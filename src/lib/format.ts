/** Date helpers, usable on both client and server. */

export function todayISO(): string {
	const d = new Date();
	return (
		d.getFullYear() +
		'-' +
		String(d.getMonth() + 1).padStart(2, '0') +
		'-' +
		String(d.getDate()).padStart(2, '0')
	);
}

/** "Wed, 05 Aug" — short date for list rows. */
export function fmtDay(iso: string | null | undefined): string {
	if (!iso) return '—';
	const dt = new Date(iso + 'T00:00:00');
	if (Number.isNaN(dt.getTime())) return '—';
	return dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
}

/** "TODAY" or a short date for due-date columns. */
export function dueLabel(iso: string | null | undefined): string {
	if (!iso) return 'no date';
	return iso === todayISO() ? 'TODAY' : fmtDay(iso);
}

/** Due-date colour: overdue red, today gold, otherwise muted. */
export function dueColor(iso: string | null | undefined, done: boolean | number): string {
	if (!iso) return '#5E5654';
	const today = todayISO();
	if (iso < today && !done) return '#C58C86';
	if (iso === today) return '#CFA76E';
	return '#5E5654';
}

/** "FRIDAY, 01 AUGUST" — the date line in the rail and hero. */
export function todayLabel(): string {
	return new Date()
		.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long' })
		.toUpperCase();
}

/** ISO date n days in the future (local time). */
export function isoInDays(n: number): string {
	const d = new Date();
	d.setDate(d.getDate() + n);
	return (
		d.getFullYear() +
		'-' +
		String(d.getMonth() + 1).padStart(2, '0') +
		'-' +
		String(d.getDate()).padStart(2, '0')
	);
}
