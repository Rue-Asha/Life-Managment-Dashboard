<script lang="ts">
	/** Block editor for notes. The server-rendered HTML sits in the field from
	 *  the start — so without JS the note is still readable, and with JS Tiptap
	 *  takes over in place. Only JSON goes back out; the server derives the plain
	 *  text for search, excerpts and the word count from it. */
	import { onMount, tick as svelteTick } from 'svelte';
	import type { Editor as TiptapEditor } from '@tiptap/core';
	import { filterSlashItems, type SlashItem, type SlashState } from './slash';

	let {
		html,
		doc,
		onchange
	}: { html: string; doc: string; onchange: (json: string) => void } = $props();

	let element: HTMLDivElement | undefined = $state();
	let editor = $state<TiptapEditor | null>(null);
	// Counts every transaction — the toolbar hangs off it to re-read isActive().
	let tick = $state(0);

	let slash = $state<SlashState | null>(null);
	let slashIndex = $state(0);
	let slashBox: HTMLDivElement | undefined = $state();

	// Filtering happens here, synchronously, so the list is never empty for a
	// frame — arrow keys and Enter always have something to land on.
	const slashItems = $derived(slash ? filterSlashItems(slash.query) : []);

	onMount(() => {
		let instance: TiptapEditor | undefined;
		let alive = true;

		(async () => {
			// Tiptap only loads after mount — the note is already on screen as
			// server-rendered HTML, the editor slides in on top.
			const [
				{ Editor },
				{ default: Placeholder },
				{ DragHandle },
				{ editorExtensions },
				{ SlashCommands }
			] = await Promise.all([
				import('@tiptap/core'),
				import('@tiptap/extension-placeholder'),
				import('@tiptap/extension-drag-handle'),
				import('./extensions'),
				import('./slash')
			]);
			if (!alive || !element) return;

			const handle = document.createElement('div');
			handle.className = 'tt-drag';
			handle.title = 'Drag block';
			handle.textContent = '⠿';

			element.innerHTML = '';
			instance = new Editor({
				element,
				extensions: [
					...editorExtensions(),
					Placeholder.configure({
						placeholder: ({ node }) =>
							node.type.name === 'heading' ? 'Heading' : 'Write — "/" for blocks'
					}),
					DragHandle.configure({ render: () => handle }),
					SlashCommands.configure({
						onOpen: (s) => {
							slash = s;
							slashIndex = 0;
						},
						onUpdate: (s) => {
							slash = s;
							// Keep the highlight in range while the query narrows the list.
							const n = filterSlashItems(s.query).length;
							if (slashIndex >= n) slashIndex = Math.max(0, n - 1);
						},
						onClose: () => (slash = null),
						onKeyDown: (event) => handleSlashKey(event)
					})
				],
				content: JSON.parse(doc),
				onUpdate: ({ editor: e }) => onchange(JSON.stringify(e.getJSON())),
				onTransaction: () => (tick += 1)
			});
			editor = instance;
		})();

		return () => {
			alive = false;
			instance?.destroy();
		};
	});

	function handleSlashKey(event: KeyboardEvent): boolean {
		if (!slash) return false;
		const items = filterSlashItems(slash.query);
		const n = items.length;

		// Ctrl-n / Ctrl-p do the same as the arrows, for the terminal-minded.
		const down = event.key === 'ArrowDown' || (event.ctrlKey && event.key === 'n');
		const up = event.key === 'ArrowUp' || (event.ctrlKey && event.key === 'p');

		if (down) {
			slashIndex = n ? (slashIndex + 1) % n : 0;
			scrollActiveIntoView();
			return true;
		}
		if (up) {
			slashIndex = n ? (slashIndex - 1 + n) % n : 0;
			scrollActiveIntoView();
			return true;
		}
		if (event.key === 'Home' && n) {
			slashIndex = 0;
			scrollActiveIntoView();
			return true;
		}
		if (event.key === 'End' && n) {
			slashIndex = n - 1;
			scrollActiveIntoView();
			return true;
		}
		if (event.key === 'Enter' || event.key === 'Tab') {
			const item = items[slashIndex];
			if (!item) return false;
			slash.pick(item);
			return true;
		}
		if (event.key === 'Escape') {
			slash = null;
			return true;
		}
		return false;
	}

	async function scrollActiveIntoView() {
		await svelteTick();
		slashBox?.querySelector('.tt-slash-item.on')?.scrollIntoView({ block: 'nearest' });
	}

	function pick(item: SlashItem) {
		slash?.pick(item);
	}

	/** Current formatting state — deliberately hangs off `tick`. */
	const st = $derived.by(() => {
		void tick;
		const e = editor;
		if (!e) return null;
		return {
			bold: e.isActive('bold'),
			italic: e.isActive('italic'),
			strike: e.isActive('strike'),
			code: e.isActive('code'),
			h1: e.isActive('heading', { level: 1 }),
			h2: e.isActive('heading', { level: 2 }),
			h3: e.isActive('heading', { level: 3 }),
			bullet: e.isActive('bulletList'),
			ordered: e.isActive('orderedList'),
			task: e.isActive('taskList'),
			quote: e.isActive('blockquote'),
			codeBlock: e.isActive('codeBlock'),
			table: e.isActive('table')
		};
	});

	interface Tool {
		label: string;
		title: string;
		key?: keyof NonNullable<typeof st>;
		run: (e: TiptapEditor) => void;
	}

	const tools: (Tool | 'sep')[] = [
		{ label: 'B', title: 'Bold (Ctrl+B)', key: 'bold', run: (e) => e.chain().focus().toggleBold().run() },
		{ label: 'I', title: 'Italic (Ctrl+I)', key: 'italic', run: (e) => e.chain().focus().toggleItalic().run() },
		{ label: 'S', title: 'Strikethrough', key: 'strike', run: (e) => e.chain().focus().toggleStrike().run() },
		{ label: '‹›', title: 'Inline code', key: 'code', run: (e) => e.chain().focus().toggleCode().run() },
		'sep',
		{ label: 'H1', title: 'Heading 1 — also "# "', key: 'h1', run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
		{ label: 'H2', title: 'Heading 2 — also "## "', key: 'h2', run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
		{ label: 'H3', title: 'Heading 3 — also "### "', key: 'h3', run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
		'sep',
		{ label: '☑', title: 'To-do list — also "[ ] "', key: 'task', run: (e) => e.chain().focus().toggleTaskList().run() },
		{ label: '•', title: 'Bullet list — also "- "', key: 'bullet', run: (e) => e.chain().focus().toggleBulletList().run() },
		{ label: '1.', title: 'Numbered list — also "1. "', key: 'ordered', run: (e) => e.chain().focus().toggleOrderedList().run() },
		'sep',
		{ label: '❝', title: 'Quote — also "> "', key: 'quote', run: (e) => e.chain().focus().toggleBlockquote().run() },
		{ label: '{ }', title: 'Code block — also "``` "', key: 'codeBlock', run: (e) => e.chain().focus().toggleCodeBlock().run() },
		{ label: '—', title: 'Divider — also "--- "', run: (e) => e.chain().focus().setHorizontalRule().run() },
		{ label: '▦', title: 'Insert table', key: 'table', run: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() }
	];

	const tableTools: { label: string; title: string; run: (e: TiptapEditor) => void }[] = [
		{ label: '+ ROW', title: 'Row below', run: (e) => e.chain().focus().addRowAfter().run() },
		{ label: '− ROW', title: 'Delete row', run: (e) => e.chain().focus().deleteRow().run() },
		{ label: '+ COL', title: 'Column right', run: (e) => e.chain().focus().addColumnAfter().run() },
		{ label: '− COL', title: 'Delete column', run: (e) => e.chain().focus().deleteColumn().run() },
		{ label: 'HEADER', title: 'Toggle header row', run: (e) => e.chain().focus().toggleHeaderRow().run() },
		{ label: 'TABLE ✕', title: 'Delete table', run: (e) => e.chain().focus().deleteTable().run() }
	];
</script>

<div class="tt-shell">
	{#if editor && st}
		<div class="tt-bar" role="toolbar" aria-label="Formatting">
			{#each tools as tool, i (i)}
				{#if tool === 'sep'}
					<span class="tt-sep"></span>
				{:else}
					<button
						type="button"
						class="tt-btn"
						class:on={tool.key ? st[tool.key] : false}
						title={tool.title}
						onclick={() => editor && tool.run(editor)}>{tool.label}</button
					>
				{/if}
			{/each}
		</div>
		{#if st.table}
			<div class="tt-bar tt-bar-table" role="toolbar" aria-label="Table">
				<span class="tt-bar-label">[ TABLE ]</span>
				{#each tableTools as tool (tool.label)}
					<button type="button" class="tt-btn wide" title={tool.title} onclick={() => editor && tool.run(editor)}>
						{tool.label}
					</button>
				{/each}
			</div>
		{/if}
	{/if}

	<div class="tt-content" bind:this={element}>
		<!-- eslint-disable-next-line svelte/no-at-html-tags — own document, server-rendered -->
		{@html html}
	</div>
</div>

{#if slash}
	<div
		class="tt-slash"
		bind:this={slashBox}
		style="top:{(slash.rect?.bottom ?? 0) + 6}px;left:{slash.rect?.left ?? 0}px"
		role="listbox"
		aria-label="Insert block"
		tabindex="-1"
	>
		<div class="tt-slash-head">↑ ↓ TO SELECT · ⏎ TO INSERT · ESC TO CLOSE</div>
		{#each slashItems as item, i (item.title)}
			<button
				type="button"
				class="tt-slash-item"
				class:on={i === slashIndex}
				role="option"
				aria-selected={i === slashIndex}
				onmouseenter={() => (slashIndex = i)}
				onclick={() => pick(item)}
			>
				<span class="t">{item.title}</span>
				<span class="h">{item.hint}</span>
			</button>
		{:else}
			<div class="tt-slash-empty">no match</div>
		{/each}
	</div>
{/if}
