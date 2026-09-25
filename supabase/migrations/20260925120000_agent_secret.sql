-- Agents accept runs only from pg_cron (or SQL run inside this database), not
-- from anyone holding the public anon key. The secret is generated here and
-- never leaves the database: cron reads it from Vault and sends it as the
-- x-agent-secret header; each agent asks public.agent_secret_ok() to check it.

select vault.create_secret(
  encode(extensions.gen_random_bytes(32), 'hex'),
  'agent_secret',
  'Shared secret pg_cron sends to the agent Edge Functions (x-agent-secret)'
)
where not exists (select 1 from vault.secrets where name = 'agent_secret');

create or replace function public.agent_secret_ok(s text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'agent_secret' and decrypted_secret = s
  );
$$;

revoke all on function public.agent_secret_ok(text) from public, anon, authenticated;
grant execute on function public.agent_secret_ok(text) to service_role;

-- Every agent cron job sends the header.
select cron.alter_job(
  jobid,
  command := replace(
    command,
    '''Content-Type'', ''application/json''',
    '''Content-Type'', ''application/json'', ''x-agent-secret'', (select decrypted_secret from vault.decrypted_secrets where name = ''agent_secret'')'
  )
)
from cron.job
where command like '%/functions/v1/%'
  and command not like '%x-agent-secret%';
