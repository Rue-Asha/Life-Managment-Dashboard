import { getDb } from './db';
import { createDocument, deleteDocument } from './documents';
import type { Priority, ProjectStatus, ProjectType } from '$lib/labels';

export interface Project {
	id: number;
	name: string;
	description: string | null;
	type: ProjectType;
	status: ProjectStatus;
	priority: Priority | null;
	tech_stack: string | null;
	link: string | null;
	start_date: string | null;
	document_id: number | null;
	created_at: string;
	updated_at: string;
}

const SORT = `CASE status WHEN 'in_progress' THEN 0 WHEN 'backlog' THEN 1 WHEN 'paused' THEN 2
              WHEN 'done' THEN 3 ELSE 4 END,
              CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 ELSE 3 END,
              updated_at DESC`;

export function listProjects(): Project[] {
	return getDb()
		.prepare(`SELECT * FROM projects ORDER BY ${SORT}`)
		.all() as unknown as Project[];
}

export function getProject(id: number): (Project & { content: string }) | null {
	return (getDb()
		.prepare(
			`SELECT p.*, COALESCE(d.content, '{"type":"doc","content":[{"type":"paragraph"}]}') AS content
			 FROM projects p LEFT JOIN documents d ON d.id = p.document_id
			 WHERE p.id = ?`
		)
		.get(id) ?? null) as (Project & { content: string }) | null;
}

export interface ProjectInput {
	name: string;
	description: string | null;
	type: ProjectType;
	status: ProjectStatus;
	priority: Priority | null;
	techStack: string | null;
	link: string | null;
	startDate: string | null;
}

export function createProject(input: ProjectInput): number {
	const documentId = createDocument();
	const result = getDb()
		.prepare(
			`INSERT INTO projects (name, description, type, status, priority, tech_stack, link, start_date, document_id)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			input.name,
			input.description,
			input.type,
			input.status,
			input.priority,
			input.techStack,
			input.link,
			input.startDate,
			documentId
		);
	return Number(result.lastInsertRowid);
}

export function updateProject(id: number, input: ProjectInput): void {
	getDb()
		.prepare(
			`UPDATE projects SET name = ?, description = ?, type = ?, status = ?, priority = ?,
			   tech_stack = ?, link = ?, start_date = ?, updated_at = datetime('now')
			 WHERE id = ?`
		)
		.run(
			input.name,
			input.description,
			input.type,
			input.status,
			input.priority,
			input.techStack,
			input.link,
			input.startDate,
			id
		);
}

/** Board-view verb: move a card one column left/right (or set directly). */
export function setProjectStatus(id: number, status: ProjectStatus): void {
	getDb()
		.prepare(`UPDATE projects SET status = ?, updated_at = datetime('now') WHERE id = ?`)
		.run(status, id);
}

export function touchProject(id: number): void {
	getDb().prepare(`UPDATE projects SET updated_at = datetime('now') WHERE id = ?`).run(id);
}

export function deleteProject(id: number): void {
	const project = getProject(id);
	getDb().prepare('DELETE FROM projects WHERE id = ?').run(id);
	if (project?.document_id) deleteDocument(project.document_id);
}
