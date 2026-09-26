-- Agent 06 runs daily at 05:30 UTC (06:30 Lagos), half an hour before the
-- CEO Agent's brief, so the brief reports that morning's new leads. Each run
-- takes the 2 least-recently-run active queries (about 20 businesses, each
-- site checked and drafted). Cost: about US$0.15 to 0.20 a run on the
-- Anthropic API key. The anon key below is the public one; the agent secret
-- comes from Vault, as for every other agent job.
select cron.unschedule('prospecting-agent-daily')
where exists (select 1 from cron.job where jobname = 'prospecting-agent-daily');

select cron.schedule(
  'prospecting-agent-daily',
  '30 5 * * *',
  $$
  select net.http_post(
    url := 'https://wphdwifayyfbvgmymoia.supabase.co/functions/v1/prospecting-agent',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwaGR3aWZheXlmYnZnbXltb2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTkyODUsImV4cCI6MjEwNDk5NTI4NX0.GiOo4QfCQS9baNsvSen1E0sHEP4VRAWYizuHPGDgEMU',
      'Content-Type', 'application/json',
      'x-agent-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'agent_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000
  );
  $$
);
