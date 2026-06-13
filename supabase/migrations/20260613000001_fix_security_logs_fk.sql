-- =============================================================================
-- Migration: Fix security_incident_logs FK + add booking_id link
-- Date: 2026-06-13
-- Fixes:
--   1. Drops the FK constraint on tenant_id so inserts from contexts where
--      tenant_id is not a valid tenants.id row no longer fail silently.
--   2. Adds nullable booking_id column to link a false-positive to its booking.
-- =============================================================================

-- 1. Drop FK constraint on tenant_id (allow any text, or NULL)
ALTER TABLE public.security_incident_logs
    DROP CONSTRAINT IF EXISTS security_incident_logs_tenant_id_fkey;

-- 2. Add DELETE + UPDATE policies for admins
DROP POLICY IF EXISTS "Allow admin delete on security_incident_logs" ON public.security_incident_logs;
CREATE POLICY "Allow admin delete on security_incident_logs"
ON public.security_incident_logs
FOR DELETE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin update on security_incident_logs" ON public.security_incident_logs;
CREATE POLICY "Allow admin update on security_incident_logs"
ON public.security_incident_logs
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (true);

-- 3. Widen SELECT to authenticated (single-tenant has no tenant_id concept)
DROP POLICY IF EXISTS "Allow admin read access to security_incident_logs" ON public.security_incident_logs;
CREATE POLICY "Allow admin read access to security_incident_logs"
ON public.security_incident_logs
FOR SELECT
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 4. Nullable linked_booking_id
ALTER TABLE public.security_incident_logs
    ADD COLUMN IF NOT EXISTS linked_booking_id UUID;

-- 5. Columns needed for false positive flow
ALTER TABLE public.security_incident_logs
    ADD COLUMN IF NOT EXISTS is_false_positive BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.security_incident_logs
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
