import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	deleteUniTask,
	getUniTask,
	listCourses,
	toggleUniDone,
	updateUniTaskField
} from '$lib/server/uni';
import { action, int, oneOf, str, strOrNull, strRaw } from '$lib/server/forms';
import { STATUSES, UNI_TYPES } from '$lib/labels';

export const load: PageServerLoad = ({ params }) => {
	const task = getUniTask(Number(params.id));
	if (!task) throw error(404, 'Task not found');
	return { task, courses: listCourses(), pageTitle: task.text || 'Uni task' };
};

export const actions: Actions = {
	text: action(({ params }, data) => {
		updateUniTaskField(Number(params.id), 'text', str(data, 'text', 'Task'));
	}),
	course: action(({ params }, data) => {
		updateUniTaskField(Number(params.id), 'course_id', int(data, 'course'));
	}),
	type: action(({ params }, data) => {
		updateUniTaskField(Number(params.id), 'type', oneOf(data, 'type', UNI_TYPES));
	}),
	due: action(({ params }, data) => {
		updateUniTaskField(Number(params.id), 'due', strOrNull(data, 'due'));
	}),
	prio: action(({ params }, data) => {
		updateUniTaskField(Number(params.id), 'prio', int(data, 'prio'));
	}),
	status: action(({ params }, data) => {
		updateUniTaskField(Number(params.id), 'status', oneOf(data, 'status', STATUSES));
	}),
	notes: action(({ params }, data) => {
		updateUniTaskField(Number(params.id), 'notes', strRaw(data, 'notes'));
	}),
	toggle: action(({ params }) => {
		toggleUniDone(Number(params.id));
	}),
	delete: action(({ params }) => {
		deleteUniTask(Number(params.id));
		throw redirect(303, '/uni?view=tasks');
	})
};
