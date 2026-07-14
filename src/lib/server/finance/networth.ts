import { getDb } from '../db';
import { openInstallmentDebtCents } from './obligations';
import { monthSummary } from './budget';
import { addMonths, currentMonth, todayIso } from '$lib/format';
import type { Account, NetWorthPoint } from '$lib/finance/types';

interface SnapshotJoin {
	account_id: number;
	date: string;
	balance_cents: number;
	role: 'asset' | 'liability';
	type: string;
}

function allSnapshots(): SnapshotJoin[] {
	return getDb()
		.prepare(
			`SELECT s.account_id, s.date, s.balance_cents, a.role, a.type
			 FROM balance_snapshots s JOIN accounts a ON a.id = s.account_id
			 ORDER BY s.date, s.id`
		)
		.all() as unknown as SnapshotJoin[];
}

const sign = (role: 'asset' | 'liability') => (role === 'asset' ? 1 : -1);

/**
 * Net worth over accounts per snapshot date: for every distinct date, each
 * account contributes its most recent snapshot at/before that date
 * (assets positive, liabilities negative). Open installment debt has no
 * history and is only subtracted from the *current* figure, not the series.
 */
export function accountNetSeries(): NetWorthPoint[] {
	const balances = new Map<number, number>();
	const points: NetWorthPoint[] = [];
	let current = 0;
	for (const s of allSnapshots()) {
		const value = s.balance_cents * sign(s.role);
		current += value - (balances.get(s.account_id) ?? 0);
		balances.set(s.account_id, value);
		const last = points[points.length - 1];
		if (last && last.date === s.date) {
			last.cents = current;
		} else {
			points.push({ date: s.date, cents: current });
		}
	}
	return points;
}

/** Account net at a cut-off date; optionally without depot accounts. */
export function accountNetAt(dateIso: string, opts: { excludeDepot?: boolean } = {}): number | null {
	const balances = new Map<number, number>();
	let seen = false;
	for (const s of allSnapshots()) {
		if (s.date > dateIso) break;
		if (opts.excludeDepot && s.type === 'depot') continue;
		balances.set(s.account_id, s.balance_cents * sign(s.role));
		seen = true;
	}
	if (!seen) return null;
	let sum = 0;
	for (const v of balances.values()) sum += v;
	return sum;
}

export interface NetWorthNow {
	accountNetCents: number;
	installmentDebtCents: number;
	netWorthCents: number;
}

export function netWorthNow(): NetWorthNow {
	const series = accountNetSeries();
	const accountNet = series.length ? series[series.length - 1].cents : 0;
	const debt = openInstallmentDebtCents();
	return {
		accountNetCents: accountNet,
		installmentDebtCents: debt,
		netWorthCents: accountNet - debt
	};
}

export function listAccountsRaw(): Account[] {
	return getDb().prepare('SELECT * FROM accounts ORDER BY id').all() as unknown as Account[];
}

function lastDayOfMonth(month: string): string {
	const [y, m] = month.split('-').map(Number);
	return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

export interface CrossCheck {
	month: string;
	savedCents: number | null;
	/** Change of non-depot account net over the month; null if snapshots are missing. */
	netChangeCents: number | null;
	diffCents: number | null;
	flagged: boolean;
}

/** Threshold above which the cross-check difference is visually flagged. */
export const CROSS_CHECK_THRESHOLD_CENTS = 5_000;

/**
 * Spec §5: monthly saved (budget) ≈ net-worth change over the same month,
 * cleaned of depot market movement (depot accounts are excluded entirely —
 * their fluctuation is not savings). Uses snapshots at the month boundaries;
 * for the running month, "now" is the end boundary.
 */
export function crossCheck(month: string): CrossCheck {
	const summary = monthSummary(month);
	const startBoundary = lastDayOfMonth(addMonths(month, -1));
	const endBoundary = month === currentMonth() ? todayIso() : lastDayOfMonth(month);
	const start = accountNetAt(startBoundary, { excludeDepot: true });
	const end = accountNetAt(endBoundary, { excludeDepot: true });
	const netChange = start === null || end === null ? null : end - start;
	const diff =
		netChange === null || summary.savedCents === null ? null : summary.savedCents - netChange;
	return {
		month,
		savedCents: summary.savedCents,
		netChangeCents: netChange,
		diffCents: diff,
		flagged: diff !== null && Math.abs(diff) > CROSS_CHECK_THRESHOLD_CENTS
	};
}
