import { getDb } from './db';
import type { Area, Priority, TaskStatus } from '$lib/labels';

export interface Task {
	id: number;
	title: string;
	area: Area;
	status: TaskStatus;
	priority: Priority | null;
	deadline: string | null;
	this_week: number;
	created_at: string;
	completed_at: string | null;
}

const OPEN = `status NOT IN ('done', 'wont_do')`;
const PRIO_ORDER = `CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 ELSE 3 END`;
const SORT = `${PRIO_ORDER}, deadline IS NULL, deadline, created_at`;

/** Open tasks marked for this week, most urgent first. */
export function listWeekOpen(area?: Area): Task[] {
	const where = area ? 'AND area = ?' : '';
	return getDb()
		.prepare(`SELECT * FROM tasks WHERE this_week = 1 AND ${OPEN} ${where} ORDER BY ${SORT}`)
		.all(...(area ? [area] : [])) as unknown as Task[];
}

/** Done tasks stay visible for 7 days (spec §4.2), newest first. */
export function listWeekDone(area?: Area): Task[] {
	const where = area ? 'AND area = ?' : '';
	return getDb()
		.prepare(
			`SELECT * FROM tasks
			 WHERE this_week = 1 AND status = 'done'
			   AND completed_at >= datetime('now', '-7 days') ${where}
			 ORDER BY completed_at DESC`
		)
		.all(...(area ? [area] : [])) as unknown as Task[];
}

/** Open tasks not scheduled for this week. */
export function listBacklog(area?: Area): Task[] {
	const where = area ? 'AND area = ?' : '';
	return getDb()
		.prepare(`SELECT * FROM tasks WHERE this_week = 0 AND ${OPEN} ${where} ORDER BY ${SORT}`)
		.all(...(area ? [area] : [])) as unknown as Task[];
}

export function weekStats(): { done: number; total: number } {
	const row = getDb()
		.prepare(
			`SELECT
			   SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done,
			   COUNT(*) AS total
			 FROM tasks
			 WHERE this_week = 1 AND status != 'wont_do'
			   AND (completed_at IS NULL OR completed_at >= datetime('now', '-7 days'))`
		)
		.get() as { done: number | null; total: number };
	return { done: row.done ?? 0, total: row.total };
}

export function countWeekOpen(): number {
	const row = getDb()
		.prepare(`SELECT COUNT(*) AS n FROM tasks WHERE this_week = 1 AND ${OPEN}`)
		.get() as { n: number };
	return row.n;
}

export function createTask(input: {
	title: string;
	area: Area;
	priority: Priority | null;
	deadline: string | null;
	thisWeek: number;
}): void {
	getDb()
		.prepare(
			`INSERT INTO tasks (title, area, priority, deadline, this_week, status)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
		.run(
			input.title,
			input.area,
			input.priority,
			input.deadline,
			input.thisWeek,
			input.thisWeek ? 'todo' : 'backlog'
		);
}

/** Edit an existing task's core fields (title, area, priority, deadline). */
export function updateTask(
	id: number,
	input: { title: string; area: Area; priority: Priority | null; deadline: string | null }
): void {
	getDb()
		.prepare(`UPDATE tasks SET title = ?, area = ?, priority = ?, deadline = ? WHERE id = ?`)
		.run(input.title, input.area, input.priority, input.deadline, id);
}

/** Check off / un-check a task. */
export function toggleDone(id: number): void {
	getDb()
		.prepare(
			`UPDATE tasks SET
			   status = CASE WHEN status = 'done' THEN 'todo' ELSE 'done' END,
			   completed_at = CASE WHEN status = 'done' THEN NULL ELSE datetime('now') END
			 WHERE id = ?`
		)
		.run(id);
}

/** Move between backlog and this week (the Sunday-review verb). */
export function setWeek(id: number, on: boolean): void {
	getDb()
		.prepare(
			`UPDATE tasks SET
			   this_week = ?,
			   status = CASE WHEN status = 'backlog' AND ? = 1 THEN 'todo'
			                 WHEN status = 'todo' AND ? = 0 THEN 'backlog'
			                 ELSE status END
			 WHERE id = ?`
		)
		.run(on ? 1 : 0, on ? 1 : 0, on ? 1 : 0, id);
}

export function deleteTask(id: number): void {
	getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id);
}
