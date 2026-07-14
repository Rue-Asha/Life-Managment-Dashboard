import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getClass,
	updateClass,
	updateClassDescription,
	deleteClass,
	listClassTasks,
	createUniTask,
	updateUniTask,
	toggleUniDone,
	setUniWeek,
	deleteUniTask
} from '$lib/server/uni';
import {
	action,
	checkbox,
	int,
	numOrNull,
	oneOf,
	oneOfOrNull,
	str,
	strOrNull
} from '$lib/server/forms';
import { CLASS_STATUSES, PRIORITIES, UNI_TASK_TYPES } from '$lib/labels';

export const load: PageServerLoad = ({ params }) => {
	const id = Number(params.id);
	const cls = Number.isInteger(id) ? getClass(id) : null;
	if (!cls) error(404, 'Class nicht gefunden');
	return { cls, tasks: listClassTasks(cls.id) };
};

export const actions: Actions = {
	update: action((event, data) => {
		updateClass(Number(event.params.id), {
			name: str(data, 'name', 'Name'),
			professor: strOrNull(data, 'professor'),
			room: strOrNull(data, 'room'),
			schedule: strOrNull(data, 'schedule'),
			cps: numOrNull(data, 'cps', 'CPs'),
			examDate: strOrNull(data, 'exam_date'),
			archiveUrl: strOrNull(data, 'archive_url'),
			status: oneOf(data, 'status', CLASS_STATUSES)
		});
	}),
	updateDescription: action((event, data) => {
		updateClassDescription(Number(event.params.id), strOrNull(data, 'description'));
	}),
	delete: (event) => {
		const cls = getClass(Number(event.params.id));
		deleteClass(Number(event.params.id));
		redirect(303, cls ? `/uni?semester=${cls.semester_id}` : '/uni');
	},
	createTask: action((event, data) => {
		createUniTask({
			title: str(data, 'title', 'Titel'),
			classId: Number(event.params.id),
			taskType: oneOfOrNull(data, 'task_type', UNI_TASK_TYPES),
			priority: oneOfOrNull(data, 'priority', PRIORITIES),
			deadline: strOrNull(data, 'deadline'),
			thisWeek: checkbox(data, 'this_week')
		});
	}),
	editTask: action((event, data) => {
		updateUniTask(int(data, 'id'), {
			title: str(data, 'title', 'Titel'),
			classId: Number(event.params.id),
			taskType: oneOfOrNull(data, 'task_type', UNI_TASK_TYPES),
			priority: oneOfOrNull(data, 'priority', PRIORITIES),
			deadline: strOrNull(data, 'deadline'),
			lastRevision: strOrNull(data, 'last_revision')
		});
	}),
	toggle: action((_event, data) => {
		toggleUniDone(int(data, 'id'));
	}),
	week: action((_event, data) => {
		setUniWeek(int(data, 'id'), data.get('on') === '1');
	}),
	deleteTask: action((_event, data) => {
		deleteUniTask(int(data, 'id'));
	})
};
