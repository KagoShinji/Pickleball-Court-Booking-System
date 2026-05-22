-- =============================================================================
-- Migration: Tenant Command Center Database Setup
-- Date: 2026-05-22
-- Description:
--   1. Adds a `role` column to `public.admin_users` with a default of 'admin'.
--   2. Promotes the first/oldest registered admin for each tenant to 'owner'.
--   3. Creates the `get_tenant_kpis` RPC function for tenant-specific metrics.
-- =============================================================================

-- ─── Step 1: Add role column to admin_users ─────────────────────────────────

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'admin';

-- ─── Step 2: Auto-promote the oldest admin per company to 'owner' ───────────

WITH oldest_admins AS (
  SELECT id,
         ROW_NUMBER() OVER(PARTITION BY company_id ORDER BY created_at ASC) as rn
  FROM public.admin_users
  WHERE company_id IS NOT NULL
)
UPDATE public.admin_users
SET role = 'owner'
WHERE id IN (
  SELECT id 
  FROM oldest_admins 
  WHERE rn = 1
);

-- Ensure our auto-promote trigger for the super admin designates them correctly
-- or leaves role as 'admin'/'owner' based on setup.
-- We can also make sure superadmin has a specific system role if desired,
-- but they generally operate outside normal tenants.

-- ─── Step 3: Create get_tenant_kpis RPC function ───────────────────────────
-- Calculates business health metrics for a specific tenant.
-- Access is restricted to super admins.

CREATE OR REPLACE FUNCTION public.get_tenant_kpis(p_tenant_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result              jsonb;
  v_is_super            boolean;
  v_revenue_30d         numeric;
  v_total_bookings_30d  integer;
  v_unique_customers    integer;
  v_active_courts       integer;
  
  v_utilization_rate    numeric;
  v_total_available_hours numeric;
  v_total_booked_hours  numeric;
  
  v_days                integer := 30;
  v_hours_per_day       integer := 14;  -- approximate daily operating hours per court
BEGIN
  -- Guard: only super admins can execute this function
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid() AND is_superadmin = true
  ) INTO v_is_super;

  IF NOT v_is_super THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- 1. Total Revenue in the last 30 days (Confirmed or Rescheduled bookings)
  SELECT coalesce(sum(total_price), 0) INTO v_revenue_30d
  FROM public.bookings
  WHERE company_id = p_tenant_id
    AND status IN ('Confirmed', 'Rescheduled')
    AND booking_date >= (CURRENT_DATE - interval '30 days');

  -- 2. Total Booking Volume in the last 30 days
  SELECT count(*) INTO v_total_bookings_30d
  FROM public.bookings
  WHERE company_id = p_tenant_id
    AND status IN ('Confirmed', 'Rescheduled')
    AND booking_date >= (CURRENT_DATE - interval '30 days');

  -- 3. Unique Customer Roster (distinct email or phone)
  SELECT count(DISTINCT coalesce(email, phone)) INTO v_unique_customers
  FROM public.bookings
  WHERE company_id = p_tenant_id;

  -- 4. Active Courts Count
  SELECT count(*) INTO v_active_courts
  FROM public.courts
  WHERE company_id = p_tenant_id
    AND is_active = true;

  -- 5. Facility Utilization Rate (30 Days)
  -- Available hours = active_courts * 14 operating_hours * 30 days
  v_total_available_hours := v_active_courts * v_hours_per_day * v_days;

  -- Booked hours = sum of booked time slots in last 30 days
  SELECT coalesce(sum(
    CASE
      WHEN jsonb_typeof(booked_times) = 'array' THEN jsonb_array_length(booked_times)
      ELSE 1
    END
  ), 0) INTO v_total_booked_hours
  FROM public.bookings
  WHERE company_id = p_tenant_id
    AND status IN ('Confirmed', 'Rescheduled')
    AND booking_date >= (CURRENT_DATE - interval '30 days');

  IF v_total_available_hours > 0 THEN
    v_utilization_rate := round((v_total_booked_hours / v_total_available_hours) * 100, 1);
  ELSE
    v_utilization_rate := 0.0;
  END IF;

  -- Build composite response payload
  v_result := jsonb_build_object(
    'revenue_30d', v_revenue_30d,
    'total_bookings_30d', v_total_bookings_30d,
    'unique_customers', v_unique_customers,
    'active_courts_count', v_active_courts,
    'utilization_rate', v_utilization_rate
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_kpis(text) TO authenticated;
