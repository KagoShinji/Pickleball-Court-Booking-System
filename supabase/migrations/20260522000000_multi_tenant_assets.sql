-- =============================================================================
-- Migration: Multi-Tenant Assets & Storage Isolation
-- Date: 2026-05-22
-- Description:
--   - Adds hero_bg_url and payment_qr_url columns to public.tenant_settings.
--   - Creates/configures 'cms-images' and 'qr-images' storage buckets.
--   - Enforces strict multi-tenant RLS checks on storage objects so that
--     authenticated Tenant Admins can only manage files in their {company_id} folder.
-- =============================================================================

-- 1. Create database columns in public.tenant_settings
ALTER TABLE public.tenant_settings
  ADD COLUMN IF NOT EXISTS hero_bg_url text,
  ADD COLUMN IF NOT EXISTS payment_qr_url text;

-- 2. Ensure storage buckets exist and are properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('cms-images', 'cms-images', true, 102400, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('qr-images', 'qr-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3. Drop existing permissive policies
DROP POLICY IF EXISTS "public_read_cms_images" ON storage.objects;
DROP POLICY IF EXISTS "public_read_qr_images" ON storage.objects;
DROP POLICY IF EXISTS "admin_insert_cms_images" ON storage.objects;
DROP POLICY IF EXISTS "admin_update_cms_images" ON storage.objects;
DROP POLICY IF EXISTS "admin_delete_cms_images" ON storage.objects;
DROP POLICY IF EXISTS "admin_insert_qr_images" ON storage.objects;
DROP POLICY IF EXISTS "admin_update_qr_images" ON storage.objects;
DROP POLICY IF EXISTS "admin_delete_qr_images" ON storage.objects;

-- 4. Create Public READ Policies (anyone can read the assets)
CREATE POLICY "public_read_cms_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'cms-images');

CREATE POLICY "public_read_qr_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'qr-images');

-- 5. Create Tenant Admin WRITE Policies (INSERT, UPDATE, DELETE)
-- Checked against public.admin_users for active auth.uid() matching the first folder segment of the storage key

-- CMS images bucket policies
CREATE POLICY "admin_insert_cms_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cms-images' AND
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid()
      AND au.company_id = split_part(name, '/', 1)
    )
  );

CREATE POLICY "admin_update_cms_images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cms-images' AND
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid()
      AND au.company_id = split_part(name, '/', 1)
    )
  );

CREATE POLICY "admin_delete_cms_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'cms-images' AND
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid()
      AND au.company_id = split_part(name, '/', 1)
    )
  );

-- QR images bucket policies
CREATE POLICY "admin_insert_qr_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'qr-images' AND
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid()
      AND au.company_id = split_part(name, '/', 1)
    )
  );

CREATE POLICY "admin_update_qr_images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'qr-images' AND
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid()
      AND au.company_id = split_part(name, '/', 1)
    )
  );

CREATE POLICY "admin_delete_qr_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'qr-images' AND
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid()
      AND au.company_id = split_part(name, '/', 1)
    )
  );
