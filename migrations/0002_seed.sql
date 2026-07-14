-- Starter data matching the user's real setup (spec §3). Everything here is
-- editable in the UI; this just removes the empty-state friction on first run.

INSERT INTO accounts (name, type, role, on_budget, institution) VALUES
	('Sparkasse Giro', 'giro', 'asset', 1, 'Sparkasse'),
	('C24 Giro', 'giro', 'asset', 1, 'C24'),
	('Scalable Tagesgeld', 'tagesgeld', 'asset', 1, 'Scalable Capital'),
	('Scalable Depot', 'depot', 'asset', 0, 'Scalable Capital');

INSERT INTO categories (name, type, icon, sort_order) VALUES
	('Gehalt', 'income', '💼', 10),
	('Sonstige Einnahmen', 'income', '➕', 20),
	('Miete', 'fix', '🏠', 30),
	('Verträge & Abos', 'fix', '📄', 40),
	('Raten', 'fix', '📆', 50),
	('Lebensmittel', 'variable', '🛒', 60),
	('Freizeit', 'variable', '🎯', 70),
	('Shopping', 'variable', '🛍️', 80),
	('Mobilität', 'variable', '🚆', 90),
	('Sonstiges', 'variable', '📦', 100);
