-- Saved outfits (looks) for KO styler
create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null default 'Untitled Look',
  items jsonb not null default '[]'::jsonb,
  avatar_config jsonb not null default '{}'::jsonb,
  style_vibe text,
  likes int not null default 0,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.outfits enable row level security;

create policy "Users manage own outfits"
on public.outfits for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Public outfits viewable by everyone"
on public.outfits for select
to anon, authenticated
using (is_public = true);

create trigger outfits_touch
before update on public.outfits
for each row execute function public.touch_updated_at();

-- Extend avatars with explicit body_type + height (so customization sliders persist)
alter table public.avatars
  add column if not exists body_type text not null default 'regular',
  add column if not exists height_cm numeric;

-- Extend profiles with current style vibe
alter table public.profiles
  add column if not exists style_vibe text;