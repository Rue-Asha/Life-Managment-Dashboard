// Proton-Calendar read-only agenda (spec §5): Proton has no embeddable
// widget, but a shared-link ICS feed. Fetched server-side and cached for
// 15 minutes; if PROTON_ICS_URL is unset the Home card degrades to links.
import { env } from '$env/dynamic/private';

export interface AgendaEvent {
	start: string; // ISO datetime (local) or date
	end: string | null;
	allDay: boolean;
	summary: string;
}

const CACHE_TTL_MS = 15 * 60 * 1000;
let cache: { fetchedAt: number; events: RawEvent[] } | null = null;

/** Unfold RFC-5545 continuation lines and split into raw lines. */
function unfold(ics: string): string[] {
	return ics
		.replace(/\r\n/g, '\n')
		.replace(/\n[ \t]/g, '')
		.split('\n');
}

function unescapeText(value: string): string {
	return value
		.replace(/\\n/gi, ' · ')
		.replace(/\\,/g, ',')
		.replace(/\\;/g, ';')
		.replace(/\\\\/g, '\\');
}

/** Parse an ICS date/datetime into a JS Date (UTC-flagged values only). */
function parseIcsDate(value: string): { date: Date; allDay: boolean } | null {
	const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
	if (dateOnly) {
		return {
			date: new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])),
			allDay: true
		};
	}
	const dt = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(value);
	if (!dt) return null;
	const [, y, mo, d, h, mi, s, z] = dt;
	const date = z
		? new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s))
		: // TZID-lokale Zeiten: pragmatisch als lokale Serverzeit interpretiert.
			new Date(+y, +mo - 1, +d, +h, +mi, +s);
	return { date, allDay: false };
}

interface RawEvent {
	start: { date: Date; allDay: boolean } | null;
	end: { date: Date; allDay: boolean } | null;
	summary: string;
	rrule: string | null;
}

function parseEvents(ics: string): RawEvent[] {
	const events: RawEvent[] = [];
	let current: RawEvent | null = null;
	for (const line of unfold(ics)) {
		if (line === 'BEGIN:VEVENT') {
			current = { start: null, end: null, summary: '', rrule: null };
			continue;
		}
		if (line === 'END:VEVENT') {
			if (current?.start) events.push(current);
			current = null;
			continue;
		}
		if (!current) continue;
		const idx = line.indexOf(':');
		if (idx === -1) continue;
		const key = line.slice(0, idx).split(';')[0].toUpperCase();
		const value = line.slice(idx + 1).trim();
		if (key === 'DTSTART') current.start = parseIcsDate(value);
		else if (key === 'DTEND') current.end = parseIcsDate(value);
		else if (key === 'SUMMARY') current.summary = unescapeText(value);
		else if (key === 'RRULE') current.rrule = value;
	}
	return events;
}

/** Expand simple RRULEs (DAILY/WEEKLY/MONTHLY/YEARLY + INTERVAL/UNTIL/COUNT)
 *  into the window. Exotic rules degrade to the base occurrence. */
function occurrencesInWindow(event: RawEvent, from: Date, to: Date): Date[] {
	const start = event.start!.date;
	if (!event.rrule) {
		return start >= from && start <= to ? [start] : [];
	}
	const parts = Object.fromEntries(
		event.rrule.split(';').map((p) => p.split('=') as [string, string])
	);
	const freq = parts.FREQ;
	const interval = Math.max(1, Number(parts.INTERVAL ?? 1));
	const count = parts.COUNT ? Number(parts.COUNT) : Infinity;
	const until = parts.UNTIL ? (parseIcsDate(parts.UNTIL)?.date ?? null) : null;
	const stepMonths = freq === 'MONTHLY' ? interval : freq === 'YEARLY' ? 12 * interval : 0;
	const stepDays = freq === 'DAILY' ? interval : freq === 'WEEKLY' ? 7 * interval : 0;
	if (!stepMonths && !stepDays) {
		return start >= from && start <= to ? [start] : [];
	}
	const result: Date[] = [];
	const cursor = new Date(start);
	for (let i = 0; i < 1000 && i < count; i++) {
		if (cursor > to || (until && cursor > until)) break;
		if (cursor >= from) result.push(new Date(cursor));
		if (stepDays) cursor.setDate(cursor.getDate() + stepDays);
		else cursor.setMonth(cursor.getMonth() + stepMonths);
	}
	return result;
}

/** Fetch + parse the raw feed once per TTL; navigation reuses this cache. */
async function loadRawEvents(): Promise<RawEvent[]> {
	const url = env.PROTON_ICS_URL;
	if (!url) return [];
	if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.events;
	const response = await fetch(url, { headers: { accept: 'text/calendar' } });
	if (!response.ok) throw new Error(`ICS-Feed antwortet mit ${response.status}`);
	const events = parseEvents(await response.text());
	cache = { fetchedAt: Date.now(), events };
	return events;
}

/** Expand recurrences and materialise AgendaEvents inside [from, to). */
function expand(rawEvents: RawEvent[], from: Date, to: Date): AgendaEvent[] {
	const events: AgendaEvent[] = [];
	for (const raw of rawEvents) {
		const durationMs =
			raw.end && raw.start ? raw.end.date.getTime() - raw.start.date.getTime() : 0;
		for (const occurrence of occurrencesInWindow(raw, from, to)) {
			events.push({
				start: occurrence.toISOString(),
				end: durationMs > 0 ? new Date(occurrence.getTime() + durationMs).toISOString() : null,
				allDay: raw.start!.allDay,
				summary: raw.summary || '(ohne Titel)'
			});
		}
	}
	events.sort((a, b) => a.start.localeCompare(b.start));
	return events;
}

export function icsConfigured(): boolean {
	return Boolean(env.PROTON_ICS_URL);
}

/** Events within an arbitrary window (the Home week overview). Errors degrade
 *  to the last cached feed, or an empty list — never block Home. */
export async function getEventsInRange(from: Date, to: Date): Promise<AgendaEvent[]> {
	try {
		return expand(await loadRawEvents(), from, to);
	} catch (err) {
		console.error('Proton-ICS-Feed nicht erreichbar:', err);
		return cache ? expand(cache.events, from, to) : [];
	}
}
