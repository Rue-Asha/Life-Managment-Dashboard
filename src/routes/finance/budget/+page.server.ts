import {
	ensureMonth,
	listBudget,
	updateBudgetRow,
	updateMonth,
	monthSummary
} from '$lib/server/finance/budget';
import { crossCheck } from '$lib/server/finance/networth';
import { listObligations, onceDueInMonth } from '$lib/server/finance/obligations';
import { listGoals, bookMonthlyContributions } from '$lib/server/finance/goals';
import { action, amountCentsOrNull, str } from '$lib/server/forms';
import { addMonths, currentMonth } from '$lib/format';
import type { Actions, PageServerLoad } from './$types';

function monthParam(url: URL): string {
	const m = url.searchParams.get('month');
	return m && /^\d{4}-\d{2}$/.test(m) ? m : currentMonth();
}

export const load: PageServerLoad = ({ url }) => {
	const month = monthParam(url);
	ensureMonth(month);
	return {
		month,
		prevMonth: addMonths(month, -1),
		nextMonth: addMonths(month, 1),
		currentMonth: currentMonth(),
		rows: listBudget(month),
		summary: monthSummary(month),
		crossCheck: crossCheck(month),
		savingGoals: listGoals().filter((g) => g.monthly_rate_cents > 0),
		fixItems: listObligations().filter(
			(o) => o.active === 1 && o.cadence !== 'once' && o.monthly_load_cents > 0
		),
		onceItems: onceDueInMonth(month)
	};
};

export const actions: Actions = {
	// One form for the whole waterfall: income pair + actual_<id> per row.
	save: action((_event, data) => {
		const month = str(data, 'month', 'Monat');
		updateMonth(
			month,
			amountCentsOrNull(data, 'expected_income'),
			amountCentsOrNull(data, 'income')
		);
		for (const row of listBudget(month)) {
			updateBudgetRow(row.id, amountCentsOrNull(data, `actual_${row.id}`));
		}
		// Book the savings rates onto the goals (idempotent per month).
		bookMonthlyContributions(month);
	})
};
