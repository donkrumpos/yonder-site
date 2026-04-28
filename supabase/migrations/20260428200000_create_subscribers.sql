-- subscribers table for the Yonder mailing list, with double opt-in.
--
-- The edge functions (`subscribe` and `confirm-subscription`) connect using the
-- service role key, which bypasses RLS. RLS is enabled with no policies so any
-- direct anon-key access is denied by default.

create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  confirmation_token uuid not null default gen_random_uuid(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscribers_email_unique unique (email),
  constraint subscribers_email_lowercase check (email = lower(email))
);

create index subscribers_token_idx on public.subscribers (confirmation_token);

alter table public.subscribers enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscribers_set_updated_at
  before update on public.subscribers
  for each row execute function public.set_updated_at();
