# Build-Spec: Life Management Dashboard („Zentrale")

> Design & scaffold spec for the self-hosted personal hub that replaces Notion,
> absorbs the Budgeting-Web-App, and adds a Schedule/Curriculum module built on
> the user's productivity framework. UI wordmark: **"Zentrale"** (adjustable).
> Companion documents: the UI concept mockup (Artifact) and
> [`budget-app-spec.md`](https://github.com/Rayliet223/Budgeting-Web-App) —
> the finance module adopts that spec verbatim.

Revision 2 — incorporates the first design-review feedback round
(separate Uni task DB, semester management, project views, Proton
integration on Home, complete Curriculum redesign).

---

## 1. Purpose in one sentence

One self-hosted web app that is the single home for **tasks, uni, IT projects,
notes, finances, and the personal schedule/curriculum** — replacing the
distributed Notion workspace and the standalone budget app with one cohesive
system.

## 2. Philosophy & hard constraints

1. **"Ein Blick am Morgen. Ein Review am Sonntag. Mehr braucht's nicht."**
   Two rituals — morning glance, Sunday review. No module may demand daily
   upkeep beyond checking boxes.
2. **Jede Sache hat genau ein Zuhause.** After migration this app *is* the home
   for its six domains. Deliberately outside: **hard appointments → Proton
   Calendar** (linked + read-only agenda, never edited here), **mail → Proton
   Mail** (linked), **deep learning/handwriting → Boox**.
3. **Self-hosted, single-user, privacy-first.** LAN/VPN only. Notion is retired
   after a one-time import. Only outbound runtime call: fetching the user's own
   shared Proton-Calendar ICS feed (optional, see §5).
4. **E-Ink readable.** High contrast, grayscale-safe, state always symbol +
   word (`✓ ● ◐ ○`, `▲ ▼`, `⚠`) — never color alone.
5. **Flexibility over rigidity.** The schedule module encodes *order, duration
   and weekly quotas* — never fixed clock times as obligations. „Quoten sind
   der Vertrag, nicht die Uhr."
6. **Boring, robust, few dependencies.** One language, one process, one SQLite
   file.

## 3. Modules

| Module | Replaces | Core content |
|---|---|---|
| 🏠 **Home** | Notion 🏠 Home | Morning glance: tasks, Proton agenda, finance, today's schedule |
| ⚡ **Tasks** | Notion ⚡ Tasks | **Alltags-/Orga-Tasks** (own DB — Uni category = organizational uni to-dos only) |
| 🎓 **Uni** | Notion Uni Hub | Semester & class management + **own Uni-task DB** (Notion schema) |
| 💻 **Projects** | Notion IT Projects Hub | IT projects registry — grid, list and status-board views |
| 🔒 **Notes** | Notion Private Notes | Inbox (quick capture) + notes by Bereich, block editor |
| 💰 **Finanzen** | Budgeting-Web-App | Full port: net worth, obligations, budget, goals |
| 🧭 **Curriculum** | new | Schedule framework: phases, priorities, day templates, quotas, mini-curricula |

Cross-cutting: global **quick capture** (→ Notes inbox), **search** (FTS5),
**Sunday review** flow.

## 4. Data model

SQLite, forward-only migrations. Amounts integer cents, dates ISO, locale
de-DE. `id` = integer pk everywhere.

### 4.1 Shared

```
links          id, module, label, url, icon, sort_order
documents      id, content JSON (ProseMirror), text_plain (FTS), updated_at
```

### 4.2 Tasks (Alltag & Orga) — own database

```
tasks   id, title,
        area enum(uni|job|it|personal),   -- uni = ORGA to-dos (Rückmeldung,
                                          --   BAföG…), never coursework
        status enum(backlog|todo|in_progress|wont_do|done),
        priority enum(high|medium|low) NULL,
        deadline date NULL, this_week bool DEFAULT false,
        created_at, completed_at
```

Coursework fields (Modul, Type, Last Revision) live **only** in `uni_tasks` —
the two task databases are deliberately separate and never merged in views,
except on Home where both contribute to "This Week".

### 4.3 Uni — semesters, classes, own task database

```
semesters  id, name ("SS 26"), status enum(active|archived),
           sort_order, created_at

classes    id, semester_id fk→semesters, name, professor, room, schedule,
           cps real, exam_date date NULL,
           status enum(active|completed|on_hold),
           color, archive_url,          -- link to Boox notes archive
           document_id fk NULL

uni_tasks  id, title,                   -- schema mirrors the Notion Tasks DB
           class_id fk→classes NULL,    -- was "Modul"
           task_type enum(exc|vl|qz|ch) NULL,
           status enum(backlog|todo|in_progress|wont_do|done),
           priority enum(high|medium|low) NULL,
           deadline date NULL, this_week bool DEFAULT false,
           last_revision date NULL,
           created_at, completed_at
```

UI requirements (from review):
- Page header is **"Uni Management"**, not the semester name.
- Semester CRUD: create, archive, delete; semester switcher filters classes.
- Class CRUD: add, edit, delete from the classes grid.
- Uni-task weekly view on the Uni page **plus** a button/link to the full
  `uni_tasks` database view (own route with all filters).
- All classes remain accessible across semesters (archived semesters included).

### 4.4 Projects

```
projects  id, name, description,
          type enum(project|course|tutorial|research|other),
          status enum(backlog|in_progress|done|paused|archived),
          priority enum(high|medium|low) NULL,
          tech_stack, link, start_date NULL, document_id fk NULL
```

**Three views** (persisted per-user preference): 🞔 **Kacheln** (cards),
☰ **Liste** (table), ▦ **Board** (columns grouped by `status`, Notion-style).

### 4.5 Notes

Unchanged from revision 1 (review: keep as is):

```
notes  id, title, bereich enum(persoenlich|ideen|gesundheit|reise|
       orte_food|musik_medien) NULL, tags JSON,
       inbox bool DEFAULT true, document_id fk, created_at, updated_at
```

### 4.6 Finanzen

Unchanged (review: keep as is). The six tables from `budget-app-spec.md` §4
**verbatim** incl. cross-check; copy that spec into `docs/`. Domain logic
ports from the budget repo, only the UI is rebuilt.

### 4.7 Curriculum — the schedule framework

**Philosophy** (fixed context for this module): Warren Buffett 25-5 — five
focus areas, ranked: **01 CyberSec/IT** (Uni + Werkstudenten-Job + private
Projekte), **02/03 Gym**, **02/03 Französisch** (Master in Frankreich 2028),
**04 Kochen**, **05 Kultur** (Musik/Fashion). The module implements **step 3
of the self-study framework** (define goals → find resources → *make a
curriculum* → test yourself → track errors → accountability → build
something): a realistic, adjustable weekly schedule. Structure follows the
user's hand-built `schedule.html` board; times are *hints*, quotas are the
contract.

```
phases           id, name ("Klausurenphase"), status enum(active|planned|archived),
                 subtitle, transition_note,   -- „// Nach den Klausuren…"
                 created_at

priorities       id, rank int (1..5), name, note   -- global, editable

day_templates    id, phase_id fk, name ("Lerntag + Gym"), meta ("Mo·Mi·Fr·Sa"),
                 sort_order
template_blocks  id, template_id fk, time_hint ("08:30"|"Pendeln"|"ab 20:00"),
                 label, duration_hint ("90 min"), priority_id fk NULL,
                 highlight bool, sort_order

week_days        id, phase_id fk, weekday int (0=Mo..6=So),
                 day_template_id fk NULL, day_label ("Lerntag"|"Arbeit 8h"…),
                 tags JSON (["GYM","KOCH"])

quotas           id, phase_id fk, priority_id fk, title, note,
                 target_count int NULL      -- NULL = qualitative quota
quota_ticks      id, quota_id fk, week ("2026-W29"), count int

mini_curricula   id, priority_id fk, phase_id fk NULL, name ("Koch-Curriculum")
mini_items       id, curriculum_id fk, week_no int, topic, done bool
```

**Behavior**
- Exactly one **active phase**; switching phases swaps the whole board.
  Creating a phase can clone an existing one (the skeleton survives —
  „das Gerüst bleibt identisch").
- Everything inline-editable & drag-reorderable: blocks within templates,
  template↔weekday assignment, quota targets, mini-curriculum weeks.
- **Quota ticks**: tapping a quota increments this ISO-week's count
  (`3/4 ▣▣▣▢`); Sunday review shows the week's contract fulfillment.
  Ticks are the only "tracking" — no time logging, no streaks-shame.
- Home shows **today**: weekday → template → its blocks + tags, plus the
  quota state of the running week.
- Mini-curricula implement "eine Technik = ein Lernziel" progressions
  (e.g. Koch W1 Messerführung → W4 Saucen); `done` per week.

## 5. Home dashboard (the morning glance)

- **This Week (groß)**: open `this_week` tasks from **both** task DBs
  (labeled ⚡ Alltag / 🎓 Uni), full list + progress — the dominant card.
- **Kalender (Proton, read-only)**: agenda of the next ~14 days from the
  user's **shared Proton-Calendar ICS link** (`PROTON_ICS_URL` env var,
  fetched server-side on a cache interval, e.g. 15 min). Proton offers no
  embeddable widget — the ICS share link is the clean, read-only way. Card
  header links: **Proton Calendar ↗** and **Proton Mail ↗**. If no ICS URL is
  configured the card degrades to the two links. (Replaces the removed
  "Demnächst" card.)
- **Heute · Schedule**: today's day template (blocks + tags) + week quota
  state from the Curriculum module.
- **Finanzen**: net worth headline + sparkline, Δ, cross-check badge,
  staleness hint (unchanged — review: keep).
- **Inbox nudge**: N notes in inbox → Sunday review.

## 6. Rituals

- **Morgens (Boox)**: Home — Top tasks, agenda, today's template. Read-only.
- **Abends**: check off tasks, tick quotas (Gym ✓, FR ✓).
- **Sonntag — Review flow**: inbox leeren → beide Task-DBs: Woche befüllen →
  Quota-Bilanz der Woche ansehen → erste Woche im Monat: Finanz-Ritual.
- Staleness hints, never blocking modals.

## 7. UI design system

Unchanged from revision 1 (validated palette, Charter/Georgia display,
system-ui body, mono data labels, E-Ink symbol+word rule, sidebar shell).
Additions from review:
- **Segmented view switcher** component (Projects: Kacheln/Liste/Board).
- **Board view**: status columns with mini-cards, horizontal scroll on narrow.
- **Week board / day-template tables**: mono time-hint column, highlight rows
  (accent-tinted) for priority blocks — the visual language of `schedule.html`
  translated into the app's token system.
- **Quota tally**: tap-able ▣▢ boxes + `n/m` mono label.

| Token | Light | Dark |
|---|---|---|
| ground | `#F6F6F2` | `#161815` |
| surface | `#FFFFFF` | `#1D201C` |
| surface-2 | `#EFF0EA` | `#242822` |
| ink / ink-2 | `#1D211C` / `#585F56` | `#E7EAE3` / `#A3AA9E` |
| line | `#DCDFD6` | `#31362F` |
| accent | `#2F8156` | `#4FA873` |
| warn / crit | `#A66A1E` / `#B3362C` | `#C27F24` / `#D06A5F` |

## 8. Editor

Unchanged: **Tiptap** block editor (ProseMirror JSON in `documents`),
`/`-menu, drag-reorder; server-rendered read-only HTML for Boox/noscript.
Blocks v1: paragraph, h1–3, lists (incl. todo), quote, callout, code,
divider, table. Attachments = later brick.

## 9. Architecture & stack

Unchanged: SvelteKit (Svelte 5, `adapter-node`), `node:sqlite` (Node ≥ 22),
forward-only migrations, form-actions-first, env contract
`HOST`/`PORT`/`ORIGIN`/`DATABASE_PATH` (+ optional `PROTON_ICS_URL`).
Auth: none in v1 (LAN/VPN only); optional passphrase brick later.

## 10. Repo scaffold (this repo: `Life-Managment-Dashboard`)

```
migrations/                     20260713_0001_….sql (date-prefixed — never
                                collides with budget01's schema_migrations)
scripts/
  migrate.mjs
  import/
    notion/                     CSV/MD importers (tasks split → tasks/uni_tasks)
src/
  lib/
    format.ts
    server/
      db.ts  search.ts  ics.ts  -- ics.ts: Proton feed fetch + cache
      modules/
        tasks.ts  uni.ts  projects.ts  notes.ts  curriculum.ts
        finance/
    components/
      ui/                       Chip, Progress, StatusBadge, FactRow, Card,
                                ViewSwitch, QuotaTally, …
      editor/
      charts/                   TrendChart, Sparkline
  routes/
    +layout.svelte              shell, capture, search
    +page.svelte                Home
    tasks/
    uni/                        uni/tasks/ (full uni_tasks DB view)
                                uni/classes/[id]/  uni/semester/ (CRUD)
    projects/  projects/[id]/   ?view=grid|list|board
    notes/     notes/[id]/
    finanzen/                   uebersicht konten fixkosten budget ziele kategorien
    curriculum/                 board (active phase) · phases/ · quotas tick API
    api/search/+server.ts
docs/budget-app-spec.md
static/
```

## 11. Build order (brick by brick)

1. **Shell + design system + empty Home** (both themes, nav, tokens).
2. **Tasks (Alltag) + weekly review + Home "This Week"** → first Notion import.
3. **Uni**: semesters/classes CRUD + `uni_tasks` DB + weekly view → Uni Hub
   retires (Notion tasks CSV splits by Area: 🎓 Uni + Modul → `uni_tasks`).
4. **Finanzen**: port domain logic, new UI, budget-DB migration → budget app
   retires.
5. **Notes + editor + quick capture + inbox** → Private Notes retires.
6. **Projects** (3 views, reuses editor) → IT Projects Hub retires; Notion done.
7. **Curriculum**: phases, priorities, week board, day templates, quotas +
   ticks, mini-curricula; Home "Heute · Schedule" card.
8. **Proton ICS agenda** on Home + **search (FTS5)** + Sunday-review polish.
9. **Deploy** (any time after brick 2, then redeploy per brick).

## 12. Migration

- **Budget data**: no copy needed — the deploy adopts `/var/lib/budget/app.db`
  in place (see §13). Verify net-worth figure matches after the first deploy
  with the finance brick.
- **Notion**: CSV export per DB. Tasks CSV splits: `Area == 🎓 Uni` (with
  Modul/Type) → `uni_tasks` (Modul → `class_id` lookup); everything else →
  `tasks`. Classes CSV → `semesters` (distinct Semester values) + `classes`.
  Notes/Projects MD export → Tiptap `generateJSON` → `documents`.
- Retire each Notion area only after its brick ships.

## 13. Deployment (homelab)

**Reuse the existing `budget01` LXC** (192.168.0.226, CTID 226) instead of
provisioning a new container — decided in review round 2:

- Point the existing `budget` role at this repo: `budget_repo_url` →
  `Life-Managment-Dashboard`, bump `budget_version`; register a new read-only
  deploy key for this repo. Renaming role/host to `hub` is cosmetic and can
  happen later (or never).
- Env contract, release layout, systemd + nginx setup are identical — a deploy
  is just a playbook run at the new pinned version.
- **The SQLite file is adopted in place** (`/var/lib/budget/app.db`): this
  app's migrations are **date-prefixed** (`20260713_0001_….sql`) so they never
  collide with the budget app's `schema_migrations` entries (`0001_init.sql`…).
  First deploy applies the new tables next to the existing finance tables —
  the finance data never moves. Consequence: the finance module must match the
  budget app's *current* schema (incl. its later migrations
  0003–0005), not the original spec text.
- Rollback story unchanged (`current` symlink); backups already cover the DB.
- LXC needs outbound HTTPS to `calendar.proton.me` once the ICS agenda ships.

## 14. Non-goals

- ❌ No calendar **editing** — Proton Calendar stays the appointment manager;
  the app only renders the shared ICS feed read-only.
- ❌ No rigid time-block enforcement, no time tracking, no streak shame —
  quotas are the contract, not the clock.
- ❌ No multi-user, no native app, no bank APIs, no transaction ledger.
- ❌ No spaced repetition — learning happens on the Boox.
- ❌ No Notion sync — one-time import, then Notion is gone.

## 15. Open decisions

- App display name (wordmark "Zentrale" vs. "Life Management Dashboard").
- Passphrase-gate brick: wanted at all?
- Proton ICS: enable in v1 or as brick 8 (as planned)?
