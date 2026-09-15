create table public.projects (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  client_id uuid references public.leads(id) on delete set null,
  type text check (type in ('Active Project','Design Retainer','Maintenance','Digital Product')),
  status text check (status in ('Brief','In Delivery','QA','Delivered','Retainer Proposed','Retained','Closed')) default 'Brief',
  assumptions text,
  start_date date,
  deadline date,
  value_ngn numeric,
  deliverable_link text,
  notion_page_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.projects is 'Mirrors the Notion Project Tracker database. assumptions is the Brief-First Method''s third pillar, tracked per project.';
comment on column public.projects.assumptions is 'What is being bet on, confidence, what breaks if wrong, how we will know — the four-part structure defined in the Track A toolkit outline.';

alter table public.projects enable row level security;
