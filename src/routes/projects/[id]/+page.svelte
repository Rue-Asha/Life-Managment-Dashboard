<script lang="ts">
	import { enhance } from '$app/forms';
	import Editor from '$lib/editor/Editor.svelte';
	import {
		PRIORITIES,
		PRIORITY_LABELS,
		PROJECT_STATUSES,
		PROJECT_STATUS_LABELS,
		PROJECT_TYPES,
		PROJECT_TYPE_LABELS
	} from '$lib/labels';

	let { data, form } = $props();

	function confirmDelete(event: SubmitEvent) {
		if (!confirm(`Projekt „${data.project.name}“ löschen?`)) event.preventDefault();
	}
</script>

<svelte:head><title>{data.project.name} · Zentrale</title></svelte:head>

<div class="page-head">
	<div>
		<p class="eyebrow"><a href="/projects">💻 Projects</a></p>
		<h1>{data.project.name}</h1>
		<p class="lede" style="margin-bottom:0;">
			<span class="badge {PROJECT_STATUS_LABELS[data.project.status].tone}"
				>{PROJECT_STATUS_LABELS[data.project.status].label}</span
			>
			<span class="chip">{PROJECT_TYPE_LABELS[data.project.type]}</span>
			{#if data.project.link}
				<a class="fchip" href={data.project.link} target="_blank" rel="noreferrer">↗ Link</a>
			{/if}
		</p>
	</div>
	<div class="actions">
		<form class="inline" method="POST" action="?/delete" onsubmit={confirmDelete}>
			<button class="btn ghost">✕ Löschen</button>
		</form>
	</div>
</div>

{#if form?.message}<p class="form-error">{form.message}</p>{/if}

<div class="card" style="margin-bottom:18px;">
	<form method="POST" action="?/meta" use:enhance>
		<div class="form-row">
			<label class="field" style="flex:1; min-width:180px;">
				<span>Name</span>
				<input type="text" name="name" required value={data.project.name} />
			</label>
			<label class="field">
				<span>Typ</span>
				<select name="type">
					{#each PROJECT_TYPES as type (type)}
						<option value={type} selected={data.project.type === type}
							>{PROJECT_TYPE_LABELS[type]}</option
						>
					{/each}
				</select>
			</label>
			<label class="field">
				<span>Status</span>
				<select name="status">
					{#each PROJECT_STATUSES as status (status)}
						<option value={status} selected={data.project.status === status}
							>{PROJECT_STATUS_LABELS[status].label}</option
						>
					{/each}
				</select>
			</label>
			<label class="field">
				<span>Priorität</span>
				<select name="priority">
					<option value="">—</option>
					{#each PRIORITIES as priority (priority)}
						<option value={priority} selected={data.project.priority === priority}
							>{PRIORITY_LABELS[priority].label}</option
						>
					{/each}
				</select>
			</label>
			<label class="field" style="min-width:170px;">
				<span>Tech-Stack</span>
				<input type="text" name="tech_stack" value={data.project.tech_stack ?? ''} />
			</label>
			<label class="field" style="min-width:170px;">
				<span>Link</span>
				<input type="text" name="link" value={data.project.link ?? ''} />
			</label>
			<label class="field">
				<span>Start</span>
				<input type="date" name="start_date" value={data.project.start_date ?? ''} />
			</label>
			<label class="field" style="flex:1; min-width:200px;">
				<span>Beschreibung</span>
				<input type="text" name="description" value={data.project.description ?? ''} />
			</label>
			<button class="btn ghost">✓ Speichern</button>
		</div>
	</form>
</div>

<h2 class="sect">Projekt-Doku</h2>
<form method="POST" action="?/save" use:enhance>
	<Editor content={data.project.content} html={data.html} />
	<div style="display:flex; justify-content:flex-end; margin-top:12px;">
		<button class="btn">✓ Inhalt speichern</button>
	</div>
</form>
