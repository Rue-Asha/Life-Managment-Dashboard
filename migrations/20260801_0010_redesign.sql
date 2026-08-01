-- Redesign (artifact "Management Dashboard Design"): 5 Module — Übersicht,
-- Aufgaben, Uni, Projekte, Notizen. Finance-/Curriculum-Tabellen bleiben
-- unangetastet (nur die UI entfällt); Volltextsuche & Tiptap-Dokumente entfallen.

-- ── Suche entfällt ─────────────────────────────────────────────────────────
-- Trigger zuerst: ALTER TABLE … RENAME parst sonst Trigger, die auf die
-- gelöschte FTS-Tabelle zeigen, und bricht ab.
DROP TRIGGER IF EXISTS trg_search_tasks_ai;
DROP TRIGGER IF EXISTS trg_search_tasks_au;
DROP TRIGGER IF EXISTS trg_search_tasks_ad;
DROP TRIGGER IF EXISTS trg_search_uni_ai;
DROP TRIGGER IF EXISTS trg_search_uni_au;
DROP TRIGGER IF EXISTS trg_search_uni_ad;
DROP TRIGGER IF EXISTS trg_search_classes_ai;
DROP TRIGGER IF EXISTS trg_search_classes_au;
DROP TRIGGER IF EXISTS trg_search_classes_ad;
DROP TRIGGER IF EXISTS trg_search_notes_ai;
DROP TRIGGER IF EXISTS trg_search_notes_au;
DROP TRIGGER IF EXISTS trg_search_notes_ad;
DROP TRIGGER IF EXISTS trg_search_projects_ai;
DROP TRIGGER IF EXISTS trg_search_projects_au;
DROP TRIGGER IF EXISTS trg_search_projects_ad;
DROP TRIGGER IF EXISTS trg_search_documents_au;
DROP TABLE IF EXISTS search_fts;

-- ── Aufgaben: cat/prio/status/notes statt area/this_week ──────────────────
CREATE TABLE tasks_v2 (
	id INTEGER PRIMARY KEY,
	text TEXT NOT NULL,
	cat TEXT NOT NULL DEFAULT 'personal' CHECK (cat IN ('personal', 'uni', 'job')),
	prio INTEGER NOT NULL DEFAULT 2 CHECK (prio IN (1, 2, 3)),
	status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
	due TEXT,
	notes TEXT NOT NULL DEFAULT '',
	done INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	completed_at TEXT
);
INSERT INTO tasks_v2 (id, text, cat, prio, status, due, done, created_at, completed_at)
SELECT id, title,
	CASE area WHEN 'uni' THEN 'uni' WHEN 'personal' THEN 'personal' ELSE 'job' END,
	CASE priority WHEN 'high' THEN 1 WHEN 'low' THEN 3 ELSE 2 END,
	CASE status WHEN 'done' THEN 'done' WHEN 'in_progress' THEN 'doing' ELSE 'todo' END,
	deadline,
	CASE WHEN status = 'done' THEN 1 ELSE 0 END,
	created_at, completed_at
FROM tasks
WHERE status != 'wont_do';
DROP TABLE tasks;
ALTER TABLE tasks_v2 RENAME TO tasks;
CREATE INDEX idx_tasks_status ON tasks (status, due);

-- ── Uni: classes → courses (code, hue, docent, slot, ects, grade, notes) ──
CREATE TABLE courses (
	id INTEGER PRIMARY KEY,
	semester_id INTEGER NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	code TEXT NOT NULL DEFAULT '',
	hue INTEGER NOT NULL DEFAULT 0,
	docent TEXT NOT NULL DEFAULT '',
	slot TEXT NOT NULL DEFAULT '',
	ects TEXT NOT NULL DEFAULT '',
	grade TEXT NOT NULL DEFAULT '',
	notes TEXT NOT NULL DEFAULT '',
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO courses (id, semester_id, name, hue, docent, slot, ects, notes)
SELECT id, semester_id, name,
	id % 7,
	COALESCE(professor, ''),
	TRIM(COALESCE(schedule, '') ||
		CASE WHEN room IS NOT NULL AND room != '' THEN ' · ' || room ELSE '' END),
	COALESCE(CAST(cps AS TEXT), ''),
	COALESCE(description, '')
FROM classes;
CREATE INDEX idx_courses_semester ON courses (semester_id);

CREATE TABLE uni_tasks_v2 (
	id INTEGER PRIMARY KEY,
	course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
	text TEXT NOT NULL,
	type TEXT NOT NULL DEFAULT 'OTH' CHECK (type IN ('VL', 'EXC', 'OTH')),
	prio INTEGER NOT NULL DEFAULT 2 CHECK (prio IN (1, 2, 3)),
	status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
	due TEXT,
	notes TEXT NOT NULL DEFAULT '',
	done INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	completed_at TEXT
);
INSERT INTO uni_tasks_v2 (id, course_id, text, type, prio, status, due, done, created_at, completed_at)
SELECT id, class_id, title,
	CASE task_type WHEN 'vl' THEN 'VL' WHEN 'exc' THEN 'EXC' ELSE 'OTH' END,
	CASE priority WHEN 'high' THEN 1 WHEN 'low' THEN 3 ELSE 2 END,
	CASE status WHEN 'done' THEN 'done' WHEN 'in_progress' THEN 'doing' ELSE 'todo' END,
	deadline,
	CASE WHEN status = 'done' THEN 1 ELSE 0 END,
	created_at, completed_at
FROM uni_tasks
WHERE class_id IS NOT NULL AND status != 'wont_do';
DROP TABLE uni_tasks;
DROP TABLE classes;
ALTER TABLE uni_tasks_v2 RENAME TO uni_tasks;
CREATE INDEX idx_uni_tasks_course ON uni_tasks (course_id);

-- Lernsession: markierte Aufgaben eines Tages.
CREATE TABLE uni_session (
	task_id INTEGER PRIMARY KEY REFERENCES uni_tasks(id) ON DELETE CASCADE,
	date TEXT NOT NULL
);

-- ── Notizen: Ordner + Klartext-Body statt Bereiche/Tiptap ─────────────────
CREATE TABLE note_folders (
	id INTEGER PRIMARY KEY,
	name TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE notes_v2 (
	id INTEGER PRIMARY KEY,
	folder_id INTEGER REFERENCES note_folders(id) ON DELETE SET NULL,
	title TEXT NOT NULL DEFAULT '',
	kind TEXT NOT NULL DEFAULT 'scratch' CHECK (kind IN ('journal', 'scratch', 'ref')),
	body TEXT NOT NULL DEFAULT '',
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO notes_v2 (id, folder_id, title, body, created_at, updated_at)
SELECT n.id, NULL, n.title, COALESCE(d.text_plain, ''), n.created_at, n.updated_at
FROM notes n
LEFT JOIN documents d ON d.id = n.document_id;
DROP TABLE notes;
ALTER TABLE notes_v2 RENAME TO notes;
CREATE INDEX idx_notes_folder ON notes (folder_id, updated_at);

-- ── Projekte: backlog/paused/active/archived + Checkliste ─────────────────
CREATE TABLE projects_v2 (
	id INTEGER PRIMARY KEY,
	name TEXT NOT NULL,
	stack TEXT NOT NULL DEFAULT '',
	status TEXT NOT NULL DEFAULT 'backlog'
		CHECK (status IN ('backlog', 'paused', 'active', 'archived')),
	repo TEXT NOT NULL DEFAULT '',
	goal TEXT NOT NULL DEFAULT '',
	notes TEXT NOT NULL DEFAULT '',
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO projects_v2 (id, name, stack, status, repo, goal, notes, created_at, updated_at)
SELECT p.id, p.name, COALESCE(p.tech_stack, ''),
	CASE p.status
		WHEN 'in_progress' THEN 'active'
		WHEN 'done' THEN 'archived'
		WHEN 'paused' THEN 'paused'
		WHEN 'archived' THEN 'archived'
		ELSE 'backlog'
	END,
	COALESCE(p.link, ''), COALESCE(p.description, ''), COALESCE(d.text_plain, ''),
	p.created_at, p.updated_at
FROM projects p
LEFT JOIN documents d ON d.id = p.document_id;
DROP TABLE projects;
ALTER TABLE projects_v2 RENAME TO projects;
CREATE INDEX idx_projects_status ON projects (status);

CREATE TABLE project_tasks (
	id INTEGER PRIMARY KEY,
	project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
	text TEXT NOT NULL,
	done INTEGER NOT NULL DEFAULT 0,
	sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_project_tasks_project ON project_tasks (project_id, sort_order);

-- Tiptap-Dokumente entfallen (Inhalte oben nach Klartext kopiert).
DROP TABLE documents;
