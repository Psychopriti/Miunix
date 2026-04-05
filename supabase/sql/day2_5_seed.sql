insert into public.profiles (id, user_id, full_name, email, role)
values (
  gen_random_uuid(),
  null,
  'Juan Developer',
  'juan.dev@test.com',
  'developer'
)
on conflict (email) do update
set
  user_id = excluded.user_id,
  full_name = excluded.full_name,
  role = excluded.role;

insert into public.agents (
  owner_profile_id,
  owner_type,
  name,
  slug,
  description,
  short_description,
  prompt_template,
  is_active,
  is_published,
  status,
  price,
  currency,
  pricing_type,
  published_at,
  cover_image_url,
  average_rating,
  total_reviews,
  total_runs
)
values
  (
    null,
    'platform',
    'Lead Generation',
    'lead-generation',
    'Generate lead ideas, audience targeting, pain points, and outreach suggestions.',
    'Find and shape lead opportunities for businesses.',
    'You are an expert lead generation assistant.',
    true,
    true,
    'published',
    0,
    'USD',
    'free',
    now(),
    null,
    0,
    0,
    0
  ),
  (
    null,
    'platform',
    'Marketing Content',
    'marketing-content',
    'Generate marketing copy, campaigns, post ideas, and promotional messaging.',
    'Create simple marketing assets for MVP growth.',
    'You are an expert marketing content assistant.',
    true,
    true,
    'published',
    0,
    'USD',
    'free',
    now(),
    null,
    0,
    0,
    0
  ),
  (
    null,
    'platform',
    'Research',
    'research',
    'Analyze a topic, summarize insights, and return structured findings.',
    'Research topics and summarize actionable insights.',
    'You are an expert research assistant.',
    true,
    true,
    'published',
    0,
    'USD',
    'free',
    now(),
    null,
    0,
    0,
    0
  )
on conflict (slug) do update
set
  owner_profile_id = excluded.owner_profile_id,
  owner_type = excluded.owner_type,
  name = excluded.name,
  description = excluded.description,
  short_description = excluded.short_description,
  prompt_template = excluded.prompt_template,
  is_active = excluded.is_active,
  is_published = excluded.is_published,
  status = excluded.status,
  price = excluded.price,
  currency = excluded.currency,
  pricing_type = excluded.pricing_type,
  published_at = excluded.published_at,
  cover_image_url = excluded.cover_image_url,
  average_rating = excluded.average_rating,
  total_reviews = excluded.total_reviews,
  total_runs = excluded.total_runs;

insert into public.agent_purchases (
  buyer_profile_id,
  agent_id,
  purchase_price,
  currency,
  payment_status
)
select
  profile.id,
  agent.id,
  0,
  'USD',
  'completed'
from public.profiles profile
cross join public.agents agent
where profile.email = 'juan.dev@test.com'
  and agent.slug in ('lead-generation', 'marketing-content', 'research')
  and not exists (
    select 1
    from public.agent_purchases purchase
    where purchase.buyer_profile_id = profile.id
      and purchase.agent_id = agent.id
      and purchase.payment_status = 'completed'
  );
