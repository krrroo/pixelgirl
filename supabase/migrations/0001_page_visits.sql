-- Visit tracking for the admin panel's Stats tab.
create table if not exists public.page_visits (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  path text,
  created_at timestamptz not null default now()
);

alter table public.page_visits enable row level security;

drop policy if exists "anon can insert visits" on public.page_visits;
create policy "anon can insert visits"
  on public.page_visits for insert to anon
  with check (true);

drop policy if exists "authenticated can read visits" on public.page_visits;
create policy "authenticated can read visits"
  on public.page_visits for select to authenticated
  using (true);
