import { getDb } from './db';
import type { Status, UniType } from '$lib/labels';

export interface Semester {
	id: number;
	name: string;
	status: 'active' | 'archived';
	sort_order: number;
}

export interface Course {
	id: number;
	semester_id: number;
	name: string;
	code: string;
	hue: number;
	docent: string;
	slot: string;
	ects: string;
	grade: string;
	notes: string;
}

export interface UniTask {
	id: number;
	course_id: number;
	text: string;
	type: UniType;
	prio: number;
	status: Status;
	due: string | null;
	notes: string;
	done: number;
	completed_at: string | null;
}

// ── Semester ────────────────────────────────────────────────────────────────

export function listSemesters(): Semester[] {
	return getDb()
		.prepare('SELECT * FROM semesters ORDER BY sort_order, id')
		.all() as unknown as Semester[];
}

export function createSemester(name: string): number {
	const res = getDb()
		.prepare(
			`INSERT INTO semesters (name, sort_order)
			 VALUES (?, COALESCE((SELECT MAX(sort_order) + 1 FROM semesters), 0))`
		)
		.run(name);
	return Number(res.lastInsertRowid);
}

export function toggleSemesterArchived(id: number): void {
	getDb()
		.prepare(
			`UPDATE semesters SET status = CASE status WHEN 'archived' THEN 'active' ELSE 'archived' END
			 WHERE id = ?`
		)
		.run(id);
}

/** Delete a semester along with its courses and their tasks (ON DELETE CASCADE). */
export function deleteSemester(id: number): void {
	getDb().prepare('DELETE FROM semesters WHERE id = ?').run(id);
}

// ── Courses ─────────────────────────────────────────────────────────────────

export function listCourses(semesterId?: number): Course[] {
	if (semesterId !== undefined) {
		return getDb()
			.prepare('SELECT * FROM courses WHERE semester_id = ? ORDER BY id')
			.all(semesterId) as unknown as Course[];
	}
	return getDb().prepare('SELECT * FROM courses ORDER BY id').all() as unknown as Course[];
}

export function getCourse(id: number): Course | null {
	return (getDb().prepare('SELECT * FROM courses WHERE id = ?').get(id) as unknown as Course) ?? null;
}

export function createCourse(semesterId: number, name: string, code: string): number {
	const used = getDb()
		.prepare('SELECT COUNT(*) AS n FROM courses WHERE semester_id = ?')
		.get(semesterId) as { n: number };
	const res = getDb()
		.prepare(`INSERT INTO courses (semester_id, name, code, hue) VALUES (?, ?, ?, ?)`)
		.run(semesterId, name, code.toUpperCase(), used.n % 7);
	return Number(res.lastInsertRowid);
}

export function updateCourseField(
	id: number,
	field: 'name' | 'code' | 'docent' | 'slot' | 'ects' | 'grade' | 'notes' | 'hue',
	value: string | number
): void {
	getDb().prepare(`UPDATE courses SET ${field} = ? WHERE id = ?`).run(value, id);
}

export function deleteCourse(id: number): void {
	getDb().prepare('DELETE FROM courses WHERE id = ?').run(id);
}

// ── Uni tasks ───────────────────────────────────────────────────────────────

export function listUniTasks(semesterId?: number): (UniTask & { semester_id: number })[] {
	if (semesterId !== undefined) {
		return getDb()
			.prepare(
				`SELECT t.*, c.semester_id FROM uni_tasks t
				 JOIN courses c ON c.id = t.course_id
				 WHERE c.semester_id = ?
				 ORDER BY t.prio, t.due IS NULL, t.due`
			)
			.all(semesterId) as unknown as (UniTask & { semester_id: number })[];
	}
	return getDb()
		.prepare(
			`SELECT t.*, c.semester_id FROM uni_tasks t
			 JOIN courses c ON c.id = t.course_id
			 ORDER BY t.prio, t.due IS NULL, t.due`
		)
		.all() as unknown as (UniTask & { semester_id: number })[];
}

export function getUniTask(id: number): UniTask | null {
	return (
		(getDb().prepare('SELECT * FROM uni_tasks WHERE id = ?').get(id) as unknown as UniTask) ?? null
	);
}

export function createUniTask(input: {
	courseId: number;
	text: string;
	due: string | null;
	prio: number;
	type: UniType;
}): void {
	getDb()
		.prepare(`INSERT INTO uni_tasks (course_id, text, due, prio, type) VALUES (?, ?, ?, ?, ?)`)
		.run(input.courseId, input.text, input.due, input.prio, input.type);
}

export function updateUniTaskField(
	id: number,
	field: 'text' | 'course_id' | 'type' | 'prio' | 'status' | 'due' | 'notes',
	value: string | number | null
): void {
	getDb().prepare(`UPDATE uni_tasks SET ${field} = ? WHERE id = ?`).run(value, id);
	if (field === 'status') {
		getDb()
			.prepare(
				`UPDATE uni_tasks SET done = CASE WHEN status = 'done' THEN 1 ELSE 0 END,
				 completed_at = CASE WHEN status = 'done' THEN datetime('now') ELSE NULL END
				 WHERE id = ?`
			)
			.run(id);
	}
}

export function toggleUniDone(id: number): void {
	getDb()
		.prepare(
			`UPDATE uni_tasks SET
			   done = CASE WHEN done = 1 THEN 0 ELSE 1 END,
			   status = CASE WHEN done = 1 THEN 'todo' ELSE 'done' END,
			   completed_at = CASE WHEN done = 1 THEN NULL ELSE datetime('now') END
			 WHERE id = ?`
		)
		.run(id);
}

/** Type badge click: LEC → EXC → OTH → LEC. */
export function cycleUniType(id: number): void {
	getDb()
		.prepare(
			`UPDATE uni_tasks SET type = CASE type WHEN 'LEC' THEN 'EXC' WHEN 'EXC' THEN 'OTH' ELSE 'LEC' END
			 WHERE id = ?`
		)
		.run(id);
}

export function deleteUniTask(id: number): void {
	getDb().prepare('DELETE FROM uni_tasks WHERE id = ?').run(id);
}

// ── Study session ───────────────────────────────────────────────────────────

export interface SessionEntry {
	task_id: number;
	date: string;
}

export function listSession(): SessionEntry[] {
	return getDb().prepare('SELECT * FROM uni_session').all() as unknown as SessionEntry[];
}

/** Star click: add a task to today's session or take it out again. As in the
 *  design, a click on a new day starts a fresh session. */
export function toggleSession(taskId: number, today: string): void {
	const db = getDb();
	const dates = db.prepare('SELECT DISTINCT date FROM uni_session').all() as unknown as {
		date: string;
	}[];
	if (dates.some((d) => d.date !== today)) {
		db.prepare('DELETE FROM uni_session WHERE date != ?').run(today);
	}
	const existing = db.prepare('SELECT task_id FROM uni_session WHERE task_id = ?').get(taskId);
	if (existing) {
		db.prepare('DELETE FROM uni_session WHERE task_id = ?').run(taskId);
	} else {
		db.prepare('INSERT INTO uni_session (task_id, date) VALUES (?, ?)').run(taskId, today);
	}
}

export function clearSession(): void {
	getDb().prepare('DELETE FROM uni_session').run();
}

/** Remove finished tasks from the session. */
export function sweepSession(): void {
	getDb()
		.prepare(
			`DELETE FROM uni_session WHERE task_id IN (SELECT id FROM uni_tasks WHERE done = 1)`
		)
		.run();
}
