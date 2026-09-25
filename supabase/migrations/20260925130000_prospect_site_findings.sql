-- Agent 06 reads each business's own website before choosing the pitch.
-- site_findings holds what was seen there (problems and features); it becomes
-- the personal line of the draft.
alter table public.prospects
  add column if not exists site_findings text,
  add column if not exists site_checked_at timestamptz;
