-- Agent 06 switches from Google Places to Claude web search (no Google
-- billing needed). Web results have no Places id, so prospects are keyed by a
-- normalised name instead, and each row records how to contact it and where
-- every fact came from.
alter table public.prospects alter column place_id drop not null;
alter table public.prospects add column if not exists dedupe_key text;
alter table public.prospects add column if not exists email text;
alter table public.prospects add column if not exists social_url text;
alter table public.prospects add column if not exists website_status text
  check (website_status in ('found', 'none_found', 'unknown'));
alter table public.prospects add column if not exists contact_channel text
  check (contact_channel in ('email', 'phone', 'social', 'none'));
alter table public.prospects add column if not exists draft_channel text
  check (draft_channel in ('email', 'whatsapp', 'social_dm'));
alter table public.prospects add column if not exists sources jsonb;
create unique index if not exists prospects_dedupe_key_idx on public.prospects (dedupe_key);

-- More small-business categories, alongside the original twelve.
insert into public.prospect_queries (query, sector) values
  ('pharmacies in Lagos', 'Healthcare'),
  ('hotels and short-let apartments in Lekki, Lagos', 'Hospitality'),
  ('bakeries and cake shops in Lagos', 'Food'),
  ('car dealers in Lagos', 'Automotive'),
  ('interior design studios in Lagos', 'Home & interiors')
on conflict (query) do nothing;
