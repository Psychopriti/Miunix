insert into public.workflows (
  slug,
  name,
  short_description,
  description,
  owner_type,
  owner_profile_id,
  price,
  currency,
  pricing_type,
  is_active,
  is_published,
  status
)
values
  (
    'research-leads',
    'Research + Leads',
    'Investigacion del mercado y aterrizaje de prospectos en un mismo flujo.',
    'El workflow analiza el objetivo comercial, sintetiza hallazgos accionables y despues convierte esa investigacion en ICPs y leads priorizados.',
    'platform',
    null,
    29,
    'USD',
    'subscription',
    true,
    true,
    'published'
  ),
  (
    'leads-marketing',
    'Leads + Marketing',
    'De segmentos y prospectos a mensajes y assets listos para activar.',
    'El workflow detecta perfiles prioritarios y transforma esa salida en angulos de mensaje, copys y piezas base para growth.',
    'platform',
    null,
    39,
    'USD',
    'subscription',
    true,
    true,
    'published'
  ),
  (
    'research-leads-marketing',
    'Research + Leads + Marketing',
    'Pipeline completo desde descubrimiento de mercado hasta activacion comercial.',
    'El workflow une research, lead generation y marketing content para entregar un paquete completo con hallazgos, ICPs, leads y assets de activacion.',
    'platform',
    null,
    59,
    'USD',
    'subscription',
    true,
    true,
    'published'
  )
on conflict (slug) do update
set
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  owner_type = excluded.owner_type,
  owner_profile_id = excluded.owner_profile_id,
  price = excluded.price,
  currency = excluded.currency,
  pricing_type = excluded.pricing_type,
  is_active = excluded.is_active,
  is_published = excluded.is_published,
  status = excluded.status;

delete from public.workflow_steps
where workflow_id in (
  select id
  from public.workflows
  where slug in ('research-leads', 'leads-marketing', 'research-leads-marketing')
);

insert into public.workflow_steps (
  workflow_id,
  position,
  agent_slug,
  step_key,
  title,
  input_mapping,
  output_mapping,
  is_required
)
select workflows.id, seed.position, seed.agent_slug, seed.step_key, seed.title, seed.input_mapping::jsonb, seed.output_mapping::jsonb, true
from public.workflows
join (
  values
    ('research-leads', 1, 'research', 'research', 'Research Brief', '["business_goal","offer","geography","target_segment"]', '["research_findings"]'),
    ('research-leads', 2, 'lead-generation', 'lead-generation', 'Lead Prioritization', '["business_goal","offer","geography","target_segment","research_findings"]', '["selected_icps","lead_list"]'),
    ('leads-marketing', 1, 'lead-generation', 'lead-generation', 'Lead Prioritization', '["business_goal","offer","geography","target_segment"]', '["selected_icps","lead_list"]'),
    ('leads-marketing', 2, 'marketing-content', 'marketing-content', 'Messaging Activation', '["business_goal","offer","geography","target_segment","selected_icps","lead_list"]', '["messaging_angles","final_assets"]'),
    ('research-leads-marketing', 1, 'research', 'research', 'Research Brief', '["business_goal","offer","geography","target_segment"]', '["research_findings"]'),
    ('research-leads-marketing', 2, 'lead-generation', 'lead-generation', 'Lead Prioritization', '["business_goal","offer","geography","target_segment","research_findings"]', '["selected_icps","lead_list"]'),
    ('research-leads-marketing', 3, 'marketing-content', 'marketing-content', 'Messaging Activation', '["business_goal","offer","geography","target_segment","research_findings","selected_icps","lead_list"]', '["messaging_angles","final_assets"]')
) as seed(workflow_slug, position, agent_slug, step_key, title, input_mapping, output_mapping)
  on seed.workflow_slug = workflows.slug;

insert into public.workflow_purchases (
  buyer_profile_id,
  workflow_id,
  purchase_price,
  currency,
  payment_status
)
select
  profile.id,
  workflow.id,
  workflow.price,
  workflow.currency,
  'completed'
from public.profiles profile
cross join public.workflows workflow
where profile.email = 'juan.dev@test.com'
  and workflow.slug in ('research-leads', 'leads-marketing', 'research-leads-marketing')
  and not exists (
    select 1
    from public.workflow_purchases purchase
    where purchase.buyer_profile_id = profile.id
      and purchase.workflow_id = workflow.id
      and purchase.payment_status = 'completed'
  );
