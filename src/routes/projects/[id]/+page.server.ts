import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getProject, updateProject, touchProject, deleteProject } from '$lib/server/projects';
import { saveDocument, renderDocumentHtml } from '$lib/server/documents';
import { action, oneOf, oneOfOrNull, str, strOrNull } from '$lib/server/forms';
import { PRIORITIES, PROJECT_STATUSES, PROJECT_TYPES } from '$lib/labels';

export const load: PageServerLoad = ({ params }) => {
	const id = Number(params.id);
	const project = Number.isInteger(id) ? getProject(id) : null;
	if (!project) error(404, 'Projekt nicht gefunden');
	return { project, html: renderDocumentHtml(project.content) };
};

export const actions: Actions = {
	meta: action((event, data) => {
		updateProject(Number(event.params.id), {
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
	save: action((event, data) => {
		const project = getProject(Number(event.params.id));
		if (!project?.document_id) error(404, 'Dokument nicht gefunden');
		saveDocument(project.document_id, str(data, 'content', 'Inhalt'));
		touchProject(project.id);
	}),
	delete: (event) => {
		deleteProject(Number(event.params.id));
		redirect(303, '/projects');
	}
};
