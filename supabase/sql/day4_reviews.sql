alter table public.agent_reviews
add column if not exists updated_at timestamptz not null default now();

create or replace function public.refresh_agent_review_stats(target_agent_id uuid)
returns void
language plpgsql
as $$
begin
  update public.agents
  set
    average_rating = coalesce((
      select round(avg(agent_reviews.rating)::numeric, 2)
      from public.agent_reviews
      where agent_reviews.agent_id = target_agent_id
    ), 0),
    total_reviews = (
      select count(*)
      from public.agent_reviews
      where agent_reviews.agent_id = target_agent_id
    )
  where id = target_agent_id;
end;
$$;

create or replace function public.handle_agent_review_stats_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_agent_review_stats(old.agent_id);
    return old;
  end if;

  perform public.refresh_agent_review_stats(new.agent_id);

  if tg_op = 'UPDATE' and old.agent_id is distinct from new.agent_id then
    perform public.refresh_agent_review_stats(old.agent_id);
  end if;

  return new;
end;
$$;

drop trigger if exists set_agent_reviews_updated_at on public.agent_reviews;
create trigger set_agent_reviews_updated_at
before update on public.agent_reviews
for each row
execute function public.set_updated_at();

drop trigger if exists refresh_agent_review_stats_after_change on public.agent_reviews;
create trigger refresh_agent_review_stats_after_change
after insert or update or delete on public.agent_reviews
for each row
execute function public.handle_agent_review_stats_change();

update public.agents
set
  average_rating = coalesce(review_stats.average_rating, 0),
  total_reviews = coalesce(review_stats.total_reviews, 0)
from (
  select
    agents.id as agent_id,
    round(avg(agent_reviews.rating)::numeric, 2) as average_rating,
    count(agent_reviews.id)::integer as total_reviews
  from public.agents
  left join public.agent_reviews on agent_reviews.agent_id = agents.id
  group by agents.id
) as review_stats
where public.agents.id = review_stats.agent_id;

drop policy if exists "Authenticated users can read reviews of published agents" on public.agent_reviews;
create policy "Anyone can read reviews of published agents"
on public.agent_reviews
for select
using (
  exists (
    select 1
    from public.agents
    where agents.id = agent_reviews.agent_id
      and agents.status = 'published'
      and agents.is_published = true
      and agents.is_active = true
  )
);

drop policy if exists "Users can insert own reviews" on public.agent_reviews;
create policy "Users can insert reviews for purchased agents"
on public.agent_reviews
for insert
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = agent_reviews.profile_id
      and profiles.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.agent_purchases
    where agent_purchases.agent_id = agent_reviews.agent_id
      and agent_purchases.buyer_profile_id = agent_reviews.profile_id
      and agent_purchases.payment_status = 'completed'
  )
);

drop policy if exists "Users can update own reviews" on public.agent_reviews;
create policy "Users can update reviews for purchased agents"
on public.agent_reviews
for update
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = agent_reviews.profile_id
      and profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = agent_reviews.profile_id
      and profiles.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.agent_purchases
    where agent_purchases.agent_id = agent_reviews.agent_id
      and agent_purchases.buyer_profile_id = agent_reviews.profile_id
      and agent_purchases.payment_status = 'completed'
  )
);
