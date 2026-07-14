import type { Actions, PageServerLoad } from './$types';
import {
	listSemesters,
	createSemester,
	setSemesterStatus,
	deleteSemester,
	listClasses,
	listAllClasses,
	createClass,
	uniListWeekOpen,
	uniListWeekDone,
	uniWeekStats,
	createUniTask,
	toggleUniDone,
	setUniWeek,
	deleteUniTask
} from '$lib/server/uni';
import {
	action,
	checkbox,
	int,
	intOrNull,
	numOrNull,
	oneOf,
	oneOfOrNull,
	str,
	strOrNull
} from '$lib/server/forms';
import { PRIORITIES, UNI_TASK_TYPES } from '$lib/labels';

export const load: PageServerLoad = ({ url }) => {
	const semesters = listSemesters();
	const requested = Number(url.searchParams.get('semester'));
	const selected =
		semesters.find((s) => s.id === requested) ??
		semesters.find((s) => s.status === 'active') ??
		semesters[0] ??
		null;
	return {
		semesters,
		selected: selected?.id ?? null,
		classes: selected ? listClasses(selected.id) : [],
		allClasses: listAllClasses(),
		weekOpen: uniListWeekOpen(),
		weekDone: uniListWeekDone(),
		stats: uniWeekStats()
	};
};

export const actions: Actions = {
	createSemester: action((_event, data) => {
		createSemester(str(data, 'name', 'Name'));
	}),
	semesterStatus: action((_event, data) => {
		setSemesterStatus(int(data, 'id'), oneOf(data, 'status', ['active', 'archived'] as const));
	}),
	deleteSemester: action((_event, data) => {
		deleteSemester(int(data, 'id'));
	}),
	createClass: action((_event, data) => {
		createClass(int(data, 'semester_id'), {
			name: str(data, 'name', 'Name'),
			professor: strOrNull(data, 'professor'),
			room: strOrNull(data, 'room'),
			schedule: strOrNull(data, 'schedule'),
			cps: numOrNull(data, 'cps', 'CPs'),
			examDate: strOrNull(data, 'exam_date'),
			archiveUrl: strOrNull(data, 'archive_url')
		});
	}),
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
	delete: action((_event, data) => {
		deleteUniTask(int(data, 'id'));
	})
};
