import { getDb } from '../db';
import { adjustAccountBalance } from './accounts';
import type { SavingsGoal } from '$lib/finance/types';

function getGoal(id: number): SavingsGoal | undefined {
	return getDb().prepare('SELECT * FROM savings_goals WHERE id = ?').get(id) as unknown as
		| SavingsGoal
		| undefined;
}

export function listGoals(): SavingsGoal[] {
	return getDb()
		.prepare('SELECT * FROM savings_goals ORDER BY due_date IS NULL, due_date, id')
		.all() as unknown as SavingsGoal[];
}

export interface GoalInput {
	name: string;
	type: 'ruecklage' | 'sparziel';
	target_amount_cents: number;
	current_amount_cents: number;
	due_date: string | null;
	account_id: number | null;
	monthly_rate_cents: number;
}

export function createGoal(g: GoalInput): void {
	getDb()
		.prepare(
			`INSERT INTO savings_goals
			 (name, type, target_amount_cents, current_amount_cents, due_date, account_id,
			  monthly_rate_cents, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, date('now'))`
		)
		.run(
			g.name,
			g.type,
			g.target_amount_cents,
			g.current_amount_cents,
			g.due_date,
			g.account_id,
			g.monthly_rate_cents
		);
}

export function updateGoal(id: number, g: GoalInput): void {
	const before = getGoal(id);
	getDb()
		.prepare(
			`UPDATE savings_goals SET name = ?, type = ?, target_amount_cents = ?,
			 current_amount_cents = ?, due_date = ?, account_id = ?, monthly_rate_cents = ?,
			 updated_at = date('now')
			 WHERE id = ?`
		)
		.run(
			g.name,
			g.type,
			g.target_amount_cents,
			g.current_amount_cents,
			g.due_date,
			g.account_id,
			g.monthly_rate_cents,
			id
		);
	// The money's location follows the goal: mirror the amount change onto the
	// linked account — but only when the account itself didn't change, so
	// re-homing a goal never fabricates a balance movement.
	if (before && g.account_id !== null && before.account_id === g.account_id) {
		adjustAccountBalance(g.account_id, g.current_amount_cents - before.current_amount_cents);
	}
}

/**
 * Book this month's savings rates onto the goals. Idempotent via the
 * goal_contributions ledger: re-saving reconciles the delta (also when a
 * rate changed since the last save) instead of double-booking.
 */
export function bookMonthlyContributions(month: string): void {
	const db = getDb();
	for (const g of listGoals()) {
		const row = db
			.prepare('SELECT cents FROM goal_contributions WHERE month = ? AND goal_id = ?')
			.get(month, g.id) as unknown as { cents: number } | undefined;
		const old = row?.cents ?? 0;
		const target = g.monthly_rate_cents;
		if (row === undefined && target === 0) continue;
		if (old === target) continue;
		db.prepare(
			`INSERT INTO goal_contributions (month, goal_id, cents) VALUES (?, ?, ?)
			 ON CONFLICT (month, goal_id) DO UPDATE SET cents = excluded.cents`
		).run(month, g.id, target);
		db.prepare(
			`UPDATE savings_goals SET current_amount_cents = current_amount_cents + ?,
			 updated_at = date('now') WHERE id = ?`
		).run(target - old, g.id);
		// Mirror the booked contribution onto the account the goal lives on.
		if (g.account_id !== null) {
			adjustAccountBalance(g.account_id, target - old);
		}
	}
}

/** Booked savings total for a month; null when nothing was booked yet. */
export function bookedSavingsCents(month: string): number | null {
	const row = getDb()
		.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(cents), 0) AS s FROM goal_contributions WHERE month = ?')
		.get(month) as unknown as { n: number; s: number };
	return row.n > 0 ? row.s : null;
}

/** Sum of all current monthly rates (the planned Sparen line). */
export function plannedSavingsCents(): number {
	return (
		getDb()
			.prepare('SELECT COALESCE(SUM(monthly_rate_cents), 0) AS s FROM savings_goals')
			.get() as unknown as { s: number }
	).s;
}

/** Quick update used by the monthly ritual: only the current amount changes. */
export function updateGoalAmount(id: number, currentAmountCents: number): void {
	const before = getGoal(id);
	getDb()
		.prepare(
			`UPDATE savings_goals SET current_amount_cents = ?, updated_at = date('now') WHERE id = ?`
		)
		.run(currentAmountCents, id);
	if (before?.account_id != null) {
		adjustAccountBalance(before.account_id, currentAmountCents - before.current_amount_cents);
	}
}

export function deleteGoal(id: number): void {
	getDb().prepare('DELETE FROM savings_goals WHERE id = ?').run(id);
}
