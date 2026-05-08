-- Create Tenant Settings Table
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id integer PRIMARY KEY DEFAULT 1,
  
  -- Branding & Contact
  company_name text NOT NULL DEFAULT 'Default Company',
  company_short_name text,
  company_initials text DEFAULT 'PP',
  logo_url text,
  contact_info jsonb DEFAULT '{"email": "", "phone": "", "address": "", "mapQuery": "", "facebook": "", "instagram": ""}'::jsonb,
  
  -- Marketing
  hero_badge text,
  hero_title text,
  hero_subtitle text,
  hero_stat_players text DEFAULT '50+ Active Players',
  hero_stat_days text DEFAULT 'Open 7 Days a Week',
  hero_content jsonb DEFAULT '[]'::jsonb, -- Array of { src, title, subtitle }
  amenities jsonb DEFAULT '[]'::jsonb, -- Array of strings
  
  -- Operations
  operating_hours jsonb DEFAULT '{"open": "08:00", "close": "22:00"}'::jsonb,
  parking_enabled boolean DEFAULT true,
  payment_instructions text,
  terms_and_conditions jsonb DEFAULT '[]'::jsonb, -- Array of { title, description }
  
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure only one row exists
  CONSTRAINT single_row CHECK (id = 1)
);

-- Row Level Security
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_can_read_tenant_settings" ON public.tenant_settings FOR SELECT USING (true);
CREATE POLICY "admin_can_update_tenant_settings" ON public.tenant_settings FOR ALL USING (auth.role() = 'authenticated');

-- Seed initial row
INSERT INTO public.tenant_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
