-- Supplement :: LIFE — subscriber profile-photo upload (2026-07-24).
--
-- Adds an avatar_url column to public.users (same table that already
-- holds full_name, edited via the same self-service "Account Settings"
-- pattern on /dashboard — see app/dashboard/AccountSettings.tsx), plus a
-- public "avatars" Storage bucket with RLS policies scoped so a
-- subscriber can only write to their own folder (path prefix = their own
-- auth.uid()), but anyone can read any avatar (bucket is public — avatar
-- images are not sensitive, and need to be readable via a plain public
-- URL from next/image with no auth token attached).
--
-- Run this once in the Supabase SQL Editor, same as prior migrations.
-- Safe to re-run (each statement is idempotent).

alter table public.users
  add column if not exists avatar_url text;

comment on column public.users.avatar_url is
  'Public Storage URL for the subscriber''s uploaded profile photo (bucket: avatars, path: {user_id}/avatar). Null until they upload one — UI must fall back to initials, never a broken image.';

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone can read any avatar — the bucket is public and avatar images
-- carry no sensitive information (this mirrors the public-read intent of
-- `public: true` above; Storage still enforces its own RLS regardless of
-- the bucket's public flag, so this policy is required, not redundant).
drop policy if exists "Public read access for avatars" on storage.objects;
create policy "Public read access for avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- A subscriber may only insert/update/delete objects inside a folder
-- named after their own auth.uid() — e.g. "3f2a.../avatar" — never another
-- subscriber's folder. storage.foldername(name) splits the object path on
-- "/" and returns it as an array; [1] is the first path segment.
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
