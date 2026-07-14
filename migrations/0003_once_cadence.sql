-- Allow one-time future costs: cadence gains 'once'. SQLite cannot alter a
-- CHECK constraint in place, so the table is rebuilt (nothing references it).
CREATE TABLE obligations_new (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	amount_cents INTEGER NOT NULL,
	cadence TEXT NOT NULL CHECK (cadence IN ('once', 'monthly', 'quarterly', 'yearly')),
	category_id INTEGER NOT NULL REFERENCES categories(id),
	next_due TEXT NOT NULL,
	type TEXT NOT NULL DEFAULT 'ongoing' CHECK (type IN ('ongoing', 'installment')),
	active INTEGER NOT NULL DEFAULT 1,
	total_amount_cents INTEGER,
	remaining_balance_cents INTEGER,
	end_date TEXT
);

INSERT INTO obligations_new (id, name, amount_cents, cadence, category_id, next_due,
	type, active, total_amount_cents, remaining_balance_cents, end_date)
SELECT id, name, amount_cents, cadence, category_id, next_due,
	type, active, total_amount_cents, remaining_balance_cents, end_date
FROM obligations;

DROP TABLE obligations;
ALTER TABLE obligations_new RENAME TO obligations;
