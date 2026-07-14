import type { LayoutServerLoad } from './$types';
import { countWeekOpen } from '$lib/server/tasks';
import { countUniWeekOpen } from '$lib/server/uni';
import { inboxCount } from '$lib/server/notes';

export const load: LayoutServerLoad = () => ({
	weekOpen: countWeekOpen(),
	uniWeekOpen: countUniWeekOpen(),
	inboxCount: inboxCount(),
	isSunday: new Date().getDay() === 0
});
