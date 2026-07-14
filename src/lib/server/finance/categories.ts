import { getDb } from '../db';
import type { Category } from '$lib/finance/types';

export function listCategories(): Category[] {
	return getDb()
		.prepare('SELECT * FROM categories ORDER BY sort_order, name')
		.all() as unknown as Category[];
}

export function createCategory(c: Omit<Category, 'id'>): void {
	getDb()
		.prepare(
			'INSERT INTO categories (name, type, icon, sort_order, account_id) VALUES (?, ?, ?, ?, ?)'
		)
		.run(c.name, c.type, c.icon, c.sort_order, c.account_id);
}

export function updateCategory(id: number, c: Omit<Category, 'id'>): void {
	getDb()
		.prepare(
			'UPDATE categories SET name = ?, type = ?, icon = ?, sort_order = ?, account_id = ? WHERE id = ?'
		)
		.run(c.name, c.type, c.icon, c.sort_order, c.account_id, id);
}

/**
 * Delete a category unless real data still references it. Empty budget rows
 * (planned 0, no actual) are just the auto-created month scaffolding from
 * ensureMonth — they carry no information and are removed along the way,
 * otherwise every category would be undeletable after one visit to /budget.
 * Returns null on success or a German error message naming the blocker.
 */
export function deleteCategory(id: number): string | null {
	const db = getDb();
	const obligations = (
		db
			.prepare('SELECT COUNT(*) AS n FROM obligations WHERE category_id = ?')
			.get(id) as unknown as { n: number }
	).n;
	if (obligations > 0) {
		return `Kategorie wird noch von ${obligations} Fixkosten-Posten verwendet.`;
	}
	db.prepare('DELETE FROM budget WHERE category_id = ? AND actual_cents IS NULL').run(id);
	const budgetRows = (
		db.prepare('SELECT COUNT(*) AS n FROM budget WHERE category_id = ?').get(id) as unknown as {
			n: number;
		}
	).n;
	if (budgetRows > 0) {
		return `Kategorie hat noch Budget-Daten in ${budgetRows} Monat(en). Erst dort Plan/Ist leeren.`;
	}
	db.prepare('DELETE FROM categories WHERE id = ?').run(id);
	return null;
}
