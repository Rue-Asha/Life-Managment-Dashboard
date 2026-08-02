-- Brick 2: everyday / organisational tasks (own database; uni study tasks get
-- their own uni_tasks table with brick 3).
-- Migrations are date-prefixed so that adopting the budget01 database in place
-- never collides with its existing schema_migrations entries.

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
