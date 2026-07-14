-- Waterfall month model: the budget keeps only variable actuals per category.
-- Income moves to one row per month (expected + actual); fixed costs are no
-- longer entered at all — they derive from the obligations registry.

CREATE TABLE months (
	month TEXT PRIMARY KEY,
	expected_income_cents INTEGER,
	income_cents INTEGER
);

-- Carry over existing income data: planned income sums become the expected
-- income, actual income sums (where any were entered) become the Ist.
INSERT INTO months (month, expected_income_cents, income_cents)
SELECT b.month,
	NULLIF(SUM(CASE WHEN c.type = 'income' THEN b.planned_cents ELSE 0 END), 0),
	CASE
		WHEN COUNT(CASE WHEN c.type = 'income' AND b.actual_cents IS NOT NULL THEN 1 END) > 0
		THEN SUM(CASE WHEN c.type = 'income' THEN COALESCE(b.actual_cents, 0) ELSE 0 END)
	END
FROM budget b
JOIN categories c ON c.id = b.category_id
GROUP BY b.month;

-- Rebuild budget without the planned column; keep only variable-category rows.
CREATE TABLE budget_new (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	month TEXT NOT NULL,
	category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
	actual_cents INTEGER,
	UNIQUE (month, category_id)
);

INSERT INTO budget_new (month, category_id, actual_cents)
SELECT b.month, b.category_id, b.actual_cents
FROM budget b
JOIN categories c ON c.id = b.category_id
WHERE c.type = 'variable';

DROP TABLE budget;
ALTER TABLE budget_new RENAME TO budget;
CREATE INDEX idx_budget_month ON budget(month);
