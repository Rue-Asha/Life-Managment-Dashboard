import { generateHTML } from '@tiptap/html/server';
import { editorExtensions } from '$lib/editor/extensions';
import { parseDoc, type DocNode } from '$lib/editor/doc';

/** Server-rendered HTML of a note: it is in the editor field from the first
 *  paint, so the note stays readable without JS and nothing jumps on hydrate. */
export function noteHtml(doc: string, fallbackText: string): string {
	const json = parseDoc(doc, fallbackText);
	try {
		return generateHTML(json as Record<string, unknown>, editorExtensions());
	} catch {
		// Unknown node (e.g. after a schema rollback) — plain text beats a
		// broken page.
		return `<p>${escapeHtml(fallbackText)}</p>`;
	}
}

export function docJson(doc: string, fallbackText: string): DocNode {
	return parseDoc(doc, fallbackText);
}

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
