/** Conversion between a Tiptap document (JSON) and plain text.
 *
 *  Deliberately without a Tiptap import: this also runs in server loads and
 *  actions, where ProseMirror has no business being. Pure JSON walking. */

export interface DocNode {
	type?: string;
	text?: string;
	attrs?: Record<string, unknown>;
	content?: DocNode[];
}

export const EMPTY_DOC = '{"type":"doc","content":[{"type":"paragraph"}]}';

/** Plain text from a document: one block per line, list items marked. */
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

	// The first block of a list item carries the marker, later ones do not.
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

/** The other way round: legacy plain text as a document, split on blank lines. */
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

/** Read stored JSON; empty or broken → rebuild it from the plain text. */
export function parseDoc(doc: string, fallbackText: string): DocNode {
	if (doc) {
		try {
			return JSON.parse(doc) as DocNode;
		} catch {
			/* falls through to the plain text below */
		}
	}
	return docFromText(fallbackText);
}

export function wordCount(text: string): number {
	return text.split(/\s+/).filter(Boolean).length;
}
