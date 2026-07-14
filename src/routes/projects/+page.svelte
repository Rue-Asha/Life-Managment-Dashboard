<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDate } from '$lib/format';
	import {
		PRIORITY_LABELS,
		PROJECT_STATUSES,
		PROJECT_STATUS_LABELS,
		PROJECT_TYPES,
		PROJECT_TYPE_LABELS
	} from '$lib/labels';
	import type { Project } from '$lib/server/projects';

	let { data, form } = $props();

	const byStatus = $derived(
		Object.fromEntries(
			PROJECT_STATUSES.map((status) => [
				status,
				data.projects.filter((p) => p.status === status)
			])
		) as Record<(typeof PROJECT_STATUSES)[number], Project[]>
	);

	const views = [
		{ id: 'grid', label: '🞔 Kacheln' },
		{ id: 'list', label: '☰ Liste' },
		{ id: 'board', label: '▦ Board' }
	] as const;
</script>

<svelte:head><title>Projects · Zentrale</title></svelte:head>

{#snippet statusMove(project: Project)}
	<form class="inline" method="POST" action="?/status" use:enhance>
		<input type="hidden" name="id" value={project.id} />
		<select
			name="status"
			class="mini-select mono"
			aria-label="Status von „{project.name}“"
			onchange={(e) => e.currentTarget.form?.requestSubmit()}
		>
			{#each PROJECT_STATUSES as status (status)}
				<option value={status} selected={project.status === status}
					>{PROJECT_STATUS_LABELS[status].label}</option
				>
			{/each}
		</select>
		<noscript><button class="fchip">Setzen</button></noscript>
	</form>
{/snippet}

{#snippet projectCard(project: Project)}
	<div class="card pcard">
		<h3><a href="/projects/{project.id}">{project.name}</a></h3>
		<p style="margin:0 0 8px; display:flex; gap:6px; flex-wrap:wrap;">
			<span class="badge {PROJECT_STATUS_LABELS[project.status].tone}"
				>{PROJECT_STATUS_LABELS[project.status].label}</span
			>
			<span class="chip">{PROJECT_TYPE_LABELS[project.type]}</span>
			{#if project.priority}
				<span class="badge {PRIORITY_LABELS[project.priority].tone}"
					>{PRIORITY_LABELS[project.priority].label}</span
				>
			{/if}
		</p>
		{#if project.description}
			<p class="dim" style="margin:0 0 8px; font-size:13.5px;">{project.description}</p>
		{/if}
		<p class="dimmer mono" style="margin:0; font-size:12.5px; line-height:1.8;">
			{#if project.tech_stack}{project.tech_stack}<br />{/if}
			{#if project.start_date}seit {formatDate(project.start_date)}{/if}
		</p>
		{#if project.link}
			<a class="more" href={project.link} target="_blank" rel="noreferrer">↗ Link</a>
		{/if}
	</div>
{/snippet}

<div class="page-head">
	<div>
		<p class="eyebrow">💻 Projects</p>
		<h1>IT Projects</h1>
	</div>
	<div class="filters" style="margin:0;">
		{#each views as v (v.id)}
			<a class="fchip" class:on={data.view === v.id} href="/projects?view={v.id}">{v.label}</a>
		{/each}
	</div>
</div>

{#if form?.message}<p class="form-error">{form.message}</p>{/if}

{#if data.view === 'grid'}
	{#if data.projects.length === 0}
		<div class="card dashed"><p class="dimmer" style="margin:0;">Noch keine Projekte.</p></div>
	{:else}
		<div class="grid cols-3">
			{#each data.projects.filter((p) => p.status !== 'archived') as project (project.id)}
				{@render projectCard(project)}
			{/each}
		</div>
		{#if byStatus.archived.length > 0}
			<h2 class="sect">▣ Archiviert · {byStatus.archived.length}</h2>
			<div class="grid cols-3">
				{#each byStatus.archived as project (project.id)}
					{@render projectCard(project)}
				{/each}
			</div>
		{/if}
	{/if}
{:else if data.view === 'list'}
	<div class="card">
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Typ</th>
						<th>Status</th>
						<th>Priorität</th>
						<th>Stack</th>
						<th>Start</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.projects as project (project.id)}
						<tr>
							<td><a href="/projects/{project.id}">{project.name}</a></td>
							<td class="muted">{PROJECT_TYPE_LABELS[project.type]}</td>
							<td>{@render statusMove(project)}</td>
							<td>
								{#if project.priority}
									<span class="badge {PRIORITY_LABELS[project.priority].tone}"
										>{PRIORITY_LABELS[project.priority].label}</span
									>
								{:else}<span class="muted">–</span>{/if}
							</td>
							<td class="muted mono small">{project.tech_stack ?? '–'}</td>
							<td class="muted">{project.start_date ? formatDate(project.start_date) : '–'}</td>
							<td>
								<form class="inline" method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={project.id} />
									<button class="iconbtn" title="Löschen">✕</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{:else}
	<div class="board">
		{#each PROJECT_STATUSES as status (status)}
			<div class="bcol">
				<p class="bhead mono">
					{PROJECT_STATUS_LABELS[status].label} · {byStatus[status].length}
				</p>
				{#each byStatus[status] as project (project.id)}
					<div class="bcard">
						<a href="/projects/{project.id}"><strong>{project.name}</strong></a>
						<p style="margin:4px 0 0; display:flex; gap:5px; flex-wrap:wrap;">
							<span class="chip">{PROJECT_TYPE_LABELS[project.type]}</span>
							{#if project.priority}
								<span class="badge {PRIORITY_LABELS[project.priority].tone}"
									>{PRIORITY_LABELS[project.priority].label}</span
								>
							{/if}
						</p>
						<div style="margin-top:8px;">{@render statusMove(project)}</div>
					</div>
				{:else}
					<p class="dimmer small" style="margin:6px 0;">—</p>
				{/each}
			</div>
		{/each}
	</div>
{/if}

<h2 class="sect">＋ Neues Projekt</h2>
<div class="card">
	<form method="POST" action="?/create" use:enhance>
		<div class="form-row">
			<label class="field" style="flex:1; min-width:200px;">
				<span>Name</span>
				<input type="text" name="name" required />
			</label>
			<label class="field">
				<span>Typ</span>
				<select name="type">
					{#each PROJECT_TYPES as type (type)}
						<option value={type}>{PROJECT_TYPE_LABELS[type]}</option>
					{/each}
				</select>
			</label>
			<label class="field">
				<span>Status</span>
				<select name="status">
					{#each PROJECT_STATUSES as status (status)}
						<option value={status}>{PROJECT_STATUS_LABELS[status].label}</option>
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
			<label class="field" style="min-width:180px;">
				<span>Tech-Stack</span>
				<input type="text" name="tech_stack" placeholder="SvelteKit · SQLite" />
			</label>
			<label class="field" style="min-width:180px;">
				<span>Link (Repo/Demo)</span>
				<input type="text" name="link" placeholder="https://…" />
			</label>
			<label class="field">
				<span>Start</span>
				<input type="date" name="start_date" />
			</label>
			<label class="field" style="flex:1; min-width:220px;">
				<span>Beschreibung (kurz)</span>
				<input type="text" name="description" />
			</label>
			<button class="btn">＋ Anlegen</button>
		</div>
	</form>
</div>

<style>
	.pcard h3 {
		margin-bottom: 8px;
	}

	.mini-select {
		font-size: 12px;
		padding: 3px 6px;
		border: 1px solid var(--line);
		border-radius: 7px;
		background: var(--surface);
		color: inherit;
	}

	.board {
		display: flex;
		gap: 14px;
		overflow-x: auto;
		padding-bottom: 8px;
	}

	.bcol {
		flex: 1;
		min-width: 210px;
	}

	.bhead {
		font-size: 11.5px;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--ink3);
		border-bottom: 2px solid var(--line);
		padding-bottom: 6px;
		margin: 0 0 10px;
	}

	.bcard {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 12px 14px;
		margin-bottom: 10px;
		font-size: 14px;
	}
</style>
