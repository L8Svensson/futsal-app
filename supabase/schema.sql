-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query)
-- for a brand-new project. Sets up a single shared row of app data, readable
-- and writable only by someone logged in via the shared Supabase Auth
-- account (see AGENTS.md for how to create that user).
--
-- If you're migrating an *existing* project that was set up with the older
-- "public read, password-gated write" model, run supabase/migration-login.sql
-- instead.

create table if not exists app_state (
  id int primary key default 1,
  data jsonb not null default '{"players":[],"weeks":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint app_state_singleton check (id = 1)
);

alter table app_state enable row level security;

create policy "Authenticated read" on app_state
  for select to authenticated using (true);

create policy "Authenticated write" on app_state
  for update to authenticated using (true) with check (true);

grant select, update on app_state to authenticated;

insert into app_state (id, data)
values (1, '{"players":[],"weeks":[]}'::jsonb)
on conflict (id) do nothing;

-- After running this:
-- 1. Authentication > Users > Add user: create the one shared login
--    (tick "Auto Confirm User" so it works without an email round-trip).
-- 2. Database > Replication: enable Realtime for the `app_state` table so
--    every signed-in tab sees updates live.
