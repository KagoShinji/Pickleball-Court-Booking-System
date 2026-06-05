-- ============================================================
-- Fix: Remove ALL overloaded create_booking_atomic functions
-- and replace with a single canonical version.
--
-- Root cause: The promotions feature created a second overload
-- (with p_user_id / p_promo_code params) on the remote DB,
-- causing PostgreSQL to fail with "Could not choose the best
-- candidate function" when calling via Supabase RPC.
-- ============================================================

-- Step 1: Drop ALL overloads by name (cascade-safe)
drop function if exists public.create_booking_atomic(
  uuid, text, text, text, date,
  time without time zone, time without time zone,
  numeric, text, text, text[], text
);

drop function if exists public.create_booking_atomic(
  uuid, text, text, text, date,
  time without time zone, time without time zone,
  numeric, text, text, text[], text, uuid
);

drop function if exists public.create_booking_atomic(
  uuid, text, text, text, date,
  time without time zone, time without time zone,
  numeric, text, text, text[], text, text, uuid
);

drop function if exists public.create_booking_atomic(
  uuid, text, text, text, date,
  time without time zone, time without time zone,
  numeric, text, text, text[], text, uuid, text
);

-- Step 2: Recreate ONE canonical function matching the JS RPC call.
-- Parameters sent by booking.js:
--   p_court_id, p_customer_name, p_customer_email, p_customer_phone,
--   p_booking_date, p_start_time, p_end_time, p_total_price, p_notes,
--   p_proof_of_payment_url, p_booked_times, p_court_type, p_company_id
create or replace function public.create_booking_atomic(
  p_court_id              uuid,
  p_customer_name         text,
  p_customer_email        text,
  p_customer_phone        text,
  p_booking_date          date,
  p_start_time            time without time zone,
  p_end_time              time without time zone,
  p_total_price           numeric,
  p_notes                 text,
  p_proof_of_payment_url  text,
  p_booked_times          text[],
  p_court_type            text    default '',
  p_company_id            uuid    default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking      public.bookings;
  v_is_exclusive boolean := coalesce(p_court_type, '') ilike '%exclusive%'
                         or coalesce(p_court_type, '') ilike '%whole%';
  v_requested_slots text[];
  v_conflicts       text[];
begin
  -- Advisory lock per booking date to prevent race conditions
  perform pg_advisory_xact_lock(hashtextextended(p_booking_date::text, 0));

  -- Normalize requested time slots (trim to HH:MM, deduplicate, sort)
  v_requested_slots := array(
    select distinct left(trim(slot), 5)
    from unnest(coalesce(p_booked_times, array[]::text[])) as slot
    where trim(slot) <> ''
    order by left(trim(slot), 5)
  );

  if coalesce(array_length(v_requested_slots, 1), 0) = 0 then
    raise exception 'NO_TIME_SLOTS_SELECTED'
      using errcode = 'P0001',
            detail  = 'No time slots were supplied for this booking.';
  end if;

  -- Check admin-blocked slots
  select array_agg(distinct left(bts.time_slot::text, 5) order by left(bts.time_slot::text, 5))
  into v_conflicts
  from public.blocked_time_slots bts
  where bts.blocked_date = p_booking_date
    and (
      (not v_is_exclusive and bts.court_id = p_court_id)
      or v_is_exclusive
    )
    and left(bts.time_slot::text, 5) = any(v_requested_slots);

  if coalesce(array_length(v_conflicts, 1), 0) > 0 then
    raise exception 'ADMIN_BLOCKED'
      using errcode = 'P0001',
            detail  = array_to_string(v_conflicts, ',');
  end if;

  -- Check existing booking conflicts (with cross-court exclusive logic)
  with existing_bookings as (
    select
      b.id,
      b.court_id,
      coalesce(c.type, '') as court_type,
      case
        when jsonb_typeof(b.booked_times) = 'array' and jsonb_array_length(b.booked_times) > 0 then (
          select array_agg(distinct left(trim(slot), 5) order by left(trim(slot), 5))
          from jsonb_array_elements_text(b.booked_times) as slot
          where trim(slot) <> ''
        )
        else (
          select array_agg(lpad(hour_slot::text, 2, '0') || ':00' order by hour_slot)
          from generate_series(
            extract(hour from b.start_time)::int,
            greatest(extract(hour from b.end_time)::int - 1, extract(hour from b.start_time)::int),
            1
          ) as hour_slot
        )
      end as slots
    from public.bookings b
    left join public.courts c on c.id = b.court_id
    where b.booking_date = p_booking_date
      and b.status in ('Confirmed', 'Rescheduled')
      and (
        b.court_id = p_court_id
        or v_is_exclusive
        or coalesce(c.type, '') ilike '%exclusive%'
        or coalesce(c.type, '') ilike '%whole%'
      )
  )
  select array_agg(distinct requested.slot order by requested.slot)
  into v_conflicts
  from existing_bookings eb
  cross join lateral unnest(v_requested_slots) as requested(slot)
  where requested.slot = any(coalesce(eb.slots, array[]::text[]));

  if coalesce(array_length(v_conflicts, 1), 0) > 0 then
    raise exception 'ALREADY_BOOKED'
      using errcode = 'P0001',
            detail  = array_to_string(v_conflicts, ',');
  end if;

  -- Insert the booking
  insert into public.bookings (
    court_id,
    customer_name,
    customer_email,
    customer_phone,
    booking_date,
    start_time,
    end_time,
    total_price,
    status,
    notes,
    proof_of_payment_url,
    booked_times,
    company_id
  )
  values (
    p_court_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_booking_date,
    p_start_time,
    p_end_time,
    coalesce(p_total_price, 0),
    'Confirmed',
    coalesce(p_notes, ''),
    p_proof_of_payment_url,
    to_jsonb(v_requested_slots),
    p_company_id
  )
  returning * into v_booking;

  return v_booking;
end;
$$;

-- Grant execute to anon + authenticated (public booking form uses anon role)
grant execute on function public.create_booking_atomic(
  uuid, text, text, text, date,
  time without time zone, time without time zone,
  numeric, text, text, text[], text, uuid
) to anon, authenticated;
