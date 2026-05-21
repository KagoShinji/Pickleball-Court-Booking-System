-- =============================================================================
-- Migration: Super Admin Features & Database-Driven Feature Flags
-- Date: 2026-05-22
-- Description:
--   1. Adds a `features` JSONB column to the `tenants` table so the platform
--      owner can toggle tenant capabilities from the Super Admin dashboard.
--   2. Adds an `is_superadmin` boolean to `admin_users` for elevated access.
--   3. Rewrites RLS policies on `tenants` to allow super admins full access
--      while restricting regular admins to their own tenant row.
--   4. Creates the `get_platform_kpis` RPC function used by the /odc dashboard.
--   5. Seeds the initial super admin user (superadmin@odc.com).
-- =============================================================================

-- ─── Step 1: Add features JSONB to tenants ──────────────────────────────────

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS features jsonb
    DEFAULT '{"company_settings": true, "analytics": false, "qr_codes": true, "time_slots": true}'::jsonb;

-- Backfill any existing tenants that have NULL features
UPDATE public.tenants
SET features = '{"company_settings": true, "analytics": false, "qr_codes": true, "time_slots": true}'::jsonb
WHERE features IS NULL;

-- ─── Step 2: Add is_superadmin boolean to admin_users ───────────────────────

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS is_superadmin boolean DEFAULT false;

-- ─── Step 3: Rewrite RLS policies on tenants table ──────────────────────────
-- Keep public SELECT (needed for customer-facing slug lookups).
-- Add UPDATE policy restricted to super admins only.

-- Drop existing policies to rebuild cleanly
DROP POLICY IF EXISTS "tenants_select_public" ON public.tenants;
DROP POLICY IF EXISTS "tenants_insert_super" ON public.tenants;
DROP POLICY IF EXISTS "tenants_update_super" ON public.tenants;

-- Anyone can read tenant rows (needed for slug lookups on public booking pages)
CREATE POLICY "tenants_select_public" ON public.tenants
  FOR SELECT USING (true);

-- Only super admins can insert new tenants
CREATE POLICY "tenants_insert_super" ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND is_superadmin = true
    )
  );

-- Only super admins can update tenant rows (feature toggles, is_active, etc.)
CREATE POLICY "tenants_update_super" ON public.tenants
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND is_superadmin = true
    )
  );

-- ─── Step 4: Create get_platform_kpis RPC function ──────────────────────────
-- Returns a JSONB payload with four platform-wide KPI metrics + trends.
-- This function is SECURITY DEFINER so it can read across all tenants
-- regardless of the caller's RLS scope. Access is guarded by checking
-- is_superadmin before returning results.

CREATE OR REPLACE FUNCTION public.get_platform_kpis()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result              jsonb;
  v_active_tenants      integer;
  v_prev_active_tenants integer;

  v_current_month_start date;
  v_prev_month_start    date;
  v_prev_month_end      date;

  v_current_bookings    integer;
  v_prev_bookings       integer;
  v_booking_trend       numeric;

  v_current_revenue     numeric;
  v_prev_revenue        numeric;
  v_revenue_trend       numeric;

  v_total_courts        integer;
  v_days_in_month       integer;
  v_hours_per_day       integer := 14;  -- approximate operating hours per court
  v_available_hours     numeric;
  v_booked_hours        numeric;
  v_utilization_rate    numeric;

  v_is_super            boolean;
BEGIN
  -- Guard: only super admins can call this
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid() AND is_superadmin = true
  ) INTO v_is_super;

  IF NOT v_is_super THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- Date boundaries
  v_current_month_start := date_trunc('month', CURRENT_DATE)::date;
  v_prev_month_start    := (date_trunc('month', CURRENT_DATE) - interval '1 month')::date;
  v_prev_month_end      := (v_current_month_start - interval '1 day')::date;

  -- ── KPI 1: Total Active Tenants ──
  SELECT count(*) INTO v_active_tenants
  FROM public.tenants WHERE is_active = true;

  -- Previous month: count tenants created before end of last month
  SELECT count(*) INTO v_prev_active_tenants
  FROM public.tenants
  WHERE is_active = true
    AND created_at <= (v_prev_month_end + interval '1 day');

  -- ── KPI 2: Monthly Booking Volume ──
  SELECT count(*) INTO v_current_bookings
  FROM public.bookings
  WHERE booking_date >= v_current_month_start
    AND booking_date < (v_current_month_start + interval '1 month')
    AND status IN ('Confirmed', 'Rescheduled');

  SELECT count(*) INTO v_prev_bookings
  FROM public.bookings
  WHERE booking_date >= v_prev_month_start
    AND booking_date < v_current_month_start
    AND status IN ('Confirmed', 'Rescheduled');

  IF v_prev_bookings > 0 THEN
    v_booking_trend := round(((v_current_bookings - v_prev_bookings)::numeric / v_prev_bookings) * 100, 1);
  ELSE
    v_booking_trend := CASE WHEN v_current_bookings > 0 THEN 100.0 ELSE 0.0 END;
  END IF;

  -- ── KPI 3: Monthly Revenue ──
  SELECT coalesce(sum(total_price), 0) INTO v_current_revenue
  FROM public.bookings
  WHERE booking_date >= v_current_month_start
    AND booking_date < (v_current_month_start + interval '1 month')
    AND status IN ('Confirmed', 'Rescheduled');

  SELECT coalesce(sum(total_price), 0) INTO v_prev_revenue
  FROM public.bookings
  WHERE booking_date >= v_prev_month_start
    AND booking_date < v_current_month_start
    AND status IN ('Confirmed', 'Rescheduled');

  IF v_prev_revenue > 0 THEN
    v_revenue_trend := round(((v_current_revenue - v_prev_revenue) / v_prev_revenue) * 100, 1);
  ELSE
    v_revenue_trend := CASE WHEN v_current_revenue > 0 THEN 100.0 ELSE 0.0 END;
  END IF;

  -- ── KPI 4: Platform Utilization Rate ──
  -- Available hours = total_active_courts * hours_per_day * days_elapsed_this_month
  SELECT count(*) INTO v_total_courts
  FROM public.courts WHERE is_active = true;

  v_days_in_month := GREATEST(EXTRACT(DAY FROM CURRENT_DATE)::integer, 1);
  v_available_hours := v_total_courts * v_hours_per_day * v_days_in_month;

  -- Booked hours: count the number of booked time slots (each slot ≈ 1 hour)
  SELECT coalesce(sum(
    CASE
      WHEN jsonb_typeof(booked_times) = 'array' THEN jsonb_array_length(booked_times)
      ELSE 1
    END
  ), 0) INTO v_booked_hours
  FROM public.bookings
  WHERE booking_date >= v_current_month_start
    AND booking_date < (v_current_month_start + interval '1 month')
    AND status IN ('Confirmed', 'Rescheduled');

  IF v_available_hours > 0 THEN
    v_utilization_rate := round((v_booked_hours / v_available_hours) * 100, 1);
  ELSE
    v_utilization_rate := 0;
  END IF;

  -- ── Build result ──
  v_result := jsonb_build_object(
    'total_active_tenants', jsonb_build_object(
      'value', v_active_tenants,
      'trend', CASE
        WHEN v_prev_active_tenants > 0
        THEN round(((v_active_tenants - v_prev_active_tenants)::numeric / v_prev_active_tenants) * 100, 1)
        ELSE 0
      END
    ),
    'platform_utilization_rate', jsonb_build_object(
      'value', v_utilization_rate,
      'booked_hours', v_booked_hours,
      'available_hours', v_available_hours
    ),
    'monthly_booking_volume', jsonb_build_object(
      'value', v_current_bookings,
      'trend', v_booking_trend,
      'previous', v_prev_bookings
    ),
    'monthly_revenue', jsonb_build_object(
      'value', v_current_revenue,
      'trend', v_revenue_trend,
      'previous', v_prev_revenue
    )
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_kpis() TO authenticated;

-- ─── Step 5: Seed super admin user ──────────────────────────────────────────
-- Creates the auth user and admin_users row for superadmin@odc.com.
-- If the email already exists in auth.users, just ensure the admin_users
-- row has is_superadmin = true.
-- NOTE: In production, the super admin should be created via the Supabase
-- dashboard or CLI. This seed is for development convenience.

-- We cannot INSERT into auth.users from a migration directly in hosted Supabase.
-- Instead, mark any existing admin user with this email as superadmin,
-- or the operator should create the user via Supabase Auth UI and then run:
--
--   UPDATE public.admin_users SET is_superadmin = true WHERE email = 'superadmin@odc.com';
--
-- For safety, we'll set up a trigger-based approach: when an admin_users row
-- is inserted with email = 'superadmin@odc.com', auto-set is_superadmin = true.

-- Auto-promote function for the designated super admin email
CREATE OR REPLACE FUNCTION public.auto_promote_superadmin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'superadmin@odc.com' THEN
    NEW.is_superadmin := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_promote_superadmin ON public.admin_users;

CREATE TRIGGER trg_auto_promote_superadmin
  BEFORE INSERT OR UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_promote_superadmin();

-- If the user already exists, promote them now
UPDATE public.admin_users
SET is_superadmin = true
WHERE email = 'superadmin@odc.com';
