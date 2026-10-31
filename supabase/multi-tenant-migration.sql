-- MoryaBilling multi-restaurant isolation migration.
-- Run this once in Supabase SQL Editor AFTER the existing pos-workflow.sql.
-- Existing POS data is assigned to the sole existing Auth user. If there is not
-- exactly one Auth user, this script stops rather than guessing who owns the data.

begin;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_members (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','staff')),
  created_at timestamptz not null default now(),
  primary key (restaurant_id, user_id),
  unique (user_id)
);

-- Preserve all current Morya records under the existing owner account.
do $$
declare
  owner_id uuid;
  owner_count integer;
  legacy_restaurant_id uuid := 'a42a78e8-7bb7-4f2b-b7cb-0a0c6e2f4a11';
begin
  select count(*), min(id::text)::uuid into owner_count, owner_id from auth.users;
  if owner_count <> 1 then
    raise exception 'Safe migration stopped: expected exactly one existing Supabase Auth user, found %. Do not continue until the Morya owner account is identified.', owner_count;
  end if;

  insert into public.restaurants (id, name)
  values (legacy_restaurant_id, 'MORYA MISAL')
  on conflict (id) do nothing;

  insert into public.restaurant_members (restaurant_id, user_id, role)
  values (legacy_restaurant_id, owner_id, 'owner')
  on conflict (user_id) do nothing;
end $$;

alter table public.pos_menu_items add column if not exists restaurant_id uuid;
alter table public.pos_restaurant_tables add column if not exists restaurant_id uuid;
alter table public.pos_restaurant_settings add column if not exists restaurant_id uuid;
alter table public.pos_bills add column if not exists restaurant_id uuid;
alter table public.pos_active_orders add column if not exists restaurant_id uuid;
alter table public.pos_active_orders add column if not exists created_at timestamptz not null default now();

update public.pos_menu_items set restaurant_id = 'a42a78e8-7bb7-4f2b-b7cb-0a0c6e2f4a11' where restaurant_id is null;
update public.pos_restaurant_tables set restaurant_id = 'a42a78e8-7bb7-4f2b-b7cb-0a0c6e2f4a11' where restaurant_id is null;
update public.pos_restaurant_settings set restaurant_id = 'a42a78e8-7bb7-4f2b-b7cb-0a0c6e2f4a11' where restaurant_id is null;
update public.pos_bills set restaurant_id = 'a42a78e8-7bb7-4f2b-b7cb-0a0c6e2f4a11' where restaurant_id is null;
update public.pos_active_orders set restaurant_id = 'a42a78e8-7bb7-4f2b-b7cb-0a0c6e2f4a11' where restaurant_id is null;

alter table public.pos_menu_items alter column restaurant_id set not null;
alter table public.pos_restaurant_tables alter column restaurant_id set not null;
alter table public.pos_restaurant_settings alter column restaurant_id set not null;
alter table public.pos_bills alter column restaurant_id set not null;
alter table public.pos_active_orders alter column restaurant_id set not null;

alter table public.pos_menu_items drop constraint if exists pos_menu_items_pkey;
alter table public.pos_restaurant_tables drop constraint if exists pos_restaurant_tables_pkey;
alter table public.pos_restaurant_settings drop constraint if exists pos_restaurant_settings_pkey;
alter table public.pos_bills drop constraint if exists pos_bills_pkey;
alter table public.pos_active_orders drop constraint if exists pos_active_orders_pkey;

alter table public.pos_menu_items add constraint pos_menu_items_pkey primary key (restaurant_id, id);
alter table public.pos_restaurant_tables add constraint pos_restaurant_tables_pkey primary key (restaurant_id, name);
alter table public.pos_restaurant_settings add constraint pos_restaurant_settings_pkey primary key (restaurant_id, key);
alter table public.pos_bills add constraint pos_bills_pkey primary key (restaurant_id, id);
alter table public.pos_active_orders add constraint pos_active_orders_pkey primary key (restaurant_id, table_name);

create or replace function public.current_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select rm.restaurant_id
  from public.restaurant_members rm
  where rm.user_id = auth.uid()
  limit 1
$$;

alter table public.pos_menu_items alter column restaurant_id set default public.current_restaurant_id();
alter table public.pos_restaurant_tables alter column restaurant_id set default public.current_restaurant_id();
alter table public.pos_restaurant_settings alter column restaurant_id set default public.current_restaurant_id();
alter table public.pos_bills alter column restaurant_id set default public.current_restaurant_id();
alter table public.pos_active_orders alter column restaurant_id set default public.current_restaurant_id();

alter table public.pos_menu_items add constraint pos_menu_items_restaurant_fk foreign key (restaurant_id) references public.restaurants(id) on delete cascade;
alter table public.pos_restaurant_tables add constraint pos_restaurant_tables_restaurant_fk foreign key (restaurant_id) references public.restaurants(id) on delete cascade;
alter table public.pos_restaurant_settings add constraint pos_restaurant_settings_restaurant_fk foreign key (restaurant_id) references public.restaurants(id) on delete cascade;
alter table public.pos_bills add constraint pos_bills_restaurant_fk foreign key (restaurant_id) references public.restaurants(id) on delete cascade;
alter table public.pos_active_orders add constraint pos_active_orders_restaurant_fk foreign key (restaurant_id) references public.restaurants(id) on delete cascade;



create or replace function public.create_restaurant_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_restaurant_id uuid;
  restaurant_name text;
begin
  restaurant_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'restaurant_name'), ''), 'My Restaurant');
  insert into public.restaurants (name) values (restaurant_name) returning id into new_restaurant_id;
  insert into public.restaurant_members (restaurant_id, user_id, role)
  values (new_restaurant_id, new.id, 'owner');
  return new;
end
$$;

drop trigger if exists on_auth_user_created_restaurant on auth.users;
create trigger on_auth_user_created_restaurant
after insert on auth.users
for each row execute procedure public.create_restaurant_for_new_user();

alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;
drop policy if exists restaurants_member_read on public.restaurants;
create policy restaurants_member_read on public.restaurants
for select to authenticated
using (id = public.current_restaurant_id());
drop policy if exists restaurant_members_self_read on public.restaurant_members;
create policy restaurant_members_self_read on public.restaurant_members
for select to authenticated
using (user_id = auth.uid());

-- Remove the old authenticated-user-wide policies and enforce tenant isolation.
drop policy if exists pos_menu_public_access on public.pos_menu_items;
drop policy if exists pos_tables_public_access on public.pos_restaurant_tables;
drop policy if exists pos_settings_public_access on public.pos_restaurant_settings;
drop policy if exists pos_bills_public_access on public.pos_bills;
drop policy if exists pos_drafts_public_access on public.pos_active_orders;

create policy pos_menu_tenant_access on public.pos_menu_items
for all to authenticated using (restaurant_id = public.current_restaurant_id())
with check (restaurant_id = public.current_restaurant_id());
create policy pos_tables_tenant_access on public.pos_restaurant_tables
for all to authenticated using (restaurant_id = public.current_restaurant_id())
with check (restaurant_id = public.current_restaurant_id());
create policy pos_settings_tenant_access on public.pos_restaurant_settings
for all to authenticated using (restaurant_id = public.current_restaurant_id())
with check (restaurant_id = public.current_restaurant_id());
create policy pos_bills_tenant_access on public.pos_bills
for all to authenticated using (restaurant_id = public.current_restaurant_id())
with check (restaurant_id = public.current_restaurant_id());
create policy pos_drafts_tenant_access on public.pos_active_orders
for all to authenticated using (restaurant_id = public.current_restaurant_id())
with check (restaurant_id = public.current_restaurant_id());

grant usage on schema public to authenticated;
grant select on public.restaurants, public.restaurant_members to authenticated;
grant select, insert, update, delete on public.pos_menu_items, public.pos_restaurant_tables, public.pos_restaurant_settings, public.pos_bills, public.pos_active_orders to authenticated;

commit;
