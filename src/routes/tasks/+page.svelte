<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDeadline, daysUntil } from '$lib/format';
	import { AREAS, AREA_LABELS, PRIORITY_LABELS, type Area } from '$lib/labels';
	import type { Task } from '$lib/server/tasks';

	let { data, form } = $props();

	function filterHref(area: Area | null): string {
		return area ? `/tasks?area=${area}` : '/tasks';
	}
</script>

<svelte:head><title>Tasks · Zentrale</title></svelte:head>

{#snippet taskRow(task: Task, inWeek: boolean)}
	<div class="row">
		<form class="inline" method="POST" action="?/toggle" use:enhance>
			<input type="hidden" name="id" value={task.id} />
			<button
				class="cbox"
				class:checked={task.status === 'done'}
				aria-label="„{task.title}“ {task.status === 'done' ? 'wieder öffnen' : 'abhaken'}"
				>{task.status === 'done' ? '✓' : ''}</button
			>
		</form>
		<span class="title" class:done-text={task.status === 'done'}>{task.title}</span>
		<span class="chip">{AREA_LABELS[task.area]}</span>
		{#if task.priority}
			<span class="badge {PRIORITY_LABELS[task.priority].tone}"
				>{PRIORITY_LABELS[task.priority].label}</span
			>
		{/if}
		{#if task.deadline}
			<span class="due" class:soon={daysUntil(task.deadline) <= 3}
				>{formatDeadline(task.deadline)}</span
			>
		{/if}
		{#if task.status !== 'done'}
			<form class="inline" method="POST" action="?/week" use:enhance>
				<input type="hidden" name="id" value={task.id} />
				<input type="hidden" name="on" value={inWeek ? '0' : '1'} />
				<button class="fchip" title={inWeek ? 'Zurück ins Backlog' : 'Für diese Woche einplanen'}
					>{inWeek ? '→ Backlog' : '→ This Week'}</button
				>
			</form>
		{/if}
		<form class="inline" method="POST" action="?/delete" use:enhance>
			<input type="hidden" name="id" value={task.id} />
			<button class="iconbtn" title="Löschen" aria-label="„{task.title}“ löschen">✕</button>
		</form>
	</div>
{/snippet}

<div class="page-head">
	<div>
		<p class="eyebrow">⚡ Tasks</p>
		<h1>Alltag &amp; Orga</h1>
		<p class="lede" style="margin-bottom:0;">
			Eigene Datenbank. <strong>🎓 Uni</strong> heißt hier: organisatorische To-dos — Lernaufgaben
			leben im Uni-Modul (Brick 3).
		</p>
	</div>
</div>

<div class="filters">
	<a class="fchip" class:on={data.area === null} href={filterHref(null)}>Alle</a>
	{#each AREAS as area (area)}
		<a class="fchip" class:on={data.area === area} href={filterHref(area)}>{AREA_LABELS[area]}</a>
	{/each}
</div>

<h2 class="sect">Neu</h2>
<div class="card">
	<form method="POST" action="?/create" use:enhance>
		<div class="form-row">
			<label class="field" style="flex:1; min-width:220px;">
				<span>Titel</span>
				<input type="text" name="title" required placeholder="Was ist zu tun?" />
			</label>
			<label class="field">
				<span>Bereich</span>
				<select name="area">
					{#each AREAS as area (area)}
						<option value={area} selected={data.area === area}>{AREA_LABELS[area]}</option>
					{/each}
				</select>
			</label>
			<label class="field">
				<span>Priorität</span>
				<select name="priority">
					<option value="">—</option>
					<option value="high">▲ Hoch</option>
					<option value="medium">■ Mittel</option>
					<option value="low">▽ Niedrig</option>
				</select>
			</label>
			<label class="field">
				<span>Deadline</span>
				<input type="date" name="deadline" />
			</label>
			<label class="check"><input type="checkbox" name="this_week" checked /> This Week</label>
			<button class="btn">＋ Anlegen</button>
		</div>
	</form>
	{#if form?.message}<p class="form-error">{form.message}</p>{/if}
</div>

<h2 class="sect">
	This Week · {data.weekOpen.length} offen
	<span class="soft">{data.stats.done}/{data.stats.total} erledigt</span>
</h2>
<div class="card">
	{#if data.weekOpen.length === 0 && data.weekDone.length === 0}
		<p class="dim" style="margin:0;">Nichts eingeplant — unten aus dem Backlog holen.</p>
	{:else}
		<div class="rows">
			{#each data.weekOpen as task (task.id)}
				{@render taskRow(task, true)}
			{/each}
			{#each data.weekDone as task (task.id)}
				{@render taskRow(task, true)}
			{/each}
		</div>
	{/if}
</div>

<h2 class="sect">Backlog · {data.backlog.length}</h2>
<div class="card">
	{#if data.backlog.length === 0}
		<p class="dim" style="margin:0;">Backlog ist leer.</p>
	{:else}
		<div class="rows">
			{#each data.backlog as task (task.id)}
				{@render taskRow(task, false)}
			{/each}
		</div>
	{/if}
</div>
<p class="dimmer" style="font-size:12.5px; margin-top:14px;">
	Erledigte Tasks bleiben 7 Tage sichtbar und verschwinden dann aus allen Ansichten (nie gelöscht).
	Sonntags-Review: Inbox leeren → Woche befüllen (→ This Week).
</p>
