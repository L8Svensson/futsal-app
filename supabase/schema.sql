-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Sets up a single shared row of app data, publicly readable, writable only
-- through a password-checked RPC function (so the public anon key alone
-- can't modify data).

create table if not exists app_state (
  id int primary key default 1,
  data jsonb not null default '{"players":[],"weeks":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint app_state_singleton check (id = 1)
);

alter table app_state enable row level security;

create policy "Public read" on app_state
  for select using (true);
-- No insert/update/delete policies for anon/authenticated: writes only via
-- the security-definer function below.

insert into app_state (id, data)
values (1, '{"players":[],"weeks":[]}'::jsonb)
on conflict (id) do nothing;

create table if not exists app_secrets (
  id int primary key default 1,
  edit_password text not null,
  constraint app_secrets_singleton check (id = 1)
);

alter table app_secrets enable row level security;
-- Intentionally no policies at all: nobody (anon or authenticated) can
-- select/insert/update this table directly. Only the SECURITY DEFINER
-- functions below (owned by a privileged role) can read it.

-- Change 'change-me' to your real shared edit password before (or after)
-- running this script, e.g.:
--   update app_secrets set edit_password = 'your-password' where id = 1;
insert into app_secrets (id, edit_password)
values (1, 'change-me')
on conflict (id) do nothing;

create or replace function check_edit_password(pw text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select pw is not null and pw = (select edit_password from app_secrets where id = 1);
$$;

create or replace function update_app_data(payload jsonb, pw text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not check_edit_password(pw) then
    raise exception 'invalid password';
  end if;
  update app_state set data = payload, updated_at = now() where id = 1;
end;
$$;

grant execute on function check_edit_password(text) to anon, authenticated;
grant execute on function update_app_data(jsonb, text) to anon, authenticated;

-- After running this, go to Database > Replication and enable Realtime for
-- the `app_state` table so every open tab sees updates live.
