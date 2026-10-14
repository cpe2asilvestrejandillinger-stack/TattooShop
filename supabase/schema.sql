-- AirWizard tattoo booking schema and row-level security.
-- Before running: back up production data and review the data updates below.
-- Run the entire script in Supabase Dashboard > SQL Editor as the postgres role.
-- The transaction makes the migration all-or-nothing if any statement fails.
-- Do not grant schema CREATE privileges to anon or authenticated.

begin;

do $$
begin
  if current_user <> 'postgres' then
    raise exception 'Run this migration as postgres in Supabase SQL Editor. Current role: %.', current_user;
  end if;

  if not has_schema_privilege(current_user, 'public', 'usage') then
    raise exception 'The postgres role needs USAGE on schema public before this migration can run.';
  end if;

  if not has_schema_privilege(current_user, 'public', 'create') then
    raise exception 'The postgres role needs CREATE on schema public. Ask the schema owner to grant CREATE to postgres, then rerun this migration.';
  end if;
end;
$$;

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
  booking_hold_expires_at timestamptz,
  session_location text not null default 'studio' check (session_location in ('studio', 'home')),
  home_service_address text,
  tattoo_style text not null default 'Fine Line',
  tattoo_size text not null default 'Small (5-10cm)',
  body_placement text not null default '',
  description text,
  reference_image_url text,
  status text not null default 'pending'
    check (status in ('pending', 'awaiting_payment', 'approved', 'rejected', 'completed', 'cancelled')),
  total_amount numeric(10,2) not null default 0 check (total_amount >= 0),
  base_amount numeric(10,2) not null default 0 check (base_amount >= 0),
  home_service_fee numeric(10,2) not null default 0 check (home_service_fee >= 0),
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
alter table public.appointments add column if not exists booking_hold_expires_at timestamptz;
alter table public.appointments add column if not exists session_location text not null default 'studio';
alter table public.appointments add column if not exists home_service_address text;
alter table public.appointments add column if not exists flash_design_id uuid references public.designs(id) on delete set null;
alter table public.appointments add column if not exists total_amount numeric(10,2) not null default 0;
alter table public.appointments add column if not exists base_amount numeric(10,2) not null default 0;
alter table public.appointments add column if not exists home_service_fee numeric(10,2) not null default 0;

alter table public.appointments drop constraint if exists appointments_session_location_check;
alter table public.appointments add constraint appointments_session_location_check
  check (session_location in ('studio', 'home'));
alter table public.appointments drop constraint if exists appointments_home_address_check;
alter table public.appointments add constraint appointments_home_address_check
  check (
    (session_location = 'studio' and home_service_address is null)
    or (session_location = 'home' and nullif(btrim(home_service_address), '') is not null)
  );
alter table public.appointments drop constraint if exists appointments_amounts_nonnegative_check;
alter table public.appointments add constraint appointments_amounts_nonnegative_check
  check (total_amount >= 0 and base_amount >= 0 and home_service_fee >= 0);

alter table public.appointments drop constraint if exists appointments_status_check;
alter table public.appointments add constraint appointments_status_check
  check (status in ('pending', 'awaiting_payment', 'approved', 'rejected', 'completed', 'cancelled'));

-- Keep only the earliest pending request as the hold when migrating duplicate requests.
with ranked_pending as (
  select a.id,
    row_number() over (partition by a.appointment_date order by a.created_at, a.id) as request_rank,
    exists (
      select 1 from public.appointments confirmed
      where confirmed.appointment_date = a.appointment_date
        and confirmed.status in ('approved', 'completed')
    ) as has_confirmed_booking
  from public.appointments a
  where a.status = 'pending' and a.booking_hold_expires_at is null
)
update public.appointments a
set booking_hold_expires_at = case
  when ranked_pending.request_rank = 1 and not ranked_pending.has_confirmed_booking
    then a.created_at + interval '2 hours'
  else now() - interval '1 second'
end
from ranked_pending
where ranked_pending.id = a.id;

update public.appointments
set booking_hold_expires_at = null
where status not in ('pending', 'awaiting_payment') and booking_hold_expires_at is not null;

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
          and (
            a.status in ('approved', 'completed')
            or (a.status = 'awaiting_payment' and a.booking_hold_expires_at > now())
          )
      ) then
      update public.designs set is_available = true where id = old.flash_design_id;
    end if;

    should_reserve := new.status in ('awaiting_payment', 'approved')
      and not (old.status in ('awaiting_payment', 'approved', 'completed') and old.flash_design_id is not distinct from new.flash_design_id);
  else
    should_reserve := new.status in ('awaiting_payment', 'approved');
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
    where a.flash_design_id = d.id and a.status in ('pending', 'awaiting_payment')
      and (a.status <> 'awaiting_payment' or a.booking_hold_expires_at > now())
  )
  and not exists (
    select 1 from public.appointments a
    where a.flash_design_id = d.id
      and (a.status in ('approved', 'completed') or (a.status = 'awaiting_payment' and a.booking_hold_expires_at > now()))
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
    and (
      a.status in ('approved', 'completed')
      or (a.status in ('pending', 'awaiting_payment') and a.booking_hold_expires_at > now())
    )
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
  if (tg_op = 'INSERT' and (new.appointment_time < time '08:00' or new.appointment_time >= time '24:00'))
     or (tg_op = 'UPDATE' and new.appointment_time is distinct from old.appointment_time
         and (new.appointment_time < time '08:00' or new.appointment_time >= time '24:00')) then
    raise exception 'Appointments must be scheduled during store hours (8:00 AM to midnight).';
  end if;

  perform pg_advisory_xact_lock(hashtext(new.appointment_date::text));

  if tg_op = 'INSERT' and new.status = 'pending' then
    new.booking_hold_expires_at := now() + interval '2 hours';
  elsif tg_op = 'UPDATE' and new.status = 'pending' and old.status <> 'pending' then
    new.booking_hold_expires_at := now() + interval '2 hours';
  elsif tg_op = 'UPDATE' and new.status = 'awaiting_payment' and old.status <> 'awaiting_payment' then
    new.booking_hold_expires_at := now() + interval '24 hours';
  elsif new.status in ('approved', 'completed', 'rejected', 'cancelled') then
    new.booking_hold_expires_at := null;
  end if;

  if tg_op = 'UPDATE'
     and old.status = 'pending'
     and new.status in ('awaiting_payment', 'approved', 'completed')
     and (old.booking_hold_expires_at is null or old.booking_hold_expires_at <= now()) then
    raise exception 'This booking hold expired. Ask the client to submit a new request.';
  end if;

  if tg_op = 'UPDATE'
     and old.status = 'awaiting_payment'
     and new.status = 'approved'
     and (old.booking_hold_expires_at is null or old.booking_hold_expires_at <= now()) then
    raise exception 'The deposit deadline expired. Ask the client to submit a new request.';
  end if;
  if tg_op = 'UPDATE' and old.status = 'awaiting_payment' and new.status = 'approved'
     and new.payment_status not in ('partial', 'paid') then
    raise exception 'Verify the downpayment before confirming this appointment.';
  end if;

  if (tg_op = 'INSERT' or new.status in ('awaiting_payment', 'approved', 'completed')) and exists (
    select 1 from public.appointments a
    where a.appointment_date = new.appointment_date
      and a.id <> new.id
      and (
        a.status in ('approved', 'completed')
        or (a.status in ('pending', 'awaiting_payment') and a.booking_hold_expires_at > now())
      )
  ) then
    raise exception 'This date has an active booking hold or confirmed appointment. Choose another date.';
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
drop index if exists public.appointments_active_hold_idx;
create index appointments_active_hold_idx
  on public.appointments (appointment_date, booking_hold_expires_at)
  where status in ('pending', 'awaiting_payment');

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
with check (
  customer_id = (select auth.uid())
  and status = 'pending'
  and payment_status = 'unpaid'
  and total_amount = 0
  and base_amount = 0
  and home_service_fee = 0
  and deposit_amount = 0
  and balance_amount = 0
);

drop policy if exists "Admins can manage appointments" on public.appointments;
create policy "Admins can manage appointments" on public.appointments
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- A direct, account-level customer to admin conversation.
create table if not exists public.customer_messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  attachment_path text,
  message_type text not null default 'text',
  created_at timestamptz not null default now()
);

alter table public.customer_messages add column if not exists attachment_path text;
alter table public.customer_messages add column if not exists message_type text not null default 'text';
alter table public.customer_messages drop constraint if exists customer_messages_message_type_check;
alter table public.customer_messages add constraint customer_messages_message_type_check
  check (
    message_type in ('text', 'payment_qr', 'payment_proof')
    and (message_type = 'text' or attachment_path is not null)
  );
alter table public.customer_messages alter column body drop not null;
alter table public.customer_messages drop constraint if exists customer_messages_body_check;
alter table public.customer_messages drop constraint if exists customer_messages_body_or_attachment_check;
alter table public.customer_messages add constraint customer_messages_body_or_attachment_check
  check (
    (body is null or char_length(btrim(body)) between 1 and 2000)
    and (body is not null or attachment_path is not null)
  );

create index if not exists customer_messages_thread_idx
  on public.customer_messages (customer_id, created_at);

-- Carry over messages from the earlier appointment-specific chat, if it was already used.
do $$
begin
  if to_regclass('public.appointment_messages') is not null then
    execute 'insert into public.customer_messages (id, customer_id, sender_id, body, created_at)
      select old_message.id, appointment.customer_id, old_message.sender_id, old_message.body, old_message.created_at
      from public.appointment_messages old_message
      join public.appointments appointment on appointment.id = old_message.appointment_id
      on conflict (id) do nothing';
  end if;
end;
$$;

alter table public.customer_messages enable row level security;
grant select, insert on public.customer_messages to authenticated;

drop policy if exists "Customers and admins can read customer conversations" on public.customer_messages;
create policy "Customers and admins can read customer conversations" on public.customer_messages
for select to authenticated
using (customer_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Customers and admins can send customer messages" on public.customer_messages;
create policy "Customers and admins can send customer messages" on public.customer_messages
for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and (
    (customer_id = (select auth.uid()) and message_type in ('text', 'payment_proof'))
    or ((select public.is_admin()) and message_type in ('text', 'payment_qr', 'payment_proof'))
  )
);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'customer_messages'
    ) then
    alter publication supabase_realtime add table public.customer_messages;
  end if;
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'appointments'
    ) then
    alter publication supabase_realtime add table public.appointments;
  end if;
end;
$$;

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
-- Private storage for customer and admin conversation images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customer-chat-attachments', 'customer-chat-attachments', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Chat participants can upload conversation images" on storage.objects;
create policy "Chat participants can upload conversation images" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'customer-chat-attachments'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select public.is_admin())
  )
);

drop policy if exists "Chat participants can view conversation images" on storage.objects;
create policy "Chat participants can view conversation images" on storage.objects
for select to authenticated
using (
  bucket_id = 'customer-chat-attachments'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select public.is_admin())
  )
);

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

commit;
