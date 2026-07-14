<script lang="ts">
	// Progressive block editor: the server-rendered HTML sits in the editable
	// area from the start, so without JS (Boox morning glance) the note is a
	// clean read-only page; with JS Tiptap takes over in place. The current
	// document JSON mirrors into a hidden input so the surrounding form action
	// stays the single save path.
	import { onMount } from 'svelte';
	import type { Editor as TiptapEditor } from '@tiptap/core';
	import { editorExtensions } from './extensions';

	let { content, html, name = 'content' }: { content: string; html: string; name?: string } =
		$props();

	let element: HTMLDivElement | undefined = $state();
	let editor = $state<TiptapEditor | null>(null);
	// svelte-ignore state_referenced_locally — deliberate: the prop is the initial value
	let json = $state(content);
	// Incremented on every transaction — toolbar reads it to re-check isActive().
	let tick = $state(0);

	onMount(() => {
		let instance: TiptapEditor | undefined;
		(async () => {
			const { Editor } = await import('@tiptap/core');
			if (!element) return;
			element.innerHTML = '';
			instance = new Editor({
				element,
				extensions: editorExtensions(),
				content: JSON.parse(content),
				onTransaction: () => {
					tick += 1;
					if (instance) json = JSON.stringify(instance.getJSON());
				}
			});
			editor = instance;
		})();
		return () => instance?.destroy();
	});

	interface Tool {
		label: string;
		title: string;
		run: (e: TiptapEditor) => void;
		active?: (e: TiptapEditor) => boolean;
	}

	const tools: (Tool | 'sep')[] = [
		{
			label: 'B',
			title: 'Fett (Strg+B)',
			run: (e) => e.chain().focus().toggleBold().run(),
			active: (e) => e.isActive('bold')
		},
		{
			label: 'I',
			title: 'Kursiv (Strg+I)',
			run: (e) => e.chain().focus().toggleItalic().run(),
			active: (e) => e.isActive('italic')
		},
		{
			label: 'S̶',
			title: 'Durchgestrichen',
			run: (e) => e.chain().focus().toggleStrike().run(),
			active: (e) => e.isActive('strike')
		},
		{
			label: '‹›',
			title: 'Code (inline)',
			run: (e) => e.chain().focus().toggleCode().run(),
			active: (e) => e.isActive('code')
		},
		'sep',
		{
			label: 'H1',
			title: 'Überschrift 1 (auch: „# “)',
			run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
			active: (e) => e.isActive('heading', { level: 1 })
		},
		{
			label: 'H2',
			title: 'Überschrift 2 (auch: „## “)',
			run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
			active: (e) => e.isActive('heading', { level: 2 })
		},
		{
			label: 'H3',
			title: 'Überschrift 3 (auch: „### “)',
			run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
			active: (e) => e.isActive('heading', { level: 3 })
		},
		'sep',
		{
			label: '•',
			title: 'Liste (auch: „- “)',
			run: (e) => e.chain().focus().toggleBulletList().run(),
			active: (e) => e.isActive('bulletList')
		},
		{
			label: '1.',
			title: 'Nummerierte Liste (auch: „1. “)',
			run: (e) => e.chain().focus().toggleOrderedList().run(),
			active: (e) => e.isActive('orderedList')
		},
		{
			label: '☑',
			title: 'To-do-Liste (auch: „[ ] “)',
			run: (e) => e.chain().focus().toggleTaskList().run(),
			active: (e) => e.isActive('taskList')
		},
		'sep',
		{
			label: '❝',
			title: 'Zitat (auch: „> “)',
			run: (e) => e.chain().focus().toggleBlockquote().run(),
			active: (e) => e.isActive('blockquote')
		},
		{
			label: '{ }',
			title: 'Code-Block (auch: „``` “)',
			run: (e) => e.chain().focus().toggleCodeBlock().run(),
			active: (e) => e.isActive('codeBlock')
		},
		{
			label: '—',
			title: 'Trennlinie (auch: „--- “)',
			run: (e) => e.chain().focus().setHorizontalRule().run()
		},
		{
			label: '▦',
			title: 'Tabelle einfügen',
			run: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
			active: (e) => e.isActive('table')
		}
	];
</script>

<div class="editor-shell">
	{#if editor}
		<div class="editor-toolbar" role="toolbar" aria-label="Formatierung">
			{#each tools as tool, i (i)}
				{#if tool === 'sep'}
					<span class="tsep"></span>
				{:else}
					<button
						type="button"
						class="tbtn"
						class:on={tick >= 0 && editor !== null && (tool.active?.(editor) ?? false)}
						title={tool.title}
						onclick={() => editor && tool.run(editor)}>{tool.label}</button
					>
				{/if}
			{/each}
		</div>
	{/if}
	<div class="editor-content" bind:this={element}>
		<!-- eslint-disable-next-line svelte/no-at-html-tags — own document, server-rendered -->
		{@html html}
	</div>
	<input type="hidden" {name} value={json} />
</div>

<style>
	.editor-shell {
		border: 1px solid var(--line);
		border-radius: var(--r-lg);
		background: var(--surface);
		box-shadow: var(--shadow-sm);
		overflow: hidden;
	}

	.editor-toolbar {
		display: flex;
		align-items: center;
		gap: 2px;
		flex-wrap: wrap;
		padding: 6px 10px;
		border-bottom: 1px solid var(--line);
		background: var(--surface2);
	}

	.tbtn {
		border: 1px solid transparent;
		background: none;
		color: var(--ink2);
		font-family: var(--font-mono);
		font-size: 12.5px;
		min-width: 28px;
		padding: 4px 6px;
		border-radius: var(--r-sm);
		cursor: pointer;
		transition:
			color 0.12s ease,
			border-color 0.12s ease,
			background 0.12s ease;
	}

	.tbtn:hover {
		border-color: var(--line);
		color: var(--ink);
	}

	.tbtn.on {
		background: var(--accent-soft);
		border-color: var(--accent);
		color: var(--ink);
	}

	.tsep {
		width: 1px;
		height: 18px;
		background: var(--line);
		margin: 0 6px;
	}

	.editor-content {
		padding: 4px 22px 18px;
		min-height: 320px;
	}
</style>
