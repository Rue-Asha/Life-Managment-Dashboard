<script lang="ts">
	/** Block-Editor für Notizen. Das serverseitig gerenderte HTML steht von
	 *  Anfang an im Feld — ohne JS ist die Notiz also lesbar, mit JS übernimmt
	 *  Tiptap an Ort und Stelle. Nach außen fällt nur JSON an; der Server leitet
	 *  daraus den Klartext für Suche, Auszüge und Wortzähler ab. */
	import { onMount } from 'svelte';
	import type { Editor as TiptapEditor } from '@tiptap/core';
	import type { SlashItem, SlashState } from './slash';

	let {
		html,
		doc,
		onchange
	}: { html: string; doc: string; onchange: (json: string) => void } = $props();

	let element: HTMLDivElement | undefined = $state();
	let editor = $state<TiptapEditor | null>(null);
	// Zählt jede Transaktion — Toolbar hängt sich dran, um isActive() neu zu lesen.
	let tick = $state(0);

	let slash = $state<SlashState | null>(null);
	let slashIndex = $state(0);

	onMount(() => {
		let instance: TiptapEditor | undefined;
		let alive = true;

		(async () => {
			// Tiptap wird erst nach dem Mount geladen — die Notiz steht schon als
			// serverseitig gerendertes HTML da, der Editor schiebt sich darüber.
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
			handle.title = 'Block ziehen';
			handle.textContent = '⠿';

			element.innerHTML = '';
			instance = new Editor({
				element,
				extensions: [
					...editorExtensions(),
					Placeholder.configure({
						placeholder: ({ node }) =>
							node.type.name === 'heading'
								? 'Überschrift'
								: 'Schreiben — „/“ für Blöcke'
					}),
					DragHandle.configure({ render: () => handle }),
					SlashCommands.configure({
						onOpen: (s) => {
							slash = s;
							slashIndex = 0;
						},
						onUpdate: (s) => {
							slash = s;
							if (slashIndex >= s.items.length) slashIndex = 0;
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
		const n = slash.items.length;
		if (event.key === 'ArrowDown') {
			slashIndex = n ? (slashIndex + 1) % n : 0;
			return true;
		}
		if (event.key === 'ArrowUp') {
			slashIndex = n ? (slashIndex - 1 + n) % n : 0;
			return true;
		}
		if (event.key === 'Enter' || event.key === 'Tab') {
			const item = slash.items[slashIndex];
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

	function pick(item: SlashItem) {
		slash?.pick(item);
	}

	/** Aktueller Formatzustand — hängt bewusst an `tick`. */
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
		{ label: 'B', title: 'Fett (Strg+B)', key: 'bold', run: (e) => e.chain().focus().toggleBold().run() },
		{ label: 'I', title: 'Kursiv (Strg+I)', key: 'italic', run: (e) => e.chain().focus().toggleItalic().run() },
		{ label: 'S', title: 'Durchgestrichen', key: 'strike', run: (e) => e.chain().focus().toggleStrike().run() },
		{ label: '‹›', title: 'Code (inline)', key: 'code', run: (e) => e.chain().focus().toggleCode().run() },
		'sep',
		{ label: 'H1', title: 'Überschrift 1 — auch „# “', key: 'h1', run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
		{ label: 'H2', title: 'Überschrift 2 — auch „## “', key: 'h2', run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
		{ label: 'H3', title: 'Überschrift 3 — auch „### “', key: 'h3', run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
		'sep',
		{ label: '☑', title: 'To-do-Liste — auch „[ ] “', key: 'task', run: (e) => e.chain().focus().toggleTaskList().run() },
		{ label: '•', title: 'Aufzählung — auch „- “', key: 'bullet', run: (e) => e.chain().focus().toggleBulletList().run() },
		{ label: '1.', title: 'Nummerierte Liste — auch „1. “', key: 'ordered', run: (e) => e.chain().focus().toggleOrderedList().run() },
		'sep',
		{ label: '❝', title: 'Zitat — auch „> “', key: 'quote', run: (e) => e.chain().focus().toggleBlockquote().run() },
		{ label: '{ }', title: 'Code-Block — auch „``` “', key: 'codeBlock', run: (e) => e.chain().focus().toggleCodeBlock().run() },
		{ label: '—', title: 'Trennlinie — auch „--- “', run: (e) => e.chain().focus().setHorizontalRule().run() },
		{ label: '▦', title: 'Tabelle einfügen', key: 'table', run: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() }
	];

	const tableTools: { label: string; title: string; run: (e: TiptapEditor) => void }[] = [
		{ label: '+ ZEILE', title: 'Zeile darunter', run: (e) => e.chain().focus().addRowAfter().run() },
		{ label: '− ZEILE', title: 'Zeile löschen', run: (e) => e.chain().focus().deleteRow().run() },
		{ label: '+ SPALTE', title: 'Spalte rechts', run: (e) => e.chain().focus().addColumnAfter().run() },
		{ label: '− SPALTE', title: 'Spalte löschen', run: (e) => e.chain().focus().deleteColumn().run() },
		{ label: 'KOPFZEILE', title: 'Kopfzeile an/aus', run: (e) => e.chain().focus().toggleHeaderRow().run() },
		{ label: 'TABELLE ✕', title: 'Tabelle löschen', run: (e) => e.chain().focus().deleteTable().run() }
	];
</script>

<div class="tt-shell">
	{#if editor && st}
		<div class="tt-bar" role="toolbar" aria-label="Formatierung">
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
			<div class="tt-bar tt-bar-table" role="toolbar" aria-label="Tabelle">
				<span class="tt-bar-label">[ TABELLE ]</span>
				{#each tableTools as tool (tool.label)}
					<button type="button" class="tt-btn wide" title={tool.title} onclick={() => editor && tool.run(editor)}>
						{tool.label}
					</button>
				{/each}
			</div>
		{/if}
	{/if}

	<div class="tt-content" bind:this={element}>
		<!-- eslint-disable-next-line svelte/no-at-html-tags — eigenes Dokument, serverseitig gerendert -->
		{@html html}
	</div>
</div>

{#if slash && slash.rect}
	<div
		class="tt-slash"
		style="top:{slash.rect.bottom + 6}px;left:{slash.rect.left}px"
		role="listbox"
		tabindex="-1"
	>
		{#each slash.items as item, i (item.title)}
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
			<div class="tt-slash-empty">nichts gefunden</div>
		{/each}
	</div>
{/if}
