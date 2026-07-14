import type { Actions, PageServerLoad } from './$types';
import {
	listProjects,
	createProject,
	setProjectStatus,
	deleteProject
} from '$lib/server/projects';
import { action, int, oneOf, oneOfOrNull, str, strOrNull } from '$lib/server/forms';
import {
	PRIORITIES,
	PROJECT_STATUSES,
	PROJECT_TYPES,
	PROJECT_VIEWS,
	type ProjectView
} from '$lib/labels';

const VIEW_COOKIE = 'projects_view';

export const load: PageServerLoad = ({ url, cookies }) => {
	const param = url.searchParams.get('view');
	let view: ProjectView = 'grid';
	if (PROJECT_VIEWS.includes(param as ProjectView)) {
		view = param as ProjectView;
		// The chosen view is the user's preference — persist it (spec §4.4).
		cookies.set(VIEW_COOKIE, view, { path: '/', maxAge: 60 * 60 * 24 * 365 });
	} else {
		const saved = cookies.get(VIEW_COOKIE);
		if (PROJECT_VIEWS.includes(saved as ProjectView)) view = saved as ProjectView;
	}
	return { view, projects: listProjects() };
};

export const actions: Actions = {
	create: action((_event, data) => {
		createProject({
			name: str(data, 'name', 'Name'),
			description: strOrNull(data, 'description'),
			type: oneOf(data, 'type', PROJECT_TYPES),
			status: oneOf(data, 'status', PROJECT_STATUSES),
			priority: oneOfOrNull(data, 'priority', PRIORITIES),
			techStack: strOrNull(data, 'tech_stack'),
			link: strOrNull(data, 'link'),
			startDate: strOrNull(data, 'start_date')
		});
	}),
	status: action((_event, data) => {
		setProjectStatus(int(data, 'id'), oneOf(data, 'status', PROJECT_STATUSES));
	}),
	delete: action((_event, data) => {
		deleteProject(int(data, 'id'));
	})
};
