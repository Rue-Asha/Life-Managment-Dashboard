-- Brick 2: Alltags-/Orga-Tasks (eigene Datenbank; Uni-Lernaufgaben bekommen
-- mit Brick 3 ihre eigene uni_tasks-Tabelle).
-- Migrationen sind datums-präfixiert, damit sie beim In-Place-Übernehmen der
-- budget01-Datenbank nie mit deren schema_migrations-Einträgen kollidieren.

CREATE TABLE tasks (
	id INTEGER PRIMARY KEY,
	title TEXT NOT NULL,
	area TEXT NOT NULL CHECK (area IN ('uni', 'job', 'it', 'personal')),
	status TEXT NOT NULL DEFAULT 'todo'
		CHECK (status IN ('backlog', 'todo', 'in_progress', 'wont_do', 'done')),
	priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
	deadline TEXT,
	this_week INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	completed_at TEXT
);

CREATE INDEX idx_tasks_week ON tasks (this_week, status);
