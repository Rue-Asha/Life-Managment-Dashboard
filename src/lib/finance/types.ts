// Row shapes shared between server queries and page components.
// SQLite booleans arrive as 0/1 integers and are kept that way.

export type CategoryType = 'income' | 'fix' | 'variable';
export type AccountType = 'giro' | 'tagesgeld' | 'depot' | 'other';
export type AccountRole = 'asset' | 'liability';
export type Cadence = 'once' | 'monthly' | 'quarterly' | 'yearly';
export type ObligationType = 'ongoing' | 'installment';
export type GoalType = 'ruecklage' | 'sparziel';

export interface Category {
	id: number;
	name: string;
	type: CategoryType;
	icon: string | null;
	sort_order: number;
	account_id: number | null;
}

export interface Account {
	id: number;
	name: string;
	type: AccountType;
	role: AccountRole;
	on_budget: number;
	institution: string | null;
	currency: string;
}

export interface AccountWithBalance extends Account {
	latest_balance_cents: number | null;
	latest_date: string | null;
	snapshot_count: number;
}

export interface Snapshot {
	id: number;
	account_id: number;
	date: string;
	balance_cents: number;
}

export interface Obligation {
	id: number;
	name: string;
	amount_cents: number;
	cadence: Cadence;
	category_id: number;
	next_due: string;
	type: ObligationType;
	active: number;
	total_amount_cents: number | null;
	remaining_balance_cents: number | null;
	end_date: string | null;
	account_id: number | null;
}

export interface ObligationView extends Obligation {
	category_name: string;
	monthly_load_cents: number;
}

export interface SavingsGoal {
	id: number;
	name: string;
	type: GoalType;
	target_amount_cents: number;
	current_amount_cents: number;
	due_date: string | null;
	account_id: number | null;
	updated_at: string;
	monthly_rate_cents: number;
}

export interface BudgetRow {
	id: number;
	month: string;
	category_id: number;
	actual_cents: number | null;
}

export interface BudgetRowView extends BudgetRow {
	category_name: string;
	category_icon: string | null;
}

export interface MonthRow {
	month: string;
	expected_income_cents: number | null;
	income_cents: number | null;
}

export interface NetWorthPoint {
	date: string;
	cents: number;
}

export const CADENCE_LABELS: Record<Cadence, string> = {
	once: 'einmalig',
	monthly: 'monatlich',
	quarterly: 'vierteljährlich',
	yearly: 'jährlich'
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
	giro: 'Girokonto',
	tagesgeld: 'Tagesgeld',
	depot: 'Depot',
	other: 'Sonstiges'
};

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
	income: 'Einnahmen',
	fix: 'Fixkosten',
	variable: 'Variabel'
};
