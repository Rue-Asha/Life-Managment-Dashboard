import type { Actions, PageServerLoad } from './$types';
import {
	listWeekOpen,
	listWeekDone,
	listBacklog,
	weekStats,
	createTask,
	updateTask,
	toggleDone,
	setWeek,
	deleteTask
} from '$lib/server/tasks';
import { action, checkbox, int, oneOf, oneOfOrNull, str, strOrNull } from '$lib/server/forms';
import { AREAS, PRIORITIES, type Area } from '$lib/labels';

export const load: PageServerLoad = ({ url }) => {
	const raw = url.searchParams.get('area');
	const area = AREAS.includes(raw as Area) ? (raw as Area) : undefined;
	return {
		area: area ?? null,
		weekOpen: listWeekOpen(area),
		weekDone: listWeekDone(area),
		backlog: listBacklog(area),
		stats: weekStats()
	};
};

export const actions: Actions = {
	create: action((_event, data) => {
		createTask({
			title: str(data, 'title', 'Titel'),
			area: oneOf(data, 'area', AREAS),
			priority: oneOfOrNull(data, 'priority', PRIORITIES),
			deadline: strOrNull(data, 'deadline'),
			thisWeek: checkbox(data, 'this_week')
		});
	}),
	update: action((_event, data) => {
		updateTask(int(data, 'id'), {
			title: str(data, 'title', 'Titel'),
			area: oneOf(data, 'area', AREAS),
			priority: oneOfOrNull(data, 'priority', PRIORITIES),
			deadline: strOrNull(data, 'deadline')
		});
	}),
	toggle: action((_event, data) => {
		toggleDone(int(data, 'id'));
	}),
	week: action((_event, data) => {
		setWeek(int(data, 'id'), data.get('on') === '1');
	}),
	delete: action((_event, data) => {
		deleteTask(int(data, 'id'));
	})
};
