-- =============================================================================
-- Migration: Fix QR code tenant isolation
-- Date: 2026-05-23
-- Description:
--   All QR codes were originally created for the Picklepoint Cebu tenant but
--   were incorrectly backfilled with company_id = 'kennydink_moalboal' during
--   the multi-tenancy migration. This migration reassigns them to the correct
--   'picklepoint_cebu' tenant so they no longer appear on Kenny Dink's website.
-- =============================================================================

-- Reassign all legacy QR codes to Picklepoint Cebu.
-- The picklepoint_cebu tenant was registered in migration 20260523000000.
UPDATE public.qr_codes
SET company_id = 'picklepoint_cebu'
WHERE company_id = 'kennydink_moalboal'
  AND id IN (
    'gcash',
    'gotyme',
    'bpi-1776750951256'
  );
