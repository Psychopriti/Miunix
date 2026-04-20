create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text,
  description text,
  owner_type text not null,
  owner_profile_id uuid references public.profiles(id) on delete cascade,
  price numeric(10,2) not null default 0,
  currency text not null default 'USD',
  pricing_type text not null default 'free',
  is_active boolean not null default true,
  is_published boolean not null default false,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workflows_owner_type_check check (owner_type in ('platform', 'developer')),
  constraint workflows_owner_consistency_check check (
    (owner_type = 'platform' and owner_profile_id is null)
    or
    (owner_type = 'developer' and owner_profile_id is not null)
  ),
  constraint workflows_status_check check (status in ('draft', 'published', 'archived')),
  constraint workflows_pricing_type_check check (pricing_type in ('free', 'one_time', 'subscription')),
  constraint workflows_publish_compatibility_check check (
    (status = 'published' and is_published = true)
    or
    (status = 'draft' and is_published = false)
    or
    (status = 'archived')
  )
);

create table if not exists public.workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  position integer not null,
  agent_slug text not null references public.agents(slug) on delete restrict,
  step_key text not null,
  title text not null,
  input_mapping jsonb not null default '[]'::jsonb,
  output_mapping jsonb not null default '[]'::jsonb,
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  constraint workflow_steps_unique_position unique (workflow_id, position),
  constraint workflow_steps_unique_key unique (workflow_id, step_key)
);

create table if not exists public.workflow_purchases (
  id uuid primary key default gen_random_uuid(),
  buyer_profile_id uuid not null references public.profiles(id) on delete cascade,
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  purchase_price numeric(10,2) not null,
  currency text not null default 'USD',
  payment_status text not null default 'completed',
  purchased_at timestamptz not null default now(),
  constraint workflow_purchases_payment_status_check check (
    payment_status in ('pending', 'completed', 'failed', 'refunded')
  )
);

create table if not exists public.workflow_executions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  input_data jsonb not null default '{}'::jsonb,
  shared_context jsonb not null default '{}'::jsonb,
  final_output jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint workflow_executions_status_check check (
    status in ('pending', 'running', 'completed', 'failed')
  )
);

create table if not exists public.workflow_step_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_execution_id uuid not null references public.workflow_executions(id) on delete cascade,
  workflow_step_id uuid not null references public.workflow_steps(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  status text not null default 'pending',
  input_data jsonb not null default '{}'::jsonb,
  output_data jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint workflow_step_runs_status_check check (
    status in ('pending', 'running', 'completed', 'failed', 'skipped')
  )
);

drop trigger if exists set_workflows_updated_at on public.workflows;
create trigger set_workflows_updated_at
before update on public.workflows
for each row
execute function public.set_updated_at();

create index if not exists idx_workflows_slug on public.workflows(slug);
create index if not exists idx_workflows_status on public.workflows(status);
create index if not exists idx_workflows_marketplace on public.workflows(status, is_active, is_published);
create index if not exists idx_workflow_steps_workflow_id on public.workflow_steps(workflow_id);
create index if not exists idx_workflow_purchases_buyer_profile_id on public.workflow_purchases(buyer_profile_id);
create index if not exists idx_workflow_purchases_workflow_id on public.workflow_purchases(workflow_id);
create index if not exists idx_workflow_executions_profile_id on public.workflow_executions(profile_id);
create index if not exists idx_workflow_executions_workflow_id on public.workflow_executions(workflow_id);
create index if not exists idx_workflow_step_runs_execution_id on public.workflow_step_runs(workflow_execution_id);
create index if not exists idx_workflow_step_runs_workflow_step_id on public.workflow_step_runs(workflow_step_id);
