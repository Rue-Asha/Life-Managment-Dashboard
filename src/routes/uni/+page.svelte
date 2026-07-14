<script lang="ts">
	import { enhance } from '$app/forms';
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
		<p class="eyebrow">🎓 Uni</p>
		<h1>Uni Management</h1>
	</div>
	<div class="actions">
		<a class="btn ghost" href="/uni/tasks">☰ Task-Datenbank →</a>
	</div>
</div>

{#if form?.message}<p class="form-error">{form.message}</p>{/if}

<h2 class="sect">Semester</h2>
<div class="card">
	{#if data.semesters.length === 0}
		<p class="dim" style="margin-top:0;">Noch kein Semester — unten anlegen (z.&nbsp;B. „SS 26“).</p>
	{:else}
		<div class="filters" style="margin-bottom:14px;">
			{#each data.semesters as sem (sem.id)}
				<a class="fchip" class:on={sem.id === data.selected} href="/uni?semester={sem.id}"
					>{sem.status === 'archived' ? '▣ ' : ''}{sem.name}
					<span class="mono">· {sem.class_count}</span></a
				>
			{/each}
		</div>
	{/if}
	<div class="form-row">
		<form method="POST" action="?/createSemester" use:enhance style="display:contents;">
			<label class="field">
				<span>Neues Semester</span>
				<input type="text" name="name" required placeholder="SS 26" />
			</label>
			<button class="btn">＋ Anlegen</button>
		</form>
		{#if selectedSemester}
			<span class="filters sep"></span>
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
</div>

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
				<div class="card">
					<h3><a href="/uni/classes/{cls.id}">{cls.name}</a></h3>
					<p style="margin:0 0 10px;">
						<span class="badge {CLASS_STATUS_LABELS[cls.status].tone}"
							>{CLASS_STATUS_LABELS[cls.status].label}</span
						>
						{#if cls.open_tasks > 0}<span class="chip">⚡ {cls.open_tasks} offen</span>{/if}
					</p>
					<p class="dim mono" style="margin:0; font-size:13px; line-height:1.9;">
						{#if cls.professor}{cls.professor}<br />{/if}
						{#if cls.schedule}{cls.schedule}{#if cls.room} · {cls.room}{/if}<br
							/>{:else if cls.room}{cls.room}<br />{/if}
						{#if cls.cps}{cls.cps} CP<br />{/if}
						{#if cls.exam_date}
							Klausur: <span class:crit-text={daysUntil(cls.exam_date) <= 14}
								>{formatDate(cls.exam_date)}</span
							>{#if daysUntil(cls.exam_date) >= 0}
								(in {daysUntil(cls.exam_date)} Tagen){/if}
						{/if}
					</p>
					{#if cls.archive_url}
						<a class="more" href={cls.archive_url} target="_blank" rel="noreferrer"
							>↗ Notizen-Archiv (Boox)</a
						>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<h2 class="sect">＋ Class anlegen</h2>
	<div class="card">
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
	</div>
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
	<a class="more" href="/uni/tasks">☰ Volle Task-Datenbank →</a>
</div>

<style>
	.crit-text {
		color: var(--crit);
		font-weight: 600;
	}
</style>
