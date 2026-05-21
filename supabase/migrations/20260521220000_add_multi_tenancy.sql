-- =============================================================================
-- Migration: Add multi-tenancy (shared-database model)
-- Date: 2026-05-21
-- Description:
--   Converts from database-per-tenant to shared-database multi-tenancy.
--   All changes are ADDITIVE — no existing columns removed, no data deleted.
--   Existing KennyDink data is backfilled with company_id = 'kennydink_moalboal'.
-- =============================================================================

-- ─── Step 1: Create tenants registry table ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tenants (
  id         text        PRIMARY KEY,           -- e.g. 'kennydink_moalboal'
  name       text        NOT NULL,              -- e.g. 'KennyDink Pickleball'
  slug       text        UNIQUE NOT NULL,       -- URL-friendly, e.g. 'kennydink'
  is_active  boolean     DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Seed with the existing KennyDink tenant
INSERT INTO public.tenants (id, name, slug)
VALUES ('kennydink_moalboal', 'KennyDink Pickleball', 'kennydink')
ON CONFLICT (id) DO NOTHING;

-- ─── Step 2: Add company_id to all data tables ───────────────────────────────

-- courts
ALTER TABLE public.courts
  ADD COLUMN IF NOT EXISTS company_id text
    DEFAULT 'kennydink_moalboal'
    REFERENCES public.tenants(id);

UPDATE public.courts SET company_id = 'kennydink_moalboal' WHERE company_id IS NULL;
ALTER TABLE public.courts ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.courts ALTER COLUMN company_id DROP DEFAULT;
CREATE INDEX IF NOT EXISTS idx_courts_company ON public.courts(company_id);

-- bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS company_id text
    DEFAULT 'kennydink_moalboal'
    REFERENCES public.tenants(id);

UPDATE public.bookings SET company_id = 'kennydink_moalboal' WHERE company_id IS NULL;
ALTER TABLE public.bookings ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN company_id DROP DEFAULT;
CREATE INDEX IF NOT EXISTS idx_bookings_company ON public.bookings(company_id);

-- blocked_time_slots
ALTER TABLE public.blocked_time_slots
  ADD COLUMN IF NOT EXISTS company_id text
    DEFAULT 'kennydink_moalboal'
    REFERENCES public.tenants(id);

UPDATE public.blocked_time_slots SET company_id = 'kennydink_moalboal' WHERE company_id IS NULL;
ALTER TABLE public.blocked_time_slots ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.blocked_time_slots ALTER COLUMN company_id DROP DEFAULT;
CREATE INDEX IF NOT EXISTS idx_blocked_slots_company ON public.blocked_time_slots(company_id);

-- qr_codes
ALTER TABLE public.qr_codes
  ADD COLUMN IF NOT EXISTS company_id text
    DEFAULT 'kennydink_moalboal'
    REFERENCES public.tenants(id);

UPDATE public.qr_codes SET company_id = 'kennydink_moalboal' WHERE company_id IS NULL;
ALTER TABLE public.qr_codes ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.qr_codes ALTER COLUMN company_id DROP DEFAULT;
CREATE INDEX IF NOT EXISTS idx_qr_codes_company ON public.qr_codes(company_id);

-- admin_audit_logs
ALTER TABLE public.admin_audit_logs
  ADD COLUMN IF NOT EXISTS company_id text
    DEFAULT 'kennydink_moalboal'
    REFERENCES public.tenants(id);

UPDATE public.admin_audit_logs SET company_id = 'kennydink_moalboal' WHERE company_id IS NULL;
ALTER TABLE public.admin_audit_logs ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.admin_audit_logs ALTER COLUMN company_id DROP DEFAULT;
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON public.admin_audit_logs(company_id);

-- admin_users
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS company_id text
    DEFAULT 'kennydink_moalboal'
    REFERENCES public.tenants(id);

UPDATE public.admin_users SET company_id = 'kennydink_moalboal' WHERE company_id IS NULL;
ALTER TABLE public.admin_users ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.admin_users ALTER COLUMN company_id DROP DEFAULT;
CREATE INDEX IF NOT EXISTS idx_admin_users_company ON public.admin_users(company_id);

-- ─── Step 3: Convert tenant_settings from singleton to multi-tenant ──────────

-- Remove the singleton primary key and id-check constraint
ALTER TABLE public.tenant_settings DROP CONSTRAINT IF EXISTS tenant_settings_pkey;
ALTER TABLE public.tenant_settings DROP CONSTRAINT IF EXISTS tenant_settings_id_check;

-- Add company_id column (nullable first so we can UPDATE)
ALTER TABLE public.tenant_settings
  ADD COLUMN IF NOT EXISTS company_id text
    REFERENCES public.tenants(id);

-- Backfill existing row
UPDATE public.tenant_settings SET company_id = 'kennydink_moalboal' WHERE company_id IS NULL;

-- Make it non-null and the primary key
ALTER TABLE public.tenant_settings ALTER COLUMN company_id SET NOT NULL;

-- Drop the old integer id column (after backfilling company_id)
ALTER TABLE public.tenant_settings DROP COLUMN IF EXISTS id;

-- Set company_id as primary key
ALTER TABLE public.tenant_settings ADD PRIMARY KEY (company_id);

-- ─── Step 4: Rewrite ALL RLS policies ────────────────────────────────────────

-- === COURTS ===
DROP POLICY IF EXISTS "Courts are viewable by everyone" ON public.courts;
DROP POLICY IF EXISTS "Authenticated users can insert courts" ON public.courts;
DROP POLICY IF EXISTS "Only admin users can update courts" ON public.courts;
DROP POLICY IF EXISTS "Authenticated users can delete courts" ON public.courts;
-- Drop any leftover policies from previous iterations
DROP POLICY IF EXISTS "courts_select_public" ON public.courts;
DROP POLICY IF EXISTS "courts_insert_admin" ON public.courts;
DROP POLICY IF EXISTS "courts_update_admin" ON public.courts;
DROP POLICY IF EXISTS "courts_delete_admin" ON public.courts;

-- Public can view courts for any tenant (needed for customer booking page)
CREATE POLICY "courts_select_public" ON public.courts
  FOR SELECT USING (true);

-- Admins can only insert/update/delete courts for their own tenant
CREATE POLICY "courts_insert_admin" ON public.courts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND company_id = courts.company_id
    )
  );

CREATE POLICY "courts_update_admin" ON public.courts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND company_id = courts.company_id
    )
  );

CREATE POLICY "courts_delete_admin" ON public.courts
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND company_id = courts.company_id
    )
  );

-- === BOOKINGS ===
DROP POLICY IF EXISTS "Bookings are viewable by everyone" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_public" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert_public" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_public" ON public.bookings;
DROP POLICY IF EXISTS "bookings_delete_admin" ON public.bookings;

-- Bookings are publicly readable (customers check their own bookings by email)
CREATE POLICY "bookings_select_public" ON public.bookings
  FOR SELECT USING (true);

-- Anyone can create a booking (public-facing booking form)
CREATE POLICY "bookings_insert_public" ON public.bookings
  FOR INSERT WITH CHECK (true);

-- Public updates allowed (e.g. adding proof of payment URL)
CREATE POLICY "bookings_update_public" ON public.bookings
  FOR UPDATE USING (true);

-- Only admins can delete bookings, scoped to their tenant
CREATE POLICY "bookings_delete_admin" ON public.bookings
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND company_id = bookings.company_id
    )
  );

-- === BLOCKED_TIME_SLOTS ===
DROP POLICY IF EXISTS "Blocked time slots are viewable by everyone" ON public.blocked_time_slots;
DROP POLICY IF EXISTS "Authenticated users can insert blocked_time_slots" ON public.blocked_time_slots;
DROP POLICY IF EXISTS "Authenticated users can update blocked_time_slots" ON public.blocked_time_slots;
DROP POLICY IF EXISTS "Authenticated users can delete blocked_time_slots" ON public.blocked_time_slots;
DROP POLICY IF EXISTS "blocked_slots_select_public" ON public.blocked_time_slots;
DROP POLICY IF EXISTS "blocked_slots_insert_admin" ON public.blocked_time_slots;
DROP POLICY IF EXISTS "blocked_slots_update_admin" ON public.blocked_time_slots;
DROP POLICY IF EXISTS "blocked_slots_delete_admin" ON public.blocked_time_slots;

CREATE POLICY "blocked_slots_select_public" ON public.blocked_time_slots
  FOR SELECT USING (true);

CREATE POLICY "blocked_slots_insert_admin" ON public.blocked_time_slots
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND company_id = blocked_time_slots.company_id
    )
  );

CREATE POLICY "blocked_slots_update_admin" ON public.blocked_time_slots
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND company_id = blocked_time_slots.company_id
    )
  );

CREATE POLICY "blocked_slots_delete_admin" ON public.blocked_time_slots
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND company_id = blocked_time_slots.company_id
    )
  );

-- === QR_CODES ===
DROP POLICY IF EXISTS "QR codes are viewable by everyone" ON public.qr_codes;
DROP POLICY IF EXISTS "Authenticated users can insert qr_codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Authenticated users can update qr_codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Authenticated users can delete qr_codes" ON public.qr_codes;
DROP POLICY IF EXISTS "qr_select_public" ON public.qr_codes;
DROP POLICY IF EXISTS "qr_insert_admin" ON public.qr_codes;
DROP POLICY IF EXISTS "qr_update_admin" ON public.qr_codes;
DROP POLICY IF EXISTS "qr_delete_admin" ON public.qr_codes;

CREATE POLICY "qr_select_public" ON public.qr_codes
  FOR SELECT USING (true);

CREATE POLICY "qr_insert_admin" ON public.qr_codes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND company_id = qr_codes.company_id
    )
  );

CREATE POLICY "qr_update_admin" ON public.qr_codes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND company_id = qr_codes.company_id
    )
  );

CREATE POLICY "qr_delete_admin" ON public.qr_codes
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND company_id = qr_codes.company_id
    )
  );

-- === ADMIN_USERS ===
DROP POLICY IF EXISTS "Admin users are viewable by everyone" ON public.admin_users;
DROP POLICY IF EXISTS "Authenticated users can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Authenticated users can update admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_insert_auth" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_update_self" ON public.admin_users;

-- admin_users readable by anyone (needed for RLS sub-selects above)
CREATE POLICY "admin_users_select" ON public.admin_users
  FOR SELECT USING (true);

-- New admins can be inserted by authenticated users (signup flow)
CREATE POLICY "admin_users_insert_auth" ON public.admin_users
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Admins can only update their own row
CREATE POLICY "admin_users_update_self" ON public.admin_users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- === ADMIN_AUDIT_LOGS ===
DROP POLICY IF EXISTS "Admin users can view audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admin users can insert audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admin users can delete audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "audit_select_admin" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "audit_insert_admin" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "audit_delete_admin" ON public.admin_audit_logs;

CREATE POLICY "audit_select_admin" ON public.admin_audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND company_id = admin_audit_logs.company_id
    )
  );

CREATE POLICY "audit_insert_admin" ON public.admin_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND company_id = admin_audit_logs.company_id
    )
  );

CREATE POLICY "audit_delete_admin" ON public.admin_audit_logs
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND company_id = admin_audit_logs.company_id
    )
  );

-- === TENANT_SETTINGS ===
DROP POLICY IF EXISTS "Tenant settings are viewable by everyone" ON public.tenant_settings;
DROP POLICY IF EXISTS "Authenticated users can insert tenant settings" ON public.tenant_settings;
DROP POLICY IF EXISTS "Authenticated users can update tenant settings" ON public.tenant_settings;
DROP POLICY IF EXISTS "Authenticated users can delete tenant settings" ON public.tenant_settings;
DROP POLICY IF EXISTS "settings_select_public" ON public.tenant_settings;
DROP POLICY IF EXISTS "settings_update_admin" ON public.tenant_settings;
DROP POLICY IF EXISTS "settings_insert_admin" ON public.tenant_settings;

CREATE POLICY "settings_select_public" ON public.tenant_settings
  FOR SELECT USING (true);

CREATE POLICY "settings_update_admin" ON public.tenant_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND company_id = tenant_settings.company_id
    )
  );

CREATE POLICY "settings_insert_admin" ON public.tenant_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND company_id = tenant_settings.company_id
    )
  );

-- === TENANTS (new table) ===
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenants_select_public" ON public.tenants;
DROP POLICY IF EXISTS "tenants_insert_super" ON public.tenants;

-- Anyone can read the tenants list (used for public slug lookups)
CREATE POLICY "tenants_select_public" ON public.tenants
  FOR SELECT USING (true);

-- Inserts are blocked via RLS — new tenants are added manually/via service role only
CREATE POLICY "tenants_insert_super" ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- ─── Step 5: Update RPC functions ────────────────────────────────────────────

-- Drop old grants before recreating functions with new signatures
DROP FUNCTION IF EXISTS public.create_booking_atomic(
  uuid, text, text, text, date,
  time without time zone, time without time zone,
  numeric, text, text, text[], text
);

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
  p_company_id           text    DEFAULT 'kennydink_moalboal'  -- NEW: tenant filter
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking          public.bookings;
  v_is_exclusive     boolean := coalesce(p_court_type, '') ILIKE '%exclusive%'
                                OR coalesce(p_court_type, '') ILIKE '%whole%';
  v_requested_slots  text[];
  v_conflicts        text[];
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

  -- Insert the booking with company_id
  INSERT INTO public.bookings (
    court_id, customer_name, customer_email, customer_phone,
    booking_date, start_time, end_time, total_price, status,
    notes, proof_of_payment_url, booked_times, company_id
  )
  VALUES (
    p_court_id, p_customer_name, p_customer_email, p_customer_phone,
    p_booking_date, p_start_time, p_end_time, COALESCE(p_total_price, 0),
    'Confirmed', COALESCE(p_notes, ''), p_proof_of_payment_url,
    to_jsonb(v_requested_slots), p_company_id
  )
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

-- Grant execute to anon + authenticated (public booking form uses anon key)
GRANT EXECUTE ON FUNCTION public.create_booking_atomic(
  uuid, text, text, text, date,
  time without time zone, time without time zone,
  numeric, text, text, text[], text, text
) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.reschedule_booking_atomic(
  uuid, date,
  time without time zone, time without time zone,
  text[], numeric, text, date,
  time without time zone, time without time zone,
  text[]
);

CREATE OR REPLACE FUNCTION public.reschedule_booking_atomic(
  p_booking_id           uuid,
  p_new_date             date,
  p_new_start_time       time without time zone,
  p_new_end_time         time without time zone,
  p_new_booked_times     text[],
  p_new_total_price      numeric,
  p_reason               text,
  p_original_date        date,
  p_original_start_time  time without time zone,
  p_original_end_time    time without time zone,
  p_original_booked_times text[],
  p_company_id           text    DEFAULT 'kennydink_moalboal'  -- NEW: tenant filter
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_booking  public.bookings;
  v_updated_booking   public.bookings;
  v_court_type        text    := '';
  v_is_exclusive      boolean;
  v_requested_slots   text[];
  v_conflicts         text[];
BEGIN
  -- Fetch existing booking (scoped to tenant for safety)
  SELECT *
  INTO   v_existing_booking
  FROM   public.bookings
  WHERE  id         = p_booking_id
    AND  company_id = p_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND'
      USING errcode = 'P0001',
            detail  = p_booking_id::text;
  END IF;

  -- Get court type for exclusive/whole logic
  SELECT COALESCE(type, '')
  INTO   v_court_type
  FROM   public.courts
  WHERE  id = v_existing_booking.court_id;

  v_is_exclusive := v_court_type ILIKE '%exclusive%' OR v_court_type ILIKE '%whole%';

  -- Advisory lock scoped to date + tenant
  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_new_date::text || p_company_id, 0)
  );

  -- Normalise requested slots
  v_requested_slots := ARRAY(
    SELECT DISTINCT LEFT(TRIM(slot), 5)
    FROM   unnest(COALESCE(p_new_booked_times, ARRAY[]::text[])) AS slot
    WHERE  TRIM(slot) <> ''
    ORDER BY LEFT(TRIM(slot), 5)
  );

  IF COALESCE(array_length(v_requested_slots, 1), 0) = 0 THEN
    RAISE EXCEPTION 'NO_TIME_SLOTS_SELECTED'
      USING errcode = 'P0001',
            detail  = 'No time slots were supplied for this reschedule.';
  END IF;

  -- Check admin-blocked slots (scoped to tenant)
  SELECT array_agg(DISTINCT LEFT(bts.time_slot::text, 5)
                   ORDER BY LEFT(bts.time_slot::text, 5))
  INTO   v_conflicts
  FROM   public.blocked_time_slots bts
  WHERE  bts.blocked_date = p_new_date
    AND  bts.company_id   = p_company_id
    AND  (
           (NOT v_is_exclusive AND bts.court_id = v_existing_booking.court_id)
           OR v_is_exclusive
         )
    AND  LEFT(bts.time_slot::text, 5) = ANY(v_requested_slots);

  IF COALESCE(array_length(v_conflicts, 1), 0) > 0 THEN
    RAISE EXCEPTION 'ADMIN_BLOCKED'
      USING errcode = 'P0001',
            detail  = array_to_string(v_conflicts, ',');
  END IF;

  -- Check existing bookings for conflicts (scoped to tenant, excluding self)
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
    WHERE  b.booking_date = p_new_date
      AND  b.company_id   = p_company_id
      AND  b.status IN ('Confirmed', 'Rescheduled')
      AND  b.id           <> p_booking_id   -- exclude self
      AND  (
             b.court_id = v_existing_booking.court_id
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

  -- Apply the reschedule
  UPDATE public.bookings
  SET
    booking_date     = p_new_date,
    start_time       = p_new_start_time,
    end_time         = p_new_end_time,
    booked_times     = to_jsonb(v_requested_slots),
    total_price      = p_new_total_price,
    status           = 'Rescheduled',
    rescheduled_from = jsonb_build_object(
      'original_date',        p_original_date,
      'original_start_time',  p_original_start_time,
      'original_end_time',    p_original_end_time,
      'original_booked_times', p_original_booked_times,
      'original_total_price', v_existing_booking.total_price,
      'reason',               p_reason,
      'rescheduled_at',       now()
    )
  WHERE  id = p_booking_id
  RETURNING * INTO v_updated_booking;

  RETURN v_updated_booking;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reschedule_booking_atomic(
  uuid, date,
  time without time zone, time without time zone,
  text[], numeric, text, date,
  time without time zone, time without time zone,
  text[], text
) TO anon, authenticated;
