# Life Management Dashboard („SISTEMA“)

Selbstgehosteter Personal Hub im Homelab. Seit dem Redesign 08/2026 ist das
Design-Artifact „Management Dashboard Design“ die Single Source of Truth:
fünf Module — **Übersicht, Aufgaben, Uni, Projekte, Notizen** — in einem
dunklen, editorialen Design (Instrument Serif/Sans + JetBrains Mono).
Finanzen, Curriculum, Review, Suche und die Kalender-Agenda wurden entfernt
(die alten Finanz-/Curriculum-Tabellen bleiben in der DB erhalten, haben aber
keine UI mehr).

## Stack

- **SvelteKit** (Svelte 5, `adapter-node`) — eine Sprache, ein Prozess
- **SQLite** über Nodes eingebautes `node:sqlite` (Node ≥ 22, kein C-Toolchain)
- Kein CSS-Framework; handgeschriebenes Design-System in `src/app.css`
  (Tokens + Komponentenklassen, portiert aus dem Artifact)
- Schriften self-hosted via Fontsource (kein CDN)

## Module

- **Übersicht** (`/`) — Statistik-Kacheln, Heute-Liste, Uni-Fristen,
  Monats-Plate, Zitat, aktive Projekte, letzte Notizen
- **Aufgaben** (`/tasks`) — Views Heute/Woche/Board/Alles, Bereiche
  Persönlich/Uni/Job, Prio P1–P3, Detailseite mit Notizen
- **Uni** (`/uni`) — Semester (archivierbar) → Kurse (Farbe, Dozent, Termin,
  ECTS, Note) → Aufgaben (VL/EXC/OTH) + Lernsession (★ pro Tag)
- **Projekte** (`/projects`) — Kacheln/Board, Status
  Backlog/Pausiert/Aktiv/Archiv, Plan-&-Aufgaben-Checkliste, Repo-Link
- **Notizen** (`/notes`) — Ordner mit Akzentfarben, Zwei-Spalten-Ansicht,
  Suche, Cover-Bild und ein **Block-Editor** (Tiptap): Überschriften,
  To-do-Listen, Tabellen, Zitate, Code, Trennlinien — per Toolbar, per
  Markdown-Kurzschreibweise (`# `, `- `, `[ ] `, ``` ``` ```) oder über das
  „/“-Menü; Blöcke lassen sich am Griff links verschieben

Bild-Slots (Hero pro Modul, Sidebar-Mood, Dashboard-Plate, Notiz-Cover)
nehmen Bilder per Klick oder Drag&Drop entgegen; Ablage im `IMAGES_DIR`
(Dateisystem, kein DB-Eintrag) über `/api/images/[slot]`.

## Entwicklung

```bash
npm install
npm run dev          # liest DATABASE_PATH aus .env (default ./dev.db)
```

Die Datenbank migriert sich beim ersten Zugriff selbst (Migrationen sind in
den Server-Build eingebettet). Manuell: `DATABASE_PATH=./dev.db npm run db:migrate`.

**Migrationen sind datums-präfixiert** (`20260713_0001_….sql`) — Absicht:
beim Deploy übernimmt die App die bestehende budget01-Datenbank in place,
ohne mit deren `schema_migrations`-Einträgen zu kollidieren.
`20260801_0010_redesign.sql` überführt Tasks/Uni/Notes/Projects best-effort
ins neue Schema. `20260802_0011_note_doc.sql` ergänzt `notes.doc` für den
Block-Editor: dort liegt das Tiptap-Dokument als JSON, `notes.body` trägt die
daraus abgeleitete Klartext-Fassung (Suche, Auszüge, Wortzähler). Notizen ohne
`doc` werden beim Lesen aus ihrem Klartext aufgebaut — Altbestand geht nicht
verloren, auch wenn er nie wieder angefasst wird.

## Produktion (Homelab-Deploy)

Wiederverwendet die bestehende `budget01`-LXC (192.168.0.226): im
Homelab-Repo `budget_repo_url` auf dieses Repo zeigen lassen,
`budget_version` pinnen, Deploy-Key registrieren, Playbook laufen lassen.

```bash
npm ci
npm run build        # → build/
DATABASE_PATH=/var/lib/budget/app.db npm run db:migrate
HOST=127.0.0.1 PORT=3000 ORIGIN=http://192.168.0.226 \
  DATABASE_PATH=/var/lib/budget/app.db IMAGES_DIR=/var/lib/budget/images \
  node build
```

> **Wichtig:** `ORIGIN` muss auf die im Browser verwendete URL zeigen, sonst
> blockt SvelteKits CSRF-Schutz alle Formular-POSTs. `IMAGES_DIR` sollte auf
> ein persistentes, beschreibbares Verzeichnis zeigen.
