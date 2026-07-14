import type { PageServerLoad } from './$types';
import { inboxCount } from '$lib/server/notes';
import { listBacklog, weekStats } from '$lib/server/tasks';
import { listUniTasks, uniWeekStats } from '$lib/server/uni';
import { getActivePhase, listQuotas } from '$lib/server/curriculum';
import { listAccounts } from '$lib/server/finance/accounts';
import { daysUntil, isoWeekKey } from '$lib/format';

export const load: PageServerLoad = () => {
	const phase = getActivePhase();
	const now = new Date();
	const accounts = listAccounts();
	const staleAccounts = accounts.filter(
		(a) => a.latest_date === null || -daysUntil(a.latest_date) > 35
	).length;
	return {
		week: isoWeekKey(),
		isSunday: now.getDay() === 0,
		// Erste 7 Tage des Monats ⇒ der Sonntag darin ist der Finanz-Sonntag.
		financeSunday: now.getDate() <= 7,
		inbox: inboxCount(),
		taskBacklog: listBacklog().length,
		uniBacklog: listUniTasks({ status: 'backlog' }).length,
		stats: weekStats(),
		uniStats: uniWeekStats(),
		quotas: phase ? listQuotas(phase.id) : [],
		phaseName: phase?.name ?? null,
		staleAccounts
	};
};
