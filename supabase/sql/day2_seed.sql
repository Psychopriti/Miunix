insert into profiles (id, user_id, full_name, email, role)
values (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  'Juan Developer',
  'juan.dev@test.com',
  'developer'
)
on conflict (email) do update
set
  user_id = excluded.user_id,
  full_name = excluded.full_name,
  role = excluded.role;

insert into agents (
  owner_profile_id,
  owner_type,
  name,
  slug,
  description,
  prompt_template,
  is_active,
  is_published
)
values
  (
    null,
    'platform',
    'Lead Generation',
    'lead-generation',
    'Generate lead ideas, audience targeting, pain points, and outreach suggestions.',
    'You are an expert lead generation assistant.',
    true,
    true
  ),
  (
    null,
    'platform',
    'Marketing Content',
    'marketing-content',
    'Generate marketing copy, campaigns, post ideas, and promotional messaging.',
    'You are an expert marketing content assistant.',
    true,
    true
  ),
  (
    null,
    'platform',
    'Research',
    'research',
    'Analyze a topic, summarize insights, and return structured findings.',
    'You are an expert research assistant.',
    true,
    true
  )
on conflict (slug) do update
set
  owner_profile_id = excluded.owner_profile_id,
  owner_type = excluded.owner_type,
  name = excluded.name,
  description = excluded.description,
  prompt_template = excluded.prompt_template,
  is_active = excluded.is_active,
  is_published = excluded.is_published;
