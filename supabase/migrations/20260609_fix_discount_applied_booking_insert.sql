-- Ensure booking inserts always provide a non-null discount_applied value.
-- This hardens both the public booking view trigger and the atomic RPC so
-- older deployed copies cannot reject booking inserts when the field is omitted.

DROP FUNCTION IF EXISTS public.create_booking_atomic(
  uuid, text, text, text, date,
  time without time zone, time without time zone,
  numeric, text, text, text[], text, text
);

ALTER TABLE public.bookings_raw
  ALTER COLUMN discount_applied SET DEFAULT 0;

UPDATE public.bookings_raw
SET discount_applied = 0
WHERE discount_applied IS NULL;

ALTER TABLE public.bookings_raw
  ALTER COLUMN discount_applied SET NOT NULL;

CREATE OR REPLACE FUNCTION public.trig_bookings_instead_of()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.bookings_raw (
      id, court_id, customer_name, customer_email, customer_phone,
      booking_date, start_time, end_time, total_price, status,
      notes, proof_of_payment_url, booked_times, rescheduled_from,
      created_at, company_id, user_id, promotion_id, discount_applied
    ) VALUES (
      COALESCE(NEW.id, gen_random_uuid()), NEW.court_id, NEW.customer_name, NEW.customer_email, NEW.customer_phone,
      NEW.booking_date, NEW.start_time, NEW.end_time, NEW.total_price, NEW.status,
      NEW.notes, NEW.proof_of_payment_url, NEW.booked_times, NEW.rescheduled_from,
      COALESCE(NEW.created_at, now()), NEW.company_id, NEW.user_id, NEW.promotion_id, COALESCE(NEW.discount_applied, 0)
    ) RETURNING * INTO NEW;

    SELECT * INTO NEW FROM public.bookings WHERE id = NEW.id;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.bookings_raw SET
      court_id = NEW.court_id,
      customer_name = CASE WHEN NEW.customer_name = '[REDACTED]' THEN bookings_raw.customer_name ELSE NEW.customer_name END,
      customer_email = CASE WHEN NEW.customer_email = '[REDACTED]' THEN bookings_raw.customer_email ELSE NEW.customer_email END,
      customer_phone = CASE WHEN NEW.customer_phone = '[REDACTED]' THEN bookings_raw.customer_phone ELSE NEW.customer_phone END,
      booking_date = NEW.booking_date,
      start_time = NEW.start_time,
      end_time = NEW.end_time,
      total_price = NEW.total_price,
      status = NEW.status,
      notes = CASE WHEN NEW.notes = '' AND bookings_raw.notes <> '' THEN bookings_raw.notes ELSE NEW.notes END,
      proof_of_payment_url = COALESCE(NEW.proof_of_payment_url, bookings_raw.proof_of_payment_url),
      booked_times = NEW.booked_times,
      rescheduled_from = NEW.rescheduled_from,
      company_id = NEW.company_id,
      user_id = NEW.user_id,
      promotion_id = NEW.promotion_id,
      discount_applied = COALESCE(NEW.discount_applied, bookings_raw.discount_applied, 0)
    WHERE id = OLD.id;

    SELECT * INTO NEW FROM public.bookings WHERE id = OLD.id;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.bookings_raw WHERE id = OLD.id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_booking_atomic(
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
  p_company_id            text    default null,
  p_discount_applied      numeric default 0
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
  perform pg_advisory_xact_lock(hashtextextended(p_booking_date::text, 0));

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
    company_id,
    discount_applied
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
    p_company_id,
    coalesce(p_discount_applied, 0)
  )
  returning * into v_booking;

  return v_booking;
end;
$$;

GRANT EXECUTE ON FUNCTION public.create_booking_atomic(
  uuid, text, text, text, date,
  time without time zone, time without time zone,
  numeric, text, text, text[], text, text, numeric
) TO anon, authenticated;