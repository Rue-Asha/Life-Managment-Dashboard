import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deleteCourse, getCourse, listUniTasks, listSemesters, toggleUniDone, updateCourseField } from '$lib/server/uni';
import { action, int, str, strRaw } from '$lib/server/forms';

export const load: PageServerLoad = ({ params }) => {
	const course = getCourse(Number(params.id));
	if (!course) throw error(404, 'Kurs nicht gefunden');
	const semester = listSemesters().find((s) => s.id === course.semester_id) ?? null;
	const tasks = listUniTasks().filter((t) => t.course_id === course.id);
	return { course, semester, tasks, pageTitle: course.name || 'Kurs' };
};

const FIELDS = ['name', 'code', 'docent', 'slot', 'ects', 'grade', 'notes'] as const;

export const actions: Actions = {
	name: action(({ params }, data) => {
		updateCourseField(Number(params.id), 'name', str(data, 'name', 'Kurs'));
	}),
	field: action(({ params }, data) => {
		const field = str(data, 'field') as (typeof FIELDS)[number];
		if (!FIELDS.includes(field) || field === 'name') return;
		updateCourseField(Number(params.id), field, strRaw(data, 'value'));
	}),
	hue: action(({ params }, data) => {
		updateCourseField(Number(params.id), 'hue', int(data, 'hue'));
	}),
	toggleTask: action((_e, data) => {
		toggleUniDone(int(data, 'id'));
	}),
	delete: action(({ params }) => {
		deleteCourse(Number(params.id));
		throw redirect(303, '/uni');
	})
};
