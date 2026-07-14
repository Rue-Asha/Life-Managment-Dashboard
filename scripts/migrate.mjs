// Minimal forward-only migration runner over node:sqlite.
//
// Applies every migrations/*.sql not yet recorded in schema_migrations, each in
// a transaction, in filename order. Idempotent: re-running applies nothing.
// Plain .mjs (not .ts) so it runs under any Node >= 22 without a TS toolchain —
// the same `node` the deploy host uses to run `npm run db:migrate`.
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dbPath = process.env.DATABASE_PATH;
if (!dbPath) {
	console.error('DATABASE_PATH is not set');
	process.exit(1);
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');
db.exec(`
	CREATE TABLE IF NOT EXISTS schema_migrations (
		version TEXT PRIMARY KEY,
		applied_at TEXT NOT NULL DEFAULT (datetime('now'))
	);
`);

const applied = new Set(
	db.prepare('SELECT version FROM schema_migrations').all().map((row) => row.version)
);

const pending = readdirSync(migrationsDir)
	.filter((file) => file.endsWith('.sql'))
	.sort()
	.filter((file) => !applied.has(file));

for (const file of pending) {
	const sql = readFileSync(join(migrationsDir, file), 'utf8');
	db.exec('BEGIN');
	try {
		db.exec(sql);
		db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(file);
		db.exec('COMMIT');
		console.log(`applied ${file}`);
	} catch (err) {
		db.exec('ROLLBACK');
		console.error(`failed ${file}: ${err.message}`);
		process.exit(1);
	}
}

console.log(
	pending.length ? `migrations complete (${pending.length} applied)` : 'no pending migrations'
);
db.close();
