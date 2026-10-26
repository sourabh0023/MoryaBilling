-- MoryaBilling POS workflow tables. Run in Supabase SQL Editor once.
-- The UI requires owner sign-in. Policies allow authenticated sessions only.
-- Disable public sign-ups in Supabase and create the owner account in the Dashboard.
create table if not exists public.pos_menu_items (
  id bigint primary key,
  name text not null,
  category text not null,
  price numeric(10,2) not null check (price >= 0),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.pos_restaurant_tables (
  name text primary key,
  created_at timestamptz not null default now()
);
create table if not exists public.pos_restaurant_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.pos_bills (
  id text primary key,
  table_name text not null,
  items jsonb not null,
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  payment text,
  status text not null default 'Saved',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.pos_active_orders (
  table_name text primary key,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Additive upgrades for projects that already ran an earlier version of this script.
alter table public.pos_bills add column if not exists paid_at timestamptz;
alter table public.pos_active_orders add column if not exists created_at timestamptz not null default now();
insert into public.pos_menu_items (id,name,category,price,is_favorite) values
(1,'Puneri Misal','Misal',90,false),(2,'Gavran Misal','Misal',100,false),
(3,'Special Misal Pav','Misal',130,false),(4,'Sada Dosa','South Indian',80,false),
(5,'Masala Dosa','South Indian',110,false),(6,'Cheese Masala Dosa','South Indian',150,false),
(7,'Pav Bhaji','Snacks',120,false),(8,'Cheese Pav Bhaji','Snacks',150,false),
(9,'Pohe','Snacks',40,false),(10,'Rassa Pohe','Snacks',50,false),
(11,'Tea','Beverages',10,false),(12,'Lassi','Beverages',30,false),
(13,'Solkadhi','Beverages',50,false),(14,'Taak','Beverages',30,false),
(15,'Gulab Jamun','Snacks',15,false),(16,'Idli (3 pcs)','South Indian',50,false),
(17,'Medu Wada (3 pcs)','South Indian',80,false),(18,'Sada Uttapam','South Indian',100,false)
on conflict (id) do nothing;
insert into public.pos_restaurant_tables (name) values
('A1'),('A2'),('A3'),('A4'),('A5'),('B1'),('B2'),('B3'),('B4'),('B5'),('C1'),('C2'),('C3')
on conflict (name) do nothing;
-- Copy legacy bills into the new UI's history table when the original schema exists.
-- This is additive: the original bills and bill_items records are not modified or deleted.
do $migration$
begin
  if to_regclass('public.bills') is not null and to_regclass('public.bill_items') is not null then
    execute $copy$
      insert into public.pos_bills
        (id, table_name, items, subtotal, discount, total, payment, status, created_at, updated_at)
      select
        b.id::text,
        coalesce(nullif(b.table_label, ''), 'Historical'),
        coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', line.line_no,
              'name', line.item_name,
              'category', 'Historical',
              'price', line.unit_price,
              'qty', line.quantity
            ) order by line.line_no
          )
          from (
            select bi.item_name, bi.unit_price, bi.quantity,
                   row_number() over (order by bi.created_at, bi.id)::integer as line_no
            from public.bill_items bi where bi.bill_id = b.id
          ) line
        ), '[]'::jsonb),
        b.subtotal,
        b.discount_amount,
        b.total_amount,
        b.payment_method,
        case when b.status = 'paid' then 'Paid' else b.status end,
        b.created_at,
        b.updated_at
      from public.bills b
      on conflict (id) do nothing
    $copy$;
  end if;
end
$migration$;

alter table public.pos_menu_items enable row level security;
alter table public.pos_restaurant_tables enable row level security;
alter table public.pos_restaurant_settings enable row level security;
alter table public.pos_bills enable row level security;
alter table public.pos_active_orders enable row level security;
drop policy if exists "pos_menu_public_access" on public.pos_menu_items;
create policy "pos_menu_public_access" on public.pos_menu_items for all to authenticated using (true) with check (true);
drop policy if exists "pos_tables_public_access" on public.pos_restaurant_tables;
create policy "pos_tables_public_access" on public.pos_restaurant_tables for all to authenticated using (true) with check (true);
drop policy if exists "pos_settings_public_access" on public.pos_restaurant_settings;
create policy "pos_settings_public_access" on public.pos_restaurant_settings for all to authenticated using (true) with check (true);
drop policy if exists "pos_bills_public_access" on public.pos_bills;
create policy "pos_bills_public_access" on public.pos_bills for all to authenticated using (true) with check (true);
drop policy if exists "pos_drafts_public_access" on public.pos_active_orders;
create policy "pos_drafts_public_access" on public.pos_active_orders for all to authenticated using (true) with check (true);
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.pos_menu_items, public.pos_restaurant_tables, public.pos_restaurant_settings, public.pos_bills, public.pos_active_orders to authenticated;
