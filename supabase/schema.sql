-- MoryaBilling initial Supabase schema
-- Apply in Supabase SQL Editor. Review before running in a production database.
create extension if not exists pgcrypto;

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete restrict,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (branch_id, name)
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete restrict,
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete restrict,
  bill_number bigint generated always as identity unique,
  order_type text not null default 'parcel' check (order_type in ('dine_in','parcel')),
  table_label text,
  status text not null default 'paid' check (status in ('paid','cancelled','refunded')),
  payment_method text not null check (payment_method in ('cash','upi','card','other')),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users(id) on delete set null
);

create index if not exists bills_branch_created_at_idx on public.bills(branch_id, created_at desc);
create index if not exists bills_status_idx on public.bills(status);
create index if not exists menu_items_branch_active_idx on public.menu_items(branch_id, is_active);

create table if not exists public.bill_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id) on delete restrict,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity numeric(12,3) not null check (quantity > 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists bill_items_bill_id_idx on public.bill_items(bill_id);

create table if not exists public.bill_audit_log (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid references public.bills(id) on delete set null,
  action text not null check (action in ('created','edited','cancelled','refunded','reprinted')),
  actor_id uuid references auth.users(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS. Access policies should be added alongside the chosen authentication/role model.
alter table public.branches enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.bills enable row level security;
alter table public.bill_items enable row level security;
alter table public.bill_audit_log enable row level security;

-- Intentionally no permissive client policies are created here. Until authenticated
-- role/branch policies are configured, client access is denied by RLS.
