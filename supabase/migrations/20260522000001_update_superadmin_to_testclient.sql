-- =============================================================================
-- Migration: Update superadmin to test client
-- Date: 2026-05-22
-- Description:
--   Updates the default superadmin@test.com user's company_id to 'client_001'
--   so that local testing in testclient mode works seamlessly.
-- =============================================================================

UPDATE public.admin_users
SET company_id = 'client_001'
WHERE email = 'superadmin@test.com';
