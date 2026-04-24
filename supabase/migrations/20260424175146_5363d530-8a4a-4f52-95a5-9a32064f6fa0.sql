-- Roles enum + table (separate from profiles for security)
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can read own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins manage roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  gender text check (gender in ('male','female','nonbinary')),
  height_cm numeric,
  weight_kg numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users view own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

-- Avatars (parametric config)
create table public.avatars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  shoulders numeric not null default 1.0,
  waist numeric not null default 1.0,
  hips numeric not null default 1.0,
  torso numeric not null default 1.0,
  legs numeric not null default 1.0,
  skin_tone text not null default '#d8a87a',
  hair_color text not null default '#3b2a1a',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.avatars enable row level security;

create policy "Users view own avatar"
  on public.avatars for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own avatar"
  on public.avatars for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own avatar"
  on public.avatars for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own avatar"
  on public.avatars for delete to authenticated using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger avatars_touch before update on public.avatars
  for each row execute function public.touch_updated_at();

-- Auto-create profile + default user role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();