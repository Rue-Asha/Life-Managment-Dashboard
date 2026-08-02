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
	updateNoteDoc,
	updateNoteField
} from '$lib/server/notes';
import { docJson, noteHtml } from '$lib/server/noteHtml';
import { docToText, type DocNode } from '$lib/editor/doc';
import { action, int, intOrNull, str, strRaw } from '$lib/server/forms';

export const load: PageServerLoad = ({ url }) => {
	const notes = listNotes();
	const rawId = Number(url.searchParams.get('id'));
	const active = notes.find((n) => n.id === rawId) ?? notes[0] ?? null;
	return {
		folders: listFolders(),
		notes,
		activeId: active?.id ?? null,
		active,
		// Startzustand des Editors: HTML fürs erste Paint, JSON für Tiptap.
		activeHtml: active ? noteHtml(active.doc, active.body) : '',
		activeDoc: active ? JSON.stringify(docJson(active.doc, active.body)) : ''
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
	doc: action((_e, data) => {
		const raw = strRaw(data, 'doc');
		let parsed: DocNode | null = null;
		try {
			parsed = JSON.parse(raw) as DocNode;
		} catch {
			// Kaputtes JSON gar nicht erst speichern — lieber die letzte gute
			// Fassung behalten, als die Notiz zu zerschießen.
			return;
		}
		updateNoteDoc(int(data, 'id'), raw, docToText(parsed));
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
