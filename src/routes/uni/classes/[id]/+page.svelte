<script lang="ts">
	import { enhance } from '$app/forms';
	import PrioritySelect from '$lib/PrioritySelect.svelte';
	import { formatDeadline, daysUntil } from '$lib/format';
	import {
		CLASS_STATUSES,
		CLASS_STATUS_LABELS,
		PRIORITY_LABELS,
		UNI_TASK_TYPE_LABELS
	} from '$lib/labels';

	let { data, form } = $props();

	function confirmDelete(event: SubmitEvent) {
		if (!confirm(`Class „${data.cls.name}“ löschen? Ihre Tasks bleiben (ohne Modul).`)) {
			event.preventDefault();
		}
	}
</script>

<svelte:head><title>{data.cls.name} · Zentrale</title></svelte:head>

<div class="page-head">
	<div>
		<p class="eyebrow"><a href="/uni?semester={data.cls.semester_id}">Uni</a> · {data.cls.semester_name}</p>
		<h1>{data.cls.name}</h1>
		<p class="lede" style="margin-bottom:0;">
			<span class="badge {CLASS_STATUS_LABELS[data.cls.status].tone}"
				>{CLASS_STATUS_LABELS[data.cls.status].label}</span
			>
			{#if data.cls.archive_url}
				<a class="fchip" href={data.cls.archive_url} target="_blank" rel="noreferrer"
					>↗ Notizen-Archiv (Boox)</a
				>
			{/if}
		</p>
	</div>
	<div class="actions">
		<form class="inline" method="POST" action="?/delete" onsubmit={confirmDelete}>
			<button class="btn ghost">✕ Class löschen</button>
		</form>
	</div>
</div>

{#if form?.message}<p class="form-error">{form.message}</p>{/if}

<details class="sec" open>
	<summary>GENERAL</summary>
	<div class="card">
		<form method="POST" action="?/update" use:enhance>
			<div class="form-row">
				<label class="field" style="flex:1; min-width:200px;">
					<span>Name</span>
					<input type="text" name="name" required value={data.cls.name} />
				</label>
				<label class="field">
					<span>Status</span>
					<select name="status">
						{#each CLASS_STATUSES as status (status)}
							<option value={status} selected={data.cls.status === status}
								>{CLASS_STATUS_LABELS[status].label}</option
							>
						{/each}
					</select>
				</label>
				<label class="field">
					<span>Professor</span>
					<input type="text" name="professor" value={data.cls.professor ?? ''} />
				</label>
				<label class="field">
					<span>Schedule</span>
					<input type="text" name="schedule" value={data.cls.schedule ?? ''} />
				</label>
				<label class="field">
					<span>Raum</span>
					<input type="text" name="room" value={data.cls.room ?? ''} />
				</label>
				<label class="field" style="max-width:90px;">
					<span>CPs</span>
					<input type="text" name="cps" inputmode="decimal" value={data.cls.cps ?? ''} />
				</label>
				<label class="field">
					<span>Klausur</span>
					<input type="date" name="exam_date" value={data.cls.exam_date ?? ''} />
				</label>
				<label class="field" style="min-width:220px;">
					<span>Archiv-URL (Boox)</span>
					<input type="text" name="archive_url" value={data.cls.archive_url ?? ''} />
				</label>
				<button class="btn">✓ Speichern</button>
			</div>
		</form>
	</div>
</details>

<details class="sec" open={!!data.cls.description}>
	<summary>Beschreibung</summary>
	<div class="card">
		<form method="POST" action="?/updateDescription" use:enhance>
			<label class="field" style="width:100%;">
				<span>Weitere Infos &amp; Notizen zu dieser Class</span>
				<textarea
					name="description"
					rows="5"
					placeholder="Inhalte, Prüfungsform, wichtige Links, Sprechstunden …"
					value={data.cls.description ?? ''}
				></textarea>
			</label>
			<div style="margin-top:12px;">
				<button class="btn">✓ Beschreibung speichern</button>
			</div>
		</form>
	</div>
</details>

<details class="sec" open>
	<summary>Tasks · {data.tasks.length}</summary>
	<details class="editor" style="margin-bottom:14px;">
		<summary>＋ Neue Task für „{data.cls.name}“</summary>
		<form method="POST" action="?/createTask" use:enhance>
			<div class="form-row">
				<label class="field" style="flex:1; min-width:220px;">
					<span>Titel</span>
					<input type="text" name="title" required placeholder="Übungsblatt 5 bearbeiten" />
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
	<div class="card">
		{#if data.tasks.length === 0}
			<p class="dim" style="margin:0;">
				Keine Tasks zu dieser Class — oben mit „＋ Neue Task“ anlegen.
			</p>
		{:else}
			<div class="rows">
				{#each data.tasks as task (task.id)}
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
						{#if task.task_type}
							<span class="chip mono">{UNI_TASK_TYPE_LABELS[task.task_type]}</span>
						{/if}
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
						{#if task.status !== 'done' && task.status !== 'wont_do'}
							<form class="inline" method="POST" action="?/week" use:enhance>
								<input type="hidden" name="id" value={task.id} />
								<input type="hidden" name="on" value={task.this_week ? '0' : '1'} />
								<button class="fchip">{task.this_week ? '→ Backlog' : '→ This Week'}</button>
							</form>
						{/if}
						<form class="inline" method="POST" action="?/deleteTask" use:enhance>
							<input type="hidden" name="id" value={task.id} />
							<button class="iconbtn" title="Löschen" aria-label="„{task.title}“ löschen">✕</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</details>

<style>
	/* Collapsible content section — the header doubles as the h2.sect divider. */
	details.sec {
		margin: 26px 0 0;
	}
	details.sec > summary {
		list-style: none;
		cursor: pointer;
		user-select: none;
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 12.5px;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink2);
		margin-bottom: 12px;
		transition: color var(--dur) var(--ease);
	}
	details.sec > summary::-webkit-details-marker {
		display: none;
	}
	details.sec > summary::before {
		content: '›';
		display: inline-block;
		font-size: 16px;
		line-height: 1;
		color: var(--ink3);
		transition:
			transform var(--dur) var(--ease),
			color var(--dur) var(--ease);
	}
	details.sec[open] > summary::before {
		transform: rotate(90deg);
	}
	details.sec > summary::after {
		content: '';
		flex: 1;
		border-top: 1px solid var(--line);
	}
	details.sec > summary:hover {
		color: var(--ink);
	}
	details.sec > summary:hover::before {
		color: var(--accent);
	}
</style>
