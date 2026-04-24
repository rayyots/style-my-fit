-- Brands
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  description text,
  cover_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.brands enable row level security;
create policy "Brands are viewable by everyone" on public.brands for select using (true);
create policy "Admins manage brands" on public.brands for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Products
create type public.purchase_type as enum ('internal', 'external');
create type public.product_gender as enum ('male', 'female', 'unisex');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  category text not null,
  description text,
  gender product_gender not null default 'unisex',
  sizes text[] not null default '{}',
  images text[] not null default '{}',
  price_cents integer not null default 0,
  currency text not null default 'USD',
  purchase_type purchase_type not null default 'internal',
  external_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "Products are viewable by everyone" on public.products for select using (true);
create policy "Admins manage products" on public.products for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create index idx_products_brand on public.products(brand_id);

-- Cart
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);
alter table public.cart_items enable row level security;
create policy "Users view own cart" on public.cart_items for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own cart" on public.cart_items for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own cart" on public.cart_items for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own cart" on public.cart_items for delete to authenticated using (auth.uid() = user_id);

-- Orders
create type public.order_status as enum ('pending', 'paid', 'shipped', 'cancelled');
create type public.payment_method as enum ('cod', 'mock_card');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status order_status not null default 'pending',
  payment_method payment_method not null default 'cod',
  total_cents integer not null default 0,
  currency text not null default 'USD',
  shipping_name text not null,
  shipping_address text not null,
  shipping_city text not null,
  shipping_country text not null,
  shipping_phone text,
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "Users view own orders" on public.orders for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own orders" on public.orders for insert to authenticated with check (auth.uid() = user_id);
create policy "Admins view all orders" on public.orders for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  size text not null,
  quantity integer not null,
  price_cents integer not null
);
alter table public.order_items enable row level security;
create policy "Users view own order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "Users insert own order items" on public.order_items for insert to authenticated
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "Admins view all order items" on public.order_items for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for product images
insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict do nothing;
create policy "Product images public read" on storage.objects for select using (bucket_id = 'products');
create policy "Admins upload product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'products' and public.has_role(auth.uid(), 'admin'));
create policy "Admins update product images" on storage.objects for update to authenticated
  using (bucket_id = 'products' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete product images" on storage.objects for delete to authenticated
  using (bucket_id = 'products' and public.has_role(auth.uid(), 'admin'));

-- Updated_at triggers
create trigger touch_brands before update on public.brands for each row execute function public.touch_updated_at();
create trigger touch_products before update on public.products for each row execute function public.touch_updated_at();