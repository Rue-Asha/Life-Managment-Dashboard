import { getDb } from './db';
import type { Cat, Status } from '$lib/labels';

export interface Task {
	id: number;
	text: string;
	cat: Cat;
	prio: number;
	status: Status;
	due: string | null;
	notes: string;
	done: number;
	created_at: string;
	completed_at: string | null;
}

export function listTasks(): Task[] {
	return getDb()
		.prepare(`SELECT * FROM tasks ORDER BY prio, due IS NULL, due, created_at DESC`)
		.all() as unknown as Task[];
}

export function getTask(id: number): Task | null {
	return (getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id) as unknown as Task) ?? null;
}

export function countOpen(): number {
	const row = getDb().prepare(`SELECT COUNT(*) AS n FROM tasks WHERE done = 0`).get() as {
		n: number;
	};
	return row.n;
}

export function createTask(input: { text: string; cat: Cat; prio: number; due: string | null }): void {
	getDb()
		.prepare(`INSERT INTO tasks (text, cat, prio, due) VALUES (?, ?, ?, ?)`)
		.run(input.text, input.cat, input.prio, input.due);
}

/** Ein Feld einer Aufgabe ändern (Detailseite: Auto-Save pro Feld). */
export function updateTaskField(
	id: number,
	field: 'text' | 'cat' | 'prio' | 'status' | 'due' | 'notes',
	value: string | number | null
): void {
	getDb().prepare(`UPDATE tasks SET ${field} = ? WHERE id = ?`).run(value, id);
	if (field === 'status') {
		getDb()
			.prepare(
				`UPDATE tasks SET done = CASE WHEN status = 'done' THEN 1 ELSE 0 END,
				 completed_at = CASE WHEN status = 'done' THEN datetime('now') ELSE NULL END
				 WHERE id = ?`
			)
			.run(id);
	}
}

export function toggleDone(id: number): void {
	getDb()
		.prepare(
			`UPDATE tasks SET
			   done = CASE WHEN done = 1 THEN 0 ELSE 1 END,
			   status = CASE WHEN done = 1 THEN 'todo' ELSE 'done' END,
			   completed_at = CASE WHEN done = 1 THEN NULL ELSE datetime('now') END
			 WHERE id = ?`
		)
		.run(id);
}

/** Board-Pfeil: offen → in Arbeit → erledigt → offen. */
export function advanceStatus(id: number): void {
	getDb()
		.prepare(
			`UPDATE tasks SET
			   status = CASE status WHEN 'todo' THEN 'doing' WHEN 'doing' THEN 'done' ELSE 'todo' END,
			   done = CASE status WHEN 'doing' THEN 1 ELSE 0 END,
			   completed_at = CASE status WHEN 'doing' THEN datetime('now') ELSE NULL END
			 WHERE id = ?`
		)
		.run(id);
}

/** Prio-Balken klick: 3 → 1 → 2 → 3 zyklisch (wie im Design: p===3?1:p+1). */
export function cyclePrio(id: number): void {
	getDb()
		.prepare(`UPDATE tasks SET prio = CASE WHEN prio = 3 THEN 1 ELSE prio + 1 END WHERE id = ?`)
		.run(id);
}

/** Kategorie-Badge klick: personal → uni → job → personal. */
export function cycleCat(id: number): void {
	getDb()
		.prepare(
			`UPDATE tasks SET cat = CASE cat WHEN 'personal' THEN 'uni' WHEN 'uni' THEN 'job' ELSE 'personal' END
			 WHERE id = ?`
		)
		.run(id);
}

export function deleteTask(id: number): void {
	getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id);
}
