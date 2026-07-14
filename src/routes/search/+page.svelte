<script lang="ts">
	let { data } = $props();

	const KIND_LABELS: Record<string, string> = {
		task: '⚡ Task',
		uni_task: '🎓 Uni-Task',
		class: '🎓 Class',
		note: '🔒 Notiz',
		project: '💻 Projekt'
	};
</script>

<svelte:head><title>Suche · Zentrale</title></svelte:head>

<p class="eyebrow">🔍 Suche</p>
<h1>Suche</h1>

<div class="card" style="margin-bottom:18px;">
	<form method="GET" action="/search">
		<div class="form-row">
			<label class="field" style="flex:1; min-width:240px;">
				<span>Überall suchen (Tasks · Uni · Notes · Projects)</span>
				<!-- svelte-ignore a11y_autofocus — dedizierte Suchseite -->
				<input type="search" name="q" value={data.q} placeholder="z. B. Maillard, Übungsblatt, EPITA …" autofocus />
			</label>
			<button class="btn">🔍 Suchen</button>
		</div>
	</form>
</div>

{#if data.q}
	<h2 class="sect">Treffer · {data.hits.length}</h2>
	<div class="card">
		{#if data.hits.length === 0}
			<p class="dim" style="margin:0;">Nichts gefunden für „{data.q}“.</p>
		{:else}
			<div class="rows">
				{#each data.hits as hit (`${hit.kind}-${hit.ref_id}`)}
					<div class="row">
						<span class="chip">{KIND_LABELS[hit.kind] ?? hit.kind}</span>
						<span class="title"><a href={hit.href}>{hit.title}</a></span>
						{#if hit.snippet}
							<!-- eslint-disable-next-line svelte/no-at-html-tags — snippet() escaped by FTS -->
							<span class="dim small">{hit.snippet}</span>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
