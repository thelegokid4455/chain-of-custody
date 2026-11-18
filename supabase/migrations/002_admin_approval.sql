-- New accounts must be approved by an Admin before they can see or record anything.
-- (Already included in schema.sql for new projects; run this only on a database
--  created from the earlier schema.)

alter table public.profiles add column if not exists approved boolean not null default false;
alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare r text := new.raw_user_meta_data->>'role';
begin
  if r is null or r not in ('Dokter Forensik (Rumah Sakit)','Penyidik Polisi',
                            'Petugas Laboratorium','Kejaksaan','Pengadilan') then
    r := 'Penyidik Polisi';
  end if;
  insert into public.profiles (id, name, role, email, approved)
  values (new.id,
          coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
          r, new.email, false);
  return new;
end $$;

create or replace function public.is_approved()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and approved);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'Admin' and approved);
$$;

-- profiles: see your own row always; approved users see everyone; admins approve / set roles
drop policy if exists "profiles readable by users" on public.profiles;
create policy "profiles readable by users" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_approved());
drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
grant update (approved, role) on public.profiles to authenticated;

drop policy if exists "items readable by users" on public.items;
create policy "items readable by users" on public.items
  for select to authenticated using (public.is_approved());
drop policy if exists "users add items" on public.items;
create policy "users add items" on public.items
  for insert to authenticated with check (public.is_approved() and created_by = auth.uid());

drop policy if exists "transfers readable by users" on public.transfers;
create policy "transfers readable by users" on public.transfers
  for select to authenticated using (public.is_approved());
drop policy if exists "users add transfers" on public.transfers;
create policy "users add transfers" on public.transfers
  for insert to authenticated with check (public.is_approved() and created_by = auth.uid());

drop policy if exists "activity readable by users" on public.activity;
create policy "activity readable by users" on public.activity
  for select to authenticated using (public.is_approved());
drop policy if exists "users log login/logout" on public.activity;
create policy "users log login/logout" on public.activity
  for insert to authenticated with check (public.is_approved() and kind in ('login', 'logout'));

drop policy if exists "users read evidence photos" on storage.objects;
create policy "users read evidence photos" on storage.objects
  for select to authenticated using (bucket_id = 'evidence-photos' and public.is_approved());
drop policy if exists "users upload evidence photos" on storage.objects;
create policy "users upload evidence photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'evidence-photos' and public.is_approved());

grant execute on function public.is_approved() to authenticated;
