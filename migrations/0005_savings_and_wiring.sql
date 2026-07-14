-- Savings rates per goal + category/obligation → account wiring.

ALTER TABLE savings_goals ADD COLUMN monthly_rate_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE categories ADD COLUMN account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE obligations ADD COLUMN account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL;

-- Ledger of booked monthly savings contributions. UNIQUE(month, goal_id)
-- makes booking idempotent: saving a month twice reconciles instead of
-- double-booking.
CREATE TABLE goal_contributions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	month TEXT NOT NULL,
	goal_id INTEGER NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
	cents INTEGER NOT NULL,
	UNIQUE (month, goal_id)
);
