import { getDb } from './db';
import { generateHTML } from '@tiptap/html';
import { editorExtensions, EMPTY_DOC } from '$lib/editor/extensions';
import { FormError } from './forms';

export interface Document {
	id: number;
	content: string;
	text_plain: string;
	updated_at: string;
}

/** Depth-first text extraction from ProseMirror JSON — feeds search (FTS). */
function extractText(node: unknown): string {
	if (node === null || typeof node !== 'object') return '';
	const n = node as { text?: string; content?: unknown[] };
	const parts: string[] = [];
	if (typeof n.text === 'string') parts.push(n.text);
	if (Array.isArray(n.content)) {
		for (const child of n.content) parts.push(extractText(child));
	}
	return parts.join(' ');
}

export function createDocument(): number {
	const result = getDb().prepare('INSERT INTO documents (content) VALUES (?)').run(EMPTY_DOC);
	return Number(result.lastInsertRowid);
}

export function getDocument(id: number): Document | null {
	return (getDb().prepare('SELECT * FROM documents WHERE id = ?').get(id) ??
		null) as Document | null;
}

/** Validate + store editor JSON; the plain-text mirror updates in step. */
export function saveDocument(id: number, contentJson: string): void {
	let parsed: unknown;
	try {
		parsed = JSON.parse(contentJson);
	} catch {
		throw new FormError('Editor-Inhalt ist kein gültiges JSON.');
	}
	if (parsed === null || typeof parsed !== 'object' || (parsed as { type?: string }).type !== 'doc') {
		throw new FormError('Editor-Inhalt hat kein Dokument-Format.');
	}
	getDb()
		.prepare(
			`UPDATE documents SET content = ?, text_plain = ?, updated_at = datetime('now') WHERE id = ?`
		)
		.run(JSON.stringify(parsed), extractText(parsed).trim(), id);
}

export function deleteDocument(id: number): void {
	getDb().prepare('DELETE FROM documents WHERE id = ?').run(id);
}

/** Server-rendered read-only HTML (Boox / noscript path, spec §8). */
export function renderDocumentHtml(content: string): string {
	try {
		return generateHTML(JSON.parse(content), editorExtensions());
	} catch {
		return '<p>⚠ Dokument konnte nicht gerendert werden.</p>';
	}
}
