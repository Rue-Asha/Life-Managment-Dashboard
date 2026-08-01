import { getDb } from './db';
import type { ProjectStatus } from '$lib/labels';

export interface Project {
	id: number;
	name: string;
	stack: string;
	status: ProjectStatus;
	repo: string;
	goal: string;
	notes: string;
	created_at: string;
	updated_at: string;
}

export interface ProjectTask {
	id: number;
	project_id: number;
	text: string;
	done: number;
	sort_order: number;
}

export function listProjects(): Project[] {
	return getDb().prepare('SELECT * FROM projects ORDER BY id DESC').all() as unknown as Project[];
}

export function getProject(id: number): Project | null {
	return (
		(getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as unknown as Project) ?? null
	);
}

export function listProjectTasks(): ProjectTask[] {
	return getDb()
		.prepare('SELECT * FROM project_tasks ORDER BY project_id, sort_order, id')
		.all() as unknown as ProjectTask[];
}

export function createProject(name: string, stack: string): number {
	const res = getDb()
		.prepare(`INSERT INTO projects (name, stack) VALUES (?, ?)`)
		.run(name, stack.toUpperCase());
	return Number(res.lastInsertRowid);
}

export function updateProjectField(
	id: number,
	field: 'name' | 'stack' | 'status' | 'repo' | 'goal' | 'notes',
	value: string
): void {
	getDb()
		.prepare(`UPDATE projects SET ${field} = ?, updated_at = datetime('now') WHERE id = ?`)
		.run(value, id);
}

/** Board-Pfeil: backlog → paused → active → archived → backlog. */
export function advanceProjectStatus(id: number): void {
	getDb()
		.prepare(
			`UPDATE projects SET status = CASE status
			   WHEN 'backlog' THEN 'paused'
			   WHEN 'paused' THEN 'active'
			   WHEN 'active' THEN 'archived'
			   ELSE 'backlog' END,
			 updated_at = datetime('now')
			 WHERE id = ?`
		)
		.run(id);
}

export function deleteProject(id: number): void {
	getDb().prepare('DELETE FROM projects WHERE id = ?').run(id);
}

export function addProjectTask(projectId: number, text: string): void {
	getDb()
		.prepare(
			`INSERT INTO project_tasks (project_id, text, sort_order)
			 VALUES (?, ?, COALESCE((SELECT MAX(sort_order) + 1 FROM project_tasks WHERE project_id = ?), 0))`
		)
		.run(projectId, text, projectId);
}

export function toggleProjectTask(id: number): void {
	getDb()
		.prepare(`UPDATE project_tasks SET done = CASE WHEN done = 1 THEN 0 ELSE 1 END WHERE id = ?`)
		.run(id);
}

export function deleteProjectTask(id: number): void {
	getDb().prepare('DELETE FROM project_tasks WHERE id = ?').run(id);
}
