import { DatabaseSync } from 'node:sqlite';
import { env } from '$env/dynamic/private';
import { runMigrations } from './migrate';

// Single shared connection for the server process. Opened lazily so the module
// can be imported without a database present (e.g. during build).
let db: DatabaseSync | undefined;

export function getDb(): DatabaseSync {
	if (!db) {
		const path = env.DATABASE_PATH;
		if (!path) {
			throw new Error('DATABASE_PATH is not set');
		}
		db = new DatabaseSync(path);
		db.exec('PRAGMA journal_mode = WAL;');
		db.exec('PRAGMA foreign_keys = ON;');
		// Self-migrate on first connection so the schema always matches the code,
		// regardless of whether `npm run db:migrate` was run against this path.
		runMigrations(db);
	}
	return db;
}
