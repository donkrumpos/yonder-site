-- contact_messages table — incoming notes from the public contact form.
-- The `contact` edge function inserts here AND sends a notification email.
--
-- Service role bypasses RLS; anon access is denied by default.

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  source text,
  created_at timestamptz not null default now()
);

create index contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
