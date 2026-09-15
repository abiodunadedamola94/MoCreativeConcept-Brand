create table public.agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  layer text,
  triggered_by text,
  status text check (status in ('success','failed','skipped')) not null default 'success',
  output_summary text,
  error_detail text,
  run_at timestamptz not null default now()
);

comment on table public.agent_logs is 'Runtime activity log for the 30-agent OS — written on every agent run. Distinct from the Notion Agent Build Roadmap, which tracks build status, not execution history. High write-frequency agents (Risk Monitor, Churn Prevention) log here rather than hitting Notion''s API on every check.';

alter table public.agent_logs enable row level security;

create index agent_logs_agent_name_idx on public.agent_logs (agent_name);
create index agent_logs_run_at_idx on public.agent_logs (run_at desc);
