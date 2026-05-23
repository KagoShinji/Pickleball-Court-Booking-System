/**
 * Company/Tenant configuration for this standalone PicklePoint Cebu deployment.
 *
 * VITE_COMPANY_ID is set in .env.local to 'picklepoint_cebu'.
 * All Supabase queries must use getCompanyId() to scope data to this tenant.
 * Never hardcode the company ID directly in service files.
 */
export function getCompanyId() {
  return import.meta.env.VITE_COMPANY_ID || 'picklepoint_cebu';
}
