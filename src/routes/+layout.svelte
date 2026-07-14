<script lang="ts">
	import '../app.css';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';

	let { children, data } = $props();

	// Lucide-style stroke icons (24×24 viewBox), one or more path `d` strings each.
	const ICONS: Record<string, string[]> = {
		home: ['M3 10.5 12 3l9 7.5', 'M5 9v12h5v-6h4v6h5V9'],
		tasks: [
			'M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z',
			'm8.5 12.2 2.4 2.4 4.8-4.8'
		],
		uni: [
			'm2 9.2 10-4.7 10 4.7-10 4.7z',
			'M6.5 11.8v4.4c0 1.5 2.5 2.9 5.5 2.9s5.5-1.4 5.5-2.9v-4.4',
			'M22 9.2v5'
		],
		finance: [
			'M6 5.5h12a3 3 0 0 1 3 3v7.5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8.5a3 3 0 0 1 3-3z',
			'M3 10h18',
			'M7 15h4'
		],
		notes: ['M6 3h9l4 4v14H6z', 'M14.5 3v4.5H19', 'M9 12h6M9 16h4'],
		projects: ['m8 8.5-4 3.5 4 3.5', 'm16 8.5 4 3.5-4 3.5', 'm13 6-2 12'],
		curriculum: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'm15.2 8.8-1.8 4.6-4.6 1.8 1.8-4.6z'],
		search: ['M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14z', 'm20 20-3.6-3.6'],
		review: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 7.5V12l3 2'],
		capture: ['m4.5 19.5.9-3.7L16.6 4.6a2 2 0 0 1 2.8 2.8L8.2 18.6z']
	};

	const nav = $derived([
		{ href: '/', icon: 'home', label: 'Home', count: null as number | null },
		{ href: '/tasks', icon: 'tasks', label: 'Tasks', count: data.weekOpen },
		{ href: '/uni', icon: 'uni', label: 'Uni', count: data.uniWeekOpen },
		{ href: '/finance', icon: 'finance', label: 'Finanzen', count: null },
		{ href: '/notes', icon: 'notes', label: 'Notes', count: data.inboxCount },
		{ href: '/projects', icon: 'projects', label: 'Projects', count: null },
		{ href: '/curriculum', icon: 'curriculum', label: 'Curriculum', count: null }
	]);

	function isActive(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
</script>

{#snippet icon(name: string)}
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.8"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		{#each ICONS[name] as d (d)}
			<path {d} />
		{/each}
	</svg>
{/snippet}

<div class="app">
	<aside class="side">
		<a class="brand" href="/">Zentrale<small>Life Management</small></a>
		<hr />
		{#each nav as item (item.href)}
			<a class="nav-link" href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>
				{@render icon(item.icon)}
				{item.label}
				{#if item.count}<span class="count">{item.count}</span>{/if}
			</a>
		{/each}
		<a
			class="nav-link mobile-only"
			href="/search"
			aria-current={isActive('/search') ? 'page' : undefined}
		>
			{@render icon('search')}
			Suche
		</a>
		<a
			class="nav-link mobile-only"
			href="/review"
			aria-current={isActive('/review') ? 'page' : undefined}
		>
			{@render icon('review')}
			Review
		</a>
		<form class="capture" method="POST" action="/notes?/create" use:enhance>
			{@render icon('capture')}
			<input
				type="text"
				name="title"
				required
				placeholder="Capture …"
				aria-label="Quick Capture zur Notes-Inbox"
			/>
		</form>
		<form class="capture" method="GET" action="/search">
			{@render icon('search')}
			<input type="search" name="q" placeholder="Suche …" aria-label="Globale Suche" />
		</form>
		<div class="push"></div>
		<a class="review-pill" href="/review">
			{@render icon('review')}
			{data.isSunday ? 'Heute: Sonntags-Review' : 'Review · Sonntag'}
		</a>
	</aside>

	<main><div class="content">{@render children()}</div></main>
</div>
