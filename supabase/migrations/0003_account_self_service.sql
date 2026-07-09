-- Adds account self-service to the dashboard: editable full name, and a
-- proper email-change flow.
--
--  - full_name is directly editable by the user via public.users (RLS
--    already scopes updates to their own row, see 0001_init.sql).
--  - Email changes must go through Supabase Auth's updateUser() (its
--    built-in confirm-the-new-address flow) rather than being edited
--    directly — a trigger keeps public.users.email in sync automatically
--    once the change is confirmed.
--  - A protective trigger locks the "email" and "reservation_id" columns
--    against direct client writes to public.users, even though the RLS
--    policy allows updating the row overall — those two fields should
--    only ever change via the auth flow / Stripe webhook, never a raw
--    client update (e.g. someone hand-editing the request payload).
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New
-- query → paste → Run).

alter table public.users add column if not exists full_name text;

create or replace function public.protect_users_restricted_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.email := old.email;
    new.reservation_id := old.reservation_id;
  end if;
  return new;
end;
$$;

drop trigger if exists users_protect_restricted_columns on public.users;
create trigger users_protect_restricted_columns
  before update on public.users
  for each row execute procedure public.protect_users_restricted_columns();

create or replace function public.sync_user_email()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.users set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute procedure public.sync_user_email();
