-- AgentWats — Supabase schema (run in SQL Editor or migrations)
-- Requires: Supabase project with Auth enabled

-- Extensions
create extension if not exists "uuid-ossp";

-- Enums
do $$ begin
  create type public.contact_tag as enum ('hot', 'warm', 'cold');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.message_direction as enum ('incoming', 'outgoing');
exception
  when duplicate_object then null;
end $$;

-- Users (1:1 with auth.users — business owner)
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- WhatsApp accounts
create table if not exists public.whatsapp_accounts (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.users (id) on delete cascade,
  phone_number_id text not null unique,
  access_token text not null,
  business_account_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_accounts_user on public.whatsapp_accounts (user_id);

-- Contacts / leads
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.users (id) on delete cascade,
  phone text not null,
  name text,
  tag public.contact_tag not null default 'cold',
  last_message text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, phone)
);

create index if not exists idx_contacts_user on public.contacts (user_id);
create index if not exists idx_contacts_tag on public.contacts (user_id, tag);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.users (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  content text not null,
  direction public.message_direction not null,
  wa_message_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists messages_wa_message_id_unique
  on public.messages (wa_message_id)
  where wa_message_id is not null;

create index if not exists idx_messages_contact_created on public.messages (contact_id, created_at desc);
create index if not exists idx_messages_user on public.messages (user_id);

-- Bots / AI
create table if not exists public.bots (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.users (id) on delete cascade unique,
  prompt text not null default 'You are a professional sales assistant.

* Answer clearly
* Capture leads (name, email)
* Be friendly
* Ask follow-up questions',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bots_user on public.bots (user_id);

-- Mirror auth signups into public.users + default bot (after bots table exists)
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  insert into public.bots (user_id, prompt, is_active)
  values (
    new.id,
    'You are a professional sales assistant.

* Answer clearly
* Capture leads (name, email)
* Be friendly
* Ask follow-up questions',
    true
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();

-- RLS
alter table public.users enable row level security;
alter table public.whatsapp_accounts enable row level security;
alter table public.contacts enable row level security;
alter table public.messages enable row level security;
alter table public.bots enable row level security;

-- Policies: users see only own rows
create policy "users_select_own" on public.users
  for select using (auth.uid () = id);

create policy "users_update_own" on public.users
  for update using (auth.uid () = id);

create policy "whatsapp_accounts_all_own" on public.whatsapp_accounts
  for all using (auth.uid () = user_id);

create policy "contacts_all_own" on public.contacts
  for all using (auth.uid () = user_id);

create policy "messages_all_own" on public.messages
  for all using (auth.uid () = user_id);

create policy "bots_all_own" on public.bots
  for all using (auth.uid () = user_id);

-- Service role bypasses RLS — used by webhook with service key

-- Realtime: replicate messages and contacts for live UI
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.contacts;

-- Optional: trigger to keep bots.updated_at fresh
create or replace function public.touch_bots_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now ();
  return new;
end;
$$;

drop trigger if exists trg_bots_updated on public.bots;
create trigger trg_bots_updated
  before update on public.bots
  for each row execute function public.touch_bots_updated_at ();
