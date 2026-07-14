-- Brick 5: Notes + Inbox + Block-Editor (spec §4.5, §8).
-- documents holds ProseMirror JSON plus a plain-text mirror for search;
-- it is shared infrastructure (Projects and Classes link into it later).

CREATE TABLE documents (
  id          INTEGER PRIMARY KEY,
  content     TEXT NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
  text_plain  TEXT NOT NULL DEFAULT '',
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE notes (
  id           INTEGER PRIMARY KEY,
  title        TEXT NOT NULL,
  bereich      TEXT CHECK (bereich IN ('persoenlich', 'ideen', 'gesundheit', 'reise', 'orte_food', 'musik_medien')),
  tags         TEXT NOT NULL DEFAULT '[]',
  inbox        INTEGER NOT NULL DEFAULT 1,
  document_id  INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_notes_inbox ON notes (inbox, updated_at);
CREATE INDEX idx_notes_bereich ON notes (bereich);
