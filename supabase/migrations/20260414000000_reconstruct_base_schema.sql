-- Reconstruct Base Schema
create extension if not exists pgcrypto;

-- 1. Create admin_users
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

alter table public.admin_users enable row level security;
create policy "admin_users_select" on public.admin_users for select using (true);
create policy "admin_users_insert" on public.admin_users for insert with check (auth.role() = 'authenticated');
create policy "admin_users_update" on public.admin_users for update using (auth.role() = 'authenticated');

-- 2. Create courts
create table if not exists public.courts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  price numeric not null default 0,
  description text,
  images jsonb,
  pricing_rules jsonb default '[]'::jsonb,
  max_players integer default 10,
  admin_id uuid references auth.users(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.courts enable row level security;
create policy "public_can_read_courts" on public.courts for select using (true);
create policy "admin_can_insert_courts" on public.courts for insert with check (auth.role() = 'authenticated');
create policy "admin_can_update_courts" on public.courts for update using (auth.role() = 'authenticated');
create policy "admin_can_delete_courts" on public.courts for delete using (auth.role() = 'authenticated');

-- 3. Create bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  court_id uuid references public.courts(id) on delete cascade,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  booking_date date not null,
  start_time time,
  end_time time,
  total_price numeric default 0,
  status text default 'Confirmed',
  notes text,
  proof_of_payment_url text,
  booked_times jsonb default '[]'::jsonb,
  rescheduled_from jsonb,
  created_at timestamptz default now()
);

alter table public.bookings enable row level security;
create policy "public_can_read_bookings" on public.bookings for select using (true);
create policy "public_can_insert_bookings" on public.bookings for insert with check (true);
create policy "public_can_update_bookings" on public.bookings for update using (true);
create policy "admin_can_delete_bookings" on public.bookings for delete using (auth.role() = 'authenticated');

-- 4. Create blocked_time_slots
create table if not exists public.blocked_time_slots (
  id uuid primary key default gen_random_uuid(),
  court_id uuid references public.courts(id) on delete cascade,
  blocked_date date not null,
  time_slot text not null,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.blocked_time_slots enable row level security;
create policy "public_can_read_blocked_slots" on public.blocked_time_slots for select using (true);
create policy "admin_can_insert_blocked_slots" on public.blocked_time_slots for insert with check (auth.role() = 'authenticated');
create policy "admin_can_update_blocked_slots" on public.blocked_time_slots for update using (auth.role() = 'authenticated');
create policy "admin_can_delete_blocked_slots" on public.blocked_time_slots for delete using (auth.role() = 'authenticated');

-- 5. Create qr_codes
create table if not exists public.qr_codes (
  id text primary key,
  label text not null,
  image_url text,
  account_name text,
  is_active boolean default true,
  sort_order integer default 0,
  updated_at timestamptz default now()
);

alter table public.qr_codes enable row level security;
create policy "public_can_read_qr_codes" on public.qr_codes for select using (true);
create policy "admin_can_insert_qr_codes" on public.qr_codes for insert with check (auth.role() = 'authenticated');
create policy "admin_can_update_qr_codes" on public.qr_codes for update using (auth.role() = 'authenticated');
create policy "admin_can_delete_qr_codes" on public.qr_codes for delete using (auth.role() = 'authenticated');

-- 6. Storage Buckets
insert into storage.buckets (id, name, public)
values 
  ('court-images', 'court-images', true),
  ('qr-images', 'qr-images', true),
  ('booking-proofs', 'booking-proofs', true)
on conflict (id) do nothing;

-- Storage Policies (Allow public access for ease, can tighten later)
create policy "public_read_storage" on storage.objects for select using (bucket_id in ('court-images', 'qr-images', 'booking-proofs'));
create policy "public_insert_storage" on storage.objects for insert with check (bucket_id in ('court-images', 'qr-images', 'booking-proofs'));
create policy "public_update_storage" on storage.objects for update using (bucket_id in ('court-images', 'qr-images', 'booking-proofs'));
create policy "public_delete_storage" on storage.objects for delete using (bucket_id in ('court-images', 'qr-images', 'booking-proofs'));
