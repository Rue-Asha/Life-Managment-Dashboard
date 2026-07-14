# Life Management Dashboard („Zentrale")

Selbstgehosteter Personal Hub — ersetzt das Notion-Setup, absorbiert die
[Budgeting-Web-App](https://github.com/Rayliet223/Budgeting-Web-App) und
ergänzt ein Schedule-basiertes Curriculum. Vollständige Spezifikation:
[`spec.md`](spec.md) · UI-Konzept: Artifact (siehe spec).

## Stack

- **SvelteKit** (Svelte 5, `adapter-node`) — eine Sprache, ein Prozess
- **SQLite** über Nodes eingebautes `node:sqlite` (Node ≥ 22, kein C-Toolchain)
- Kein CSS-Framework; ein handgeschriebenes, E-Ink-taugliches Design-System
  (hoher Kontrast, monochrom lesbar, Zustand immer Symbol + Wort)

## Entwicklung

```bash
npm install
npm run dev          # liest DATABASE_PATH aus .env (default ./dev.db)
```

Die Datenbank migriert sich beim ersten Zugriff selbst (Migrationen sind in
den Server-Build eingebettet). Manuell: `DATABASE_PATH=./dev.db npm run db:migrate`.

**Migrationen sind datums-präfixiert** (`20260713_0001_….sql`) — Absicht:
beim Deploy übernimmt die App die bestehende budget01-Datenbank in place,
ohne mit deren `schema_migrations`-Einträgen zu kollidieren (spec §13).

## Produktion (Homelab-Deploy)

Wiederverwendet die bestehende `budget01`-LXC (192.168.0.226): im
Homelab-Repo `budget_repo_url` auf dieses Repo zeigen lassen,
`budget_version` pinnen, Deploy-Key registrieren, Playbook laufen lassen.

```bash
npm ci
npm run build        # → build/
DATABASE_PATH=/var/lib/budget/app.db npm run db:migrate
HOST=127.0.0.1 PORT=3000 ORIGIN=http://192.168.0.226 DATABASE_PATH=/var/lib/budget/app.db node build
```

> **Wichtig:** `ORIGIN` muss auf die im Browser verwendete URL zeigen, sonst
> blockt SvelteKits CSRF-Schutz alle Formular-POSTs.

## Build-Status (Bricks, spec §11)

- [x] 1 — Shell + Design-System + Home
- [x] 2 — Tasks (Alltag & Orga) + This Week auf Home
- [x] 3 — Uni Management (Semester, Classes, uni_tasks)
- [x] 4 — Finanzen (Port der Budget-App)
- [x] 5 — Notes + Block-Editor + Inbox
- [x] 6 — Projects (Kacheln/Liste/Board)
- [x] 7 — Curriculum (Wochen-Board, Quoten)
- [x] 8 — Proton-ICS-Agenda + Suche + Review-Flow
