create table if not exists public.agent_conversations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  title text not null default 'Nueva conversacion',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agent_executions
add column if not exists conversation_id uuid references public.agent_conversations(id) on delete cascade;

create index if not exists idx_agent_conversations_profile_id on public.agent_conversations(profile_id);
create index if not exists idx_agent_conversations_agent_id on public.agent_conversations(agent_id);
create index if not exists idx_agent_conversations_last_message_at on public.agent_conversations(last_message_at desc);
create index if not exists idx_agent_executions_conversation_id on public.agent_executions(conversation_id);

drop trigger if exists set_agent_conversations_updated_at on public.agent_conversations;
create trigger set_agent_conversations_updated_at
before update on public.agent_conversations
for each row
execute function public.set_updated_at();

alter table public.agent_conversations enable row level security;

drop policy if exists "Users can view own conversations" on public.agent_conversations;
create policy "Users can view own conversations"
on public.agent_conversations
for select
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = agent_conversations.profile_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own conversations" on public.agent_conversations;
create policy "Users can insert own conversations"
on public.agent_conversations
for insert
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = agent_conversations.profile_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own conversations" on public.agent_conversations;
create policy "Users can update own conversations"
on public.agent_conversations
for update
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = agent_conversations.profile_id
      and profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = agent_conversations.profile_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own conversations" on public.agent_conversations;
create policy "Users can delete own conversations"
on public.agent_conversations
for delete
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = agent_conversations.profile_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert executions into own conversations" on public.agent_executions;
create policy "Users can insert executions into own conversations"
on public.agent_executions
for insert
with check (
  exists (
    select 1
    from public.profiles
    join public.agents on agents.id = agent_executions.agent_id
    left join public.agent_conversations
      on agent_conversations.id = agent_executions.conversation_id
    where profiles.id = agent_executions.profile_id
      and profiles.user_id = auth.uid()
      and (
        agent_executions.conversation_id is null
        or (
          agent_conversations.profile_id = profiles.id
          and agent_conversations.agent_id = agent_executions.agent_id
        )
      )
      and (
        (agents.is_active = true and agents.status = 'published' and agents.is_published = true)
        or
        (
          agents.is_active = true
          and agents.owner_type = 'developer'
          and agents.owner_profile_id = profiles.id
        )
      )
  )
);
