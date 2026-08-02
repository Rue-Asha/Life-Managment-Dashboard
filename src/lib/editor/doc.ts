/** Konvertierung zwischen Tiptap-Dokument (JSON) und Klartext.
 *
 *  Bewusst ohne Tiptap-Import: das läuft auch im Server-Load und in Actions,
 *  wo ProseMirror nichts zu suchen hat. Reines JSON-Walking. */

export interface DocNode {
	type?: string;
	text?: string;
	attrs?: Record<string, unknown>;
	content?: DocNode[];
}

export const EMPTY_DOC = '{"type":"doc","content":[{"type":"paragraph"}]}';

/** Klartext aus einem Dokument: ein Block pro Zeile, Listenpunkte markiert. */
export function docToText(doc: DocNode | null | undefined): string {
	if (!doc) return '';
	const lines: string[] = [];

	const walk = (node: DocNode, prefix = '') => {
		const kids = node.content ?? [];

		switch (node.type) {
			case 'taskItem': {
				const done = node.attrs?.['checked'] === true;
				collectBlocks(kids, `${done ? '[x]' : '[ ]'} `);
				return;
			}
			case 'listItem':
				collectBlocks(kids, prefix || '- ');
				return;
			case 'horizontalRule':
				lines.push('---');
				return;
			case 'paragraph':
			case 'heading':
			case 'codeBlock':
			case 'tableHeader':
			case 'tableCell': {
				const text = inline(node);
				if (text) lines.push(prefix + text);
				return;
			}
			default:
				for (const kid of kids) walk(kid, prefix);
		}
	};

	// Der erste Block eines Listenpunkts trägt die Markierung, Folgeblöcke nicht.
	const collectBlocks = (kids: DocNode[], marker: string) => {
		let first = true;
		for (const kid of kids) {
			walk(kid, first ? marker : '');
			first = false;
		}
	};

	const inline = (node: DocNode): string =>
		(node.content ?? []).map((k) => k.text ?? inline(k)).join('');

	for (const block of doc.content ?? []) walk(block);
	return lines.join('\n').trim();
}

/** Gegenrichtung: Klartext (Altbestand) als Dokument, Absätze an Leerzeilen. */
export function docFromText(text: string): DocNode {
	const blocks = text
		.split(/\n{2,}/)
		.map((b) => b.trim())
		.filter(Boolean);
	if (!blocks.length) return JSON.parse(EMPTY_DOC) as DocNode;
	return {
		type: 'doc',
		content: blocks.map((block) => ({
			type: 'paragraph',
			content: block.split('\n').flatMap((line, i) =>
				i === 0
					? [{ type: 'text', text: line }]
					: [{ type: 'hardBreak' }, { type: 'text', text: line }]
			)
		}))
	};
}

/** Gespeichertes JSON lesen; leer/kaputt → aus dem Klartext aufbauen. */
export function parseDoc(doc: string, fallbackText: string): DocNode {
	if (doc) {
		try {
			return JSON.parse(doc) as DocNode;
		} catch {
			/* fällt unten auf den Klartext zurück */
		}
	}
	return docFromText(fallbackText);
}

export function wordCount(text: string): number {
	return text.split(/\s+/).filter(Boolean).length;
}
