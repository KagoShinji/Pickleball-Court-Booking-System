-- =============================================================================
-- Migration: Tenant Billing Status and License Tiers
-- Date: 2026-05-22
-- Description:
--   1. Adds `billing_status` and `billing_tier` columns to the `tenants` table.
--   2. Enforces constraints on status ('active', 'past_due', 'trial') and tier ('starter', 'pro', 'enterprise').
--   3. Sets sensible defaults and backfills existing rows.
-- =============================================================================

-- ─── Step 1: Add columns and constraints to public.tenants ───────────────────

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS billing_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS billing_tier text DEFAULT 'enterprise';

-- Add check constraints to enforce integrity
ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS chk_billing_status,
  ADD CONSTRAINT chk_billing_status CHECK (billing_status IN ('active', 'past_due', 'trial'));

ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS chk_billing_tier,
  ADD CONSTRAINT chk_billing_tier CHECK (billing_tier IN ('starter', 'pro', 'enterprise'));

-- ─── Step 2: Backfill existing records ───────────────────────────────────────

UPDATE public.tenants
SET billing_status = 'active',
    billing_tier = 'enterprise'
WHERE billing_status IS NULL OR billing_tier IS NULL;
