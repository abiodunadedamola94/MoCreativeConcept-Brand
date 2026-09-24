-- Rate card: prices live in the database, not in source code (the repo is
-- public). Agent 09 reads active rows at run time. Service-role only.
create table if not exists public.rate_card (
  id uuid primary key default gen_random_uuid(),
  item text not null unique,
  price_ngn numeric not null,
  price_max_ngn numeric,          -- set when the item is a range
  unit text,                      -- e.g. 'per year', 'per agent/workflow'
  notes text,
  pillar text check (pillar in ('Product Design', 'AI Automation')),
  sort int not null default 100,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.rate_card enable row level security;

-- Prices are seeded directly in the database, never in this public repo.
-- Edit them in the Supabase table editor (public.rate_card).

-- Agent 06 (Prospecting): what to search for. Edit rows to change targeting.
create table if not exists public.prospect_queries (
  id uuid primary key default gen_random_uuid(),
  query text not null unique,
  sector text not null,
  active boolean not null default true,
  last_run_at timestamptz,
  runs int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.prospect_queries enable row level security;

insert into public.prospect_queries (query, sector) values
  ('private schools in Lekki, Lagos', 'Education'),
  ('private schools in Ikeja, Lagos', 'Education'),
  ('dental clinics in Lagos', 'Healthcare'),
  ('private hospitals in Lekki, Lagos', 'Healthcare'),
  ('real estate agencies in Lekki, Lagos', 'Real estate'),
  ('logistics companies in Lagos', 'Logistics'),
  ('fashion boutiques in Lagos', 'Retail'),
  ('restaurants in Victoria Island, Lagos', 'Hospitality'),
  ('fitness gyms in Lagos', 'Fitness'),
  ('law firms in Lagos', 'Professional services'),
  ('event centres in Lagos', 'Events'),
  ('beauty salons and spas in Lekki, Lagos', 'Beauty')
on conflict (query) do nothing;

-- Agent 06 output. Deliberately separate from public.leads: the Screening
-- Agent emails leads automatically, and nothing here may be contacted until
-- the founder approves it and sends by hand.
create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  place_id text not null unique,
  name text not null,
  sector text,
  query text,
  address text,
  website text,
  phone text,
  rating numeric,
  rating_count int,
  maps_url text,
  pillar text check (pillar in ('Product Design', 'AI Automation')),
  fit_score int,
  fit_reason text,
  draft_message text,
  drafted_at timestamptz,
  status text not null default 'New'
    check (status in ('New', 'Approved', 'Contacted', 'Replied', 'Not a fit')),
  lead_id uuid references public.leads(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.prospects enable row level security;
create index if not exists prospects_status_score_idx on public.prospects (status, fit_score desc);
