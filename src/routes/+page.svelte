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
	import { PRIORITY_LABELS, parseTags } from '$lib/labels';

	let { data } = $props();

	const now = new Date();
	const greeting =
		now.getHours() < 11 ? 'Guten Morgen' : now.getHours() < 18 ? 'Guten Tag' : 'Guten Abend';
	const pct = $derived(
		data.stats.total === 0 ? 0 : Math.round((data.stats.done / data.stats.total) * 100)
	);

	const SOURCE_LABELS = { alltag: 'Alltag', uni: 'Uni' } as const;
</script>

<svelte:head><title>Zentrale</title></svelte:head>

<p class="eyebrow">{formatLongDate(now)} · KW {isoWeek(now)}</p>
<h1>{greeting}, Ornab.</h1>
<p class="lede"><em>Ein Blick am Morgen. Ein Review am Sonntag. Mehr braucht's nicht.</em></p>

<div class="grid cols-3">
	<div class="card span-2">
		<h3>This Week</h3>
		{#if data.weekOpen.length === 0 && data.weekDone.length === 0}
			<p class="dim">
				Noch nichts für diese Woche geplant — in <a href="/tasks">Tasks</a> oder
				<a href="/uni">Uni</a> Aufgaben anlegen oder aus dem Backlog holen.
			</p>
		{:else}
			<div class="rows">
				{#each data.weekOpen as item (`${item.source}-${item.id}`)}
					<div class="row">
						<form
							class="inline"
							method="POST"
							action={item.source === 'uni' ? '/?/toggleUni' : '/?/toggle'}
							use:enhance
						>
							<input type="hidden" name="id" value={item.id} />
							<button class="cbox" aria-label="„{item.title}“ abhaken"></button>
						</form>
						<span class="title">{item.title}</span>
						<span class="chip">{SOURCE_LABELS[item.source]}</span>
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
						{:else}
							<span class="due">—</span>
						{/if}
					</div>
				{/each}
				{#each data.weekDone as item (`${item.source}-${item.id}`)}
					<div class="row">
						<form
							class="inline"
							method="POST"
							action={item.source === 'uni' ? '/?/toggleUni' : '/?/toggle'}
							use:enhance
						>
							<input type="hidden" name="id" value={item.id} />
							<button class="cbox checked" aria-label="„{item.title}“ wieder öffnen">✓</button>
						</form>
						<span class="title done-text">{item.title}</span>
						<span class="chip">{SOURCE_LABELS[item.source]}</span>
					</div>
				{/each}
			</div>
			<div class="prog" style="margin-top:14px;">
				<div class="track"><div class="fill" style="width:{pct}%"></div></div>
				<span class="num">This Week · {data.stats.done}/{data.stats.total} erledigt</span>
			</div>
		{/if}
		<a class="more" href="/tasks">Alle Tasks →</a>
		<a class="more" href="/uni" style="margin-left:14px;">Uni Management →</a>
	</div>

	<div class="card">
		<h3>Kalender · Proton</h3>
		{#if data.inboxCount > 0}
			<p class="dim" style="margin:0 0 12px; font-size:13.5px;">
				<a href="/notes">{data.inboxCount}
					{data.inboxCount === 1 ? 'Notiz' : 'Notizen'} in der Inbox</a> — sonntags einsortieren.
			</p>
		{/if}
		{#if !data.icsConfigured}
			<p class="dim" style="margin:0 0 12px; font-size:13.5px;">
				Read-only-Agenda: <span class="mono">PROTON_ICS_URL</span> in der <span class="mono">.env</span>
				setzen (Proton → Kalender teilen → Link).
			</p>
		{:else if data.agenda.length === 0}
			<p class="dim" style="margin:0 0 12px; font-size:13.5px;">
				Keine Termine in den nächsten 14 Tagen.
			</p>
		{:else}
			<div class="rows" style="margin-bottom:12px;">
				{#each data.agenda.slice(0, 6) as event (event.start + event.summary)}
					<div class="row" style="font-size:13.5px;">
						<span class="mono dim" style="font-size:12px; white-space:nowrap;">
							{formatDeadline(event.start.slice(0, 10))}{#if !event.allDay}
								{new Date(event.start).toLocaleTimeString('de-DE', {
									hour: '2-digit',
									minute: '2-digit'
								})}{/if}
						</span>
						<span class="title">{event.summary}</span>
					</div>
				{/each}
			</div>
		{/if}
		<div style="display:flex; gap:8px; flex-wrap:wrap;">
			<a class="fchip" href="https://calendar.proton.me" target="_blank" rel="noreferrer"
				>↗ Proton Calendar</a
			>
			<a class="fchip" href="https://mail.proton.me" target="_blank" rel="noreferrer"
				>↗ Proton Mail</a
			>
		</div>
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
</style>
