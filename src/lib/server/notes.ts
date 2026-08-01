import { getDb } from './db';
import type { NoteKind } from '$lib/labels';

export interface NoteFolder {
	id: number;
	name: string;
}

export interface Note {
	id: number;
	folder_id: number | null;
	title: string;
	kind: NoteKind;
	body: string;
	created_at: string;
	updated_at: string;
}

export function listFolders(): NoteFolder[] {
	return getDb()
		.prepare('SELECT id, name FROM note_folders ORDER BY id')
		.all() as unknown as NoteFolder[];
}

export function createFolder(name: string): number {
	const res = getDb().prepare('INSERT INTO note_folders (name) VALUES (?)').run(name);
	return Number(res.lastInsertRowid);
}

export function renameFolder(id: number, name: string): void {
	getDb().prepare('UPDATE note_folders SET name = ? WHERE id = ?').run(name, id);
}

/** Ordner löschen; enthaltene Notizen wandern nach „Ohne Ordner" (folder_id NULL). */
export function deleteFolder(id: number): void {
	getDb().prepare('DELETE FROM note_folders WHERE id = ?').run(id);
}

export function listNotes(): Note[] {
	return getDb()
		.prepare('SELECT * FROM notes ORDER BY updated_at DESC, id DESC')
		.all() as unknown as Note[];
}

export function getNote(id: number): Note | null {
	return (getDb().prepare('SELECT * FROM notes WHERE id = ?').get(id) as unknown as Note) ?? null;
}

export function createNote(input: {
	title: string;
	body?: string;
	kind?: NoteKind;
	folderId?: number | null;
}): number {
	const res = getDb()
		.prepare(`INSERT INTO notes (title, body, kind, folder_id) VALUES (?, ?, ?, ?)`)
		.run(input.title, input.body ?? '', input.kind ?? 'journal', input.folderId ?? null);
	return Number(res.lastInsertRowid);
}

export function updateNoteField(
	id: number,
	field: 'title' | 'body' | 'kind' | 'folder_id',
	value: string | number | null
): void {
	getDb()
		.prepare(`UPDATE notes SET ${field} = ?, updated_at = datetime('now') WHERE id = ?`)
		.run(value, id);
}

export function deleteNote(id: number): void {
	getDb().prepare('DELETE FROM notes WHERE id = ?').run(id);
}
