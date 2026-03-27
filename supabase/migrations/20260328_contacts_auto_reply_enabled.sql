alter table public.contacts
  add column if not exists auto_reply_enabled boolean not null default true;

comment on column public.contacts.auto_reply_enabled is 'When false, inbound WhatsApp messages skip AI auto-reply for this contact.';
