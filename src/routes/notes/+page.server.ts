import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	createFolder,
	createNote,
	deleteFolder,
	deleteNote,
	getNote,
	listFolders,
	listNotes,
	renameFolder,
	updateNoteField
} from '$lib/server/notes';
import { action, int, intOrNull, str, strRaw } from '$lib/server/forms';

export const load: PageServerLoad = ({ url }) => {
	const notes = listNotes();
	const rawId = Number(url.searchParams.get('id'));
	const active = notes.find((n) => n.id === rawId) ?? notes[0] ?? null;
	return {
		folders: listFolders(),
		notes,
		activeId: active?.id ?? null,
		active
	};
};

export const actions: Actions = {
	createNote: action((event, data) => {
		// Neue Notiz landet im Ordner der aktuell offenen Notiz (wie im Design).
		const currentId = intOrNull(data, 'current');
		const folderId = currentId ? (getNote(currentId)?.folder_id ?? null) : null;
		const id = createNote({ title: '', kind: 'journal', folderId });
		throw redirect(303, `/notes?id=${id}`);
	}),
	title: action((_e, data) => {
		updateNoteField(int(data, 'id'), 'title', strRaw(data, 'title'));
	}),
	body: action((_e, data) => {
		updateNoteField(int(data, 'id'), 'body', strRaw(data, 'body'));
	}),
	move: action((_e, data) => {
		updateNoteField(int(data, 'id'), 'folder_id', intOrNull(data, 'folder'));
	}),
	deleteNote: action((_e, data) => {
		deleteNote(int(data, 'id'));
		throw redirect(303, '/notes');
	}),
	createFolder: action((_e, data) => {
		createFolder(str(data, 'name', 'Ordner'));
	}),
	renameFolder: action((_e, data) => {
		renameFolder(int(data, 'id'), str(data, 'name', 'Ordner'));
	}),
	deleteFolder: action((_e, data) => {
		deleteFolder(int(data, 'id'));
	})
};
