-- Brick 7: Curriculum — the schedule framework (spec §4.7). Times are hints,
-- quotas are the contract. Seeded with the 25-5 priorities and the user's
-- hand-built Klausurenphase (schedule.html) so the module starts non-empty;
-- everything is editable in the UI.

CREATE TABLE phases (
  id               INTEGER PRIMARY KEY,
  name             TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('active', 'planned', 'archived')),
  subtitle         TEXT,
  transition_note  TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE priorities (
  id    INTEGER PRIMARY KEY,
  rank  INTEGER NOT NULL,
  name  TEXT NOT NULL,
  note  TEXT
);

CREATE TABLE day_templates (
  id          INTEGER PRIMARY KEY,
  phase_id    INTEGER NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  meta        TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE template_blocks (
  id             INTEGER PRIMARY KEY,
  template_id    INTEGER NOT NULL REFERENCES day_templates(id) ON DELETE CASCADE,
  time_hint      TEXT,
  label          TEXT NOT NULL,
  duration_hint  TEXT,
  priority_id    INTEGER REFERENCES priorities(id) ON DELETE SET NULL,
  highlight      INTEGER NOT NULL DEFAULT 0,
  sort_order     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE week_days (
  id               INTEGER PRIMARY KEY,
  phase_id         INTEGER NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  weekday          INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  day_template_id  INTEGER REFERENCES day_templates(id) ON DELETE SET NULL,
  day_label        TEXT,
  tags             TEXT NOT NULL DEFAULT '[]',
  UNIQUE (phase_id, weekday)
);

CREATE TABLE quotas (
  id            INTEGER PRIMARY KEY,
  phase_id      INTEGER NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  priority_id   INTEGER REFERENCES priorities(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  note          TEXT,
  target_count  INTEGER,          -- NULL = qualitative quota (no tally)
  sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE quota_ticks (
  id        INTEGER PRIMARY KEY,
  quota_id  INTEGER NOT NULL REFERENCES quotas(id) ON DELETE CASCADE,
  week      TEXT NOT NULL,        -- ISO week key "2026-W29"
  count     INTEGER NOT NULL DEFAULT 0,
  UNIQUE (quota_id, week)
);

CREATE TABLE mini_curricula (
  id           INTEGER PRIMARY KEY,
  priority_id  INTEGER REFERENCES priorities(id) ON DELETE SET NULL,
  phase_id     INTEGER REFERENCES phases(id) ON DELETE SET NULL,
  name         TEXT NOT NULL
);

CREATE TABLE mini_items (
  id             INTEGER PRIMARY KEY,
  curriculum_id  INTEGER NOT NULL REFERENCES mini_curricula(id) ON DELETE CASCADE,
  week_no        INTEGER NOT NULL,
  topic          TEXT NOT NULL,
  done           INTEGER NOT NULL DEFAULT 0
);

-- ── Seed: 25-5 priorities ────────────────────────────────────────────────

INSERT INTO priorities (rank, name, note) VALUES
  (1, 'CyberSec / IT', 'Uni + Werkstudenten-Job + private Projekte'),
  (2, 'Gym', NULL),
  (3, 'Französisch', 'Master in Frankreich 2028'),
  (4, 'Kochen', 'mit Study'),
  (5, 'Kultur', 'Musik / Fashion');

-- ── Seed: Klausurenphase (aus schedule.html) ─────────────────────────────

INSERT INTO phases (name, status, subtitle, transition_note) VALUES
  ('Klausurenphase', 'active', 'Arbeit = Di + Do · Gym an 4 Lerntagen',
   'Nach den Klausuren: aktiver Kultur-Slot kommt dazu, Klausurlernen-Quote wird durch Projekt-/Kurs-Blöcke ersetzt.');

INSERT INTO day_templates (phase_id, name, meta, sort_order) VALUES
  (1, 'Lerntag + Gym', 'Mo · Mi · Fr · Sa', 1),
  (1, 'Arbeitstag', 'Di · Do', 2),
  (1, 'Sonntag', 'Review + Prep', 3);

INSERT INTO template_blocks (template_id, time_hint, label, duration_hint, priority_id, highlight, sort_order) VALUES
  (1, '08:00', 'Aufstehen, Frühstück', NULL, NULL, 0, 1),
  (1, '08:30', 'FR · Französisch (Anki + Podcast)', '20 min', 3, 1, 2),
  (1, '09:00', 'Deep Work 1 — Klausur', '90 min', 1, 1, 3),
  (1, '10:30', 'Pause', '20 min', NULL, 0, 4),
  (1, '10:50', 'Deep Work 2 — Klausur', '90 min', 1, 1, 5),
  (1, '12:20', 'Mittag (Meal Prep) + Pause', '~70 min', NULL, 0, 6),
  (1, '13:30', 'Deep Work 3 — Active Recall / Feynman', '90 min', 1, 1, 7),
  (1, '15:00', 'Puffer', '30 min', NULL, 0, 8),
  (1, '15:30', 'GYM · Training inkl. Weg', '120 min', 2, 1, 9),
  (1, '17:30', 'Duschen, runterkommen', NULL, NULL, 0, 10),
  (1, '18:30', 'KOCH · Kochen — Mi/Sa mit Technik-Study', '~75 min', 4, 1, 11),
  (1, 'ab 20:00', 'frei / optional lange FR-Session', NULL, NULL, 0, 12),
  (2, '07:00', 'Aufstehen', NULL, NULL, 0, 1),
  (2, 'Pendeln', 'FR · Mikro (Anki/Podcast)', '15–20 min', 3, 1, 2),
  (2, '08–17', 'Arbeit · Mittag aus Meal Prep', '8 h', 1, 0, 3),
  (2, 'Abend', 'Einfaches Essen · frei — Lernen = Bonus, kein Soll', NULL, NULL, 0, 4),
  (3, '09:30', 'Aufstehen + FR', '20 min', 3, 1, 1),
  (3, '10:00', 'Lernblock (Wiederholung, leicht)', '90 min', 1, 0, 2),
  (3, '11:30', 'Puffer / Freizeit', NULL, NULL, 0, 3),
  (3, '14:00', 'REVIEW · Wochen-Review (Inbox, Woche, Quoten)', '25 min', NULL, 1, 4),
  (3, '14:30', 'KOCH · Meal Prep (Di+Do)', '~90 min', 4, 1, 5),
  (3, 'Abend', 'Lange FR-Session oder Kultur / frei', '60–90 min', 3, 0, 6);

INSERT INTO week_days (phase_id, weekday, day_template_id, day_label, tags) VALUES
  (1, 0, 1, 'Lerntag', '["GYM","koch"]'),
  (1, 1, 2, 'Arbeit 8h', '[]'),
  (1, 2, 1, 'Lerntag', '["GYM","KOCH"]'),
  (1, 3, 2, 'Arbeit 8h', '[]'),
  (1, 4, 1, 'Lerntag', '["GYM","koch"]'),
  (1, 5, 1, 'Lerntag', '["GYM","KOCH"]'),
  (1, 6, 3, 'Review · rest · PREP', '["REVIEW"]');

INSERT INTO quotas (phase_id, priority_id, title, note, target_count, sort_order) VALUES
  (1, 1, 'Klausurlernen', '5 Lerntage × 3 Blöcke ≈ 13–15 Deep-Work-Blöcke (90 min)', 14, 1),
  (1, 2, 'Gym — Ramp-up', 'Woche 1–2: 2× → ab Woche 3: 4×. 45–60 min Training. Alte Problemzone anfangs reduziert.', 4, 2),
  (1, 3, 'Französisch', '7× pro Woche · min. 20 min · Sa/So 1× lang (60–90 min)', 7, 3),
  (1, 4, 'Kochen', '2 Technik-Sessions (Mi/Sa) + 1 Meal Prep (So)', 3, 4),
  (1, 5, 'Kultur', 'Passiv (Musik beim Kochen/Gym) · aktiver Slot erst nach den Klausuren', NULL, 5);

INSERT INTO mini_curricula (priority_id, phase_id, name) VALUES (4, 1, 'Koch-Curriculum');

INSERT INTO mini_items (curriculum_id, week_no, topic, done) VALUES
  (1, 1, 'Messerführung + mise en place', 0),
  (1, 2, 'Anbraten / Maillard', 0),
  (1, 3, 'Schmoren', 0),
  (1, 4, 'Saucen / Emulsion', 0);
