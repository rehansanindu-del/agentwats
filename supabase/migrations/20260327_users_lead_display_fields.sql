-- Lead extraction config + which keys show in Leads UI (null = not configured yet)
alter table public.users
  add column if not exists lead_fields jsonb default '["name", "service", "budget"]'::jsonb;

alter table public.users
  add column if not exists lead_display_fields jsonb;
