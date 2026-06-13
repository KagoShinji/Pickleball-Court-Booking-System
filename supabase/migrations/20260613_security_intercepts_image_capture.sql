-- =============================================================================
-- Migration: Security Intercepts — Image Capture & Storage
-- Date: 2026-06-13
-- Description:
--   1. Adds spoof_image_url column to security_incident_logs.
--   2. Creates the 'security_intercepts' storage bucket (public upload, admin read).
-- =============================================================================

-- Phase 1a: Schema — add spoof image URL column
ALTER TABLE security_incident_logs
    ADD COLUMN IF NOT EXISTS spoof_image_url TEXT;

-- Phase 1b: Storage bucket (idempotent via DO block)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('security_intercepts', 'security_intercepts', false)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Phase 1c: Storage RLS policies

-- Allow any anonymous/authenticated user to upload (INSERT) to the bucket.
-- This is required so the public-facing checkout can fire-and-forget the upload.
DROP POLICY IF EXISTS "security_intercepts_public_upload" ON storage.objects;
CREATE POLICY "security_intercepts_public_upload"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'security_intercepts');

-- Restrict reading (SELECT) to authenticated admins only.
DROP POLICY IF EXISTS "security_intercepts_admin_read" ON storage.objects;
CREATE POLICY "security_intercepts_admin_read"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'security_intercepts'
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated admins to delete archived intercepts.
DROP POLICY IF EXISTS "security_intercepts_admin_delete" ON storage.objects;
CREATE POLICY "security_intercepts_admin_delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'security_intercepts'
        AND auth.role() = 'authenticated'
    );
