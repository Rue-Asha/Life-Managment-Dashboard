import { getDb } from './db';

export interface SearchHit {
	kind: 'task' | 'uni_task' | 'class' | 'note' | 'project';
	ref_id: number;
	title: string;
	snippet: string;
}

/** Escape user input into an FTS5 prefix query: each term quoted + "*". */
function toFtsQuery(q: string): string {
	const terms = q
		.split(/\s+/)
		.map((t) => t.replace(/"/g, '').trim())
		.filter(Boolean);
	if (terms.length === 0) return '';
	return terms.map((t) => `"${t}"*`).join(' ');
}

export function search(q: string, limit = 40): SearchHit[] {
	const query = toFtsQuery(q);
	if (!query) return [];
	return getDb()
		.prepare(
			`SELECT kind, ref_id, title,
			        snippet(search_fts, 3, '«', '»', ' … ', 12) AS snippet
			 FROM search_fts
			 WHERE search_fts MATCH ?
			 ORDER BY bm25(search_fts, 0, 0, 3.0, 1.0)
			 LIMIT ?`
		)
		.all(query, limit) as unknown as SearchHit[];
}

export function searchHref(hit: SearchHit): string {
	switch (hit.kind) {
		case 'task':
			return '/tasks';
		case 'uni_task':
			return '/uni/tasks';
		case 'class':
			return `/uni/classes/${hit.ref_id}`;
		case 'note':
			return `/notes/${hit.ref_id}`;
		case 'project':
			return `/projects/${hit.ref_id}`;
	}
}
