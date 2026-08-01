import type { LayoutServerLoad } from './$types';
import { existingSlots } from '$lib/server/images';

export const load: LayoutServerLoad = () => ({
	imageSlots: existingSlots()
});
