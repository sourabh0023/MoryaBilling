-- MoryaBilling table dashboard migration; safe to run on an existing POS database.
-- Run this in the Supabase SQL Editor before deploying the dashboard changes.
alter table public.pos_active_orders add column if not exists created_at timestamptz not null default now();
alter table public.pos_bills add column if not exists paid_at timestamptz;
create index if not exists pos_bills_table_status_created_idx on public.pos_bills (table_name, status, created_at desc);
