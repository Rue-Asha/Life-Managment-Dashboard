import type { Actions, PageServerLoad } from './$types';
import {
	listAllClasses,
	listUniTasks,
	toggleUniDone,
	setUniWeek,
	setUniStatus,
	markRevised,
	deleteUniTask,
	type UniTaskFilter
} from '$lib/server/uni';
import { action, int, oneOf } from '$lib/server/forms';
import {
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
