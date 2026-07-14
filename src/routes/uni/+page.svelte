<script lang="ts">
	import { enhance } from '$app/forms';
	import PrioritySelect from '$lib/PrioritySelect.svelte';
	import { formatDate, formatDeadline, daysUntil } from '$lib/format';
	import { CLASS_STATUS_LABELS, PRIORITY_LABELS, UNI_TASK_TYPE_LABELS } from '$lib/labels';
	import type { UniTask } from '$lib/server/uni';

	let { data, form } = $props();

	const selectedSemester = $derived(data.semesters.find((s) => s.id === data.selected) ?? null);

	function confirmSubmit(message: string) {
		return (event: SubmitEvent) => {
			if (!confirm(message)) event.preventDefault();
		};
	}
</script>

<svelte:head><title>Uni · Zentrale</title></svelte:head>

{#snippet taskRow(task: UniTask)}
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
				<input type="hidden" name="on" value="0" />
				<button class="fchip" title="Zurück ins Backlog">→ Backlog</button>
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
		<p class="eyebrow">Uni</p>
		<h1>Uni Management</h1>
	</div>
	<div class="actions">
		<a class="btn ghost" href="/uni/tasks">Task-Datenbank →</a>
	</div>
</div>

{#if form?.message}<p class="form-error">{form.message}</p>{/if}

<h2 class="sect">Semester</h2>
{#if data.semesters.length > 0}
	<div class="filters">
		{#each data.semesters as sem (sem.id)}
			<a class="fchip" class:on={sem.id === data.selected} href="/uni?semester={sem.id}"
				>{sem.status === 'archived' ? '▣ ' : ''}{sem.name}
				<span class="mono">· {sem.class_count}</span></a
			>
		{/each}
	</div>
{/if}
<details class="editor" open={data.semesters.length === 0} style="margin-bottom:8px;">
	<summary
		>{data.semesters.length === 0 ? '＋ Erstes Semester anlegen' : 'Semester verwalten'}</summary
	>
	<div class="form-row">
		<form method="POST" action="?/createSemester" use:enhance style="display:contents;">
			<label class="field">
				<span>Neues Semester</span>
				<input type="text" name="name" required placeholder="SS 26" />
			</label>
			<button class="btn">＋ Anlegen</button>
		</form>
		{#if selectedSemester}
			<span class="sep"></span>
			<form class="inline" method="POST" action="?/semesterStatus" use:enhance>
				<input type="hidden" name="id" value={selectedSemester.id} />
				<input
					type="hidden"
					name="status"
					value={selectedSemester.status === 'active' ? 'archived' : 'active'}
				/>
				<button class="btn ghost"
					>{selectedSemester.status === 'active'
						? `▣ „${selectedSemester.name}“ archivieren`
						: `● „${selectedSemester.name}“ aktivieren`}</button
				>
			</form>
			<form
				class="inline"
				method="POST"
				action="?/deleteSemester"
				onsubmit={confirmSubmit(
					`Semester „${selectedSemester.name}“ samt allen Classes löschen? Uni-Tasks bleiben (ohne Modul).`
				)}
			>
				<input type="hidden" name="id" value={selectedSemester.id} />
				<button class="btn ghost">✕ Löschen</button>
			</form>
		{/if}
	</div>
</details>

{#if selectedSemester}
	<h2 class="sect">
		Classes · {selectedSemester.name}
		{#if selectedSemester.status === 'archived'}<span class="soft">▣ archiviert</span>{/if}
	</h2>
	{#if data.classes.length === 0}
		<div class="card dashed">
			<p class="dimmer" style="margin:0;">Noch keine Classes in diesem Semester.</p>
		</div>
	{:else}
		<div class="grid cols-3">
			{#each data.classes as cls (cls.id)}
				<div class="card uclass lift">
					<a class="stretch" href="/uni/classes/{cls.id}" aria-label="„{cls.name}“ öffnen"></a>
					<div class="uclass-head">
						<h3>{cls.name}</h3>
						<span class="badge {CLASS_STATUS_LABELS[cls.status].tone}"
							>{CLASS_STATUS_LABELS[cls.status].label}</span
						>
					</div>
					<div class="uclass-meta">
						{#if cls.professor}<span>{cls.professor}</span>{/if}
						{#if cls.schedule || cls.room}
							<span class="mono"
								>{cls.schedule ?? ''}{#if cls.schedule && cls.room} · {/if}{cls.room ?? ''}</span
							>
						{/if}
						{#if cls.cps}<span class="mono">{cls.cps} CP</span>{/if}
						{#if cls.exam_date}
							<span
								>Klausur:
								<span class="mono" class:crit-text={daysUntil(cls.exam_date) <= 14}
									>{formatDate(cls.exam_date)}</span
								>{#if daysUntil(cls.exam_date) >= 0}
									(in {daysUntil(cls.exam_date)} Tagen){/if}</span
							>
						{/if}
						{#if cls.description}<span class="desc dimmer">{cls.description}</span>{/if}
					</div>
					<div class="uclass-foot">
						{#if cls.open_tasks > 0}<span class="chip accent">{cls.open_tasks} offen</span>{/if}
						{#if cls.archive_url}
							<a class="more above" href={cls.archive_url} target="_blank" rel="noreferrer"
								>↗ Notizen-Archiv (Boox)</a
							>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<details class="editor" open={data.classes.length === 0} style="margin-top:14px;">
		<summary>＋ Class anlegen</summary>
		<form method="POST" action="?/createClass" use:enhance>
			<input type="hidden" name="semester_id" value={selectedSemester.id} />
			<div class="form-row">
				<label class="field" style="flex:1; min-width:200px;">
					<span>Name</span>
					<input type="text" name="name" required placeholder="Algorithmen & Datenstrukturen" />
				</label>
				<label class="field">
					<span>Professor</span>
					<input type="text" name="professor" />
				</label>
				<label class="field">
					<span>Schedule</span>
					<input type="text" name="schedule" placeholder="Di 09:50 · Fr 08:00" />
				</label>
				<label class="field">
					<span>Raum</span>
					<input type="text" name="room" />
				</label>
				<label class="field" style="max-width:90px;">
					<span>CPs</span>
					<input type="text" name="cps" inputmode="decimal" placeholder="5" />
				</label>
				<label class="field">
					<span>Klausur</span>
					<input type="date" name="exam_date" />
				</label>
				<label class="field" style="min-width:200px;">
					<span>Archiv-URL (Boox)</span>
					<input type="text" name="archive_url" placeholder="https://…" />
				</label>
				<button class="btn">＋ Anlegen</button>
			</div>
		</form>
	</details>
{/if}

<h2 class="sect">
	This Week · {data.weekOpen.length} offen
	<span class="soft">{data.stats.done}/{data.stats.total} erledigt</span>
</h2>
<div class="card" style="margin-bottom:14px;">
	<form method="POST" action="?/createTask" use:enhance>
		<div class="form-row">
			<label class="field" style="flex:1; min-width:220px;">
				<span>Neue Uni-Task</span>
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
			<label class="check"><input type="checkbox" name="this_week" checked /> This Week</label>
			<button class="btn">＋ Anlegen</button>
		</div>
	</form>
</div>
<div class="card">
	{#if data.weekOpen.length === 0 && data.weekDone.length === 0}
		<p class="dim" style="margin:0;">
			Nichts eingeplant — neue Task oben anlegen oder im
			<a href="/uni/tasks">Backlog der Task-Datenbank</a> „→ This Week“ drücken.
		</p>
	{:else}
		<div class="rows">
			{#each data.weekOpen as task (task.id)}
				{@render taskRow(task)}
			{/each}
			{#each data.weekDone as task (task.id)}
				{@render taskRow(task)}
			{/each}
		</div>
	{/if}
	<a class="more" href="/uni/tasks">Volle Task-Datenbank →</a>
</div>

<style>
	.crit-text {
		color: var(--crit);
		font-weight: 600;
	}

	/* Class card — the whole box is the link (stretched-link pattern). */
	.uclass {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.uclass .stretch {
		position: absolute;
		inset: 0;
		z-index: 1;
		border-radius: inherit;
	}
	.uclass .stretch:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	/* Secondary links (archive) must rise above the stretched link. */
	.uclass .above {
		position: relative;
		z-index: 2;
	}
	.uclass-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
	}
	.uclass-head h3 {
		margin: 0;
		font-size: 16.5px;
		font-weight: 650;
		letter-spacing: -0.01em;
		line-height: 1.35;
		color: var(--ink);
		transition: color var(--dur) var(--ease);
	}
	.uclass:hover .uclass-head h3 {
		color: var(--accent);
	}
	.uclass-meta {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 13.5px;
		color: var(--ink2);
	}
	.uclass-meta .mono {
		color: var(--ink2);
	}
	.uclass-meta .desc {
		margin-top: 2px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-height: 1.5;
	}
	.uclass-foot {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		margin-top: auto;
	}
	.uclass-foot .more {
		margin-top: 0;
	}
</style>
