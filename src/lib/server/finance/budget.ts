import { getDb } from '../db';
import { totalMonthlyLoadCents, onceDueInMonth } from './obligations';
import { bookedSavingsCents, plannedSavingsCents } from './goals';
import type { BudgetRowView, Category, MonthRow } from '$lib/finance/types';

/**
 * Waterfall month model (no plan columns): income is one manual pair
 * (expected + actual) per month, fixed costs derive from the obligations
 * registry, and only variable categories take an actual value.
 */
export function ensureMonth(month: string): void {
	const db = getDb();
	db.prepare('INSERT OR IGNORE INTO months (month) VALUES (?)').run(month);
	const categories = db
		.prepare("SELECT * FROM categories WHERE type = 'variable'")
		.all() as unknown as Category[];
	const insert = db.prepare(
		'INSERT OR IGNORE INTO budget (month, category_id, actual_cents) VALUES (?, ?, NULL)'
	);
	for (const c of categories) {
		insert.run(month, c.id);
	}
}

export function getMonth(month: string): MonthRow {
	return (getDb().prepare('SELECT * FROM months WHERE month = ?').get(month) as unknown as
		| MonthRow
		| undefined) ?? { month, expected_income_cents: null, income_cents: null };
}

export function updateMonth(
	month: string,
	expectedIncomeCents: number | null,
	incomeCents: number | null
): void {
	getDb()
		.prepare(
			`INSERT INTO months (month, expected_income_cents, income_cents) VALUES (?, ?, ?)
			 ON CONFLICT (month) DO UPDATE SET
			   expected_income_cents = excluded.expected_income_cents,
			   income_cents = excluded.income_cents`
		)
		.run(month, expectedIncomeCents, incomeCents);
}

/** Variable-category rows for the month (the only per-category entry left). */
export function listBudget(month: string): BudgetRowView[] {
	return getDb()
		.prepare(
			`SELECT b.*, c.name AS category_name, c.icon AS category_icon
			 FROM budget b JOIN categories c ON c.id = b.category_id
			 WHERE b.month = ?
			 ORDER BY c.sort_order, c.name`
		)
		.all(month) as unknown as BudgetRowView[];
}

export function updateBudgetRow(id: number, actualCents: number | null): void {
	getDb().prepare('UPDATE budget SET actual_cents = ? WHERE id = ?').run(actualCents, id);
}

export interface MonthSummary {
	month: string;
	expectedIncomeCents: number | null;
	incomeCents: number | null;
	/** Income used for the waterfall: Ist if entered, else the expectation. */
	effectiveIncomeCents: number | null;
	/** Monthly base load from the obligations registry (today's registry state). */
	fixLoadCents: number;
	/** One-time costs falling due in this month. */
	onceDueCents: number;
	/** fixLoad + onceDue — the month's full fixed side. */
	fixTotalCents: number;
	/** Savings allocation: booked contributions if the month was saved, else the current rates. */
	savingsCents: number;
	savingsBooked: boolean;
	variableActualCents: number;
	/** effectiveIncome − fixLoad − savings; null until any income figure exists. */
	availableCents: number | null;
	/** available − variable actuals. */
	remainingCents: number | null;
	/** incomeIst − fixLoad − variable actuals; null until the Ist is entered. */
	savedCents: number | null;
	/** saved / incomeIst as a fraction (0.23 = 23 %). */
	savingsRate: number | null;
	hasActuals: boolean;
}

export function monthSummary(month: string): MonthSummary {
	const m = getMonth(month);
	const rows = listBudget(month);
	const fixLoad = totalMonthlyLoadCents();
	let variable = 0;
	let hasVariableActuals = false;
	for (const r of rows) {
		if (r.actual_cents !== null) {
			variable += r.actual_cents;
			hasVariableActuals = true;
		}
	}
	const once = onceDueInMonth(month).reduce((s, o) => s + o.amount_cents, 0);
	const fixTotal = fixLoad + once;
	const booked = bookedSavingsCents(month);
	const savings = booked ?? plannedSavingsCents();
	const effectiveIncome = m.income_cents ?? m.expected_income_cents;
	const available = effectiveIncome === null ? null : effectiveIncome - fixTotal - savings;
	const saved = m.income_cents === null ? null : m.income_cents - fixTotal - variable;
	return {
		month,
		expectedIncomeCents: m.expected_income_cents,
		incomeCents: m.income_cents,
		effectiveIncomeCents: effectiveIncome,
		fixLoadCents: fixLoad,
		onceDueCents: once,
		fixTotalCents: fixTotal,
		savingsCents: savings,
		savingsBooked: booked !== null,
		variableActualCents: variable,
		availableCents: available,
		remainingCents: available === null ? null : available - variable,
		savedCents: saved,
		savingsRate:
			saved !== null && m.income_cents !== null && m.income_cents > 0
				? saved / m.income_cents
				: null,
		hasActuals: hasVariableActuals || m.income_cents !== null
	};
}
