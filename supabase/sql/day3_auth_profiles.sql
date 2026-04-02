create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('user', 'developer', 'admin'))
);

create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_profiles_role on public.profiles(role);
