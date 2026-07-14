<script lang="ts">
	import { enhance } from '$app/forms';
	import PrioritySelect from '$lib/PrioritySelect.svelte';
	import { formatDate, formatDeadline, daysUntil } from '$lib/format';
	import {
		PRIORITY_LABELS,
		TASK_STATUSES,
		TASK_STATUS_LABELS,
		UNI_TASK_TYPE_LABELS
	} from '$lib/labels';
	import type { UniTask } from '$lib/server/uni';

	let { data, form } = $props();

	let editingId = $state<number | null>(null);

	// GET-Filter als Query-String bauen (leere Werte fallen weg).
	function filterQuery(patch: Record<string, string | null>): string {
		const params = new URLSearchParams();
		const merged = {
			class: data.filter.classId === null ? null : String(data.filter.classId),
			type: data.filter.taskType,
			status: data.filter.status,
			...patch
		};
		for (const [key, value] of Object.entries(merged)) {
			if (value) params.set(key, value);
		}
		const qs = params.toString();
		return qs ? `/uni/tasks?${qs}` : '/uni/tasks';
	}
</script>

<svelte:head><title>Uni-Tasks · Zentrale</title></svelte:head>

<div class="page-head">
	<div>
		<p class="eyebrow">Uni</p>
		<h1>Task-Datenbank</h1>
		<p class="lede" style="margin-bottom:0;">
			Alle Uni-Tasks über alle Semester — inklusive erledigter. Wochenplanung passiert im
			<a href="/uni">Uni-Modul</a>.
		</p>
	</div>
</div>

{#if form?.message}<p class="form-error">{form.message}</p>{/if}

<details class="editor" style="margin-bottom:18px;">
	<summary>＋ Neue Uni-Task</summary>
	<form method="POST" action="?/createTask" use:enhance>
		<div class="form-row">
			<label class="field" style="flex:1; min-width:220px;">
				<span>Titel</span>
				<input type="text" name="title" required placeholder="Übungsblatt 5 bearbeiten" />
			</label>
			<label class="field">
				<span>Modul</span>
				<select name="class_id">
					<option value="">—</option>
					{#each data.allClasses as cls (cls.id)}
						<option value={cls.id}>{cls.name} ({cls.semester_name})</option>
					{/each}
				</select>
			</label>
			<label class="field">
				<span>Type</span>
				<select name="task_type">
					<option value="">—</option>
					{#each Object.entries(UNI_TASK_TYPE_LABELS) as [value, label] (value)}
						<option {value}>{label}</option>
					{/each}
				</select>
			</label>
			<PrioritySelect />
			<label class="field">
				<span>Deadline</span>
				<input type="date" name="deadline" />
			</label>
			<label class="check"><input type="checkbox" name="this_week" /> This Week</label>
			<button class="btn">＋ Anlegen</button>
		</div>
	</form>
</details>

<div class="filters">
	<a class="fchip" class:on={data.filter.status === null} href={filterQuery({ status: null })}
		>Alle</a
	>
	{#each TASK_STATUSES as status (status)}
		<a class="fchip" class:on={data.filter.status === status} href={filterQuery({ status })}
			>{TASK_STATUS_LABELS[status]}</a
		>
	{/each}
	<span class="sep"></span>
	{#each Object.entries(UNI_TASK_TYPE_LABELS) as [value, label] (value)}
		<a
			class="fchip mono"
			class:on={data.filter.taskType === value}
			href={filterQuery({ type: data.filter.taskType === value ? null : value })}>{label}</a
		>
	{/each}
</div>

<div class="filters">
	<a class="fchip" class:on={data.filter.classId === null} href={filterQuery({ class: null })}
		>Alle Module</a
	>
	{#each data.allClasses as cls (cls.id)}
		<a
			class="fchip"
			class:on={data.filter.classId === cls.id}
			href={filterQuery({ class: data.filter.classId === cls.id ? null : String(cls.id) })}
			>{cls.name}</a
		>
	{/each}
</div>

{#snippet editRow(task: UniTask)}
	<form
		class="row editrow"
		method="POST"
		action="?/update"
		use:enhance={() => {
			return async ({ update, result }) => {
				await update({ reset: false });
				if (result.type === 'success') editingId = null;
			};
		}}
	>
		<input type="hidden" name="id" value={task.id} />
		<label class="field" style="flex:1; min-width:200px;">
			<span>Titel</span>
			<input type="text" name="title" required value={task.title} />
		</label>
		<label class="field">
			<span>Modul</span>
			<select name="class_id">
				<option value="">—</option>
				{#each data.allClasses as cls (cls.id)}
					<option value={cls.id} selected={task.class_id === cls.id}>{cls.name}</option>
				{/each}
			</select>
		</label>
		<label class="field">
			<span>Type</span>
			<select name="task_type">
				<option value="">—</option>
				{#each Object.entries(UNI_TASK_TYPE_LABELS) as [value, label] (value)}
					<option {value} selected={task.task_type === value}>{label}</option>
				{/each}
			</select>
		</label>
		<PrioritySelect value={task.priority} />
		<label class="field">
			<span>Deadline</span>
			<input type="date" name="deadline" value={task.deadline ?? ''} />
		</label>
		<label class="field">
			<span>Zuletzt wiederholt</span>
			<input type="date" name="last_revision" value={task.last_revision ?? ''} />
		</label>
		<button class="btn">✓ Speichern</button>
		<button class="fchip" type="button" onclick={() => (editingId = null)}>Abbrechen</button>
	</form>
{/snippet}

<h2 class="sect">Tasks · {data.tasks.length}</h2>
<div class="card">
	{#if data.tasks.length === 0}
		<p class="dim" style="margin:0;">Keine Tasks für diesen Filter.</p>
	{:else}
		<div class="rows">
			{#each data.tasks as task (task.id)}
				{#if editingId === task.id}
					{@render editRow(task)}
				{:else}
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
					{#if task.class_name}<span class="chip">{task.class_name}</span>{/if}
					{#if task.task_type}
						<span class="chip mono">{UNI_TASK_TYPE_LABELS[task.task_type]}</span>
					{/if}
					<form class="inline" method="POST" action="?/status" use:enhance>
						<input type="hidden" name="id" value={task.id} />
						<select
							name="status"
							class="status-select mono"
							onchange={(e) => e.currentTarget.form?.requestSubmit()}
						>
							{#each TASK_STATUSES as status (status)}
								<option value={status} selected={task.status === status}
									>{TASK_STATUS_LABELS[status]}</option
								>
							{/each}
						</select>
						<noscript><button class="fchip">Setzen</button></noscript>
					</form>
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
					{#if task.last_revision}
						<span class="chip mono" title="Last Revision">↻ {formatDate(task.last_revision)}</span>
					{/if}
					{#if task.status !== 'done' && task.status !== 'wont_do'}
						<form class="inline" method="POST" action="?/week" use:enhance>
							<input type="hidden" name="id" value={task.id} />
							<input type="hidden" name="on" value={task.this_week ? '0' : '1'} />
							<button
								class="fchip"
								title={task.this_week ? 'Zurück ins Backlog' : 'Für diese Woche einplanen'}
								>{task.this_week ? '→ Backlog' : '→ This Week'}</button
							>
						</form>
					{/if}
					<form class="inline" method="POST" action="?/revise" use:enhance>
						<input type="hidden" name="id" value={task.id} />
						<button class="iconbtn" title="Heute revidiert (Last Revision setzen)">↻</button>
					</form>
						<button
							class="iconbtn edit"
							title="Bearbeiten"
							aria-label="Task bearbeiten"
							onclick={() => (editingId = task.id)}>✎</button
						>
					<form class="inline" method="POST" action="?/delete" use:enhance>
						<input type="hidden" name="id" value={task.id} />
						<button class="iconbtn" title="Löschen" aria-label="„{task.title}“ löschen">✕</button>
					</form>
				</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>
<p class="dimmer" style="font-size:12.5px; margin-top:14px;">
	↻ stempelt „Last Revision“ auf heute — fürs Wiederholen von VL-Material vor der Klausur.
</p>

<style>
	.status-select {
		font-size: 12px;
		padding: 3px 6px;
		min-height: 26px;
		border: 1px solid var(--line);
		border-radius: var(--r-sm);
		background: var(--surface);
		color: inherit;
	}
	.editrow {
		align-items: flex-end;
		gap: 10px;
	}
</style>
