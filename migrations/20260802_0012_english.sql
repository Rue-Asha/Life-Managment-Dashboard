-- The UI is English now, and one stored value was still German: uni_tasks.type
-- used 'VL' for "Vorlesung". Rename it to 'LEC' and move the CHECK constraint
-- along — SQLite cannot alter a CHECK in place, so the table is rebuilt.
--
-- uni_session references uni_tasks(id) ON DELETE CASCADE. The rebuild keeps the
-- same ids, but dropping the old table cascades the session away — and the
-- connection runs with foreign_keys = ON, which a migration cannot turn off
-- (PRAGMA foreign_keys is a no-op inside the transaction the runner opens). So
-- the starred tasks are parked in a temp table and put back afterwards.

CREATE TEMP TABLE session_backup AS SELECT task_id, date FROM uni_session;

CREATE TABLE uni_tasks_en (
	id INTEGER PRIMARY KEY,
	course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
	text TEXT NOT NULL,
	type TEXT NOT NULL DEFAULT 'OTH' CHECK (type IN ('LEC', 'EXC', 'OTH')),
	prio INTEGER NOT NULL DEFAULT 2 CHECK (prio IN (1, 2, 3)),
	status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
	due TEXT,
	notes TEXT NOT NULL DEFAULT '',
	done INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	completed_at TEXT
);

INSERT INTO uni_tasks_en (
	id, course_id, text, type, prio, status, due, notes, done, created_at, completed_at
)
SELECT
	id,
	course_id,
	text,
	CASE type WHEN 'VL' THEN 'LEC' ELSE type END,
	prio,
	status,
	due,
	notes,
	done,
	created_at,
	completed_at
FROM uni_tasks;

DROP TABLE uni_tasks;
ALTER TABLE uni_tasks_en RENAME TO uni_tasks;

INSERT OR IGNORE INTO uni_session (task_id, date)
SELECT task_id, date FROM session_backup
WHERE task_id IN (SELECT id FROM uni_tasks);

DROP TABLE session_backup;
