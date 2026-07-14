import {
	listCategories,
	createCategory,
	updateCategory,
	deleteCategory
} from '$lib/server/finance/categories';
import { listAccounts } from '$lib/server/finance/accounts';
import { action, FormError, str, strOrNull, oneOf, int, intOrNull } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { categories: listCategories(), accounts: listAccounts() };
};

function categoryInput(data: FormData) {
	return {
		name: str(data, 'name', 'Name'),
		type: oneOf(data, 'type', ['income', 'fix', 'variable'] as const),
		icon: strOrNull(data, 'icon'),
		sort_order: intOrNull(data, 'sort_order') ?? 0,
		account_id: intOrNull(data, 'account_id')
	};
}

/** Map the UNIQUE(name) constraint to a friendly message (e.g. double submit). */
function withUniqueGuard(fn: () => void): void {
	try {
		fn();
	} catch (err) {
		if (err instanceof Error && err.message.includes('UNIQUE')) {
			throw new FormError('Eine Kategorie mit diesem Namen existiert bereits.');
		}
		throw err;
	}
}

export const actions: Actions = {
	create: action((_event, data) => {
		const input = categoryInput(data);
		withUniqueGuard(() => createCategory(input));
	}),

	update: action((_event, data) => {
		const id = int(data, 'id');
		const input = categoryInput(data);
		withUniqueGuard(() => updateCategory(id, input));
	}),

	delete: action((_event, data) => {
		const message = deleteCategory(int(data, 'id'));
		if (message) {
			throw new FormError(message);
		}
	})
};
