import { generateHTML } from '@tiptap/html/server';
import { editorExtensions } from '$lib/editor/extensions';
import { parseDoc, type DocNode } from '$lib/editor/doc';

/** Serverseitiges HTML einer Notiz: steht schon im ersten Paint im Editor-Feld,
 *  damit die Notiz ohne JS lesbar bleibt und nichts nachspringt. */
export function noteHtml(doc: string, fallbackText: string): string {
	const json = parseDoc(doc, fallbackText);
	try {
		return generateHTML(json as Record<string, unknown>, editorExtensions());
	} catch {
		// Unbekannter Knoten (z. B. nach einem Schema-Rückbau) — lieber der
		// Klartext als eine kaputte Seite.
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
