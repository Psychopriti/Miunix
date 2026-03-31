alter table profiles enable row level security;
alter table agents enable row level security;
alter table agent_executions enable row level security;

drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
on profiles
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
on profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
on profiles
for update
using (auth.uid() = user_id);

drop policy if exists "Authenticated users can view published agents" on agents;
create policy "Authenticated users can view published agents"
on agents
for select
using (auth.role() = 'authenticated' and is_published = true);

drop policy if exists "Owners can view own developer drafts" on agents;
create policy "Owners can view own developer drafts"
on agents
for select
using (
  owner_type = 'developer'
  and owner_profile_id is not null
  and exists (
    select 1
    from profiles
    where profiles.id = agents.owner_profile_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Developers can create own developer agents" on agents;
create policy "Developers can create own developer agents"
on agents
for insert
with check (
  owner_type = 'developer'
  and owner_profile_id is not null
  and exists (
    select 1
    from profiles
    where profiles.id = agents.owner_profile_id
      and profiles.user_id = auth.uid()
      and profiles.role in ('developer', 'admin')
  )
);

drop policy if exists "Admins can create platform agents" on agents;
create policy "Admins can create platform agents"
on agents
for insert
with check (
  owner_type = 'platform'
  and owner_profile_id is null
  and exists (
    select 1
    from profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Owners can update own developer agents" on agents;
create policy "Owners can update own developer agents"
on agents
for update
using (
  owner_type = 'developer'
  and owner_profile_id is not null
  and exists (
    select 1
    from profiles
    where profiles.id = agents.owner_profile_id
      and profiles.user_id = auth.uid()
  )
)
with check (
  owner_type = 'developer'
  and owner_profile_id is not null
  and exists (
    select 1
    from profiles
    where profiles.id = agents.owner_profile_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Admins can update any agent" on agents;
create policy "Admins can update any agent"
on agents
for update
using (
  exists (
    select 1
    from profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Owners can delete own developer agents" on agents;
create policy "Owners can delete own developer agents"
on agents
for delete
using (
  owner_type = 'developer'
  and owner_profile_id is not null
  and exists (
    select 1
    from profiles
    where profiles.id = agents.owner_profile_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Admins can delete any agent" on agents;
create policy "Admins can delete any agent"
on agents
for delete
using (
  exists (
    select 1
    from profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Users can view own executions" on agent_executions;
create policy "Users can view own executions"
on agent_executions
for select
using (
  exists (
    select 1
    from profiles
    where profiles.id = agent_executions.profile_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own executions" on agent_executions;
create policy "Users can insert own executions"
on agent_executions
for insert
with check (
  exists (
    select 1
    from profiles
    join agents on agents.id = agent_executions.agent_id
    where profiles.id = agent_executions.profile_id
      and profiles.user_id = auth.uid()
      and (
        (agents.is_active = true and agents.is_published = true)
        or
        (
          agents.is_active = true
          and agents.owner_type = 'developer'
          and agents.owner_profile_id = profiles.id
        )
      )
  )
);

drop policy if exists "Users can update own executions" on agent_executions;
create policy "Users can update own executions"
on agent_executions
for update
using (
  exists (
    select 1
    from profiles
    where profiles.id = agent_executions.profile_id
      and profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from profiles
    where profiles.id = agent_executions.profile_id
      and profiles.user_id = auth.uid()
  )
);
