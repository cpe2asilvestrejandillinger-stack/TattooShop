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
  flash_design_id uuid references public.designs(id) on delete set null,
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
alter table public.appointments add column if not exists flash_design_id uuid references public.designs(id) on delete set null;

create or replace function public.reserve_flash_for_appointment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  reserved_id uuid;
  should_reserve boolean := false;
begin
  if tg_op = 'UPDATE' then
    if old.flash_design_id is not null
      and (
        new.status in ('rejected', 'cancelled')
        or old.flash_design_id is distinct from new.flash_design_id
      )
      and not exists (
        select 1 from public.appointments a
        where a.flash_design_id = old.flash_design_id
          and a.id <> old.id
          and a.status in ('approved', 'completed')
      ) then
      update public.designs set is_available = true where id = old.flash_design_id;
    end if;

    should_reserve := new.status = 'approved'
      and not (old.status in ('approved', 'completed') and old.flash_design_id is not distinct from new.flash_design_id);
  else
    should_reserve := new.status = 'approved';
  end if;

  if should_reserve and new.flash_design_id is not null then
    update public.designs
    set is_available = false
    where id = new.flash_design_id and is_available = true
    returning id into reserved_id;

    if reserved_id is null then
      raise exception 'This flash design was just claimed. Please choose another design.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists reserve_flash_before_appointment on public.appointments;
create trigger reserve_flash_before_appointment
before insert or update on public.appointments
for each row execute function public.reserve_flash_for_appointment();

-- Release flash designs that were marked taken by an older trigger for pending requests.
update public.designs d
set is_available = true
where not d.is_available
  and exists (
    select 1 from public.appointments a
    where a.flash_design_id = d.id and a.status = 'pending'
  )
  and not exists (
    select 1 from public.appointments a
    where a.flash_design_id = d.id and a.status in ('approved', 'completed')
  );

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  schedule_date date not null,
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  unique (schedule_date, start_time),
  constraint schedules_valid_time_range check (end_time > start_time)
);

alter table public.appointments add column if not exists schedule_id uuid references public.schedules(id) on delete set null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'schedules_valid_time_range') then
    alter table public.schedules add constraint schedules_valid_time_range check (end_time > start_time);
  end if;
end $$;

create or replace function public.validate_schedule_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.end_time <= new.start_time then
    raise exception 'End time must be later than start time.';
  end if;
  if exists (
    select 1 from public.schedules s
    where s.id <> new.id
      and s.schedule_date = new.schedule_date
      and new.start_time < s.end_time
      and new.end_time > s.start_time
  ) then
    raise exception 'This time overlaps another schedule slot.';
  end if;
  if new.is_available and exists (
    select 1 from public.appointments a
    where a.schedule_id = new.id and a.status not in ('rejected', 'cancelled')
  ) then
    raise exception 'This time has an active booking request and cannot be reopened.';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_schedule_before_save on public.schedules;
create trigger validate_schedule_before_save
before insert or update on public.schedules
for each row execute function public.validate_schedule_slot();

create or replace function public.reserve_schedule_for_appointment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_slot public.schedules%rowtype;
begin
  if new.schedule_id is null then
    raise exception 'Choose an available appointment time.';
  end if;

  select * into selected_slot
  from public.schedules
  where id = new.schedule_id
  for update;

  if not found or not selected_slot.is_available then
    raise exception 'This appointment time is no longer available. Choose another time.';
  end if;
  if selected_slot.schedule_date <> new.appointment_date
     or selected_slot.start_time <> new.appointment_time then
    raise exception 'The selected time does not match the chosen availability slot.';
  end if;
  if exists (select 1 from public.appointments a where a.schedule_id = new.schedule_id and a.status not in ('rejected', 'cancelled')) then
    raise exception 'This time already has a booking request. Choose another time.';
  end if;

  update public.schedules set is_available = false where id = selected_slot.id;
  return new;
end;
$$;

drop trigger if exists reserve_schedule_before_appointment on public.appointments;

create or replace function public.release_schedule_after_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.schedule_id is not null and new.status in ('rejected', 'cancelled') then
    update public.schedules s set is_available = true
    where s.id = new.schedule_id
      and not exists (
        select 1 from public.appointments a
        where a.schedule_id = new.schedule_id
          and a.id <> new.id
          and a.status not in ('rejected', 'cancelled')
      );
  end if;
  return new;
end;
$$;

drop trigger if exists release_schedule_after_appointment_status on public.appointments;

create or replace function public.get_unavailable_booking_dates(p_start_date date default current_date)
returns table (appointment_date date)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct a.appointment_date
  from public.appointments a
  where a.appointment_date >= coalesce(p_start_date, current_date)
    and a.status in ('approved', 'completed')
  order by a.appointment_date;
$$;

revoke all on function public.get_unavailable_booking_dates(date) from public;
grant execute on function public.get_unavailable_booking_dates(date) to anon, authenticated;

create or replace function public.prevent_booking_on_confirmed_date()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.appointment_date::text));
  if (tg_op = 'INSERT' or new.status in ('approved', 'completed')) and exists (
    select 1 from public.appointments a
    where a.appointment_date = new.appointment_date
      and a.id <> new.id
      and a.status in ('approved', 'completed')
  ) then
    raise exception 'This date already has a confirmed appointment. Choose another date.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_booking_on_confirmed_date on public.appointments;
create trigger prevent_booking_on_confirmed_date
before insert or update on public.appointments
for each row execute function public.prevent_booking_on_confirmed_date();

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
using (true);

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
drop policy if exists "Anyone can view schedule availability" on public.schedules;
create policy "Anyone can view schedule availability" on public.schedules
for select to anon, authenticated
using (true);

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

-- Public images for admin-managed 1/1 flash designs.
alter table public.designs add column if not exists size text not null default '';

insert into storage.buckets (id, name, public)
values ('flash-designs', 'flash-designs', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Anyone can view flash design images" on storage.objects;
create policy "Anyone can view flash design images" on storage.objects
for select to anon, authenticated
using (bucket_id = 'flash-designs');

drop policy if exists "Admins can manage flash design images" on storage.objects;
create policy "Admins can manage flash design images" on storage.objects
for all to authenticated
using (bucket_id = 'flash-designs' and (select public.is_admin()))
with check (bucket_id = 'flash-designs' and (select public.is_admin()));
