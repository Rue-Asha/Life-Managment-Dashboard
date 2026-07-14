import { getDb } from '../db';
import type { Account, AccountWithBalance, Snapshot } from '$lib/finance/types';

export function listAccounts(): AccountWithBalance[] {
	return getDb()
		.prepare(
			`SELECT a.*, s.balance_cents AS latest_balance_cents, s.date AS latest_date,
			        (SELECT COUNT(*) FROM balance_snapshots b WHERE b.account_id = a.id) AS snapshot_count
			 FROM accounts a
			 LEFT JOIN (
			   SELECT account_id, balance_cents, date,
			          ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY date DESC, id DESC) AS rn
			   FROM balance_snapshots
			 ) s ON s.account_id = a.id AND s.rn = 1
			 ORDER BY a.on_budget DESC, a.id`
		)
		.all() as unknown as AccountWithBalance[];
}

export function getAccount(id: number): Account | undefined {
	return getDb().prepare('SELECT * FROM accounts WHERE id = ?').get(id) as unknown as
		| Account
		| undefined;
}

export function createAccount(a: Omit<Account, 'id' | 'currency'>): void {
	getDb()
		.prepare(
			`INSERT INTO accounts (name, type, role, on_budget, institution)
			 VALUES (?, ?, ?, ?, ?)`
		)
		.run(a.name, a.type, a.role, a.on_budget, a.institution);
}

export function updateAccount(id: number, a: Omit<Account, 'id' | 'currency'>): void {
	getDb()
		.prepare(
			`UPDATE accounts SET name = ?, type = ?, role = ?, on_budget = ?, institution = ?
			 WHERE id = ?`
		)
		.run(a.name, a.type, a.role, a.on_budget, a.institution, id);
}

export function deleteAccount(id: number): void {
	getDb().prepare('DELETE FROM accounts WHERE id = ?').run(id);
}

/** Insert or overwrite the snapshot for (account, date) — one value per day. */
export function upsertSnapshot(accountId: number, date: string, balanceCents: number): void {
	getDb()
		.prepare(
			`INSERT INTO balance_snapshots (account_id, date, balance_cents)
			 VALUES (?, ?, ?)
			 ON CONFLICT (account_id, date) DO UPDATE SET balance_cents = excluded.balance_cents`
		)
		.run(accountId, date, balanceCents);
}

export function listSnapshots(accountId: number, limit = 50): Snapshot[] {
	return getDb()
		.prepare(
			`SELECT * FROM balance_snapshots WHERE account_id = ?
			 ORDER BY date DESC, id DESC LIMIT ?`
		)
		.all(accountId, limit) as unknown as Snapshot[];
}

export function deleteSnapshot(id: number): void {
	getDb().prepare('DELETE FROM balance_snapshots WHERE id = ?').run(id);
}

/**
 * Apply a delta to an account by writing today's snapshot as latest-known
 * balance + delta. Used when savings-goal amounts change, so the money's
 * location follows automatically. Snapshots stay absolute values, so a
 * manually entered (real) balance later simply overwrites the estimate.
 */
export function adjustAccountBalance(accountId: number, deltaCents: number): void {
	if (deltaCents === 0) return;
	const today = new Date().toISOString().slice(0, 10);
	const latest = getDb()
		.prepare(
			`SELECT balance_cents FROM balance_snapshots
			 WHERE account_id = ? AND date <= ? ORDER BY date DESC, id DESC LIMIT 1`
		)
		.get(accountId, today) as unknown as { balance_cents: number } | undefined;
	upsertSnapshot(accountId, today, (latest?.balance_cents ?? 0) + deltaCents);
}
