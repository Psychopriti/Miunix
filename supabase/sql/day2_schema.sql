create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('user', 'developer', 'admin'))
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references profiles(id) on delete cascade,
  owner_type text not null,
  name text not null,
  slug text not null unique,
  description text,
  prompt_template text,
  is_active boolean not null default true,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agents_owner_type_check check (owner_type in ('platform', 'developer')),
  constraint agents_owner_consistency_check check (
    (owner_type = 'platform' and owner_profile_id is null)
    or
    (owner_type = 'developer' and owner_profile_id is not null)
  )
);

create table if not exists agent_executions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  input_data jsonb not null default '{}'::jsonb,
  output_data jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint agent_executions_status_check check (
    status in ('pending', 'completed', 'failed')
  )
);

drop trigger if exists set_agents_updated_at on agents;
create trigger set_agents_updated_at
before update on agents
for each row
execute function public.set_updated_at();

create index if not exists idx_profiles_user_id on profiles(user_id);
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_agents_slug on agents(slug);
create index if not exists idx_agents_owner_profile_id on agents(owner_profile_id);
create index if not exists idx_agents_owner_type on agents(owner_type);
create index if not exists idx_agents_published_active on agents(is_published, is_active);
create index if not exists idx_agent_executions_profile_id on agent_executions(profile_id);
create index if not exists idx_agent_executions_agent_id on agent_executions(agent_id);
create index if not exists idx_agent_executions_created_at on agent_executions(created_at desc);
