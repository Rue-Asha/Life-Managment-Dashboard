import type { PageServerLoad } from './$types';
import { search, searchHref } from '$lib/server/search';

export const load: PageServerLoad = ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	return {
		q,
		hits: q ? search(q).map((hit) => ({ ...hit, href: searchHref(hit) })) : []
	};
};
