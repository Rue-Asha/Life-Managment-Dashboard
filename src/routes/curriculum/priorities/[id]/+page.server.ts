import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getPriority,
	updatePriority,
	ensurePriorityDocument,
	listQuotasByPriority,
	listMiniByPriority
} from '$lib/server/curriculum';
import { getDocument, saveDocument, renderDocumentHtml } from '$lib/server/documents';
import { EMPTY_DOC } from '$lib/editor/extensions';
import { action, str, strOrNull } from '$lib/server/forms';

export const load: PageServerLoad = ({ params }) => {
	const id = Number(params.id);
	const priority = Number.isInteger(id) ? getPriority(id) : null;
	if (!priority) error(404, 'Priorität nicht gefunden');
	const documentId = ensurePriorityDocument(priority.id);
	const doc = getDocument(documentId);
	return {
		priority,
		content: doc?.content ?? EMPTY_DOC,
		html: renderDocumentHtml(doc?.content ?? EMPTY_DOC),
		quotas: listQuotasByPriority(priority.id),
		minis: listMiniByPriority(priority.id)
	};
};

export const actions: Actions = {
	update: action((event, data) => {
		updatePriority(Number(event.params.id), {
			name: str(data, 'name', 'Name'),
			note: strOrNull(data, 'note')
		});
	}),
	saveDescription: action((event, data) => {
		const documentId = ensurePriorityDocument(Number(event.params.id));
		saveDocument(documentId, str(data, 'content', 'Inhalt'));
	})
};
