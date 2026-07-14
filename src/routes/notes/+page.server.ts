import type { Actions, PageServerLoad } from './$types';
import { listInbox, listNotes, bereichCounts, createNote, deleteNote } from '$lib/server/notes';
import { action, int, str } from '$lib/server/forms';
import { BEREICHE, type Bereich } from '$lib/labels';

export const load: PageServerLoad = ({ url }) => {
	const raw = url.searchParams.get('bereich');
	const bereich = BEREICHE.includes(raw as Bereich) ? (raw as Bereich) : undefined;
	return {
		bereich: bereich ?? null,
		inbox: listInbox(),
		notes: listNotes(bereich),
		counts: bereichCounts()
	};
};

export const actions: Actions = {
	create: action((_event, data) => {
		createNote(str(data, 'title', 'Titel'));
	}),
	delete: action((_event, data) => {
		deleteNote(int(data, 'id'));
	})
};
