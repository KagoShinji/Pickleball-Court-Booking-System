-- =============================================================================
-- Migration: Add custom parking fields to tenant settings
-- Date: 2026-05-22
-- Description: Adds parking_is_inside and parking_map_link columns
-- =============================================================================

ALTER TABLE public.tenant_settings
  ADD COLUMN IF NOT EXISTS parking_is_inside boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS parking_map_link text;
