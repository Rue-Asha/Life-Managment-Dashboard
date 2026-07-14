-- Core schema. All money amounts are stored as integer cents (EUR) to avoid
-- floating-point rounding; dates are ISO strings (YYYY-MM-DD), months YYYY-MM.

CREATE TABLE categories (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL UNIQUE,
	type TEXT NOT NULL CHECK (type IN ('income', 'fix', 'variable')),
	icon TEXT,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE accounts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL UNIQUE,
	type TEXT NOT NULL CHECK (type IN ('giro', 'tagesgeld', 'depot', 'other')),
	role TEXT NOT NULL DEFAULT 'asset' CHECK (role IN ('asset', 'liability')),
	on_budget INTEGER NOT NULL DEFAULT 1,
	institution TEXT,
	currency TEXT NOT NULL DEFAULT 'EUR'
);

CREATE TABLE balance_snapshots (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
	date TEXT NOT NULL,
	balance_cents INTEGER NOT NULL,
	UNIQUE (account_id, date)
);
CREATE INDEX idx_snapshots_account_date ON balance_snapshots(account_id, date);

CREATE TABLE obligations (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	amount_cents INTEGER NOT NULL,
	cadence TEXT NOT NULL CHECK (cadence IN ('monthly', 'quarterly', 'yearly')),
	category_id INTEGER NOT NULL REFERENCES categories(id),
	next_due TEXT NOT NULL,
	type TEXT NOT NULL DEFAULT 'ongoing' CHECK (type IN ('ongoing', 'installment')),
	active INTEGER NOT NULL DEFAULT 1,
	total_amount_cents INTEGER,
	remaining_balance_cents INTEGER,
	end_date TEXT
);

CREATE TABLE savings_goals (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	type TEXT NOT NULL DEFAULT 'sparziel' CHECK (type IN ('ruecklage', 'sparziel')),
	target_amount_cents INTEGER NOT NULL,
	current_amount_cents INTEGER NOT NULL DEFAULT 0,
	due_date TEXT,
	account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
	updated_at TEXT NOT NULL DEFAULT (date('now'))
);

CREATE TABLE budget (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	month TEXT NOT NULL,
	category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
	planned_cents INTEGER NOT NULL DEFAULT 0,
	actual_cents INTEGER,
	UNIQUE (month, category_id)
);
CREATE INDEX idx_budget_month ON budget(month);
