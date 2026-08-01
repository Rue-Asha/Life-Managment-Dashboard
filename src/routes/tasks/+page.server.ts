import type { Actions, PageServerLoad } from './$types';
import {
	advanceStatus,
	createTask,
	cycleCat,
	cyclePrio,
	deleteTask,
	listTasks,
	toggleDone,
	updateTaskField
} from '$lib/server/tasks';
import { action, int, oneOf, strOrNull, str } from '$lib/server/forms';
import { CATS } from '$lib/labels';

const VIEWS = ['day', 'week', 'board', 'all'] as const;

export const load: PageServerLoad = ({ url }) => {
	const rawView = url.searchParams.get('view');
	const rawCat = url.searchParams.get('cat');
	return {
		view: VIEWS.includes(rawView as (typeof VIEWS)[number]) ? rawView : 'day',
		cat: CATS.includes(rawCat as (typeof CATS)[number]) ? rawCat : 'all',
		tasks: listTasks()
	};
};

export const actions: Actions = {
	create: action((_event, data) => {
		createTask({
			text: str(data, 'text', 'Aufgabe'),
			cat: oneOf(data, 'cat', CATS),
			prio: int(data, 'prio'),
			due: strOrNull(data, 'due')
		});
	}),
	toggle: action((_event, data) => {
		toggleDone(int(data, 'id'));
	}),
	advance: action((_event, data) => {
		advanceStatus(int(data, 'id'));
	}),
	prio: action((_event, data) => {
		cyclePrio(int(data, 'id'));
	}),
	cat: action((_event, data) => {
		cycleCat(int(data, 'id'));
	}),
	due: action((_event, data) => {
		updateTaskField(int(data, 'id'), 'due', strOrNull(data, 'due'));
	}),
	delete: action((_event, data) => {
		deleteTask(int(data, 'id'));
	})
};
