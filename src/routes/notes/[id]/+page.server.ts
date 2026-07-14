import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getNote, updateNoteMeta, touchNote, deleteNote } from '$lib/server/notes';
import { saveDocument, renderDocumentHtml } from '$lib/server/documents';
import { action, oneOfOrNull, str, strOrNull } from '$lib/server/forms';
import { BEREICHE } from '$lib/labels';

export const load: PageServerLoad = ({ params }) => {
	const id = Number(params.id);
	const note = Number.isInteger(id) ? getNote(id) : null;
	if (!note) error(404, 'Notiz nicht gefunden');
	return { note, html: renderDocumentHtml(note.content) };
};

export const actions: Actions = {
	meta: action((event, data) => {
		const tagsRaw = strOrNull(data, 'tags');
		updateNoteMeta(Number(event.params.id), {
			title: str(data, 'title', 'Titel'),
			bereich: oneOfOrNull(data, 'bereich', BEREICHE),
			tags: tagsRaw
				? tagsRaw
						.split(',')
						.map((t) => t.trim().replace(/^#/, ''))
						.filter(Boolean)
				: []
		});
	}),
	save: action((event, data) => {
		const note = getNote(Number(event.params.id));
		if (!note?.document_id) error(404, 'Dokument nicht gefunden');
		saveDocument(note.document_id, str(data, 'content', 'Inhalt'));
		touchNote(note.id);
	}),
	delete: (event) => {
		deleteNote(Number(event.params.id));
		redirect(303, '/notes');
	}
};
