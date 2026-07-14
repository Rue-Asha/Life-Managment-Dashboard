import type { Actions, PageServerLoad } from './$types';
import {
	listAllClasses,
	listUniTasks,
	createUniTask,
	toggleUniDone,
	setUniWeek,
	setUniStatus,
	markRevised,
	deleteUniTask,
	type UniTaskFilter
} from '$lib/server/uni';
import {
	action,
	checkbox,
	int,
	intOrNull,
	oneOf,
	oneOfOrNull,
	str,
	strOrNull
} from '$lib/server/forms';
import {
	PRIORITIES,
	TASK_STATUSES,
	UNI_TASK_TYPES,
	type TaskStatus,
	type UniTaskType
} from '$lib/labels';

export const load: PageServerLoad = ({ url }) => {
	const filter: UniTaskFilter = {};
	const classRaw = url.searchParams.get('class');
	if (classRaw && Number.isInteger(Number(classRaw))) filter.classId = Number(classRaw);
	const typeRaw = url.searchParams.get('type');
	if (UNI_TASK_TYPES.includes(typeRaw as UniTaskType)) filter.taskType = typeRaw as UniTaskType;
	const statusRaw = url.searchParams.get('status');
	if (TASK_STATUSES.includes(statusRaw as TaskStatus)) filter.status = statusRaw as TaskStatus;
	return {
		tasks: listUniTasks(filter),
		allClasses: listAllClasses(),
		filter: {
			classId: filter.classId ?? null,
			taskType: filter.taskType ?? null,
			status: filter.status ?? null
		}
	};
};

export const actions: Actions = {
	createTask: action((_event, data) => {
		createUniTask({
			title: str(data, 'title', 'Titel'),
			classId: intOrNull(data, 'class_id'),
			taskType: oneOfOrNull(data, 'task_type', UNI_TASK_TYPES),
			priority: oneOfOrNull(data, 'priority', PRIORITIES),
			deadline: strOrNull(data, 'deadline'),
			thisWeek: checkbox(data, 'this_week')
		});
	}),
	toggle: action((_event, data) => {
		toggleUniDone(int(data, 'id'));
	}),
	week: action((_event, data) => {
		setUniWeek(int(data, 'id'), data.get('on') === '1');
	}),
	status: action((_event, data) => {
		setUniStatus(int(data, 'id'), oneOf(data, 'status', TASK_STATUSES));
	}),
	revise: action((_event, data) => {
		markRevised(int(data, 'id'));
	}),
	delete: action((_event, data) => {
		deleteUniTask(int(data, 'id'));
	})
};
