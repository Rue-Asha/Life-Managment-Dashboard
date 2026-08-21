// CI assertion, not part of the app: does DATABASE_PATH actually contain every
// migration in migrations/?
//
// Both runners fail open. scripts/migrate.mjs reads an empty directory and
// prints "no pending migrations"; src/lib/server/migrate.ts globs a string
// literal, and Vite resolves a glob that matches nothing to zero modules
// without a build or type error. Either way the exit code is 0 and the
// database is empty. This turns that silence into a red build.
import { DatabaseSync } from 'node:sqlite';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dbPath = process.env.DATABASE_PATH;
if (!dbPath) {
	console.error('DATABASE_PATH is not set');
	process.exit(1);
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const expected = readdirSync(migrationsDir)
	.filter((file) => file.endsWith('.sql'))
	.sort();

if (!expected.length) {
	console.error(`no migrations found in ${migrationsDir}`);
	process.exit(1);
}

// Opened read-write on purpose: the app leaves the database in WAL mode, and a
// read-only handle cannot recover a hot WAL file.
const db = new DatabaseSync(dbPath);
let applied;
try {
	applied = new Set(
		db.prepare('SELECT version FROM schema_migrations').all().map((row) => row.version)
	);
} catch {
	console.error(`${dbPath} has no schema_migrations table — nothing migrated it`);
	process.exit(1);
} finally {
	db.close();
}

const missing = expected.filter((file) => !applied.has(file));
if (missing.length) {
	console.error(`${missing.length} migration(s) not applied to ${dbPath}:`);
	for (const file of missing) console.error(`  ${file}`);
	process.exit(1);
}

console.log(`all ${expected.length} migrations applied to ${dbPath}`);
