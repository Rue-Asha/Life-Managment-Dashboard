<script lang="ts">
	import { page } from '$app/state';

	const tabs = [
		{ href: '/finance', label: '◈ Dashboard' },
		{ href: '/finance/budget', label: '📊 Budget' },
		{ href: '/finance/accounts', label: '🏦 Konten' },
		{ href: '/finance/obligations', label: '📄 Fixkosten & Raten' },
		{ href: '/finance/goals', label: '◎ Ziele' },
		{ href: '/finance/categories', label: '🗂 Kategorien' }
	];

	function isActive(href: string): boolean {
		return href === '/finance'
			? page.url.pathname === '/finance'
			: page.url.pathname.startsWith(href);
	}
</script>

<div class="filters" style="margin-bottom:22px;">
	{#each tabs as tab (tab.href)}
		<a class="fchip" class:on={isActive(tab.href)} href={tab.href}>{tab.label}</a>
	{/each}
</div>
