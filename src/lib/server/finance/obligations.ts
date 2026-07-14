import { getDb } from '../db';
import type { Cadence, Obligation, ObligationView } from '$lib/finance/types';

export function monthlyLoadCents(amountCents: number, cadence: Cadence): number {
	switch (cadence) {
		case 'once':
			// One-time costs are not part of the recurring monthly base load.
			return 0;
		case 'monthly':
			return amountCents;
		case 'quarterly':
			return Math.round(amountCents / 3);
		case 'yearly':
			return Math.round(amountCents / 12);
	}
}

function withView(o: Obligation & { category_name: string }): ObligationView {
	return { ...o, monthly_load_cents: monthlyLoadCents(o.amount_cents, o.cadence) };
}

export function listObligations(): ObligationView[] {
	const rows = getDb()
		.prepare(
			`SELECT o.*, c.name AS category_name
			 FROM obligations o JOIN categories c ON c.id = o.category_id
			 ORDER BY o.active DESC, o.next_due`
		)
		.all() as unknown as (Obligation & { category_name: string })[];
	return rows.map(withView);
}

/** Sum of monthly_load over all active obligations = monatliche Grundlast. */
export function totalMonthlyLoadCents(): number {
	return listObligations()
		.filter((o) => o.active)
		.reduce((sum, o) => sum + o.monthly_load_cents, 0);
}

/** Monthly load per category (only active), used to prefill fix budget rows. */
export function monthlyLoadByCategory(): Map<number, number> {
	const map = new Map<number, number>();
	for (const o of listObligations()) {
		if (!o.active) continue;
		map.set(o.category_id, (map.get(o.category_id) ?? 0) + o.monthly_load_cents);
	}
	return map;
}

/** Active obligations due within the next `days` days (or overdue). */
export function upcomingObligations(days = 30): ObligationView[] {
	const limit = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
	return listObligations().filter((o) => o.active && o.next_due <= limit);
}

/**
 * One-time costs falling due in the given month (YYYY-MM). Deliberately
 * ignores `active`: paying a once item deactivates it, but it still belongs
 * to that month's costs. A cancelled one-time cost should be deleted.
 */
export function onceDueInMonth(month: string): ObligationView[] {
	const rows = getDb()
		.prepare(
			`SELECT o.*, c.name AS category_name
			 FROM obligations o JOIN categories c ON c.id = o.category_id
			 WHERE o.cadence = 'once' AND substr(o.next_due, 1, 7) = ?
			 ORDER BY o.next_due`
		)
		.all(month) as unknown as (Obligation & { category_name: string })[];
	return rows.map(withView);
}

/** Open installment debt = liability side of net worth (spec §4). */
export function openInstallmentDebtCents(): number {
	const row = getDb()
		.prepare(
			`SELECT COALESCE(SUM(remaining_balance_cents), 0) AS debt
			 FROM obligations WHERE type = 'installment' AND active = 1`
		)
		.get() as unknown as { debt: number };
	return row.debt;
}

export interface ObligationInput {
	name: string;
	amount_cents: number;
	cadence: Cadence;
	category_id: number;
	next_due: string;
	type: 'ongoing' | 'installment';
	active: number;
	total_amount_cents: number | null;
	remaining_balance_cents: number | null;
	end_date: string | null;
	account_id: number | null;
}

export function createObligation(o: ObligationInput): void {
	getDb()
		.prepare(
			`INSERT INTO obligations
			 (name, amount_cents, cadence, category_id, next_due, type, active,
			  total_amount_cents, remaining_balance_cents, end_date, account_id)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			o.name,
			o.amount_cents,
			o.cadence,
			o.category_id,
			o.next_due,
			o.type,
			o.active,
			o.total_amount_cents,
			o.remaining_balance_cents,
			o.end_date,
			o.account_id
		);
}

export function updateObligation(id: number, o: ObligationInput): void {
	getDb()
		.prepare(
			`UPDATE obligations SET
			 name = ?, amount_cents = ?, cadence = ?, category_id = ?, next_due = ?, type = ?,
			 active = ?, total_amount_cents = ?, remaining_balance_cents = ?, end_date = ?,
			 account_id = ?
			 WHERE id = ?`
		)
		.run(
			o.name,
			o.amount_cents,
			o.cadence,
			o.category_id,
			o.next_due,
			o.type,
			o.active,
			o.total_amount_cents,
			o.remaining_balance_cents,
			o.end_date,
			o.account_id,
			id
		);
}

export interface AccountFlow {
	fixOutCents: number;
	variableCategoryNames: string[];
	savingsInCents: number;
}

/** Display wiring: what flows through each account per month (by assignment). */
export function accountFlows(): Map<number, AccountFlow> {
	const db = getDb();
	const map = new Map<number, AccountFlow>();
	const get = (id: number): AccountFlow => {
		let f = map.get(id);
		if (!f) {
			f = { fixOutCents: 0, variableCategoryNames: [], savingsInCents: 0 };
			map.set(id, f);
		}
		return f;
	};
	for (const o of listObligations()) {
		if (o.active && o.account_id !== null) {
			get(o.account_id).fixOutCents += o.monthly_load_cents;
		}
	}
	const categories = db
		.prepare("SELECT name, account_id FROM categories WHERE type = 'variable' AND account_id IS NOT NULL")
		.all() as unknown as { name: string; account_id: number }[];
	for (const c of categories) {
		get(c.account_id).variableCategoryNames.push(c.name);
	}
	const goals = db
		.prepare('SELECT account_id, monthly_rate_cents FROM savings_goals WHERE account_id IS NOT NULL')
		.all() as unknown as { account_id: number; monthly_rate_cents: number }[];
	for (const g of goals) {
		get(g.account_id).savingsInCents += g.monthly_rate_cents;
	}
	return map;
}

export function deleteObligation(id: number): void {
	getDb().prepare('DELETE FROM obligations WHERE id = ?').run(id);
}

function advanceDue(iso: string, cadence: Cadence): string {
	const d = new Date(iso + 'T00:00:00Z');
	const months = cadence === 'monthly' ? 1 : cadence === 'quarterly' ? 3 : 12;
	// Clamp to end of month when the day overflows (e.g. 31.01. + 1 Monat).
	const day = d.getUTCDate();
	d.setUTCDate(1);
	d.setUTCMonth(d.getUTCMonth() + months);
	const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
	d.setUTCDate(Math.min(day, lastDay));
	return d.toISOString().slice(0, 10);
}

/**
 * "Als bezahlt markieren": advance next_due by one cadence period; for
 * installments also reduce the remaining balance and deactivate at zero.
 * One-time costs (cadence 'once') are simply deactivated — paid is done.
 */
export function markObligationPaid(id: number): void {
	const db = getDb();
	const o = db.prepare('SELECT * FROM obligations WHERE id = ?').get(id) as unknown as
		| Obligation
		| undefined;
	if (!o) return;
	if (o.cadence === 'once') {
		db.prepare('UPDATE obligations SET active = 0 WHERE id = ?').run(id);
		return;
	}
	const nextDue = advanceDue(o.next_due, o.cadence);
	if (o.type === 'installment' && o.remaining_balance_cents !== null) {
		const remaining = Math.max(0, o.remaining_balance_cents - o.amount_cents);
		db.prepare(
			'UPDATE obligations SET next_due = ?, remaining_balance_cents = ?, active = ? WHERE id = ?'
		).run(nextDue, remaining, remaining > 0 ? 1 : 0, id);
	} else {
		db.prepare('UPDATE obligations SET next_due = ? WHERE id = ?').run(nextDue, id);
	}
}
