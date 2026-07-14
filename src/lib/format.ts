// Formatting helpers shared by server and client. Dates are ISO strings in the
// data layer; the UI speaks German locale. EUR helpers (integer cents) join
// with the finance brick and live here from day one so both modules share one
// formatting home.

const dateFmt = new Intl.DateTimeFormat('de-DE', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric'
});

const longDateFmt = new Intl.DateTimeFormat('de-DE', {
	weekday: 'long',
	day: 'numeric',
	month: 'long',
	year: 'numeric'
});

const shortDeadlineFmt = new Intl.DateTimeFormat('de-DE', {
	weekday: 'short',
	day: '2-digit',
	month: '2-digit'
});

/** ISO date (YYYY-MM-DD) → German display (TT.MM.JJJJ). */
export function formatDate(iso: string): string {
	const d = new Date(iso + 'T00:00:00');
	return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
}

/** e.g. "Montag, 13. Juli 2026" */
export function formatLongDate(d: Date = new Date()): string {
	return longDateFmt.format(d);
}

/** ISO date → e.g. "Do, 16.07." for deadline chips. */
export function formatDeadline(iso: string): string {
	const d = new Date(iso + 'T00:00:00');
	return Number.isNaN(d.getTime()) ? iso : shortDeadlineFmt.format(d) + '.';
}

/** Whole days from today (local) to the ISO date; negative = overdue. */
export function daysUntil(iso: string): number {
	const target = new Date(iso + 'T00:00:00');
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** ISO week key for quota ticks, e.g. "2026-W29" (spec §4.7). */
export function isoWeekKey(d: Date = new Date()): string {
	const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	const day = date.getUTCDay() || 7;
	date.setUTCDate(date.getUTCDate() + 4 - day);
	return `${date.getUTCFullYear()}-W${String(isoWeek(d)).padStart(2, '0')}`;
}

/** ISO-8601 week number, e.g. 29. */
export function isoWeek(d: Date = new Date()): number {
	const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	const day = date.getUTCDay() || 7;
	date.setUTCDate(date.getUTCDate() + 4 - day);
	const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
	return Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

const eur = new Intl.NumberFormat('de-DE', {
	style: 'currency',
	currency: 'EUR',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});

const eurWhole = new Intl.NumberFormat('de-DE', {
	style: 'currency',
	currency: 'EUR',
	minimumFractionDigits: 0,
	maximumFractionDigits: 0
});

const monthFmt = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

export function formatCents(cents: number): string {
	return eur.format(cents / 100);
}

/** Whole-euro variant for headline numbers where cents are noise. */
export function formatCentsWhole(cents: number): string {
	return eurWhole.format(Math.round(cents / 100));
}

/** Signed variant: prefixes + for positive values (deltas, cross-check). */
export function formatCentsSigned(cents: number): string {
	return (cents > 0 ? '+' : '') + eur.format(cents / 100);
}

/** YYYY-MM → "Juli 2026". */
export function formatMonth(month: string): string {
	const d = new Date(month + '-01T00:00:00');
	return Number.isNaN(d.getTime()) ? month : monthFmt.format(d);
}

/** Integer cents → German decimal input value ("1234,56"); null → "". */
export function centsToInput(cents: number | null | undefined): string {
	if (cents === null || cents === undefined) return '';
	return (cents / 100).toFixed(2).replace('.', ',');
}

export function todayIso(): string {
	return new Date().toISOString().slice(0, 10);
}

export function currentMonth(): string {
	return todayIso().slice(0, 7);
}

/** Add n months to a YYYY-MM key. */
export function addMonths(month: string, n: number): string {
	const [y, m] = month.split('-').map(Number);
	const d = new Date(Date.UTC(y, m - 1 + n, 1));
	return d.toISOString().slice(0, 7);
}

/**
 * Parse a German or technical decimal amount ("1.234,56", "1234.56", "12") to
 * integer cents. Returns null for unparseable input.
 */
export function parseAmountToCents(input: string): number | null {
	let s = input.trim().replace(/[€\s]/g, '');
	if (!s) return null;
	if (s.includes(',')) {
		s = s.replace(/\./g, '').replace(',', '.');
	}
	const value = Number(s);
	if (!Number.isFinite(value)) return null;
	return Math.round(value * 100);
}
