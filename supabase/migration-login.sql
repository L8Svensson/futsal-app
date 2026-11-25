-- Run this in the Supabase SQL Editor to switch from "public read, password
-- to edit" to "must log in to see or edit anything".
-- Before running: create the shared login user in
-- Authentication > Users > Add user (tick "Auto Confirm User").

drop policy if exists "Public read" on app_state;
revoke select, insert, update, delete on app_state from anon;
revoke execute on function check_edit_password(text) from anon, authenticated;
revoke execute on function update_app_data(jsonb, text) from anon, authenticated;
drop function if exists check_edit_password(text);
drop function if exists update_app_data(jsonb, text);
drop table if exists app_secrets;

create policy "Authenticated read" on app_state
  for select to authenticated using (true);

create policy "Authenticated write" on app_state
  for update to authenticated using (true) with check (true);

grant select, update on app_state to authenticated;
