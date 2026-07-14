<script lang="ts">
	import { WEEKDAYS } from '$lib/labels';
	import { isoWeek } from '$lib/format';
	import type { AgendaEvent } from '$lib/server/ics';

	let { data } = $props();

	const anchor = $derived(new Date(`${data.anchor}T00:00:00`));

	function iso(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}
	function addDays(d: Date, n: number): Date {
		const x = new Date(d);
		x.setDate(x.getDate() + n);
		return x;
	}
	function startOfWeek(d: Date): Date {
		const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
		x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
		return x;
	}
	const todayKey = iso(new Date());

	// Bucket events by local day key.
	const byDay = $derived.by(() => {
		const map = new Map<string, AgendaEvent[]>();
		for (const ev of data.events) {
			const key = iso(new Date(ev.start));
			(map.get(key) ?? map.set(key, []).get(key)!).push(ev);
		}
		return map;
	});
	function dayEvents(d: Date): AgendaEvent[] {
		return byDay.get(iso(d)) ?? [];
	}
	function time(ev: AgendaEvent): string {
		if (ev.allDay) return 'ganztägig';
		return new Date(ev.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
	}

	// View grids.
	const weekDays = $derived(Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i)));
	const monthGrid = $derived(
		Array.from({ length: 42 }, (_, i) =>
			addDays(startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1)), i)
		)
	);
	const listDays = $derived(
		Array.from({ length: 30 }, (_, i) => addDays(anchor, i)).filter((d) => dayEvents(d).length > 0)
	);

	// Navigation.
	function hrefFor(view: string, dateIso: string): string {
		return `/calendar?view=${view}&date=${dateIso}`;
	}
	const prevHref = $derived(
		data.view === 'month'
			? hrefFor('month', iso(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1)))
			: hrefFor(data.view, iso(addDays(anchor, data.view === 'list' ? -30 : -7)))
	);
	const nextHref = $derived(
		data.view === 'month'
			? hrefFor('month', iso(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)))
			: hrefFor(data.view, iso(addDays(anchor, data.view === 'list' ? 30 : 7)))
	);

	const periodLabel = $derived.by(() => {
		if (data.view === 'week') {
			const d0 = weekDays[0];
			const d6 = weekDays[6];
			const fmt = (d: Date) => d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
			return `KW ${isoWeek(d0)} · ${fmt(d0)} – ${fmt(d6)}`;
		}
		if (data.view === 'month') {
			return anchor.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
		}
		return `Ab ${anchor.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
	});

	const VIEW_LABELS = { week: 'Woche', month: 'Monat', list: 'Liste' } as const;
</script>

<svelte:head><title>Kalender · Zentrale</title></svelte:head>

<div class="page-head">
	<div>
		<p class="eyebrow">Kalender</p>
		<h1>Kalender</h1>
		<p class="lede" style="margin-bottom:0;">
			Read-only-Ansicht deines Proton-Kalenders (ICS-Feed). Termine anlegen/ändern in Proton.
		</p>
	</div>
	<div class="actions">
		<a class="btn ghost" href="https://calendar.proton.me" target="_blank" rel="noreferrer"
			>↗ In Proton öffnen</a
		>
	</div>
</div>

{#if !data.icsConfigured}
	<div class="card">
		<h3>Kalender-Feed einrichten</h3>
		<p class="dim" style="margin:0 0 8px;">
			Setze <span class="mono">PROTON_ICS_URL</span> in der <span class="mono">.env</span> — der
			geteilte Link aus Proton:
		</p>
		<p class="dimmer mono small" style="margin:0;">
			Proton Calendar → Einstellungen → Kalender teilen → „Link zum Teilen“ (ICS) kopieren →
			<span class="mono">PROTON_ICS_URL=…</span> in <span class="mono">.env</span>, dann neu starten.
		</p>
	</div>
{:else}
	<div class="cal-toolbar">
		<div class="cal-nav">
			<a class="fchip" href={prevHref} aria-label="Zurück">‹</a>
			<a class="fchip" href={hrefFor(data.view, todayKey)}>Heute</a>
			<a class="fchip" href={nextHref} aria-label="Weiter">›</a>
			<span class="cal-period">{periodLabel}</span>
		</div>
		<div class="filters" style="margin:0;">
			{#each ['week', 'month', 'list'] as v (v)}
				<a class="fchip" class:on={data.view === v} href={hrefFor(v, data.anchor)}
					>{VIEW_LABELS[v as keyof typeof VIEW_LABELS]}</a
				>
			{/each}
		</div>
	</div>

	{#if data.view === 'week'}
		<div class="board cal-week">
			{#each weekDays as d, i (iso(d))}
				<div class="bcol" class:today={iso(d) === todayKey}>
					<p class="bhead mono">
						{WEEKDAYS[i]}
						{d.getDate()}.{d.getMonth() + 1}.
					</p>
					<div class="cal-daybox">
						{#each dayEvents(d) as ev (ev.start + ev.summary)}
							<div class="cal-ev" class:allday={ev.allDay}>
								<span class="cal-time mono">{time(ev)}</span>
								<span class="cal-sum">{ev.summary}</span>
							</div>
						{:else}
							<p class="dimmer small" style="margin:4px 0;">—</p>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else if data.view === 'month'}
		<div class="card" style="padding:0; overflow:hidden;">
			<div class="cal-month">
				{#each WEEKDAYS as wd (wd)}
					<div class="cal-mhead mono">{wd}</div>
				{/each}
				{#each monthGrid as d (iso(d))}
					{@const evs = dayEvents(d)}
					<div
						class="cal-cell"
						class:dim-month={d.getMonth() !== anchor.getMonth()}
						class:today={iso(d) === todayKey}
					>
						<span class="cal-daynum mono">{d.getDate()}</span>
						{#each evs.slice(0, 3) as ev (ev.start + ev.summary)}
							<span class="cal-chip" title="{time(ev)} · {ev.summary}">
								{#if !ev.allDay}<span class="mono">{time(ev)}</span> {/if}{ev.summary}
							</span>
						{/each}
						{#if evs.length > 3}<span class="cal-more">+{evs.length - 3} mehr</span>{/if}
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="card">
			{#if listDays.length === 0}
				<p class="dim" style="margin:0;">Keine Termine in den nächsten 30 Tagen.</p>
			{:else}
				{#each listDays as d (iso(d))}
					<p class="cal-listhead mono" class:today={iso(d) === todayKey}>
						{d.toLocaleDateString('de-DE', {
							weekday: 'short',
							day: 'numeric',
							month: 'short'
						})}
					</p>
					<div class="rows" style="margin-bottom:14px;">
						{#each dayEvents(d) as ev (ev.start + ev.summary)}
							<div class="row">
								<span class="cal-time mono" style="min-width:64px;">{time(ev)}</span>
								<span class="title">{ev.summary}</span>
							</div>
						{/each}
					</div>
				{/each}
			{/if}
		</div>
	{/if}
{/if}

<style>
	.cal-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		margin-bottom: 18px;
	}
	.cal-nav {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.cal-period {
		font-weight: 600;
		font-size: 14.5px;
		margin-left: 6px;
	}

	/* Week */
	.cal-week .bcol {
		min-width: 150px;
	}
	.cal-daybox {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.cal-ev {
		display: flex;
		flex-direction: column;
		gap: 1px;
		padding: 6px 9px;
		border: 1px solid var(--line);
		border-left: 3px solid var(--accent);
		border-radius: var(--r-sm);
		background: var(--surface);
		box-shadow: var(--shadow-sm);
		font-size: 13px;
	}
	.cal-ev.allday {
		border-left-color: var(--warn);
	}
	.cal-time {
		font-size: 11.5px;
		color: var(--ink3);
	}
	.cal-sum {
		color: var(--ink);
		line-height: 1.3;
	}

	/* Month */
	.cal-month {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
	}
	.cal-mhead {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--ink3);
		padding: 8px 10px;
		border-bottom: 1px solid var(--line);
		background: var(--surface2);
	}
	.cal-cell {
		min-height: 96px;
		border-right: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
		padding: 6px 8px;
		display: flex;
		flex-direction: column;
		gap: 3px;
		overflow: hidden;
	}
	.cal-cell:nth-child(7n + 7) {
		border-right: none;
	}
	.cal-daynum {
		font-size: 12px;
		color: var(--ink2);
		align-self: flex-start;
	}
	.cal-cell.dim-month {
		background: color-mix(in srgb, var(--surface2) 45%, transparent);
	}
	.cal-cell.dim-month .cal-daynum {
		color: var(--ink3);
	}
	.cal-cell.today .cal-daynum {
		background: var(--accent);
		color: var(--accent-ink);
		border-radius: 999px;
		padding: 0 6px;
		font-weight: 600;
	}
	.cal-chip {
		font-size: 11.5px;
		line-height: 1.35;
		padding: 1px 6px;
		border-radius: 5px;
		background: var(--accent-soft);
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.cal-chip .mono {
		color: var(--accent);
	}
	.cal-more {
		font-size: 11px;
		color: var(--ink3);
	}

	/* List */
	.cal-listhead {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ink3);
		margin: 16px 0 6px;
		padding-bottom: 4px;
		border-bottom: 1px solid var(--line);
	}
	.cal-listhead:first-child {
		margin-top: 0;
	}
	.cal-listhead.today {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}

	@media (max-width: 640px) {
		.cal-cell {
			min-height: 72px;
		}
		.cal-chip {
			font-size: 10.5px;
		}
	}
</style>
