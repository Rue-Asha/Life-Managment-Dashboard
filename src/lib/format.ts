/** Datums-Helfer, auf Client und Server nutzbar. */

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

/** "Mi., 05. Aug." — kurzes Datum für Listenzeilen. */
export function fmtDay(iso: string | null | undefined): string {
	if (!iso) return '—';
	const dt = new Date(iso + 'T00:00:00');
	if (Number.isNaN(dt.getTime())) return '—';
	return dt.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });
}

/** "HEUTE" oder kurzes Datum für Fristen-Spalten. */
export function dueLabel(iso: string | null | undefined): string {
	if (!iso) return 'kein Datum';
	return iso === todayISO() ? 'HEUTE' : fmtDay(iso);
}

/** Fristen-Farbe: überfällig rot, heute gold, sonst gedeckt. */
export function dueColor(iso: string | null | undefined, done: boolean | number): string {
	if (!iso) return '#5E5654';
	const today = todayISO();
	if (iso < today && !done) return '#C58C86';
	if (iso === today) return '#CFA76E';
	return '#5E5654';
}

/** "FREITAG, 01. AUGUST" — Datumszeile im Rail/Hero. */
export function todayLabel(): string {
	return new Date()
		.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })
		.toUpperCase();
}

/** ISO-Datum n Tage in der Zukunft (lokale Zeit). */
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
