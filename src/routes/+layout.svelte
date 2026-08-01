<script lang="ts">
	import '@fontsource-variable/instrument-sans';
	import '@fontsource/instrument-serif';
	import '@fontsource/instrument-serif/400-italic.css';
	import '@fontsource-variable/jetbrains-mono';
	import '../app.css';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import ImageSlot from '$lib/ImageSlot.svelte';
	import { todayLabel } from '$lib/format';

	let { children, data } = $props();

	interface Module {
		id: string;
		href: string;
		num: string;
		label: string;
		kicker: string;
		spine: string;
		line: string;
		title: string;
	}

	const hour = new Date().getHours();
	const greeting = hour < 11 ? 'Guten Morgen.' : hour < 18 ? 'Guten Tag.' : 'Guten Abend.';

	const MODULES: Module[] = [
		{
			id: 'dashboard',
			href: '/',
			num: '01',
			label: 'Übersicht',
			kicker: '[ ÜBERSICHT ]',
			spine: 'YUME NO SEKAI',
			line: 'Ein ruhiger Kosmos.',
			title: greeting
		},
		{
			id: 'todo',
			href: '/tasks',
			num: '02',
			label: 'Aufgaben',
			kicker: '[ AUFGABEN ]',
			spine: 'SHIZUKA NA UCHU',
			line: 'Woche, Tag, Board.',
			title: 'Was ansteht'
		},
		{
			id: 'uni',
			href: '/uni',
			num: '03',
			label: 'Uni',
			kicker: '[ STUDIUM ]',
			spine: 'GAKUMON NO MICHI',
			line: 'Semester & Kurse.',
			title: 'Studium'
		},
		{
			id: 'projects',
			href: '/projects',
			num: '04',
			label: 'Projekte',
			kicker: '[ IT-PROJEKTE ]',
			spine: 'MIRAI SAGASHITE',
			line: 'Was gebaut wird.',
			title: 'Projekte'
		},
		{
			id: 'notes',
			href: '/notes',
			num: '05',
			label: 'Notizen',
			kicker: '[ ARCHIV ]',
			spine: 'HOSHI NO KIOKU',
			line: 'Gedächtnis der Sterne.',
			title: 'Notizen'
		}
	];

	const VIEWS: Record<string, { id: string; label: string }[]> = {
		'/tasks': [
			{ id: 'day', label: 'Heute' },
			{ id: 'week', label: 'Woche' },
			{ id: 'board', label: 'Board' },
			{ id: 'all', label: 'Alles' }
		],
		'/uni': [
			{ id: 'courses', label: 'Kurse' },
			{ id: 'tasks', label: 'Aufgaben' },
			{ id: 'session', label: 'Session' }
		],
		'/projects': [
			{ id: 'tiles', label: 'Kacheln' },
			{ id: 'board', label: 'Board' }
		]
	};
	const DEFAULT_VIEW: Record<string, string> = {
		'/tasks': 'day',
		'/uni': 'courses',
		'/projects': 'tiles'
	};

	const activeModule = $derived(
		MODULES.find((m) =>
			m.href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(m.href)
		) ?? MODULES[0]
	);

	const basePath = $derived(activeModule.href);
	const views = $derived(
		page.url.pathname === basePath ? (VIEWS[basePath] ?? null) : null
	);
	const currentView = $derived(
		page.url.searchParams.get('view') ?? DEFAULT_VIEW[basePath] ?? ''
	);
	const pageTitle = $derived((page.data.pageTitle as string | undefined) ?? activeModule.title);
	const today = todayLabel();

	// Rail-Zustand überlebt Reloads via localStorage.
	let railOpen = $state(true);
	if (browser) {
		railOpen = localStorage.getItem('md.rail') !== 'closed';
	}
	function toggleRail() {
		railOpen = !railOpen;
		localStorage.setItem('md.rail', railOpen ? 'open' : 'closed');
	}

	function viewHref(v: string): string {
		return v === DEFAULT_VIEW[basePath] ? basePath : `${basePath}?view=${v}`;
	}

	const slots = $derived(new Set(data.imageSlots as string[]));
</script>

<div class="app">
	<div class="scanlines"></div>
	<div class="glow"></div>
	<div class="frame">
		<aside class="rail" class:closed={!railOpen}>
			<button type="button" class="rail-toggle" title="Sidebar ein-/ausklappen" onclick={toggleRail}>
				{railOpen ? '‹ EINKLAPPEN' : '›'}
			</button>
			{#if railOpen}
				<div class="rail-head">
					<div class="rail-sys">[ SISTEMA ]</div>
					<a class="rail-brand" href="/">Managment<br /><em>Dashboard</em></a>
					<div class="barcode"></div>
					<div class="rail-mood">
						<ImageSlot slot="rail-mood" placeholder="Mood / Bild" has={slots.has('rail-mood')} />
						<div class="mood-shade"></div>
						<div class="mood-tag">MIRAI / 未来</div>
					</div>
				</div>
			{/if}
			<nav class="rail-nav">
				{#each MODULES as m (m.id)}
					<a
						href={m.href}
						title={m.label}
						aria-current={activeModule.id === m.id ? 'page' : undefined}
					>
						<span class="num">{m.num}</span>
						{#if railOpen}<span class="lbl">{m.label}</span>{/if}
					</a>
				{/each}
			</nav>
			{#if railOpen}
				<div class="rail-foot">{today}</div>
			{/if}
		</aside>

		<main class="main">
			<div class="content">
				<div class="hero">
					<ImageSlot
						slot={`hero-${activeModule.id}`}
						placeholder={`Bild hierher ziehen — ${activeModule.label}`}
						has={slots.has(`hero-${activeModule.id}`)}
					/>
					<div class="hero-shade-l"></div>
					<div class="hero-shade-b"></div>
					<div class="hero-scan"></div>
					<div class="hero-spine"><span>{activeModule.spine}</span></div>
					<div class="hero-text">
						<div class="hero-kicker">{activeModule.kicker}</div>
						<div class="hero-line">{activeModule.line}</div>
					</div>
					<div class="hero-date">{today}</div>
					<div class="hero-barcode"></div>
				</div>

				<div class="page-head">
					<div>
						<div class="kicker">{activeModule.kicker}</div>
						<h1 class="page-title">{pageTitle}</h1>
					</div>
					{#if views}
						<div class="subnav">
							{#each views as v (v.id)}
								<a href={viewHref(v.id)} class:on={currentView === v.id}>{v.label}</a>
							{/each}
						</div>
					{/if}
				</div>

				{@render children()}
			</div>
		</main>
	</div>
</div>
