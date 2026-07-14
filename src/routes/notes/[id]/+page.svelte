<script lang="ts">
	import { enhance } from '$app/forms';
	import Editor from '$lib/editor/Editor.svelte';
	import { formatDate } from '$lib/format';
	import { BEREICHE, BEREICH_LABELS, parseTags } from '$lib/labels';

	let { data, form } = $props();

	function confirmDelete(event: SubmitEvent) {
		if (!confirm(`Notiz „${data.note.title}“ löschen?`)) event.preventDefault();
	}
</script>

<svelte:head><title>{data.note.title} · Zentrale</title></svelte:head>

<div class="page-head">
	<div>
		<p class="eyebrow"><a href="/notes">🔒 Notes</a></p>
		<h1>{data.note.title}</h1>
		<p class="lede" style="margin-bottom:0;">
			{#if data.note.inbox}
				<span class="badge warn">📥 Inbox — Bereich wählen zum Einsortieren</span>
			{:else if data.note.bereich}
				<span class="chip">{BEREICH_LABELS[data.note.bereich]}</span>
			{/if}
			<span class="dim small">zuletzt {formatDate(data.note.updated_at.slice(0, 10))}</span>
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
			<label class="field" style="flex:1; min-width:220px;">
				<span>Titel</span>
				<input type="text" name="title" required value={data.note.title} />
			</label>
			<label class="field">
				<span>Bereich</span>
				<select name="bereich">
					<option value="">📥 (Inbox)</option>
					{#each BEREICHE as bereich (bereich)}
						<option value={bereich} selected={data.note.bereich === bereich}
							>{BEREICH_LABELS[bereich]}</option
						>
					{/each}
				</select>
			</label>
			<label class="field" style="min-width:200px;">
				<span>Tags (Komma-getrennt)</span>
				<input type="text" name="tags" value={parseTags(data.note.tags).join(', ')} />
			</label>
			<button class="btn ghost">✓ Speichern</button>
		</div>
	</form>
</div>

<form method="POST" action="?/save" use:enhance>
	<Editor content={data.note.content} html={data.html} />
	<div style="display:flex; justify-content:flex-end; margin-top:12px;">
		<button class="btn">✓ Inhalt speichern</button>
	</div>
</form>
