import {
	listObligations,
	createObligation,
	deleteObligation,
	markObligationPaid,
	totalMonthlyLoadCents,
	openInstallmentDebtCents
} from '$lib/server/finance/obligations';
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
import { todayIso } from '$lib/format';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return {
		obligations: listObligations(),
		categories: listCategories().filter((c) => c.type === 'fix'),
		accounts: listAccounts(),
		totalMonthlyLoadCents: totalMonthlyLoadCents(),
		openInstallmentDebtCents: openInstallmentDebtCents(),
		today: todayIso()
	};
};

export const actions: Actions = {
	create: action((_event, data) => {
		const type = oneOf(data, 'type', ['ongoing', 'installment'] as const);
		createObligation({
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

	markPaid: action((_event, data) => {
		markObligationPaid(int(data, 'id'));
	}),

	delete: action((_event, data) => {
		deleteObligation(int(data, 'id'));
	})
};
