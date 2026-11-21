#!/usr/bin/env bash
# Applies any supabase/migrations/*.sql files that haven't run yet, in name
# order, recording each in public._migrations. Needs DB_URL (a Postgres
# connection string — the SUPABASE_DB_URL repository secret in CI).
set -euo pipefail
: "${DB_URL:?DB_URL is not set}"

psql "$DB_URL" -v ON_ERROR_STOP=1 -c "
  create table if not exists public._migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  );
"

for f in $(ls supabase/migrations/*.sql | sort); do
  name=$(basename "$f")
  applied=$(psql "$DB_URL" -tAc "select 1 from public._migrations where name = '$name'")
  if [ "$applied" = "1" ]; then
    echo "skip $name (already applied)"
    continue
  fi
  echo "applying $name"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$f"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -c "insert into public._migrations(name) values ('$name');"
done
