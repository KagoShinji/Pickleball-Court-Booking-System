-- Recreate the trig_bookings_instead_of trigger function to handle missing discount_applied columns
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
    
    -- Populate NEW with view row data so returning output matches the view format
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

-- Drop overloaded/outdated create_booking_atomic functions
DROP FUNCTION IF EXISTS public.create_booking_atomic(
  uuid, text, text, text, date,
  time without time zone, time without time zone,
  numeric, text, text, text[], text, text
);

DROP FUNCTION IF EXISTS public.create_booking_atomic(
  uuid, text, text, text, date,
  time without time zone, time without time zone,
  numeric, text, text, text[], text, text, numeric
);

DROP FUNCTION IF EXISTS public.create_booking_atomic(
  uuid, text, text, text, date,
  time without time zone, time without time zone,
  numeric, text, text, text[], text, text, uuid, text
);

-- Recreate create_booking_atomic compiled against the bookings view with promo code support
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  p_court_id             uuid,
  p_customer_name        text,
  p_customer_email       text,
  p_customer_phone       text,
  p_booking_date         date,
  p_start_time           time without time zone,
  p_end_time             time without time zone,
  p_total_price          numeric,
  p_notes                text,
  p_proof_of_payment_url text,
  p_booked_times         text[],
  p_court_type           text    DEFAULT '',
  p_company_id           text    DEFAULT 'kennydink_moalboal',
  p_user_id              uuid    DEFAULT null,
  p_promo_code           text    DEFAULT null
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking            public.bookings;
  v_is_exclusive       boolean := coalesce(p_court_type, '') ILIKE '%exclusive%'
                                  OR coalesce(p_court_type, '') ILIKE '%whole%';
  v_requested_slots    text[];
  v_conflicts          text[];

  -- Promo variables
  v_promo              public.promotions;
  v_auto_promo         public.promotions;
  v_discount           numeric := 0;
  v_final_price        numeric := 0;

  -- Pricing calculation variables
  v_holidays           jsonb := '[]'::jsonb;
  v_court_price        numeric;
  v_court_pricing_rules jsonb;
  v_slot               text;
  v_slot_base_price    numeric;
  v_slot_discount      numeric;
  v_total_base_price   numeric := 0;
  v_day_of_week        int;
BEGIN
  -- Advisory lock scoped to date + tenant to prevent cross-tenant interference
  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_booking_date::text || p_company_id, 0)
  );

  -- Normalise the requested time slots
  v_requested_slots := ARRAY(
    SELECT DISTINCT LEFT(TRIM(slot), 5)
    FROM unnest(COALESCE(p_booked_times, ARRAY[]::text[])) AS slot
    WHERE TRIM(slot) <> ''
    ORDER BY LEFT(TRIM(slot), 5)
  );

  IF COALESCE(array_length(v_requested_slots, 1), 0) = 0 THEN
    RAISE EXCEPTION 'NO_TIME_SLOTS_SELECTED'
      USING errcode = 'P0001',
            detail  = 'No time slots were supplied for this booking.';
  END IF;

  -- Check admin-blocked slots (scoped to tenant)
  SELECT array_agg(DISTINCT LEFT(bts.time_slot::text, 5)
                   ORDER BY LEFT(bts.time_slot::text, 5))
  INTO   v_conflicts
  FROM   public.blocked_time_slots bts
  WHERE  bts.blocked_date = p_booking_date
    AND  bts.company_id   = p_company_id
    AND  (
           (NOT v_is_exclusive AND bts.court_id = p_court_id)
           OR v_is_exclusive
         )
    AND  LEFT(bts.time_slot::text, 5) = ANY(v_requested_slots);

  IF COALESCE(array_length(v_conflicts, 1), 0) > 0 THEN
    RAISE EXCEPTION 'ADMIN_BLOCKED'
      USING errcode = 'P0001',
            detail  = array_to_string(v_conflicts, ',');
  END IF;

  -- Check existing bookings for conflicts (scoped to tenant)
  WITH existing_bookings AS (
    SELECT
      b.id,
      b.court_id,
      COALESCE(c.type, '') AS court_type,
      CASE
        WHEN jsonb_typeof(b.booked_times) = 'array'
             AND jsonb_array_length(b.booked_times) > 0 THEN (
          SELECT array_agg(DISTINCT LEFT(TRIM(slot), 5)
                            ORDER BY LEFT(TRIM(slot), 5))
          FROM   jsonb_array_elements_text(b.booked_times) AS slot
          WHERE  TRIM(slot) <> ''
        )
        ELSE (
          SELECT array_agg(lpad(hour_slot::text, 2, '0') || ':00'
                           ORDER BY hour_slot)
          FROM   generate_series(
                   EXTRACT(HOUR FROM b.start_time)::int,
                   GREATEST(EXTRACT(HOUR FROM b.end_time)::int - 1,
                            EXTRACT(HOUR FROM b.start_time)::int),
                   1
                 ) AS hour_slot
        )
      END AS slots
    FROM   public.bookings b
    LEFT JOIN public.courts c ON c.id = b.court_id
    WHERE  b.booking_date = p_booking_date
      AND  b.company_id   = p_company_id
      AND  b.status IN ('Confirmed', 'Rescheduled')
      AND  (
             b.court_id = p_court_id
             OR v_is_exclusive
             OR COALESCE(c.type, '') ILIKE '%exclusive%'
             OR COALESCE(c.type, '') ILIKE '%whole%'
           )
  )
  SELECT array_agg(DISTINCT requested.slot ORDER BY requested.slot)
  INTO   v_conflicts
  FROM   existing_bookings eb
  CROSS JOIN LATERAL unnest(v_requested_slots) AS requested(slot)
  WHERE  requested.slot = ANY(COALESCE(eb.slots, ARRAY[]::text[]));

  IF COALESCE(array_length(v_conflicts, 1), 0) > 0 THEN
    RAISE EXCEPTION 'ALREADY_BOOKED'
      USING errcode = 'P0001',
            detail  = array_to_string(v_conflicts, ',');
  END IF;

  -- Get court details for pricing
  SELECT price, pricing_rules
  INTO   v_court_price, v_court_pricing_rules
  FROM   public.courts
  WHERE  id = p_court_id;

  -- Load holidays
  SELECT COALESCE(tenant_settings.operating_hours->'holidays', '[]'::jsonb)
  INTO   v_holidays
  FROM   public.tenant_settings
  WHERE  tenant_settings.company_id = p_company_id;

  v_day_of_week := extract(isodow from p_booking_date)::int % 7; -- Convert 1-7 to 0-6

  -- ───── PROMOTIONS COUPON ENGINE VALIDATION ─────────────────────────────────
  IF p_promo_code IS NOT NULL AND TRIM(p_promo_code) <> '' THEN
    SELECT p.*
    INTO   v_promo
    FROM   public.promotions p
    WHERE  p.tenant_id  = p_company_id
      AND  p.promo_code = TRIM(p_promo_code)
      AND  p.is_active  = true
      AND  (p.court_id IS NULL OR p.court_id = p_court_id)
      AND  p_booking_date BETWEEN (p.start_date AT TIME ZONE 'Asia/Manila')::date AND (p.end_date AT TIME ZONE 'Asia/Manila')::date
      FOR UPDATE;

    IF v_promo.id IS NULL THEN
      RAISE EXCEPTION 'PROMO_INVALID'
        USING errcode = 'P0001',
              detail  = 'The promo code "' || p_promo_code || '" does not exist or is inactive.';
    END IF;

    -- Validate promo restrictions
    IF v_promo.applicable_days IS NOT NULL THEN
      IF NOT (v_day_of_week = ANY(v_promo.applicable_days)) THEN
        RAISE EXCEPTION 'PROMO_DAY_RESTRICTED'
          USING errcode = 'P0001',
                detail  = 'The promo code "' || p_promo_code || '" is not applicable on the selected day of the week.';
      END IF;
    END IF;

    IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
      RAISE EXCEPTION 'PROMO_USAGE_EXCEEDED'
        USING errcode = 'P0001',
              detail  = 'The promo code "' || p_promo_code || '" has reached its maximum number of uses.';
    END IF;

  ELSE
    -- Check for auto-applied promotions that match the date, day-of-week, and are applicable to at least one slot hour
    SELECT p.*
    INTO   v_auto_promo
    FROM   public.promotions p
    WHERE  p.tenant_id  = p_company_id
      AND  p.promo_code IS NULL
      AND  p.is_active  = true
      AND  (p.court_id IS NULL OR p.court_id = p_court_id)
      AND  p_booking_date BETWEEN (p.start_date AT TIME ZONE 'Asia/Manila')::date AND (p.end_date AT TIME ZONE 'Asia/Manila')::date
      AND  (p.max_uses IS NULL OR p.current_uses < p.max_uses)
      AND  (p.applicable_days IS NULL OR (v_day_of_week = ANY(p.applicable_days)))
      AND  (
             p.start_hour IS NULL OR p.end_hour IS NULL OR
             EXISTS (
               SELECT 1
               FROM unnest(v_requested_slots) AS slot
               WHERE public.is_promo_applicable_to_slot(p.applicable_days, p.start_hour, p.end_hour, p_booking_date, slot)
             )
           )
    ORDER BY
      CASE WHEN p.discount_type = 'percentage' THEN p.discount_value ELSE 0 END DESC,
      CASE WHEN p.discount_type = 'fixed_amount' THEN p.discount_value ELSE 0 END DESC,
      CASE WHEN p.discount_type = 'fixed_price' THEN p.discount_value ELSE 999999 END ASC
    LIMIT 1
    FOR UPDATE;

    IF v_auto_promo.id IS NOT NULL THEN
      v_promo := v_auto_promo;
    END IF;
  END IF;

  -- ───── SLOT-BY-SLOT PRICE AND DISCOUNT CALCULATION ────────────────────────
  v_final_price := 0;
  v_discount := 0;

  FOREACH v_slot IN ARRAY v_requested_slots LOOP
    v_slot_base_price := public.calculate_slot_base_price(v_court_price, v_court_pricing_rules, p_booking_date, v_slot, v_holidays);
    v_total_base_price := v_total_base_price + v_slot_base_price;

    IF v_promo.id IS NOT NULL AND public.is_promo_applicable_to_slot(v_promo.applicable_days, v_promo.start_hour, v_promo.end_hour, p_booking_date, v_slot) THEN
      IF v_promo.discount_type = 'percentage' THEN
        v_slot_discount := ROUND(v_slot_base_price * (v_promo.discount_value / 100), 2);
      ELSIF v_promo.discount_type = 'fixed_price' THEN
        v_slot_discount := GREATEST(v_slot_base_price - v_promo.discount_value, 0);
      ELSE -- fixed_amount
        v_slot_discount := LEAST(v_promo.discount_value, v_slot_base_price);
      END IF;
    ELSE
      v_slot_discount := 0;
    END IF;

    v_discount := v_discount + v_slot_discount;
    v_final_price := v_final_price + (v_slot_base_price - v_slot_discount);
  END LOOP;

  -- ───── PROMO VALIDATION AND USAGE COUNTING ─────────────────────────────────
  IF v_promo.id IS NOT NULL THEN
    IF v_discount > 0 THEN
      -- Increment usage counter
      UPDATE public.promotions
      SET    current_uses = current_uses + 1,
             updated_at   = now()
      WHERE  id = v_promo.id;
    ELSE
      -- Discount resulted in 0.
      IF p_promo_code IS NOT NULL AND TRIM(p_promo_code) <> '' THEN
        RAISE EXCEPTION 'PROMO_NOT_APPLICABLE'
          USING errcode = 'P0001',
                detail  = 'The promo code "' || p_promo_code || '" is not applicable to any of the selected time slots or day of the week.';
      ELSE
        -- Clear auto promotion so it is not associated with the booking
        v_promo.id := NULL;
      END IF;
    END IF;
  END IF;

  -- ───── INSERT THE BOOKING ────────────────────────────────────────────────
  INSERT INTO public.bookings (
    court_id, customer_name, customer_email, customer_phone,
    booking_date, start_time, end_time, total_price, status,
    notes, proof_of_payment_url, booked_times, company_id, user_id,
    promotion_id, discount_applied
  )
  VALUES (
    p_court_id, p_customer_name, p_customer_email, p_customer_phone,
    p_booking_date, p_start_time, p_end_time, v_final_price,
    'Confirmed', COALESCE(p_notes, ''), p_proof_of_payment_url,
    to_jsonb(v_requested_slots), p_company_id, p_user_id,
    v_promo.id, v_discount
  )
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

-- Grant EXECUTE permissions back to standard client roles
GRANT EXECUTE ON FUNCTION public.create_booking_atomic(
  uuid, text, text, text, date,
  time without time zone, time without time zone,
  numeric, text, text, text[], text, text, uuid, text
) TO anon, authenticated;
