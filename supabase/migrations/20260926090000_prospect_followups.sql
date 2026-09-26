-- Outreach follow-up tracking for the daily brief.
-- contacted_at: when the first message went out. follow_up_due: when the next
-- nudge is due (day 4, then the founder moves it to day 10 after the nudge).
-- bounced_at: the address failed; reach them another way.
alter table public.prospects
  add column if not exists contacted_at timestamptz,
  add column if not exists follow_up_due date,
  add column if not exists bounced_at timestamptz;

-- Marking a prospect Contacted stamps the date and schedules the day-4 follow-up.
create or replace function public.prospects_on_contacted()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'Contacted' and (old.status is distinct from 'Contacted') then
    new.contacted_at := coalesce(new.contacted_at, now());
    new.follow_up_due := coalesce(new.follow_up_due, (new.contacted_at at time zone 'Africa/Lagos')::date + 4);
  end if;
  return new;
end;
$$;

drop trigger if exists prospects_contacted on public.prospects;
create trigger prospects_contacted
  before update on public.prospects
  for each row execute function public.prospects_on_contacted();

-- Backfill batch 1 (sent 25 Sep 2026 from hello@).
update public.prospects
set contacted_at = '2026-09-25 18:00:00+00',
    follow_up_due = '2026-09-29'
where status = 'Contacted' and contacted_at is null;

-- Delphi's address bounced (Resend, 25 Sep): no email follow-up.
update public.prospects
set bounced_at = '2026-09-25 18:12:26+00', follow_up_due = null
where name = 'Delphi International School Lekki';
