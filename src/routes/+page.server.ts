import type { Actions, PageServerLoad } from './$types';
import { listTasks, toggleDone } from '$lib/server/tasks';
import { listSemesters, listCourses, listUniTasks, listSession } from '$lib/server/uni';
import { listProjects, listProjectTasks } from '$lib/server/projects';
import { listNotes } from '$lib/server/notes';
import { action, int } from '$lib/server/forms';
import { todayISO } from '$lib/format';

export const load: PageServerLoad = () => {
	const today = todayISO();
	const tasks = listTasks();
	const semesters = listSemesters();
	const currentSem = [...semesters].reverse().find((s) => s.status === 'active') ?? null;
	const courses = listCourses();
	const semUniTasks = currentSem ? listUniTasks(currentSem.id) : [];
	const allUniTasks = listUniTasks();
	const sessionIds = new Set(listSession().map((s) => s.task_id));
	const projects = listProjects();
	const projectTasks = listProjectTasks();
	const notes = listNotes();

	return {
		stats: {
			openTasks: tasks.filter((t) => !t.done).length,
			uniOpen: semUniTasks.filter((t) => !t.done).length,
			semesterName: currentSem?.name ?? '—',
			activeProjects: projects.filter((p) => p.status === 'active').length,
			sessionOpen: allUniTasks.filter((t) => sessionIds.has(t.id) && !t.done).length
		},
		dayTodos: tasks.filter((t) => t.due === today || (t.due && t.due < today && !t.done)),
		deadlines: allUniTasks
			.filter((t) => !t.done && t.due)
			.sort((a, b) => ((a.due ?? '') < (b.due ?? '') ? -1 : 1))
			.slice(0, 4)
			.map((t) => {
				const c = courses.find((x) => x.id === t.course_id);
				return { id: t.id, text: t.text, due: t.due, course: c?.name ?? '—', hue: c?.hue ?? 0 };
			}),
		activeProjectRows: projects
			.filter((p) => p.status === 'active')
			.map((p) => {
				const ts = projectTasks.filter((t) => t.project_id === p.id);
				const done = ts.filter((t) => t.done).length;
				return {
					id: p.id,
					name: p.name,
					stack: p.stack,
					pct: ts.length ? Math.round((done / ts.length) * 100) : 0
				};
			}),
		recentNotes: notes.slice(0, 4).map((n) => ({
			id: n.id,
			title: n.title || 'Untitled',
			kind: n.kind,
			excerpt: n.body.replace(/\n/g, ' ').slice(0, 70)
		}))
	};
};

export const actions: Actions = {
	toggle: action((_event, data) => {
		toggleDone(int(data, 'id'));
	})
};
