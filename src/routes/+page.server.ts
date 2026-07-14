import type { Actions, PageServerLoad } from './$types';
import { listWeekOpen, listWeekDone, weekStats, toggleDone } from '$lib/server/tasks';
import { uniListWeekOpen, uniListWeekDone, uniWeekStats, toggleUniDone } from '$lib/server/uni';
import { netWorthNow } from '$lib/server/finance/networth';
import { upcomingObligations } from '$lib/server/finance/obligations';
import { todayView, tickQuota } from '$lib/server/curriculum';
import { getEventsInRange, icsConfigured, type AgendaEvent } from '$lib/server/ics';
import { action, int } from '$lib/server/forms';
import type { Priority } from '$lib/labels';

/** One row on the Home This-Week card — tagged with its source DB (spec §5.1). */
export interface WeekItem {
	source: 'alltag' | 'uni';
	id: number;
	title: string;
	priority: Priority | null;
	deadline: string | null;
	sub: string | null; // area/class chip text is rendered client-side
}

const PRIO_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

function byUrgency(a: WeekItem, b: WeekItem): number {
	const prio = (PRIO_RANK[a.priority ?? ''] ?? 3) - (PRIO_RANK[b.priority ?? ''] ?? 3);
	if (prio !== 0) return prio;
	if (a.deadline === b.deadline) return 0;
	if (a.deadline === null) return 1;
	if (b.deadline === null) return -1;
	return a.deadline < b.deadline ? -1 : 1;
}

export const load: PageServerLoad = async () => {
	const orgaOpen: WeekItem[] = listWeekOpen()
		.map(
			(t): WeekItem => ({
				source: 'alltag',
				id: t.id,
				title: t.title,
				priority: t.priority,
				deadline: t.deadline,
				sub: null
			})
		)
		.sort(byUrgency);
	const uniOpen: WeekItem[] = uniListWeekOpen()
		.map(
			(t): WeekItem => ({
				source: 'uni',
				id: t.id,
				title: t.title,
				priority: t.priority,
				deadline: t.deadline,
				sub: t.class_name
			})
		)
		.sort(byUrgency);

	const orgaDone: WeekItem[] = listWeekDone()
		.slice(0, 5)
		.map(
			(t): WeekItem => ({
				source: 'alltag',
				id: t.id,
				title: t.title,
				priority: null,
				deadline: null,
				sub: null
			})
		);
	const uniDone: WeekItem[] = uniListWeekDone()
		.slice(0, 5)
		.map(
			(t): WeekItem => ({
				source: 'uni',
				id: t.id,
				title: t.title,
				priority: null,
				deadline: null,
				sub: t.class_name
			})
		);

	const tasks = weekStats();
	const uni = uniWeekStats();
	return {
		orgaOpen,
		uniOpen,
		orgaDone,
		uniDone,
		orgaStats: tasks,
		uniStats: uni,
		netWorthCents: netWorthNow().netWorthCents,
		dueSoon: upcomingObligations(14).map((o) => ({
			id: o.id,
			name: o.name,
			next_due: o.next_due,
			amount_cents: o.amount_cents
		})),
		today: todayView(),
		icsConfigured: icsConfigured(),
		...(await calendarWeek())
	};
};

/** Current week (Mon–Sun) as a quick calendar overview on Home. */
async function calendarWeek(): Promise<{ calWeekStart: string; calEvents: AgendaEvent[] }> {
	const from = new Date();
	from.setHours(0, 0, 0, 0);
	from.setDate(from.getDate() - ((from.getDay() + 6) % 7)); // back to Monday
	const to = new Date(from);
	to.setDate(to.getDate() + 7);
	const y = from.getFullYear();
	const m = String(from.getMonth() + 1).padStart(2, '0');
	const d = String(from.getDate()).padStart(2, '0');
	return {
		calWeekStart: `${y}-${m}-${d}`,
		calEvents: icsConfigured() ? await getEventsInRange(from, to) : []
	};
}

export const actions: Actions = {
	toggle: action((_event, data) => {
		toggleDone(int(data, 'id'));
	}),
	toggleUni: action((_event, data) => {
		toggleUniDone(int(data, 'id'));
	}),
	// Abend-Ritual direkt von Home: Quoten-Tick (Gym ✓, FR ✓ …).
	tick: action((_event, data) => {
		tickQuota(int(data, 'id'), data.get('delta') === '-1' ? -1 : 1);
	})
};
