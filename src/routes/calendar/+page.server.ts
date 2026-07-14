import type { PageServerLoad } from './$types';
import { getEventsInRange, icsConfigured } from '$lib/server/ics';

const VIEWS = ['week', 'month', 'list'] as const;
type View = (typeof VIEWS)[number];

function isoDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date): Date {
	const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
	const weekday = (x.getDay() + 6) % 7; // Mo=0 … So=6
	x.setDate(x.getDate() - weekday);
	return x;
}

export const load: PageServerLoad = async ({ url }) => {
	const viewRaw = url.searchParams.get('view');
	const view: View = VIEWS.includes(viewRaw as View) ? (viewRaw as View) : 'week';
	const dateRaw = url.searchParams.get('date');
	const anchor =
		dateRaw && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)
			? new Date(`${dateRaw}T00:00:00`)
			: new Date();

	let from: Date;
	let to: Date;
	if (view === 'week') {
		from = startOfWeek(anchor);
		to = new Date(from);
		to.setDate(to.getDate() + 7);
	} else if (view === 'month') {
		from = startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
		to = new Date(from);
		to.setDate(to.getDate() + 42); // 6-week grid
	} else {
		from = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
		to = new Date(from);
		to.setDate(to.getDate() + 30);
	}

	const configured = icsConfigured();
	return {
		view,
		anchor: isoDate(anchor),
		icsConfigured: configured,
		events: configured ? await getEventsInRange(from, to) : []
	};
};
