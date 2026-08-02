# Life Management Dashboard ("SISTEMA")

Self-hosted personal hub running in the homelab. Since the 08/2026 redesign the
design artifact "Management Dashboard Design" is the single source of truth:
five modules — **Overview, Tasks, Uni, Projects, Notes** — in a dark, editorial
design (Instrument Serif/Sans + JetBrains Mono). Finance, curriculum, review,
search and the calendar agenda were removed (the old finance and curriculum
tables stay in the database, they just have no UI any more).

## Stack

- **SvelteKit** (Svelte 5, `adapter-node`) — one language, one process
- **SQLite** via Node's built-in `node:sqlite` (Node ≥ 22, no C toolchain)
- No CSS framework; hand-written design system in `src/app.css`
  (tokens + component classes, ported from the artifact)
- Fonts self-hosted via Fontsource (no CDN)

## Modules

- **Overview** (`/`) — stat tiles, today's list, uni deadlines, monthly plate,
  quote, active projects, recent notes
- **Tasks** (`/tasks`) — Today/Week/Board/All views, areas Personal/Uni/Job,
  priorities P1–P3, detail page with notes
- **Uni** (`/uni`) — semesters (archivable) → courses (colour, lecturer, slot,
  ECTS, grade) → tasks (LEC/EXC/OTH) + study session (★ per day)
- **Projects** (`/projects`) — tiles/board, status Backlog/Paused/Active/
  Archived, plan-and-tasks checklist, repo link
- **Notes** (`/notes`) — folders with accent colours, two-column layout,
  search, cover image and a **block editor** (Tiptap): headings, to-do lists,
  tables, quotes, code, dividers — via the toolbar, via Markdown shorthand
  (`# `, `- `, `[ ] `, ` ``` `) or through the "/" menu; blocks can be moved by
  the handle on their left

Image slots (hero per module, sidebar mood, dashboard plate, note cover) accept
images by click or drag&drop; they are stored in `IMAGES_DIR` (filesystem, no DB
row) and served through `/api/images/[slot]`.

## Development

```bash
npm install
npm run dev          # reads DATABASE_PATH from .env (default ./dev.db)
```

The database migrates itself on first access (migrations are embedded in the
server build). Manually: `DATABASE_PATH=./dev.db npm run db:migrate`.

**Migrations are date-prefixed** (`20260713_0001_….sql`) on purpose: on deploy
the app adopts the existing budget01 database in place, without colliding with
its `schema_migrations` entries.

- `20260801_0010_redesign.sql` moves tasks/uni/notes/projects to the new schema
  on a best-effort basis.
- `20260802_0011_note_doc.sql` adds `notes.doc` for the block editor: the Tiptap
  document lives there as JSON, while `notes.body` carries the plain text
  derived from it (search, excerpts, word count). Notes without a `doc` are
  rebuilt from their plain text on read — nothing is lost, even if an old note
  is never touched again.
- `20260802_0012_english.sql` renames the last German stored value,
  `uni_tasks.type = 'VL'` (Vorlesung), to `'LEC'`.

## Production (homelab deploy)

Runs on the `life-dashboard01` LXC (192.168.0.223). In the homelab repo, point
`life_dashboard_repo_url` at this repo, pin `life_dashboard_version`, register
the deploy key and run the playbook.

```bash
npm ci
npm run build        # → build/
DATABASE_PATH=/var/lib/life-dashboard/app.db npm run db:migrate
HOST=127.0.0.1 PORT=3000 ORIGIN=http://192.168.0.223 \
  DATABASE_PATH=/var/lib/life-dashboard/app.db \
  IMAGES_DIR=/var/lib/life-dashboard/images \
  node build
```

> **Important:** `ORIGIN` must point at the URL used in the browser, otherwise
> SvelteKit's CSRF protection blocks every form POST. `IMAGES_DIR` should point
> at a persistent, writable directory.
