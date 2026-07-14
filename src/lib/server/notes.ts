import { getDb } from './db';
import { createDocument, deleteDocument } from './documents';
import type { Bereich } from '$lib/labels';

export interface Note {
	id: number;
	title: string;
	bereich: Bereich | null;
	tags: string; // JSON array of strings
	inbox: number;
	document_id: number | null;
	created_at: string;
	updated_at: string;
	snippet: string;
}

const WITH_SNIPPET = `SELECT n.*, COALESCE(substr(d.text_plain, 1, 160), '') AS snippet
	 FROM notes n LEFT JOIN documents d ON d.id = n.document_id`;

export function listInbox(): Note[] {
	return getDb()
		.prepare(`${WITH_SNIPPET} WHERE n.inbox = 1 ORDER BY n.created_at DESC`)
		.all() as unknown as Note[];
}

export function inboxCount(): number {
	const row = getDb().prepare('SELECT COUNT(*) AS n FROM notes WHERE inbox = 1').get() as {
		n: number;
	};
	return row.n;
}

/** Filed notes (not inbox), optionally one Bereich, freshest first. */
export function listNotes(bereich?: Bereich): Note[] {
	const where = bereich ? 'AND n.bereich = ?' : '';
	return getDb()
		.prepare(`${WITH_SNIPPET} WHERE n.inbox = 0 ${where} ORDER BY n.updated_at DESC`)
		.all(...(bereich ? [bereich] : [])) as unknown as Note[];
}

export function bereichCounts(): Record<string, number> {
	const rows = getDb()
		.prepare(
			`SELECT bereich, COUNT(*) AS n FROM notes WHERE inbox = 0 AND bereich IS NOT NULL GROUP BY bereich`
		)
		.all() as unknown as { bereich: string; n: number }[];
	return Object.fromEntries(rows.map((r) => [r.bereich, r.n]));
}

/** Quick capture: title only, lands in the inbox with an empty document. */
export function createNote(title: string): number {
	const documentId = createDocument();
	const result = getDb()
		.prepare('INSERT INTO notes (title, document_id) VALUES (?, ?)')
		.run(title, documentId);
	return Number(result.lastInsertRowid);
}

export function getNote(id: number): (Note & { content: string }) | null {
	return (getDb()
		.prepare(
			`SELECT n.*, COALESCE(d.text_plain, '') AS snippet,
			        COALESCE(d.content, '{"type":"doc","content":[{"type":"paragraph"}]}') AS content
			 FROM notes n LEFT JOIN documents d ON d.id = n.document_id
			 WHERE n.id = ?`
		)
		.get(id) ?? null) as (Note & { content: string }) | null;
}

/** Filing a Bereich moves the note out of the inbox (the Sunday-review verb). */
export function updateNoteMeta(
	id: number,
	input: { title: string; bereich: Bereich | null; tags: string[] }
): void {
	getDb()
		.prepare(
			`UPDATE notes SET title = ?, bereich = ?, tags = ?,
			   inbox = CASE WHEN ? IS NULL THEN inbox ELSE 0 END,
			   updated_at = datetime('now')
			 WHERE id = ?`
		)
		.run(input.title, input.bereich, JSON.stringify(input.tags), input.bereich, id);
}

export function touchNote(id: number): void {
	getDb().prepare(`UPDATE notes SET updated_at = datetime('now') WHERE id = ?`).run(id);
}

export function deleteNote(id: number): void {
	const note = getNote(id);
	getDb().prepare('DELETE FROM notes WHERE id = ?').run(id);
	if (note?.document_id) deleteDocument(note.document_id);
}
