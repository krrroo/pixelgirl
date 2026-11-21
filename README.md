# pixelgirl

A personal art blog and gallery — illustrations, photography, pixel art, and writing. No algorithm. Just things I made.

**Live site:** [p1x3lg1rl.com](https://p1x3lg1rl.com)

---

## Links

| | |
|---|---|
| [Live site](https://p1x3lg1rl.com) | View the website |
| [Repository](https://github.com/krrroo/pixelgirl) | Source code |
| [Issues](https://github.com/krrroo/pixelgirl/issues) | Bug reports and feature requests |

---

## Features

- **Post feed** — public gallery of posts with image lightbox
- **Lightbox** — double-click to like, constrained image display with pixel close button
- **Draft/publish control** — new posts default to draft; uncheck to publish immediately
- **Like persistence** — likes stored in `localStorage` to survive page refresh
- **Music playlist** — songs are posts of type `music`; the sidebar (or bottom bar on mobile) plays every published one, with prev/next and per-tile play buttons. Managed from the admin panel's Music tab

---

## Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Backend / database:** [Supabase](https://supabase.com) (Auth, Storage, Database)
- **Hosting:** GitHub Pages, custom domain via `CNAME`
- **Migrations:** SQL files in `supabase/migrations/`, applied by a GitHub Action on push to `main`

---

## Project structure

```
pixelgirl/
├── index.html                  # App shell and all page markup
├── app.js                      # All application logic
├── style.css                   # Styles
├── admin.html                  # Mobile-first admin panel (posts, stats, music, settings)
├── supabase/migrations/        # Database schema migrations
└── .github/workflows/          # Migration pipeline
```
