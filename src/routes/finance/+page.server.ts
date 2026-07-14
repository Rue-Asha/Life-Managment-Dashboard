import { listAccounts } from '$lib/server/finance/accounts';
import { listObligations, upcomingObligations, accountFlows } from '$lib/server/finance/obligations';
import { listGoals } from '$lib/server/finance/goals';
import { ensureMonth, monthSummary } from '$lib/server/finance/budget';
import { accountNetSeries, netWorthNow, crossCheck } from '$lib/server/finance/networth';
import { currentMonth } from '$lib/format';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const month = currentMonth();
	ensureMonth(month);
	const accounts = listAccounts();

	// Deckung anstehender Zahlungen: alles Fällige der nächsten 90 Tage gegen
	// die Rücklagen-Seite (Tagesgeld-Konten, dort liegen die Rücklagen).
	const upcoming90 = upcomingObligations(90);
	const due90Cents = upcoming90.reduce((sum, o) => sum + o.amount_cents, 0);
	const reserveCents = accounts
		.filter((a) => a.type === 'tagesgeld')
		.reduce((sum, a) => sum + (a.latest_balance_cents ?? 0), 0);

	return {
		month,
		netWorth: netWorthNow(),
		series: accountNetSeries(),
		accounts,
		upcoming: upcomingObligations(30),
		installments: listObligations().filter((o) => o.type === 'installment' && o.active === 1),
		goals: listGoals(),
		summary: monthSummary(month),
		// Map is not serializable across the wire; ship as a plain record.
		flows: Object.fromEntries(accountFlows()),
		crossCheck: crossCheck(month),
		coverage: {
			due90Cents,
			reserveCents,
			gapCents: due90Cents - reserveCents
		}
	};
};
