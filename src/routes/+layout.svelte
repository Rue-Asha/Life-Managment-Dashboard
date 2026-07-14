<script lang="ts">
	import '../app.css';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';

	let { children, data } = $props();

	const nav = $derived([
		{ href: '/', em: '🏠', label: 'Home', count: null as number | null },
		{ href: '/tasks', em: '⚡', label: 'Tasks', count: data.weekOpen },
		{ href: '/uni', em: '🎓', label: 'Uni', count: data.uniWeekOpen },
		{ href: '/finance', em: '💰', label: 'Finanzen', count: null },
		{ href: '/notes', em: '🔒', label: 'Notes', count: data.inboxCount },
		{ href: '/projects', em: '💻', label: 'Projects', count: null },
		{ href: '/curriculum', em: '🧭', label: 'Curriculum', count: null }
	]);

	function isActive(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
</script>

<div class="app">
	<aside class="side">
		<a class="brand" href="/">Zentrale<small>Life Management</small></a>
		<hr />
		{#each nav as item (item.href)}
			<a class="nav-link" href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>
				<span class="em">{item.em}</span>
				{item.label}
				{#if item.count}<span class="count">{item.count}</span>{/if}
			</a>
		{/each}
		<form class="capture" method="POST" action="/notes?/create" use:enhance>
			<input type="text" name="title" required placeholder="✎ Capture …" aria-label="Quick Capture zur Notes-Inbox" />
		</form>
		<form class="capture" method="GET" action="/search">
			<input type="search" name="q" placeholder="🔍 Suche …" aria-label="Globale Suche" />
		</form>
		<div class="push"></div>
		<a class="review-pill" href="/review"
			>{data.isSunday ? '◔ Heute: Sonntags-Review' : '◔ Review · Sonntag'}</a
		>
	</aside>

	<main><div class="content">{@render children()}</div></main>
</div>
