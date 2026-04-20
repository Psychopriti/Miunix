alter table public.profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists premium_plan text,
  add column if not exists premium_agent_limit integer not null default 0,
  add column if not exists premium_since timestamptz;

alter table public.profiles
  drop constraint if exists profiles_premium_plan_check;

alter table public.profiles
  add constraint profiles_premium_plan_check
  check (premium_plan in ('starter', 'pro', 'scale') or premium_plan is null);

alter table public.profiles
  drop constraint if exists profiles_premium_agent_limit_check;

alter table public.profiles
  add constraint profiles_premium_agent_limit_check
  check (premium_agent_limit in (0, 1, 3, 5));

alter table public.profiles
  drop constraint if exists profiles_premium_consistency_check;

alter table public.profiles
  add constraint profiles_premium_consistency_check
  check (
    (is_premium = false and premium_plan is null and premium_agent_limit = 0)
    or
    (is_premium = true and role = 'user' and premium_plan is not null and premium_agent_limit in (1, 3, 5))
  );

alter table public.agents
  drop constraint if exists agents_owner_type_check;

alter table public.agents
  add constraint agents_owner_type_check
  check (owner_type in ('platform', 'developer', 'user'));

alter table public.agents
  drop constraint if exists agents_owner_consistency_check;

alter table public.agents
  add constraint agents_owner_consistency_check
  check (
    (owner_type = 'platform' and owner_profile_id is null)
    or
    (owner_type in ('developer', 'user') and owner_profile_id is not null)
  );

create index if not exists idx_profiles_is_premium on public.profiles(is_premium);
create index if not exists idx_profiles_premium_plan on public.profiles(premium_plan);
