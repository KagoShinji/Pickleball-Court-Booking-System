-- =============================================================================
-- Migration: Seed test client (client_001)
-- Date: 2026-05-21
-- Description: Inserts the test tenant for local/remote testing.
-- =============================================================================

INSERT INTO public.tenants (id, name, slug)
VALUES ('client_001', 'Multi-Tenancy Pickleball Test', 'client-001')
ON CONFLICT (id) DO NOTHING;

-- Also pre-fill an empty tenant_settings row so it exists
INSERT INTO public.tenant_settings (company_id, company_name, company_short_name, updated_at)
VALUES ('client_001', 'Multi-Tenancy Pickleball Test', 'Test', now())
ON CONFLICT (company_id) DO NOTHING;
