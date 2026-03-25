-- Optional: run in Supabase SQL editor if your DB was created before this column existed.
-- Deduplicates WhatsApp webhook retries (same Cloud API message id).

alter table public.messages
  add column if not exists wa_message_id text;

create unique index if not exists messages_wa_message_id_unique
  on public.messages (wa_message_id)
  where wa_message_id is not null;
