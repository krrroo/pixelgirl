-- Lock down the posts table.
--
-- Before: visitors saved likes by updating posts.likes directly, so the
-- database had to let anonymous users UPDATE posts — which (depending on the
-- policy) can mean anyone could edit or blank out any post.
--
-- After:
--   * visitors can only READ published posts, and like through
--     increment_likes(), which can change nothing but the like count (±1)
--   * only signed-in users (you) can read drafts, create, edit or delete
--
-- Make sure public sign-ups are OFF in Supabase (Authentication → Sign In /
-- Providers → "Allow new users to sign up"), or "signed-in" means anyone.

begin;

-- ── 1. likes go through a function ───────────────────────────────
-- security definer: runs with the function owner's rights, so visitors
-- don't need UPDATE on the table. It only ever moves likes by one step and
-- never below zero, and ignores drafts.
create or replace function public.increment_likes(post_id uuid, delta int default 1)
returns int
language sql
security definer
set search_path = public
as $$
  update public.posts
     set likes = greatest(0, coalesce(likes, 0) + case when delta < 0 then -1 else 1 end)
   where id = post_id
     and published is not false
  returning likes;
$$;

revoke all on function public.increment_likes(uuid, int) from public;
grant execute on function public.increment_likes(uuid, int) to anon, authenticated;

-- ── 2. replace whatever policies posts had with a known set ──────
alter table public.posts enable row level security;

do $$
declare
  p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'posts' loop
    execute format('drop policy %I on public.posts', p.policyname);
  end loop;
end $$;

create policy "anyone can read published posts"
  on public.posts for select to anon, authenticated
  using (published is not false);

create policy "admin can read all posts"
  on public.posts for select to authenticated
  using (true);

create policy "admin can create posts"
  on public.posts for insert to authenticated
  with check (true);

create policy "admin can edit posts"
  on public.posts for update to authenticated
  using (true) with check (true);

create policy "admin can delete posts"
  on public.posts for delete to authenticated
  using (true);

-- belt and braces: even if a permissive policy is added later by mistake,
-- anonymous users have no write privileges on the table at all
revoke insert, update, delete on public.posts from anon;

commit;
