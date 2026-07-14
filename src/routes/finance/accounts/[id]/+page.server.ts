import { error, redirect } from '@sveltejs/kit';
import {
	getAccount,
	updateAccount,
	deleteAccount,
	listSnapshots,
	upsertSnapshot,
	deleteSnapshot
} from '$lib/server/finance/accounts';
import { action, str, strOrNull, amountCents, oneOf, checkbox, int } from '$lib/server/forms';
import { todayIso } from '$lib/format';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const account = getAccount(Number(params.id));
	if (!account) {
		error(404, 'Konto nicht gefunden');
	}
	return { account, snapshots: listSnapshots(account.id), today: todayIso() };
};

export const actions: Actions = {
	update: action(({ params }, data) => {
		updateAccount(Number(params.id), {
			name: str(data, 'name', 'Name'),
			type: oneOf(data, 'type', ['giro', 'tagesgeld', 'depot', 'other'] as const),
			role: oneOf(data, 'role', ['asset', 'liability'] as const),
			on_budget: checkbox(data, 'on_budget'),
			institution: strOrNull(data, 'institution')
		});
	}),

	delete: async ({ params }) => {
		deleteAccount(Number(params.id));
		redirect(303, '/finance/accounts');
	},

	addSnapshot: action(({ params }, data) => {
		upsertSnapshot(
			Number(params.id),
			str(data, 'date', 'Datum'),
			amountCents(data, 'balance', 'Kontostand')
		);
	}),

	deleteSnapshot: action((_event, data) => {
		deleteSnapshot(int(data, 'snapshot_id'));
	})
};
