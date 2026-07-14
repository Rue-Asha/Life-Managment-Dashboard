-- Brick 6: IT Projects (spec §4.4) — three views over one table; the document
-- link reuses the brick-5 editor infrastructure.

CREATE TABLE projects (
  id           INTEGER PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT,
  type         TEXT NOT NULL DEFAULT 'project' CHECK (type IN ('project', 'course', 'tutorial', 'research', 'other')),
  status       TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in_progress', 'done', 'paused', 'archived')),
  priority     TEXT CHECK (priority IN ('high', 'medium', 'low')),
  tech_stack   TEXT,
  link         TEXT,
  start_date   TEXT,
  document_id  INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_projects_status ON projects (status);
