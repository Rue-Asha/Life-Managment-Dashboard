import { getDb } from './db';
import type { ClassStatus, Priority, TaskStatus, UniTaskType } from '$lib/labels';

export interface Semester {
	id: number;
	name: string;
	status: 'active' | 'archived';
	sort_order: number;
	created_at: string;
	class_count: number;
}

export interface Class {
	id: number;
	semester_id: number;
	name: string;
	professor: string | null;
	room: string | null;
	schedule: string | null;
	cps: number | null;
	exam_date: string | null;
	status: ClassStatus;
	color: string | null;
	archive_url: string | null;
	description: string | null;
	document_id: number | null;
	open_tasks: number;
}

export interface UniTask {
	id: number;
	title: string;
	class_id: number | null;
	task_type: UniTaskType | null;
	status: TaskStatus;
	priority: Priority | null;
	deadline: string | null;
	this_week: number;
	last_revision: string | null;
	created_at: string;
	completed_at: string | null;
	class_name: string | null;
}

const OPEN = `status NOT IN ('done', 'wont_do')`;
const PRIO_ORDER = `CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 ELSE 3 END`;
const SORT = `${PRIO_ORDER}, deadline IS NULL, deadline, created_at`;
const WITH_CLASS = `SELECT ut.*, c.name AS class_name FROM uni_tasks ut LEFT JOIN classes c ON c.id = ut.class_id`;

// ── Semesters ────────────────────────────────────────────────────────────

/** All semesters, newest first, active before archived. */
export function listSemesters(): Semester[] {
	return getDb()
		.prepare(
			`SELECT s.*, (SELECT COUNT(*) FROM classes c WHERE c.semester_id = s.id) AS class_count
			 FROM semesters s
			 ORDER BY s.status = 'archived', s.sort_order DESC, s.created_at DESC`
		)
		.all() as unknown as Semester[];
}

export function createSemester(name: string): void {
	getDb()
		.prepare(
			`INSERT INTO semesters (name, sort_order)
			 VALUES (?, COALESCE((SELECT MAX(sort_order) FROM semesters), 0) + 1)`
		)
		.run(name);
}

export function setSemesterStatus(id: number, status: 'active' | 'archived'): void {
	getDb().prepare('UPDATE semesters SET status = ? WHERE id = ?').run(status, id);
}

/** Cascades to classes; their uni_tasks keep existing with class_id = NULL. */
export function deleteSemester(id: number): void {
	getDb().prepare('DELETE FROM semesters WHERE id = ?').run(id);
}

// ── Classes ──────────────────────────────────────────────────────────────

export function listClasses(semesterId: number): Class[] {
	return getDb()
		.prepare(
			`SELECT c.*,
			   (SELECT COUNT(*) FROM uni_tasks ut WHERE ut.class_id = c.id AND ut.${OPEN}) AS open_tasks
			 FROM classes c
			 WHERE c.semester_id = ?
			 ORDER BY c.status = 'completed', c.name`
		)
		.all(semesterId) as unknown as Class[];
}

/** Every class across all semesters (for task-form selects; spec §4.3). */
export function listAllClasses(): (Class & { semester_name: string })[] {
	return getDb()
		.prepare(
			`SELECT c.*, s.name AS semester_name, 0 AS open_tasks
			 FROM classes c JOIN semesters s ON s.id = c.semester_id
			 ORDER BY s.status = 'archived', s.sort_order DESC, c.name`
		)
		.all() as unknown as (Class & { semester_name: string })[];
}

export function getClass(id: number): (Class & { semester_name: string }) | null {
	return (getDb()
		.prepare(
			`SELECT c.*, s.name AS semester_name,
			   (SELECT COUNT(*) FROM uni_tasks ut WHERE ut.class_id = c.id AND ut.${OPEN}) AS open_tasks
			 FROM classes c JOIN semesters s ON s.id = c.semester_id
			 WHERE c.id = ?`
		)
		.get(id) ?? null) as (Class & { semester_name: string }) | null;
}

export interface ClassInput {
	name: string;
	professor: string | null;
	room: string | null;
	schedule: string | null;
	cps: number | null;
	examDate: string | null;
	archiveUrl: string | null;
}

export function createClass(semesterId: number, input: ClassInput): void {
	getDb()
		.prepare(
			`INSERT INTO classes (semester_id, name, professor, room, schedule, cps, exam_date, archive_url)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			semesterId,
			input.name,
			input.professor,
			input.room,
			input.schedule,
			input.cps,
			input.examDate,
			input.archiveUrl
		);
}

export function updateClass(id: number, input: ClassInput & { status: ClassStatus }): void {
	getDb()
		.prepare(
			`UPDATE classes SET name = ?, professor = ?, room = ?, schedule = ?,
			   cps = ?, exam_date = ?, archive_url = ?, status = ?
			 WHERE id = ?`
		)
		.run(
			input.name,
			input.professor,
			input.room,
			input.schedule,
			input.cps,
			input.examDate,
			input.archiveUrl,
			input.status,
			id
		);
}

/** Free-text description lives in its own box on the class detail page. */
export function updateClassDescription(id: number, description: string | null): void {
	getDb().prepare('UPDATE classes SET description = ? WHERE id = ?').run(description, id);
}

/** Tasks of the class survive with class_id = NULL (ON DELETE SET NULL). */
export function deleteClass(id: number): void {
	getDb().prepare('DELETE FROM classes WHERE id = ?').run(id);
}

// ── Uni tasks (mirrors tasks.ts, plus class join / type / last_revision) ─

export function uniListWeekOpen(): UniTask[] {
	return getDb()
		.prepare(`${WITH_CLASS} WHERE ut.this_week = 1 AND ut.${OPEN} ORDER BY ${SORT}`)
		.all() as unknown as UniTask[];
}

export function uniListWeekDone(): UniTask[] {
	return getDb()
		.prepare(
			`${WITH_CLASS}
			 WHERE ut.this_week = 1 AND ut.status = 'done'
			   AND ut.completed_at >= datetime('now', '-7 days')
			 ORDER BY ut.completed_at DESC`
		)
		.all() as unknown as UniTask[];
}

export interface UniTaskFilter {
	classId?: number;
	taskType?: UniTaskType;
	status?: TaskStatus;
}

/** Full database view (spec §4.3): everything, incl. done/wont_do. */
export function listUniTasks(filter: UniTaskFilter = {}): UniTask[] {
	const where: string[] = [];
	const params: (number | string)[] = [];
	if (filter.classId !== undefined) {
		where.push('ut.class_id = ?');
		params.push(filter.classId);
	}
	if (filter.taskType) {
		where.push('ut.task_type = ?');
		params.push(filter.taskType);
	}
	if (filter.status) {
		where.push('ut.status = ?');
		params.push(filter.status);
	}
	return getDb()
		.prepare(
			`${WITH_CLASS}
			 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
			 ORDER BY CASE ut.task_type WHEN 'exc' THEN 0 WHEN 'vl' THEN 1
			                             WHEN 'qz' THEN 2 WHEN 'ch' THEN 3 ELSE 4 END,
			          ut.title COLLATE NOCASE`
		)
		.all(...params) as unknown as UniTask[];
}

export function listClassTasks(classId: number): UniTask[] {
	return listUniTasks({ classId });
}

export function uniWeekStats(): { done: number; total: number } {
	const row = getDb()
		.prepare(
			`SELECT
			   SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done,
			   COUNT(*) AS total
			 FROM uni_tasks
			 WHERE this_week = 1 AND status != 'wont_do'
			   AND (completed_at IS NULL OR completed_at >= datetime('now', '-7 days'))`
		)
		.get() as { done: number | null; total: number };
	return { done: row.done ?? 0, total: row.total };
}

export function countUniWeekOpen(): number {
	const row = getDb()
		.prepare(`SELECT COUNT(*) AS n FROM uni_tasks WHERE this_week = 1 AND ${OPEN}`)
		.get() as { n: number };
	return row.n;
}

export function createUniTask(input: {
	title: string;
	classId: number | null;
	taskType: UniTaskType | null;
	priority: Priority | null;
	deadline: string | null;
	thisWeek: number;
}): void {
	getDb()
		.prepare(
			`INSERT INTO uni_tasks (title, class_id, task_type, priority, deadline, this_week, status)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			input.title,
			input.classId,
			input.taskType,
			input.priority,
			input.deadline,
			input.thisWeek,
			input.thisWeek ? 'todo' : 'backlog'
		);
}

/** Edit an existing uni task's fields (incl. the optional Last-Revision date). */
export function updateUniTask(
	id: number,
	input: {
		title: string;
		classId: number | null;
		taskType: UniTaskType | null;
		priority: Priority | null;
		deadline: string | null;
		lastRevision: string | null;
	}
): void {
	getDb()
		.prepare(
			`UPDATE uni_tasks SET title = ?, class_id = ?, task_type = ?, priority = ?,
			   deadline = ?, last_revision = ?
			 WHERE id = ?`
		)
		.run(
			input.title,
			input.classId,
			input.taskType,
			input.priority,
			input.deadline,
			input.lastRevision,
			id
		);
}

export function toggleUniDone(id: number): void {
	getDb()
		.prepare(
			`UPDATE uni_tasks SET
			   status = CASE WHEN status = 'done' THEN 'todo' ELSE 'done' END,
			   completed_at = CASE WHEN status = 'done' THEN NULL ELSE datetime('now') END
			 WHERE id = ?`
		)
		.run(id);
}

export function setUniWeek(id: number, on: boolean): void {
	getDb()
		.prepare(
			`UPDATE uni_tasks SET
			   this_week = ?,
			   status = CASE WHEN status = 'backlog' AND ? = 1 THEN 'todo'
			                 WHEN status = 'todo' AND ? = 0 THEN 'backlog'
			                 ELSE status END
			 WHERE id = ?`
		)
		.run(on ? 1 : 0, on ? 1 : 0, on ? 1 : 0, id);
}

export function setUniStatus(id: number, status: TaskStatus): void {
	getDb()
		.prepare(
			`UPDATE uni_tasks SET
			   status = ?,
			   completed_at = CASE WHEN ? = 'done' THEN COALESCE(completed_at, datetime('now')) ELSE NULL END
			 WHERE id = ?`
		)
		.run(status, status, id);
}

/** "Last Revision" from the Notion schema — stamped when material was revisited. */
export function markRevised(id: number): void {
	getDb().prepare(`UPDATE uni_tasks SET last_revision = date('now') WHERE id = ?`).run(id);
}

export function deleteUniTask(id: number): void {
	getDb().prepare('DELETE FROM uni_tasks WHERE id = ?').run(id);
}
