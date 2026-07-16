<script lang="ts">
	import { enhance } from '$app/forms';
	import Editor from '$lib/editor/Editor.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>0{data.priority.rank} · {data.priority.name} · Zentrale</title></svelte:head>

<div class="page-head">
	<div>
		<p class="eyebrow"><a href="/curriculum">Curriculum</a> · 25-5 · Prioritäten</p>
		<h1><span class="mono rank">0{data.priority.rank}</span> {data.priority.name}</h1>
		{#if data.priority.note}<p class="lede" style="margin-bottom:0;">{data.priority.note}</p>{/if}
	</div>
</div>

{#if form?.message}<p class="form-error">{form.message}</p>{/if}

<h2 class="sect">Details</h2>
<div class="card">
	<form method="POST" action="?/update" use:enhance>
		<div class="form-row">
			<label class="field" style="min-width:200px;">
				<span>Name</span>
				<input type="text" name="name" required value={data.priority.name} />
			</label>
			<label class="field" style="flex:1; min-width:220px;">
				<span>Notiz (einzeilig)</span>
				<input type="text" name="note" value={data.priority.note ?? ''} />
			</label>
			<button class="btn">✓ Speichern</button>
		</div>
	</form>
</div>

<h2 class="sect">Beschreibung &amp; Notizen</h2>
<form method="POST" action="?/saveDescription" use:enhance>
	<Editor content={data.content} html={data.html} />
	<div style="display:flex; justify-content:flex-end; margin-top:12px;">
		<button class="btn">✓ Beschreibung speichern</button>
	</div>
</form>

{#if data.quotas.length > 0}
	<h2 class="sect">Wochenquoten mit dieser Priorität</h2>
	<div class="card">
		<div class="rows">
			{#each data.quotas as quota (quota.id)}
				<div class="row">
					<span class="title">{quota.title}</span>
					<a class="chip" href="/curriculum?phase={quota.phase_id}"
						>{quota.phase_status === 'archived' ? '▣ ' : ''}{quota.phase_name}</a
					>
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if data.minis.length > 0}
	<h2 class="sect">Mini-Curricula mit dieser Priorität</h2>
	<div class="card">
		<div class="rows">
			{#each data.minis as mini (mini.id)}
				<div class="row">
					<span class="title">{mini.name}</span>
					<a class="chip" href="/curriculum">↗ Curriculum</a>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.rank {
		font-size: 0.6em;
		color: var(--accent);
		font-weight: 700;
		letter-spacing: 0.04em;
		vertical-align: middle;
	}
</style>
