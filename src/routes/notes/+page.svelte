<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDate } from '$lib/format';
	import { BEREICHE, BEREICH_LABELS, parseTags } from '$lib/labels';
	import type { Note } from '$lib/server/notes';

	let { data, form } = $props();
</script>

<svelte:head><title>Notes · Zentrale</title></svelte:head>

{#snippet noteRow(note: Note)}
	<div class="row">
		<span class="title"><a href="/notes/{note.id}">{note.title}</a></span>
		{#if note.bereich}<span class="chip">{BEREICH_LABELS[note.bereich]}</span>{/if}
		{#each parseTags(note.tags) as tag (tag)}
			<span class="chip mono">#{tag}</span>
		{/each}
		{#if note.snippet}<span class="dim small snippet">{note.snippet}</span>{/if}
		<span class="due">{formatDate(note.updated_at.slice(0, 10))}</span>
		<form class="inline" method="POST" action="?/delete" use:enhance>
			<input type="hidden" name="id" value={note.id} />
			<button class="iconbtn" title="Löschen" aria-label="„{note.title}“ löschen">✕</button>
		</form>
	</div>
{/snippet}

<div class="page-head">
	<div>
		<p class="eyebrow">Notes</p>
		<h1>Notes</h1>
		<p class="lede" style="margin-bottom:0;">
			Capture zuerst, einsortieren sonntags — der Bereich wird auf der Notiz-Seite gesetzt.
		</p>
	</div>
</div>

<h2 class="sect">Neu</h2>
<div class="card">
	<form method="POST" action="?/create" use:enhance>
		<div class="form-row">
			<label class="field" style="flex:1; min-width:240px;">
				<span>Quick Capture → Inbox</span>
				<input type="text" name="title" required placeholder="Gedanke, Link, Idee …" />
			</label>
			<button class="btn">＋ In die Inbox</button>
		</div>
	</form>
	{#if form?.message}<p class="form-error">{form.message}</p>{/if}
</div>

<h2 class="sect">
	Inbox · {data.inbox.length}
	{#if data.inbox.length > 0}<span class="soft">sonntags leeren</span>{/if}
</h2>
<div class="card" class:dashed={data.inbox.length === 0}>
	{#if data.inbox.length === 0}
		<p class="dimmer" style="margin:0;">Inbox ist leer. ✓</p>
	{:else}
		<div class="rows">
			{#each data.inbox as note (note.id)}
				{@render noteRow(note)}
			{/each}
		</div>
	{/if}
</div>

<h2 class="sect">Abgelegt</h2>
<div class="filters">
	<a class="fchip" class:on={data.bereich === null} href="/notes">Alle</a>
	{#each BEREICHE as bereich (bereich)}
		<a class="fchip" class:on={data.bereich === bereich} href="/notes?bereich={bereich}"
			>{BEREICH_LABELS[bereich]}
			{#if data.counts[bereich]}<span class="mono">· {data.counts[bereich]}</span>{/if}</a
		>
	{/each}
</div>
<div class="card">
	{#if data.notes.length === 0}
		<p class="dim" style="margin:0;">Keine Notizen in dieser Ansicht.</p>
	{:else}
		<div class="rows">
			{#each data.notes as note (note.id)}
				{@render noteRow(note)}
			{/each}
		</div>
	{/if}
</div>

<style>
	.snippet {
		max-width: 340px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
