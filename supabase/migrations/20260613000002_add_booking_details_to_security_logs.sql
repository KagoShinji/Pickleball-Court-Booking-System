-- =============================================================================
-- Migration: Add booking_details JSONB to security_incident_logs
-- Date: 2026-06-13
-- Description:
--   Adds a JSONB column `booking_details` to the `security_incident_logs` table
--   so that we can store user-entered booking data during fraud interceptions.
-- =============================================================================

ALTER TABLE public.security_incident_logs
ADD COLUMN IF NOT EXISTS booking_details JSONB;
