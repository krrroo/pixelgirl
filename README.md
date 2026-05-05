# pixelgirl

A personal art blog and gallery — illustrations, photography, pixel art, and writing. No algorithm. Just things I made.

**GitHub repository:** [krrroo/pixelgirl](https://github.com/krrroo/pixelgirl)

---

## Pages

| Page | Description |
|------|-------------|
| [Repository](https://github.com/krrroo/pixelgirl) | Source code |
| [Issues](https://github.com/krrroo/pixelgirl/issues) | Bug reports and feature requests |
| [Pull requests](https://github.com/krrroo/pixelgirl/pulls) | Open contributions |
| [Commits](https://github.com/krrroo/pixelgirl/commits) | Change history |

---

## Features

- **Post feed** — public gallery of posts with image lightbox
- **Lightbox** — double-click to like, constrained image display with pixel close button
- **Draft/publish control** — new posts default to draft; uncheck to publish immediately
- **Like persistence** — likes stored in `localStorage` to survive page refresh
- **Background music player** — looping audio with volume control, loaded from Supabase storage
- **Gothic font preview** — live font preview panel in the admin area
- **Admin panel** — password-protected via Supabase Auth; create posts, upload music, delete content
- **Mobile nav** — responsive header with admin link shown only when logged in

---

## Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Backend / database:** [Supabase](https://supabase.com) (Auth, Storage, Database)

---

## Project structure

```
pixelgirl/
├── index.html   # App shell and all page markup
├── app.js       # All application logic
└── style.css    # Styles
```
