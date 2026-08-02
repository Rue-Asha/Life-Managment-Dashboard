<script lang="ts">
	import { enhance } from '$app/forms';
	import { beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import ImageSlot from '$lib/ImageSlot.svelte';
	import NoteEditor from '$lib/editor/NoteEditor.svelte';
	import { autosave, quietEnhance } from '$lib/autosave';
	import { INBOX_COLOR, NOTE_KIND_LABEL, folderColor } from '$lib/labels';
	import { wordCount } from '$lib/editor/doc';
	import { fmtDay } from '$lib/format';
	import type { Note } from '$lib/server/notes';

	let { data } = $props();

	let q = $state('');
	let collapsed: Record<string, boolean> = $state({});

	const pad = (n: number) => String(n).padStart(2, '0');
	const slots = $derived(new Set(page.data.imageSlots as string[]));

	function matches(n: Note): boolean {
		const query = q.trim().toLowerCase();
		if (!query) return true;
		return (n.title + n.body).toLowerCase().includes(query);
	}

	// One accent per folder, keyed by folder id (inbox = null). A note borrows the
	// accent of its folder, so tree entry and editor stay the same colour.
	const accents = $derived.by(() => {
		const map = new Map<number | null, string>([[null, INBOX_COLOR]]);
		data.folders.forEach((fo, i) => map.set(fo.id, folderColor(i)));
		return map;
	});
	const accentOf = (folderId: number | null): string => accents.get(folderId) ?? INBOX_COLOR;

	// "No folder" (inbox) first, then the folders that were created.
	const tree = $derived.by(() => {
		const inbox = {
			key: 'inbox',
			id: null as number | null,
			name: 'No folder',
			accent: accentOf(null),
			canDelete: false,
			items: data.notes.filter((n) => n.folder_id === null && matches(n))
		};
		const rest = data.folders.map((fo) => ({
			key: String(fo.id),
			id: fo.id as number | null,
			name: fo.name,
			accent: accentOf(fo.id),
			canDelete: true,
			items: data.notes.filter((n) => n.folder_id === fo.id && matches(n))
		}));
		return [inbox, ...rest];
	});

	function isOpen(key: string): boolean {
		return q.trim() ? true : !collapsed[key];
	}

	let folderForm: HTMLFormElement | undefined = $state();
	let folderName = $state('');
	function promptFolder() {
		const name = (window.prompt('Folder name') || '').trim();
		if (!name) return;
		folderName = name;
		queueMicrotask(() => folderForm?.requestSubmit());
	}

	let renameForm: HTMLFormElement | undefined = $state();
	let renameId = $state(0);
	let renameName = $state('');
	function promptRename(id: number, current: string) {
		const name = (window.prompt('Rename folder', current) || '').trim();
		if (!name) return;
		renameId = id;
		renameName = name;
		queueMicrotask(() => renameForm?.requestSubmit());
	}

	const note = $derived(data.active);
	const words = $derived(note ? wordCount(note.body) : 0);
	const noteAccent = $derived(note ? accentOf(note.folder_id) : INBOX_COLOR);

	// Editor autosave: the document goes into a hidden field and the form is
	// submitted debounced. Anything pending is saved right before a navigation —
	// otherwise a quick click on the next note costs the last few seconds of
	// typing.
	let docForm: HTMLFormElement | undefined = $state();
	let docJson = $state('');
	let docTimer: ReturnType<typeof setTimeout> | undefined;
	let docDirty = $state(false);

	function saveDoc() {
		clearTimeout(docTimer);
		if (!docDirty) return;
		docDirty = false;
		docForm?.requestSubmit();
	}

	function onDocChange(json: string) {
		docJson = json;
		docDirty = true;
		clearTimeout(docTimer);
		docTimer = setTimeout(saveDoc, 700);
	}

	beforeNavigate(saveDoc);

	// Drop anything pending when switching notes: a timer still in flight could
	// otherwise save the previous note's text under the new id. beforeNavigate
	// has already flushed it. The last id deliberately lives in a plain variable
	// — a freshly loaded `data` alone must not reset the editor.
	let lastNoteId: number | null = null;
	$effect(() => {
		const id = note?.id ?? null;
		if (id === lastNoteId) return;
		lastNoteId = id;
		clearTimeout(docTimer);
		docDirty = false;
		docJson = '';
	});
</script>

<div class="notes-grid">
	<section class="note-tree">
		<div class="note-tree-bar">
			<input type="search" placeholder="search…" bind:value={q} />
			<button type="button" class="btn-ghost" style="padding:5px 9px;font-size:10px;letter-spacing:normal" onclick={promptFolder}>
				+ Folder
			</button>
			<form bind:this={folderForm} method="POST" action="?/createFolder" use:enhance hidden>
				<input type="hidden" name="name" value={folderName} />
			</form>
			<form bind:this={renameForm} method="POST" action="?/renameFolder" use:enhance hidden>
				<input type="hidden" name="id" value={renameId} />
				<input type="hidden" name="name" value={renameName} />
			</form>
			<form method="POST" action="?/createNote" use:enhance>
				<input type="hidden" name="current" value={data.activeId ?? ''} />
				<button class="btn-primary" style="padding:5px 12px;font-size:12px">+ New</button>
			</form>
		</div>
		<div class="note-tree-scroll">
			{#each tree as fo (fo.key)}
				<div>
					<div
						class="folder-head"
						style="border-left-color:{fo.accent};background:linear-gradient(90deg,{fo.accent}2E 0%,{fo.accent}10 42%,rgba(14,12,13,0) 100%)"
					>
						<button
							type="button"
							class="folder-btn"
							onclick={() => (collapsed[fo.key] = !collapsed[fo.key])}
						>
							<span class="initial" style="color:{fo.accent}">{fo.name.trim().charAt(0).toUpperCase() || '?'}</span>
							<span class="fname">{fo.name}</span>
							<span class="fcount" style="color:{fo.accent}">{pad(fo.items.length)}</span>
							<span class="fmark">{isOpen(fo.key) ? '▾' : '▸'}</span>
						</button>
						{#if fo.canDelete}
							<span class="fops">
								<button type="button" title="rename" onclick={() => promptRename(fo.id!, fo.name)}>✎</button>
								<form method="POST" action="?/deleteFolder" use:enhance style="display:contents">
									<input type="hidden" name="id" value={fo.id} />
									<button class="danger" title="Delete folder">✕</button>
								</form>
							</span>
						{/if}
					</div>
					{#if isOpen(fo.key)}
						{#each fo.items as n (n.id)}
							<a
								class="note-item"
								class:on={n.id === data.activeId}
								style="--accent:{fo.accent}"
								href={`/notes?id=${n.id}`}
							>
								<div class="ntitle">{n.title || 'Untitled'}</div>
								<div class="nmeta">{NOTE_KIND_LABEL[n.kind]} · {fmtDay(n.updated_at.slice(0, 10))}</div>
							</a>
						{:else}
							<div class="folder-empty">empty</div>
						{/each}
					{/if}
				</div>
			{/each}
		</div>
	</section>

	<section class="note-editor" style="--accent:{noteAccent}">
		{#if note}
			{#key note.id}
				<form method="POST" action="?/title" use:quietEnhance>
					<input type="hidden" name="id" value={note.id} />
					<input class="title" name="title" placeholder="Title" value={note.title} use:autosave />
				</form>
				<div class="meta-row">
					<form method="POST" action="?/move" use:quietEnhance style="display:contents">
						<input type="hidden" name="id" value={note.id} />
						<select name="folder" value={note.folder_id == null ? '' : String(note.folder_id)} use:autosave>
							<option value="">No folder</option>
							{#each data.folders as fo (fo.id)}
								<option value={String(fo.id)}>{fo.name}</option>
							{/each}
						</select>
					</form>
					<span class="meta">UPDATED {fmtDay(note.updated_at.slice(0, 10)).toUpperCase()} · {words} WORDS</span>
					<form method="POST" action="?/deleteNote" use:enhance style="margin-left:auto">
						<input type="hidden" name="id" value={note.id} />
						<button class="btn-text">delete</button>
					</form>
				</div>
				<div class="note-cover">
					<ImageSlot
						slot={`note-cover-${note.id}`}
						placeholder="Cover image"
						has={slots.has(`note-cover-${note.id}`)}
					/>
					<div class="plate-shade" style="background:linear-gradient(180deg,rgba(11,10,10,0) 55%,rgba(11,10,10,0.6) 100%)"></div>
				</div>
				<form bind:this={docForm} method="POST" action="?/doc" use:quietEnhance>
					<input type="hidden" name="id" value={note.id} />
					<input type="hidden" name="doc" value={docJson} />
					<NoteEditor html={data.activeHtml} doc={data.activeDoc} onchange={onDocChange} />
				</form>
			{/key}
		{:else}
			<div class="empty-serif" style="padding:40px 0">No notes yet — start with "+ New".</div>
		{/if}
	</section>
</div>
