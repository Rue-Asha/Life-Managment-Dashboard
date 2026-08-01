import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	addProjectTask,
	deleteProject,
	deleteProjectTask,
	getProject,
	listProjectTasks,
	toggleProjectTask,
	updateProjectField
} from '$lib/server/projects';
import { action, int, oneOf, str, strRaw } from '$lib/server/forms';
import { PROJECT_STATUSES } from '$lib/labels';

export const load: PageServerLoad = ({ params }) => {
	const project = getProject(Number(params.id));
	if (!project) throw error(404, 'Projekt nicht gefunden');
	const tasks = listProjectTasks().filter((t) => t.project_id === project.id);
	return { project, tasks, pageTitle: project.name || 'Projekt' };
};

export const actions: Actions = {
	name: action(({ params }, data) => {
		updateProjectField(Number(params.id), 'name', str(data, 'name', 'Name'));
	}),
	stack: action(({ params }, data) => {
		updateProjectField(Number(params.id), 'stack', strRaw(data, 'stack'));
	}),
	status: action(({ params }, data) => {
		updateProjectField(Number(params.id), 'status', oneOf(data, 'status', PROJECT_STATUSES));
	}),
	repo: action(({ params }, data) => {
		updateProjectField(Number(params.id), 'repo', strRaw(data, 'repo'));
	}),
	notes: action(({ params }, data) => {
		updateProjectField(Number(params.id), 'notes', strRaw(data, 'notes'));
	}),
	addTask: action(({ params }, data) => {
		addProjectTask(Number(params.id), str(data, 'text', 'Schritt'));
	}),
	toggleTask: action((_e, data) => {
		toggleProjectTask(int(data, 'id'));
	}),
	deleteTask: action((_e, data) => {
		deleteProjectTask(int(data, 'id'));
	}),
	delete: action(({ params }) => {
		deleteProject(Number(params.id));
		throw redirect(303, '/projects');
	})
};
