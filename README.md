# Life Management Dashboard ("SISTEMA")

Self-hosted personal hub running in the homelab. Since the 08/2026 redesign the
design artifact "Management Dashboard Design" is the single source of truth:
five modules — **Overview, Tasks, Uni, Projects, Notes** — in a dark, editorial
design (Instrument Serif/Sans + JetBrains Mono). Finance, curriculum, review,
search and the calendar agenda were removed (the old finance and curriculum
tables stay in the database, they just have no UI any more).

> **Docs:** the write-up on the design rationale and rebuild lives on the blog
> — [rue-asha.github.io/projects/life-dashboard](https://rue-asha.github.io/projects/life-dashboard/).

## Stack

- **SvelteKit** (Svelte 5, `adapter-node`) — one language, one process
- **SQLite** via Node's built-in `node:sqlite` — no native addons, no C toolchain
- No CSS framework; hand-written design system ported from the design artifact
- Fonts self-hosted (no CDN)

## Modules

- **Overview** — stat tiles, today's list, uni deadlines, monthly plate,
  quote, active projects, recent notes
- **Tasks** — Today/Week/Board/All views, areas Personal/Uni/Job,
  priorities P1–P3, detail page with notes
- **Uni** — semesters (archivable) → courses (colour, lecturer, slot,
  ECTS, grade) → tasks (lecture/exercise/other) + study session tracking
- **Projects** — tiles/board, status Backlog/Paused/Active/Archived,
  plan-and-tasks checklist, repo link
- **Notes** — folders with accent colours, search, cover images and a
  block editor (headings, to-do lists, tables, quotes, code, dividers),
  usable via toolbar, Markdown shorthand, or a "/" command menu

Each module also accepts image slots (hero, sidebar, cover art) by click or
drag & drop.

## Architecture

Single-process SvelteKit app with an embedded SQLite database; runs
self-hosted on a homelab server, provisioned and deployed via a dedicated
role in the [homelab repo](https://github.com/Rue-Asha/Homelab-Managment).

## Scope & security model

This is a **single-user app published to show the work**, not a product to
deploy. It runs on a LAN-only homelab host and assumes that boundary: there is
**no authentication, no authorisation and no multi-tenancy** — by design, not
by omission (spec §9). Anyone who can reach the port can read and write
everything, including the unauthenticated image endpoints.

If you do run it, keep it behind your LAN or a VPN. Do not port-forward it,
and do not expose it to the internet without putting an authenticating proxy
in front of it first.
