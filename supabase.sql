-- Run this once in the Supabase SQL editor for your project.
-- Creates the `sales` table used by app/sell/page.js and app/history/page.js.

create table if not exists public.sales (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  items jsonb not null default '[]'::jsonb, -- [{ id, name, qty, price }, ...]
  total numeric not null default 0
);

-- Enable Row Level Security and allow the anon (public) key to read/write.
-- This is fine for a small internal demo POS; for production, restrict
-- writes to authenticated staff accounts instead.
alter table public.sales enable row level security;

create policy "Allow public read on sales"
  on public.sales for select
  to anon
  using (true);

create policy "Allow public insert on sales"
  on public.sales for insert
  to anon
  with check (true);

-- ============================================================
-- products — real stock tracking (used by app/sell/page.js)
-- ============================================================
create table if not exists public.products (
  id text primary key,        -- matches the ids in lib/products.js, e.g. "p1"
  name text not null,
  price numeric not null default 0,
  unit text not null default 'ชิ้น',
  stock int not null default 0
);

alter table public.products enable row level security;

create policy "Allow public read on products"
  on public.products for select
  to anon
  using (true);

-- Needed so the Sell page can decrement stock after a sale.
-- Note: this has no per-user auth, same caveat as the rest of this demo —
-- fine for small internal use, not a substitute for real auth if this
-- ever needs to be locked down.
create policy "Allow public update on products"
  on public.products for update
  to anon
  using (true)
  with check (true);

-- Seed with the same catalog as lib/products.js (skip if a row already exists).
insert into public.products (id, name, price, unit, stock) values
  ('p1', 'กาแฟอเมริกาโน่', 45, 'แก้ว', 20),
  ('p2', 'กาแฟลาเต้', 55, 'แก้ว', 20),
  ('p3', 'ชาเขียวมัทฉะ', 60, 'แก้ว', 20),
  ('p4', 'ครัวซองต์เนย', 40, 'ชิ้น', 20),
  ('p5', 'แซนวิชแฮมชีส', 65, 'ชิ้น', 20),
  ('p6', 'เค้กช็อกโกแลต', 75, 'ชิ้น', 20),
  ('p7', 'น้ำเปล่า', 15, 'ขวด', 20),
  ('p8', 'น้ำส้มคั้นสด', 50, 'แก้ว', 20)
on conflict (id) do nothing;
