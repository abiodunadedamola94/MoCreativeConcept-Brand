create table public.leads (
  id uuid primary key default gen_random_uuid(),
  contact_or_company text not null,
  stage text check (stage in ('Awareness','Interest','Consideration','Intent','Decision','Onboarding','In Delivery','Delivered','Retention','Advocacy')) default 'Awareness',
  client_tier text check (client_tier in ('Anchor','Growth','Passive Buyer','Strategic Partner')),
  source text check (source in ('LinkedIn','Referral','Inbound','Cold Outreach','Other')),
  fit_score numeric,
  email text,
  next_action text,
  next_action_date date,
  notes text,
  notion_page_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.leads is 'Mirrors the Notion CRM & Pipeline database. notion_page_id links back to the source of record.';

alter table public.leads enable row level security;
