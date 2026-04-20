alter table public.workflows enable row level security;
alter table public.workflow_steps enable row level security;
alter table public.workflow_purchases enable row level security;
alter table public.workflow_executions enable row level security;
alter table public.workflow_step_runs enable row level security;

drop policy if exists "Authenticated users can view published workflows" on public.workflows;
create policy "Authenticated users can view published workflows"
on public.workflows
for select
using (
  auth.role() = 'authenticated'
  and status = 'published'
  and is_published = true
  and is_active = true
);

drop policy if exists "Owners can view own workflow drafts" on public.workflows;
create policy "Owners can view own workflow drafts"
on public.workflows
for select
using (
  owner_type = 'developer'
  and owner_profile_id is not null
  and exists (
    select 1
    from public.profiles
    where profiles.id = workflows.owner_profile_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can view steps of visible workflows" on public.workflow_steps;
create policy "Authenticated users can view steps of visible workflows"
on public.workflow_steps
for select
using (
  exists (
    select 1
    from public.workflows
    where workflows.id = workflow_steps.workflow_id
      and workflows.status = 'published'
      and workflows.is_published = true
      and workflows.is_active = true
  )
);

drop policy if exists "Users can view own workflow purchases" on public.workflow_purchases;
create policy "Users can view own workflow purchases"
on public.workflow_purchases
for select
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = workflow_purchases.buyer_profile_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own workflow purchases" on public.workflow_purchases;
create policy "Users can insert own workflow purchases"
on public.workflow_purchases
for insert
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = workflow_purchases.buyer_profile_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Users can view own workflow executions" on public.workflow_executions;
create policy "Users can view own workflow executions"
on public.workflow_executions
for select
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = workflow_executions.profile_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own workflow executions" on public.workflow_executions;
create policy "Users can insert own workflow executions"
on public.workflow_executions
for insert
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = workflow_executions.profile_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own workflow executions" on public.workflow_executions;
create policy "Users can update own workflow executions"
on public.workflow_executions
for update
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = workflow_executions.profile_id
      and profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = workflow_executions.profile_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Users can view own workflow step runs" on public.workflow_step_runs;
create policy "Users can view own workflow step runs"
on public.workflow_step_runs
for select
using (
  exists (
    select 1
    from public.workflow_executions
    join public.profiles on profiles.id = workflow_executions.profile_id
    where workflow_executions.id = workflow_step_runs.workflow_execution_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own workflow step runs" on public.workflow_step_runs;
create policy "Users can insert own workflow step runs"
on public.workflow_step_runs
for insert
with check (
  exists (
    select 1
    from public.workflow_executions
    join public.profiles on profiles.id = workflow_executions.profile_id
    where workflow_executions.id = workflow_step_runs.workflow_execution_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own workflow step runs" on public.workflow_step_runs;
create policy "Users can update own workflow step runs"
on public.workflow_step_runs
for update
using (
  exists (
    select 1
    from public.workflow_executions
    join public.profiles on profiles.id = workflow_executions.profile_id
    where workflow_executions.id = workflow_step_runs.workflow_execution_id
      and profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workflow_executions
    join public.profiles on profiles.id = workflow_executions.profile_id
    where workflow_executions.id = workflow_step_runs.workflow_execution_id
      and profiles.user_id = auth.uid()
  )
);
