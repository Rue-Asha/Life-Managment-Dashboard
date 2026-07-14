import { listAccounts, createAccount, upsertSnapshot } from '$lib/server/finance/accounts';
import { action, str, strOrNull, oneOf, checkbox } from '$lib/server/forms';
import { parseAmountToCents, todayIso } from '$lib/format';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { accounts: listAccounts(), today: todayIso() };
};

export const actions: Actions = {
	// Snapshot ritual: one date, one optional amount per account; empty fields
	// are simply skipped so a partial weekly update stays low-friction.
	snapshots: action((_event, data) => {
		const date = str(data, 'date', 'Datum');
		let saved = 0;
		for (const account of listAccounts()) {
			const raw = String(data.get(`balance_${account.id}`) ?? '').trim();
			if (!raw) continue;
			const cents = parseAmountToCents(raw);
			if (cents === null) continue;
			upsertSnapshot(account.id, date, cents);
			saved++;
		}
		if (saved === 0) {
			return { success: true };
		}
	}),

	create: action((_event, data) => {
		createAccount({
			name: str(data, 'name', 'Name'),
			type: oneOf(data, 'type', ['giro', 'tagesgeld', 'depot', 'other'] as const),
			role: oneOf(data, 'role', ['asset', 'liability'] as const),
			on_budget: checkbox(data, 'on_budget'),
			institution: strOrNull(data, 'institution')
		});
	})
};
