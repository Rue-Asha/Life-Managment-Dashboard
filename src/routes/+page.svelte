<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		formatLongDate,
		formatDeadline,
		formatCents,
		formatCentsWhole,
		daysUntil,
		isoWeek
	} from '$lib/format';
	import { PRIORITY_LABELS, parseTags, WEEKDAYS } from '$lib/labels';
	import type { AgendaEvent } from '$lib/server/ics';

	let { data } = $props();

	// Kalender-Wochenübersicht (aus dem Proton-ICS-Feed).
	function calIso(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}
	const calStart = $derived(new Date(`${data.calStart}T00:00:00`));
	const calDays = $derived(
		Array.from({ length: 7 }, (_, i) => {
			const d = new Date(calStart);
			d.setDate(d.getDate() + i);
			return d;
		})
	);
	const calLabel = $derived.by(() => {
		const end = calDays[6];
		const fmt = (d: Date) => d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
		return `${fmt(calStart)} – ${fmt(end)}`;
	});
	const calByDay = $derived.by(() => {
		const map = new Map<string, AgendaEvent[]>();
		for (const ev of data.calEvents) {
			const key = calIso(new Date(ev.start));
			(map.get(key) ?? map.set(key, []).get(key)!).push(ev);
		}
		return map;
	});
	const todayIso = calIso(new Date());
	function calEventsFor(d: Date): AgendaEvent[] {
		return calByDay.get(calIso(d)) ?? [];
	}
	function evTime(ev: AgendaEvent): string {
		return new Date(ev.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
	}

	const now = new Date();
	const greeting =
		now.getHours() < 11 ? 'Guten Morgen' : now.getHours() < 18 ? 'Guten Tag' : 'Guten Abend';
	const orgaPct = $derived(
		data.orgaStats.total === 0 ? 0 : Math.round((data.orgaStats.done / data.orgaStats.total) * 100)
	);
	const uniPct = $derived(
		data.uniStats.total === 0 ? 0 : Math.round((data.uniStats.done / data.uniStats.total) * 100)
	);
</script>

{#snippet weekCard(
	title: string,
	href: string,
	moreLabel: string,
	toggleAction: string,
	open: typeof data.orgaOpen,
	done: typeof data.orgaDone,
	stats: { done: number; total: number },
	pct: number,
	emptyHint: string
)}
	<div class="card">
		<h3>{title}</h3>
		{#if open.length === 0 && done.length === 0}
			<p class="dim" style="font-size:13.5px;">{@html emptyHint}</p>
		{:else}
			<div class="rows">
				{#each open as item (item.id)}
					<div class="row">
						<form class="inline" method="POST" action={toggleAction} use:enhance>
							<input type="hidden" name="id" value={item.id} />
							<button class="cbox" aria-label="„{item.title}“ abhaken"></button>
						</form>
						<span class="title">{item.title}</span>
						{#if item.sub}<span class="chip">{item.sub}</span>{/if}
						{#if item.priority}
							<span class="badge {PRIORITY_LABELS[item.priority].tone}"
								>{PRIORITY_LABELS[item.priority].label}</span
							>
						{/if}
						{#if item.deadline}
							<span class="due" class:soon={daysUntil(item.deadline) <= 3}
								>{formatDeadline(item.deadline)}</span
							>
						{/if}
					</div>
				{/each}
				{#each done as item (item.id)}
					<div class="row">
						<form class="inline" method="POST" action={toggleAction} use:enhance>
							<input type="hidden" name="id" value={item.id} />
							<button class="cbox checked" aria-label="„{item.title}“ wieder öffnen">✓</button>
						</form>
						<span class="title done-text">{item.title}</span>
						{#if item.sub}<span class="chip">{item.sub}</span>{/if}
					</div>
				{/each}
			</div>
			{#if stats.total > 0}
				<div class="prog" style="margin-top:14px;">
					<div class="track"><div class="fill" style="width:{pct}%"></div></div>
					<span class="num">{stats.done}/{stats.total} erledigt</span>
				</div>
			{/if}
		{/if}
		<a class="more" {href}>{moreLabel} →</a>
	</div>
{/snippet}

<svelte:head><title>Zentrale</title></svelte:head>

<p class="eyebrow">{formatLongDate(now)} · KW {isoWeek(now)}</p>
<h1>{greeting}, Ornab.</h1>
<p class="lede"><em>Ein Blick am Morgen. Ein Review am Sonntag. Mehr braucht's nicht.</em></p>

<div class="grid cols-3">
	{@render weekCard(
		'Orga · This Week',
		'/tasks',
		'Alle To-Dos',
		'/?/toggle',
		data.orgaOpen,
		data.orgaDone,
		data.orgaStats,
		orgaPct,
		'Nichts geplant — in <a href="/tasks">To-Do-List</a> anlegen oder aus dem Backlog holen.'
	)}

	{@render weekCard(
		'Uni · This Week',
		'/uni',
		'Uni Management',
		'/?/toggleUni',
		data.uniOpen,
		data.uniDone,
		data.uniStats,
		uniPct,
		'Nichts geplant — im <a href="/uni">Uni-Modul</a> anlegen oder aus dem Backlog holen.'
	)}

	<div class="card">
		<h3>Heute · Schedule</h3>
		{#if data.today?.day}
			<p style="margin:0 0 4px;">
				<strong>{data.today.day.day_label ?? '—'}</strong>
				{#each parseTags(data.today.day.tags) as tag (tag)}
					<span class="chip mono">{tag}</span>
				{/each}
			</p>
			{#if data.today.template}
				<div class="tblocks">
					{#each data.today.template.blocks as block (block.id)}
						<div class="tblock" class:hl={block.highlight}>
							<span class="mono thint">{block.time_hint ?? ''}</span>
							<span>{block.label}{#if block.duration_hint}<span class="dimmer mono" style="font-size:11.5px;"> · {block.duration_hint}</span>{/if}</span>
						</div>
					{/each}
				</div>
			{/if}
			<div class="quota-mini">
				{#each data.today.quotas.filter((q) => q.target_count !== null) as quota (quota.id)}
					<form class="inline" method="POST" action="/?/tick" use:enhance>
						<input type="hidden" name="id" value={quota.id} />
						<input type="hidden" name="delta" value="1" />
						<button
							class="fchip"
							title="{quota.title}: Tick für diese Woche"
							class:done-q={quota.week_count >= (quota.target_count ?? 0)}
							>{quota.title}
							<span class="mono">{quota.week_count}/{quota.target_count}</span></button
						>
					</form>
				{/each}
			</div>
		{:else}
			<p class="dim" style="margin:0; font-size:13.5px;">
				Keine aktive Phase — im <a href="/curriculum">Curriculum</a> anlegen.
			</p>
		{/if}
		<a class="more" href="/curriculum">Zum Schedule →</a>
	</div>

	<div class="card span-3" id="cal">
		<div class="cal-h3">
			<h3 style="margin:0;">Kalender · {calLabel}</h3>
			<div class="cal-nav">
				<a class="fchip" href="/?cal={data.calPrev}#cal" aria-label="7 Tage zurück">‹</a>
				<a
					class="fchip"
					class:on={data.calStart === data.calToday}
					href="/?cal={data.calToday}#cal">Heute</a
				>
				<a class="fchip" href="/?cal={data.calNext}#cal" aria-label="7 Tage vor">›</a>
				<a
					class="more"
					style="margin:0 0 0 4px;"
					href="https://calendar.proton.me"
					target="_blank"
					rel="noreferrer">↗ In Proton öffnen</a
				>
			</div>
		</div>
		{#if !data.icsConfigured}
			<p class="dim" style="margin:0; font-size:13.5px;">
				<span class="mono">PROTON_ICS_URL</span> in der <span class="mono">.env</span> setzen (Proton
				→ Kalender teilen → Link) — dann erscheint hier deine Woche.
			</p>
		{:else}
			<div class="calweek">
				{#each calDays as d (calIso(d))}
					<div class="calday" class:today={calIso(d) === todayIso}>
						<p class="cdhead mono">{WEEKDAYS[(d.getDay() + 6) % 7]} {d.getDate()}.{d.getMonth() +
								1}.</p>
						{#each calEventsFor(d) as ev (ev.start + ev.summary)}
							<div class="cev" class:allday={ev.allDay}>
								{#if !ev.allDay}<span class="ct mono">{evTime(ev)}</span>{/if}
								<span class="cs">{ev.summary}</span>
							</div>
						{:else}
							<span class="cempty">–</span>
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="card span-2">
		<h3>Netto-Vermögen</h3>
		<p class="mono" style="font-size:34px; font-weight:650; margin:0 0 10px; letter-spacing:-0.02em;">
			{formatCentsWhole(data.netWorthCents)}
		</p>
		{#if data.dueSoon.length > 0}
			<div class="rows">
				{#each data.dueSoon as o (o.id)}
					<div class="row">
						<span class="title">{o.name}</span>
						<span class="due" class:soon={daysUntil(o.next_due) <= 7}
							>{formatDeadline(o.next_due)}</span
						>
						<span class="mono">{formatCents(o.amount_cents)}</span>
					</div>
				{/each}
			</div>
		{:else}
			<p class="dim" style="margin:0; font-size:13.5px;">
				Keine Zahlungen in den nächsten 14 Tagen fällig.
			</p>
		{/if}
		<a class="more" href="/finance">Zum Finanz-Dashboard →</a>
	</div>
</div>

<style>
	.tblocks {
		margin: 8px 0 4px;
		display: flex;
		flex-direction: column;
	}

	.tblock {
		display: grid;
		grid-template-columns: 64px 1fr;
		gap: 8px;
		font-size: 12.5px;
		padding: 3px 6px;
		border-radius: 5px;
	}

	.tblock.hl {
		background: var(--accent-soft);
	}

	.tblock .thint {
		color: var(--ink3);
		font-size: 11px;
		white-space: nowrap;
	}

	.quota-mini {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		margin-top: 10px;
	}

	.quota-mini .done-q {
		border-color: var(--accent);
		color: var(--accent);
	}

	/* Kalender-Wochenübersicht */
	.cal-h3 {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px 14px;
		flex-wrap: wrap;
		margin-bottom: 12px;
	}
	.cal-nav {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}
	.cal-nav .fchip.on {
		background: var(--ink);
		color: var(--ground);
		border-color: var(--ink);
	}
	.calweek {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 8px;
	}
	.calday {
		border: 1px solid var(--line);
		border-radius: var(--r-md);
		background: var(--surface);
		padding: 8px 9px;
		display: flex;
		flex-direction: column;
		gap: 5px;
		min-height: 92px;
	}
	.calday.today {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent-soft) 45%, transparent);
	}
	.cdhead {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--ink3);
		margin: 0 0 1px;
	}
	.calday.today .cdhead {
		color: var(--accent);
	}
	.cev {
		display: flex;
		flex-direction: column;
		gap: 1px;
		font-size: 12px;
		line-height: 1.3;
		border-left: 2px solid var(--accent);
		padding-left: 6px;
	}
	.cev.allday {
		border-left-color: var(--warn);
	}
	.ct {
		font-size: 10.5px;
		color: var(--ink3);
	}
	.cs {
		color: var(--ink);
	}
	.cempty {
		color: var(--ink3);
		font-size: 12px;
	}

	@media (max-width: 760px) {
		.calweek {
			display: flex;
			overflow-x: auto;
			padding-bottom: 6px;
		}
		.calday {
			min-width: 132px;
			flex: 0 0 auto;
		}
	}
</style>
