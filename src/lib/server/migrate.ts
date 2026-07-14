import type { DatabaseSync } from 'node:sqlite';

// Migration SQL is bundled into the server build at compile time, so it's
// available at runtime regardless of the process working directory. This lets
// the app self-migrate on startup (see getDb) instead of relying on a separate
// `npm run db:migrate` step that might target a different DATABASE_PATH.
const modules = import.meta.glob('../../../migrations/*.sql', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

interface VersionRow {
	version: string;
}

/**
 * Apply every bundled migrations/*.sql not yet recorded in schema_migrations,
 * each in a transaction, in filename order. Idempotent: re-running applies
 * nothing. Mirrors scripts/migrate.mjs but runs in-process against the live
 * connection, so a freshly-opened database always has the latest schema.
 */
export function runMigrations(db: DatabaseSync): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version TEXT PRIMARY KEY,
			applied_at TEXT NOT NULL DEFAULT (datetime('now'))
		);
	`);

	const applied = new Set(
		(db.prepare('SELECT version FROM schema_migrations').all() as unknown as VersionRow[]).map(
			(r) => r.version
		)
	);

	const files = Object.keys(modules)
		.map((path) => ({ name: path.split('/').pop() as string, sql: modules[path] }))
		.sort((a, b) => a.name.localeCompare(b.name));

	for (const { name, sql } of files) {
		if (applied.has(name)) continue;
		db.exec('BEGIN');
		try {
			db.exec(sql);
			db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(name);
			db.exec('COMMIT');
		} catch (err) {
			db.exec('ROLLBACK');
			throw err;
		}
	}
}
