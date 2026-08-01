import type { Actions, PageServerLoad } from './$types';
import {
	advanceProjectStatus,
	createProject,
	listProjects,
	listProjectTasks
} from '$lib/server/projects';
import { action, int, str, strOrNull } from '$lib/server/forms';

export const load: PageServerLoad = ({ url }) => {
	return {
		view: url.searchParams.get('view') === 'board' ? 'board' : 'tiles',
		projects: listProjects(),
		projectTasks: listProjectTasks()
	};
};

export const actions: Actions = {
	create: action((_e, data) => {
		createProject(str(data, 'name', 'Projekt'), strOrNull(data, 'stack') ?? 'TBD');
	}),
	advance: action((_e, data) => {
		advanceProjectStatus(int(data, 'id'));
	})
};
