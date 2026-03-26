create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  plan text not null check (plan in ('starter', 'business')),
  message text,
  created_at timestamptz not null default now()
);

alter table public.contact_requests enable row level security;

drop policy if exists "contact_requests_no_access" on public.contact_requests;
create policy "contact_requests_no_access" on public.contact_requests
  for all
  using (false)
  with check (false);
