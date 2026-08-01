import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deleteTask, getTask, toggleDone, updateTaskField } from '$lib/server/tasks';
import { action, int, oneOf, strOrNull, strRaw, str } from '$lib/server/forms';
import { CATS, STATUSES } from '$lib/labels';

export const load: PageServerLoad = ({ params }) => {
	const task = getTask(Number(params.id));
	if (!task) throw error(404, 'Aufgabe nicht gefunden');
	return { task, pageTitle: task.text || 'Aufgabe' };
};

export const actions: Actions = {
	text: action(({ params }, data) => {
		updateTaskField(Number(params.id), 'text', str(data, 'text', 'Aufgabe'));
	}),
	due: action(({ params }, data) => {
		updateTaskField(Number(params.id), 'due', strOrNull(data, 'due'));
	}),
	prio: action(({ params }, data) => {
		updateTaskField(Number(params.id), 'prio', int(data, 'prio'));
	}),
	cat: action(({ params }, data) => {
		updateTaskField(Number(params.id), 'cat', oneOf(data, 'cat', CATS));
	}),
	status: action(({ params }, data) => {
		updateTaskField(Number(params.id), 'status', oneOf(data, 'status', STATUSES));
	}),
	notes: action(({ params }, data) => {
		updateTaskField(Number(params.id), 'notes', strRaw(data, 'notes'));
	}),
	toggle: action(({ params }) => {
		toggleDone(Number(params.id));
	}),
	delete: action(({ params }) => {
		deleteTask(Number(params.id));
		throw redirect(303, '/tasks');
	})
};
