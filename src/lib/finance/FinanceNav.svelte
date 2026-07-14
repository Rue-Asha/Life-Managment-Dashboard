<script lang="ts">
	import { page } from '$app/state';

	const tabs = [
		{ href: '/finance', label: 'Dashboard' },
		{ href: '/finance/budget', label: 'Budget' },
		{ href: '/finance/accounts', label: 'Konten' },
		{ href: '/finance/obligations', label: 'Fixkosten & Raten' },
		{ href: '/finance/goals', label: 'Ziele' },
		{ href: '/finance/categories', label: 'Kategorien' }
	];

	function isActive(href: string): boolean {
		return href === '/finance'
			? page.url.pathname === '/finance'
			: page.url.pathname.startsWith(href);
	}
</script>

<nav class="ftabs" aria-label="Finanzen">
	{#each tabs as tab (tab.href)}
		<a class="ftab" class:on={isActive(tab.href)} href={tab.href}>{tab.label}</a>
	{/each}
</nav>

<style>
	.ftabs {
		display: flex;
		gap: 2px;
		margin: 4px 0 24px;
		border-bottom: 1px solid var(--line);
		overflow-x: auto;
		scrollbar-width: none;
	}

	.ftab {
		font-size: 13.5px;
		font-weight: 500;
		color: var(--ink2);
		text-decoration: none;
		padding: 8px 12px;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		white-space: nowrap;
		border-radius: var(--r-sm) var(--r-sm) 0 0;
		transition:
			color 0.12s ease,
			background 0.12s ease;
	}

	.ftab:hover {
		color: var(--ink);
		background: var(--surface2);
	}

	.ftab.on {
		color: var(--ink);
		font-weight: 600;
		border-bottom-color: var(--accent);
	}
</style>
