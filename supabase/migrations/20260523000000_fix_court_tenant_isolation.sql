-- =============================================================================
-- Migration: Fix court tenant isolation
-- Date: 2026-05-23
-- Description:
--   The original single-tenant app was for Picklepoint Cebu. When multi-tenancy
--   was added, all existing courts were backfilled with company_id =
--   'kennydink_moalboal' instead of being correctly assigned to Picklepoint.
--   This migration:
--     1. Registers the Picklepoint Cebu tenant.
--     2. Creates a default tenant_settings row for Picklepoint.
--     3. Reassigns all six legacy courts (and their related data) back to
--        the picklepoint_cebu tenant, so they no longer bleed onto the
--        Kenny Dink website.
-- =============================================================================

-- ─── Step 1: Register Picklepoint Cebu as a tenant ───────────────────────────
INSERT INTO public.tenants (id, name, slug, is_active, features)
VALUES (
  'picklepoint_cebu',
  'Picklepoint Cebu',
  'picklepoint',
  true,
  '{"qr_codes": true, "analytics": false, "time_slots": true, "company_settings": true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ─── Step 2: Create default tenant_settings row for Picklepoint ──────────────
INSERT INTO public.tenant_settings (company_id, company_name, company_short_name, updated_at)
VALUES (
  'picklepoint_cebu',
  'Picklepoint Cebu',
  'Picklepoint',
  now()
)
ON CONFLICT (company_id) DO NOTHING;

-- ─── Step 3: Reassign all legacy courts to Picklepoint Cebu ──────────────────
-- These are the original courts that were created before multi-tenancy was
-- introduced. They were incorrectly backfilled to 'kennydink_moalboal'.
UPDATE public.courts
SET company_id = 'picklepoint_cebu'
WHERE company_id = 'kennydink_moalboal'
  AND id IN (
    'db84c088-ff6f-4fe7-888d-1b2986194ef6', -- Exclusive Court
    '2bf82499-292e-4e3a-801a-46b68413023a', -- For Events
    '7abe33b5-0261-4603-8abf-f48e7c117538', -- Court 1
    '93d3dfa7-3523-4e47-9b4e-683111ec316e', -- Court 2
    'cb1879cb-320a-4d66-9f8c-41106938edb3', -- COURT 1 & COURT 2
    'e5b8993b-fff7-4fe7-83f9-84853529ce8d'  -- Promo
  );

-- ─── Step 4: Reassign related bookings to Picklepoint Cebu ───────────────────
UPDATE public.bookings
SET company_id = 'picklepoint_cebu'
WHERE company_id = 'kennydink_moalboal'
  AND court_id IN (
    'db84c088-ff6f-4fe7-888d-1b2986194ef6',
    '2bf82499-292e-4e3a-801a-46b68413023a',
    '7abe33b5-0261-4603-8abf-f48e7c117538',
    '93d3dfa7-3523-4e47-9b4e-683111ec316e',
    'cb1879cb-320a-4d66-9f8c-41106938edb3',
    'e5b8993b-fff7-4fe7-83f9-84853529ce8d'
  );

-- ─── Step 5: Reassign related blocked_time_slots to Picklepoint Cebu ─────────
UPDATE public.blocked_time_slots
SET company_id = 'picklepoint_cebu'
WHERE company_id = 'kennydink_moalboal'
  AND court_id IN (
    'db84c088-ff6f-4fe7-888d-1b2986194ef6',
    '2bf82499-292e-4e3a-801a-46b68413023a',
    '7abe33b5-0261-4603-8abf-f48e7c117538',
    '93d3dfa7-3523-4e47-9b4e-683111ec316e',
    'cb1879cb-320a-4d66-9f8c-41106938edb3',
    'e5b8993b-fff7-4fe7-83f9-84853529ce8d'
  );

-- ─── Step 6: Reassign Picklepoint admin_audit_logs ───────────────────────────
-- Audit logs related to the legacy courts should also live under Picklepoint.
-- We match on metadata->>'courtId' for court-specific entries.
UPDATE public.admin_audit_logs
SET company_id = 'picklepoint_cebu'
WHERE company_id = 'kennydink_moalboal'
  AND (
    metadata->>'courtId' IN (
      'db84c088-ff6f-4fe7-888d-1b2986194ef6',
      '2bf82499-292e-4e3a-801a-46b68413023a',
      '7abe33b5-0261-4603-8abf-f48e7c117538',
      '93d3dfa7-3523-4e47-9b4e-683111ec316e',
      'cb1879cb-320a-4d66-9f8c-41106938edb3',
      'e5b8993b-fff7-4fe7-83f9-84853529ce8d'
    )
  );
