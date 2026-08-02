import type { Actions, PageServerLoad } from './$types';
import {
	clearSession,
	createCourse,
	createSemester,
	createUniTask,
	cycleUniType,
	deleteSemester,
	deleteUniTask,
	listCourses,
	listSemesters,
	listSession,
	listUniTasks,
	sweepSession,
	toggleSemesterArchived,
	toggleSession,
	toggleUniDone
} from '$lib/server/uni';
import { action, int, oneOf, str, strOrNull } from '$lib/server/forms';
import { UNI_TYPES } from '$lib/labels';
import { todayISO } from '$lib/format';

const VIEWS = ['courses', 'tasks', 'session'] as const;

export const load: PageServerLoad = ({ url }) => {
	const rawView = url.searchParams.get('view');
	const semesters = listSemesters();
	const rawSem = Number(url.searchParams.get('sem'));
	const fallback = [...semesters].reverse().find((s) => s.status === 'active') ?? semesters.at(-1);
	const sem = semesters.find((s) => s.id === rawSem) ?? fallback ?? null;
	const rawCourse = url.searchParams.get('course');

	return {
		view: VIEWS.includes(rawView as (typeof VIEWS)[number]) ? rawView : 'courses',
		semesters,
		semId: sem?.id ?? null,
		showArchived: url.searchParams.get('archive') === '1',
		courseFilter: rawCourse && rawCourse !== 'all' ? Number(rawCourse) : null,
		courses: listCourses(),
		uniTasks: listUniTasks(),
		session: listSession(),
		today: todayISO()
	};
};

export const actions: Actions = {
	addSemester: action((_e, data) => {
		createSemester(str(data, 'name', 'Semester'));
	}),
	archiveSemester: action((_e, data) => {
		toggleSemesterArchived(int(data, 'id'));
	}),
	deleteSemester: action((_e, data) => {
		deleteSemester(int(data, 'id'));
	}),
	addCourse: action((_e, data) => {
		createCourse(int(data, 'sem'), str(data, 'name', 'Course'), strOrNull(data, 'code') ?? '');
	}),
	addTask: action((_e, data) => {
		createUniTask({
			courseId: int(data, 'course'),
			text: str(data, 'text', 'Task'),
			due: strOrNull(data, 'due'),
			prio: int(data, 'prio'),
			type: oneOf(data, 'type', UNI_TYPES)
		});
	}),
	toggle: action((_e, data) => {
		toggleUniDone(int(data, 'id'));
	}),
	type: action((_e, data) => {
		cycleUniType(int(data, 'id'));
	}),
	delete: action((_e, data) => {
		deleteUniTask(int(data, 'id'));
	}),
	session: action((_e, data) => {
		toggleSession(int(data, 'id'), todayISO());
	}),
	clearSession: action(() => {
		clearSession();
	}),
	sweepSession: action(() => {
		sweepSession();
	})
};
