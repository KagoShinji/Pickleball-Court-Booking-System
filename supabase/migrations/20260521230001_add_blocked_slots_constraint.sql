-- =============================================================================
-- Migration: Add unique constraint for blocked_time_slots
-- Date: 2026-05-21
-- Description:
--   Adds a unique constraint on (court_id, blocked_date, time_slot, company_id)
--   so that the frontend can safely use upsert() when blocking slots.
-- =============================================================================

ALTER TABLE public.blocked_time_slots 
ADD CONSTRAINT blocked_time_slots_unique_constraint 
UNIQUE (court_id, blocked_date, time_slot, company_id);
