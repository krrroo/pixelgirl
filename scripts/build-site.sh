#!/usr/bin/env bash
# Copies a checkout of the repo into a folder ready to publish, leaving out
# dev-only files. With "staging" as the 3rd argument it also marks the copy
# as staging: hidden from search engines and with a visible "staging" tag.
#
#   scripts/build-site.sh <source-dir> <output-dir> [staging]
set -euo pipefail

src=$1
out=$2
mode=${3:-production}

mkdir -p "$out"
tar -C "$src" -cf - \
  --exclude './.git' --exclude './.github' --exclude './node_modules' \
  --exclude './tests' --exclude './scripts' --exclude './supabase' --exclude './src' \
  --exclude './package.json' --exclude './package-lock.json' \
  --exclude './*.config.js' --exclude './.prettier*' --exclude './.gitignore' \
  --exclude './README.md' --exclude './playwright-report' --exclude './test-results' \
  --exclude './_site' . | tar -C "$out" -xf -

if [ "$mode" = "staging" ]; then
  rm -f "$out/CNAME" # only the root site owns the custom domain
  tag='<div style="position:fixed;top:6px;left:50%;transform:translateX(-50%);z-index:10000;pointer-events:none;background:#c9a227;color:#000;font:600 10px/1 monospace;letter-spacing:.1em;padding:4px 8px;text-transform:uppercase">staging</div>'
  for page in "$out"/index.html "$out"/admin.html; do
    [ -f "$page" ] || continue
    sed -i "0,/<head>/s|<head>|<head>\n<meta name=\"robots\" content=\"noindex\">|" "$page"
    sed -i "0,/<body>/s|<body>|<body>\n$tag|" "$page"
  done
fi

echo "built $mode site from $src → $out"
