-- =====================================================================
-- Digital Chain of Custody — Supabase database setup
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run once on a new project.
-- =====================================================================

-- ---------- Users (profile + role) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  name       text not null,
  role       text not null check (role in (
               'Admin','Dokter Forensik (Rumah Sakit)','Penyidik Polisi',
               'Petugas Laboratorium','Kejaksaan','Pengadilan')),
  created_at timestamptz not null default now()
);

-- New sign-ups get a profile automatically. Nobody can sign themselves up
-- as Admin; promote an account to Admin with the UPDATE at the bottom.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare r text := new.raw_user_meta_data->>'role';
begin
  if r is null or r not in ('Dokter Forensik (Rumah Sakit)','Penyidik Polisi',
                            'Petugas Laboratorium','Kejaksaan','Pengadilan') then
    r := 'Penyidik Polisi';
  end if;
  insert into public.profiles (id, name, role)
  values (new.id,
          coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
          r);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'Admin');
$$;

create or replace function public.my_name()
returns text language sql stable security definer set search_path = public as $$
  select name from public.profiles where id = auth.uid();
$$;

-- ---------- Evidence (barang bukti) ----------
create table if not exists public.items (
  code           text primary key check (code ~ '^BB-[0-9]{3,}$'),
  type           text not null,
  description    text not null,
  location       text not null,
  collected_date date not null,
  officer        text not null,
  photo_path     text,
  created_by     uuid default auth.uid() references auth.users on delete set null,
  created_at     timestamptz not null default now()
);

-- ---------- Transfers (chain of custody log) — append-only ----------
create table if not exists public.transfers (
  id         bigint generated always as identity primary key,
  code       text not null references public.items(code) on delete cascade,
  from_loc   text not null,
  to_loc     text not null,
  officer    text not null,
  moved_date date not null,
  moved_time text not null check (moved_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  note       text,
  created_by uuid default auth.uid() references auth.users on delete set null,
  created_at timestamptz not null default now(),
  check (from_loc <> to_loc)
);
create index if not exists transfers_code_idx on public.transfers (code);

-- ---------- Activity feed (dashboard + notifications) ----------
create table if not exists public.activity (
  id         bigint generated always as identity primary key,
  message    text not null,
  kind       text not null default 'info',
  by_name    text,
  created_at timestamptz not null default now()
);

-- A transfer moves the item and is logged automatically.
create or replace function public.on_transfer_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.items set location = new.to_loc where code = new.code;
  insert into public.activity (message, kind, by_name)
  values (new.code || ' dipindahkan ke ' || new.to_loc, 'transfer', public.my_name());
  return new;
end $$;
drop trigger if exists transfers_after_insert on public.transfers;
create trigger transfers_after_insert
  after insert on public.transfers for each row execute function public.on_transfer_insert();

create or replace function public.on_item_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity (message, kind, by_name)
    values (new.code || ' (' || new.type || ') ditambahkan', 'add', public.my_name());
    return new;
  else
    insert into public.activity (message, kind, by_name)
    values (old.code || ' dihapus', 'del', public.my_name());
    return old;
  end if;
end $$;
drop trigger if exists items_after_change on public.items;
create trigger items_after_change
  after insert or delete on public.items for each row execute function public.on_item_change();

-- ---------- Row Level Security ----------
alter table public.profiles  enable row level security;
alter table public.items     enable row level security;
alter table public.transfers enable row level security;
alter table public.activity  enable row level security;

drop policy if exists "profiles readable by users" on public.profiles;
create policy "profiles readable by users" on public.profiles
  for select to authenticated using (true);

drop policy if exists "items readable by users" on public.items;
create policy "items readable by users" on public.items
  for select to authenticated using (true);
drop policy if exists "users add items" on public.items;
create policy "users add items" on public.items
  for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "admins delete items" on public.items;
create policy "admins delete items" on public.items
  for delete to authenticated using (public.is_admin());
-- No UPDATE policy: location only changes through a recorded transfer.

drop policy if exists "transfers readable by users" on public.transfers;
create policy "transfers readable by users" on public.transfers
  for select to authenticated using (true);
drop policy if exists "users add transfers" on public.transfers;
create policy "users add transfers" on public.transfers
  for insert to authenticated with check (created_by = auth.uid());
-- No UPDATE/DELETE policy: the custody log cannot be edited.

drop policy if exists "activity readable by users" on public.activity;
create policy "activity readable by users" on public.activity
  for select to authenticated using (true);
drop policy if exists "users log login/logout" on public.activity;
create policy "users log login/logout" on public.activity
  for insert to authenticated with check (kind in ('login', 'logout'));

-- ---------- Photo storage (private bucket) ----------
insert into storage.buckets (id, name, public)
values ('evidence-photos', 'evidence-photos', false)
on conflict (id) do nothing;

drop policy if exists "users read evidence photos" on storage.objects;
create policy "users read evidence photos" on storage.objects
  for select to authenticated using (bucket_id = 'evidence-photos');
drop policy if exists "users upload evidence photos" on storage.objects;
create policy "users upload evidence photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'evidence-photos');

-- ---------- Make yourself Admin (run AFTER registering on the site) ----------
-- update public.profiles set role = 'Admin'
-- where id = (select id from auth.users where email = 'YOUR_EMAIL_HERE');
