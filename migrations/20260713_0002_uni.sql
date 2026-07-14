-- Brick 3: Uni Management — semesters, classes, own uni_tasks DB (spec §4.3).
-- uni_tasks mirrors the Notion Tasks DB schema (Modul→class_id, Type, Last Revision);
-- it is deliberately separate from `tasks` (Alltag/Orga).

CREATE TABLE semesters (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE classes (
  id           INTEGER PRIMARY KEY,
  semester_id  INTEGER NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  professor    TEXT,
  room         TEXT,
  schedule     TEXT,
  cps          REAL,
  exam_date    TEXT,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  color        TEXT,
  archive_url  TEXT,
  document_id  INTEGER
);

CREATE INDEX idx_classes_semester ON classes (semester_id);

CREATE TABLE uni_tasks (
  id             INTEGER PRIMARY KEY,
  title          TEXT NOT NULL,
  class_id       INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  task_type      TEXT CHECK (task_type IN ('exc', 'vl', 'qz', 'ch')),
  status         TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('backlog', 'todo', 'in_progress', 'wont_do', 'done')),
  priority       TEXT CHECK (priority IN ('high', 'medium', 'low')),
  deadline       TEXT,
  this_week      INTEGER NOT NULL DEFAULT 0,
  last_revision  TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at   TEXT
);

CREATE INDEX idx_uni_tasks_week ON uni_tasks (this_week, status);
CREATE INDEX idx_uni_tasks_class ON uni_tasks (class_id);
