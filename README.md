# pixelgirl

A personal art blog and gallery — illustrations, photography, pixel art, and writing. No algorithm. Just things I made.

**Live site:** [p1x3lg1rl.com](https://p1x3lg1rl.com)

---

## Links

|                                                      |                                  |
| ---------------------------------------------------- | -------------------------------- |
| [Live site](https://p1x3lg1rl.com)                   | View the website                 |
| [Repository](https://github.com/krrroo/pixelgirl)    | Source code                      |
| [Issues](https://github.com/krrroo/pixelgirl/issues) | Bug reports and feature requests |

---

## Features

- **Post feed** — public gallery of posts with image lightbox
- **Lightbox** — double-click to like, constrained image display with pixel close button
- **Draft/publish control** — new posts default to draft; uncheck to publish immediately
- **Like persistence** — likes stored in `localStorage` to survive page refresh
- **Music playlist** — songs are posts of type `music`; the sidebar (or bottom bar on mobile) plays every published one, with prev/next and per-tile play buttons. Managed from the admin panel's Music tab. With no songs uploaded (or Supabase down), a default SoundCloud track plays through a hidden SoundCloud widget, credited and linked to the artist (`DEFAULT_TRACK` in `app.js`)

---

## Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Backend / database:** [Supabase](https://supabase.com) (Auth, Storage, Database)
- **Hosting:** GitHub Pages, custom domain via `CNAME`
- **Migrations:** SQL files in `supabase/migrations/`, applied by the deploy workflow when production is released

---

## Development

Needs Node 20+. The site itself has no build step; Node is only for the dev tools.

```bash
npm install                     # once
npx playwright install chromium # once, for browser tests
npm run serve                   # site at http://localhost:4173
npm run check                   # everything CI runs: lint, format, unit + browser tests
```

| Command            | Tool       | What it does                                                                                                          | Python equivalent   |
| ------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `npm run lint`     | ESLint     | Finds bugs and risky patterns                                                                                         | `ruff check`        |
| `npm run format`   | Prettier   | Rewrites code into one consistent style                                                                               | `ruff format`       |
| `npm test`         | Vitest     | Unit tests for logic (player, data mapping, escaping)                                                                 | `pytest`            |
| `npm run test:e2e` | Playwright | Opens the real pages in a browser (desktop + iPhone size) and clicks through them, with Supabase and SoundCloud faked | `pytest` + Selenium |

Browser tests never touch the real database: `tests/e2e/fixtures/` holds fake Supabase and SoundCloud scripts that are swapped in for the real ones.

---

## Branches, CI/CD and staging

```
feature branch ──PR──▶ dev ──PR──▶ main (production)
                        │            │
                        ▼            ▼
          p1x3lg1rl.com/staging/   p1x3lg1rl.com
```

- **Work happens on a branch**, merged into `dev` by pull request. Every PR runs CI (`.github/workflows/ci.yml`): lint, format check, unit tests, browser tests.
- **Merging into `dev`** deploys to **staging** — `p1x3lg1rl.com/staging/` (yellow STAGING tag, hidden from search engines, not counted in stats). Check it on your phone.
- **Releasing** = a PR from `dev` into `main`. Merging it deploys production and runs any new database migrations.
- Nobody pushes to `dev` or `main` directly — branch protection requires a PR with passing checks.
- `.github/workflows/deploy.yml` does the deploy; it builds both sites with `scripts/build-site.sh` and publishes them together to GitHub Pages. If the production branch is ever renamed `prod`, the workflow picks that up automatically.

⚠️ Staging uses the **same Supabase database** as production — posts made or deleted in staging admin are real. A separate Supabase project for staging is the next step if that becomes a problem.

---

## Project structure

No build step: the browser loads the ES modules in `js/` directly.

```
pixelgirl/
├── index.html / style.css      # public site
├── admin.html / admin.css      # phone-first admin app
├── js/
│   ├── main.js                 # public site entry point — wires the parts together
│   ├── core/                   # shared by both apps: config, Supabase client, DOM + format helpers
│   ├── data/                   # everything that talks to Supabase (posts, likes, tracking) + sample posts
│   ├── player/                 # music player: Player (logic), engines (audio file / SoundCloud), PlayerView
│   ├── site/                   # public site UI: store (state), grid, lightbox, router, auth, in-site admin
│   └── admin/                  # admin app: feed, composer, music, stats
├── samples/                    # images for the fallback sample posts
├── scripts/                    # build-site.sh (assembles prod + staging), migrate.sh
└── supabase/migrations/        # database schema changes, applied on production deploys
```

### How the pieces talk

- **`store`** (`js/site/store.js`) holds posts, filter and signed-in user, and emits events when they change. UI modules listen to it instead of calling each other.
- **`Player`** has no DOM code: it picks the first engine that can play a track (`HtmlAudioEngine` for uploaded files, `SoundCloudEngine` for SoundCloud links). `PlayerView` renders it.
- HTML is built with the `html` tagged template in `js/core/dom.js`, which escapes every value automatically. Buttons declare `data-action="…"` and modules handle them with `delegate()` — no inline `onclick`.
