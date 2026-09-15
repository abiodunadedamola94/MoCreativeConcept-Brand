create table public.revenue (
  id uuid primary key default gen_random_uuid(),
  entry text not null,
  type text check (type in ('Project Fee','Retainer','Maintenance','Digital Product')),
  amount_ngn numeric not null,
  client_id uuid references public.leads(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  entry_date date not null default current_date,
  status text check (status in ('Invoiced','Paid','Overdue')) default 'Invoiced',
  notion_page_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.revenue is 'Mirrors the Notion MRR & Revenue Tracker database — the financial heartbeat.';

alter table public.revenue enable row level security;

create index revenue_status_idx on public.revenue (status);
create index revenue_entry_date_idx on public.revenue (entry_date);
