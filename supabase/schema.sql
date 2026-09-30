-- AirWizard tattoo booking schema and row-level security.
-- Run this script in the Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  duration_minutes integer not null default 60,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  category text,
  price numeric(10,2),
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  appointment_date date not null,
  appointment_time time not null,
  tattoo_style text not null default 'Fine Line',
  tattoo_size text not null default 'Small (5-10cm)',
  body_placement text not null default '',
  description text,
  reference_image_url text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  deposit_amount numeric(10,2) not null default 0,
  balance_amount numeric(10,2) not null default 0,
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'partial', 'paid')),
  created_at timestamptz not null default now()
);

-- Add the booking detail fields if appointments already existed from an earlier setup.
alter table public.appointments add column if not exists tattoo_style text not null default 'Fine Line';
alter table public.appointments add column if not exists tattoo_size text not null default 'Small (5-10cm)';
alter table public.appointments add column if not exists body_placement text not null default '';

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  schedule_date date not null,
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  unique (schedule_date, start_time)
);

create index if not exists appointments_customer_date_idx
  on public.appointments (customer_id, appointment_date);
create index if not exists appointments_date_idx
  on public.appointments (appointment_date, appointment_time);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
-- Create profiles for users who existed before this trigger was installed.
insert into public.profiles (id, full_name, role)
select id, coalesce(raw_user_meta_data ->> 'full_name', ''), 'customer'
from auth.users
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.designs enable row level security;
alter table public.appointments enable row level security;
alter table public.schedules enable row level security;

grant select, update on public.profiles to authenticated;
grant select on public.services, public.designs, public.schedules to anon, authenticated;
grant insert, update, delete on public.services, public.designs, public.schedules to authenticated;
grant select, insert, update, delete on public.appointments to authenticated;

-- Profiles
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile" on public.profiles
for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()) and role = 'customer');

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles" on public.profiles
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Services
drop policy if exists "Anyone can view active services" on public.services;
create policy "Anyone can view active services" on public.services
for select to anon, authenticated
using (is_active = true or (select public.is_admin()));

drop policy if exists "Admins can manage services" on public.services;
create policy "Admins can manage services" on public.services
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Designs
drop policy if exists "Anyone can view available designs" on public.designs;
create policy "Anyone can view available designs" on public.designs
for select to anon, authenticated
using (is_available = true or (select public.is_admin()));

drop policy if exists "Admins can manage designs" on public.designs;
create policy "Admins can manage designs" on public.designs
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Appointments
drop policy if exists "Customers can view their own appointments" on public.appointments;
create policy "Customers can view their own appointments" on public.appointments
for select to authenticated
using (customer_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Customers can create their own appointments" on public.appointments;
create policy "Customers can create their own appointments" on public.appointments
for insert to authenticated
with check (customer_id = (select auth.uid()) and status = 'pending');

drop policy if exists "Admins can manage appointments" on public.appointments;
create policy "Admins can manage appointments" on public.appointments
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Schedules
drop policy if exists "Anyone can view available schedules" on public.schedules;
create policy "Anyone can view available schedules" on public.schedules
for select to anon, authenticated
using (is_available = true or (select public.is_admin()));

drop policy if exists "Admins can manage schedules" on public.schedules;
create policy "Admins can manage schedules" on public.schedules
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
-- Private storage for booking reference images.
insert into storage.buckets (id, name, public)
values ('appointment-references', 'appointment-references', false)
on conflict (id) do nothing;

drop policy if exists "Customers can upload appointment references" on storage.objects;
create policy "Customers can upload appointment references" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'appointment-references'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Customers and admins can view appointment references" on storage.objects;
create policy "Customers and admins can view appointment references" on storage.objects
for select to authenticated
using (
  bucket_id = 'appointment-references'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select public.is_admin())
  )
);