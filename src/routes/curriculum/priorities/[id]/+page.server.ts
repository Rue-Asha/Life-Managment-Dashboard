import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getPriority,
	updatePriority,
	listQuotasByPriority,
	listMiniByPriority
} from '$lib/server/curriculum';
import { action, str, strOrNull } from '$lib/server/forms';

export const load: PageServerLoad = ({ params }) => {
	const id = Number(params.id);
	const priority = Number.isInteger(id) ? getPriority(id) : null;
	if (!priority) error(404, 'Priorität nicht gefunden');
	return {
		priority,
		quotas: listQuotasByPriority(priority.id),
		minis: listMiniByPriority(priority.id)
	};
};

export const actions: Actions = {
	update: action((event, data) => {
		updatePriority(Number(event.params.id), {
			name: str(data, 'name', 'Name'),
			note: strOrNull(data, 'note'),
			description: strOrNull(data, 'description')
		});
	})
};
