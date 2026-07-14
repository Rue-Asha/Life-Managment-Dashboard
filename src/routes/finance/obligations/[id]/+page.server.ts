import { error, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { updateObligation, deleteObligation } from '$lib/server/finance/obligations';
import { listCategories } from '$lib/server/finance/categories';
import { listAccounts } from '$lib/server/finance/accounts';
import {
	action,
	str,
	strOrNull,
	amountCents,
	amountCentsOrNull,
	oneOf,
	checkbox,
	int,
	intOrNull
} from '$lib/server/forms';
import type { Obligation } from '$lib/finance/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const obligation = getDb()
		.prepare('SELECT * FROM obligations WHERE id = ?')
		.get(Number(params.id)) as unknown as Obligation | undefined;
	if (!obligation) {
		error(404, 'Posten nicht gefunden');
	}
	return {
		obligation,
		categories: listCategories().filter((c) => c.type === 'fix'),
		accounts: listAccounts()
	};
};

export const actions: Actions = {
	update: action(({ params }, data) => {
		const type = oneOf(data, 'type', ['ongoing', 'installment'] as const);
		updateObligation(Number(params.id), {
			name: str(data, 'name', 'Name'),
			amount_cents: amountCents(data, 'amount'),
			cadence: oneOf(data, 'cadence', ['once', 'monthly', 'quarterly', 'yearly'] as const),
			category_id: int(data, 'category_id'),
			next_due: str(data, 'next_due', 'Nächste Fälligkeit'),
			type,
			active: checkbox(data, 'active'),
			total_amount_cents: type === 'installment' ? amountCentsOrNull(data, 'total_amount') : null,
			remaining_balance_cents:
				type === 'installment' ? amountCentsOrNull(data, 'remaining_balance') : null,
			end_date: type === 'installment' ? strOrNull(data, 'end_date') : null,
			account_id: intOrNull(data, 'account_id')
		});
	}),

	delete: async ({ params }) => {
		deleteObligation(Number(params.id));
		redirect(303, '/finance/obligations');
	}
};
