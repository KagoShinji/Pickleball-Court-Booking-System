-- Create security_incident_logs table
CREATE TABLE IF NOT EXISTS public.security_incident_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    incident_type TEXT NOT NULL,
    device_fingerprint TEXT,
    attempted_reference_no TEXT,
    raw_ocr_output TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for security_incident_logs
ALTER TABLE public.security_incident_logs ENABLE ROW LEVEL SECURITY;

-- Allow insert without auth (since it is a public-facing booking system shadow log)
DROP POLICY IF EXISTS "Allow public inserts to security_incident_logs" ON public.security_incident_logs;
CREATE POLICY "Allow public inserts to security_incident_logs" 
ON public.security_incident_logs 
FOR INSERT 
WITH CHECK (true);

-- Allow admins to view security incident logs
DROP POLICY IF EXISTS "Allow admin read access to security_incident_logs" ON public.security_incident_logs;
CREATE POLICY "Allow admin read access to security_incident_logs" 
ON public.security_incident_logs 
FOR SELECT 
USING (true); -- Can be restricted based on tenant/role later

-- Add ocr_data column to bookings_raw base table
ALTER TABLE public.bookings_raw 
ADD COLUMN IF NOT EXISTS ocr_data JSONB;

-- Recreate bookings view appending ocr_data to the end of the column list
CREATE OR REPLACE VIEW public.bookings AS
 SELECT id,
    court_id,
    booking_date,
    start_time,
    end_time,
    status,
    booked_times,
    rescheduled_from,
    created_at,
    company_id,
    user_id,
    promotion_id,
    discount_applied,
    total_price,
        CASE
            WHEN auth.role() = 'authenticated'::text AND (EXISTS ( SELECT 1
               FROM admin_users au
              WHERE au.id = auth.uid() AND (au.is_superadmin = true OR au.company_id = bookings_raw.company_id))) OR auth.role() = 'authenticated'::text AND user_id = auth.uid() THEN customer_name
            ELSE '[REDACTED]'::text
        END AS customer_name,
        CASE
            WHEN auth.role() = 'authenticated'::text AND (EXISTS ( SELECT 1
               FROM admin_users au
              WHERE au.id = auth.uid() AND (au.is_superadmin = true OR au.company_id = bookings_raw.company_id))) OR auth.role() = 'authenticated'::text AND user_id = auth.uid() THEN customer_email
            ELSE '[REDACTED]'::text
        END AS customer_email,
        CASE
            WHEN auth.role() = 'authenticated'::text AND (EXISTS ( SELECT 1
               FROM admin_users au
              WHERE au.id = auth.uid() AND (au.is_superadmin = true OR au.company_id = bookings_raw.company_id))) OR auth.role() = 'authenticated'::text AND user_id = auth.uid() THEN customer_phone
            ELSE '[REDACTED]'::text
        END AS customer_phone,
        CASE
            WHEN auth.role() = 'authenticated'::text AND (EXISTS ( SELECT 1
               FROM admin_users au
              WHERE au.id = auth.uid() AND (au.is_superadmin = true OR au.company_id = bookings_raw.company_id))) OR auth.role() = 'authenticated'::text AND user_id = auth.uid() THEN notes
            ELSE ''::text
        END AS notes,
        CASE
            WHEN auth.role() = 'authenticated'::text AND (EXISTS ( SELECT 1
               FROM admin_users au
              WHERE au.id = auth.uid() AND (au.is_superadmin = true OR au.company_id = bookings_raw.company_id))) OR auth.role() = 'authenticated'::text AND user_id = auth.uid() THEN proof_of_payment_url
            ELSE NULL::text
        END AS proof_of_payment_url,
    ocr_data
   FROM bookings_raw
  WHERE (current_setting('request.headers'::text, true)::jsonb ->> 'x-company-id'::text) = 'odyssey'::text OR company_id = COALESCE(NULLIF(current_setting('request.headers'::text, true)::jsonb ->> 'x-company-id'::text, ''::text), 'picklepoint_cebu'::text) OR auth.role() = 'authenticated'::text AND (EXISTS ( SELECT 1
           FROM admin_users au
          WHERE au.id = auth.uid() AND au.is_superadmin = true)) OR auth.role() = 'authenticated'::text AND user_id = auth.uid();
