alter table public.contacts
  add column if not exists service_interest text,
  add column if not exists budget text;
