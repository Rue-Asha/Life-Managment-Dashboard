/** Notion-style "/" menu. The extension only reports state outwards — the menu
 *  itself is drawn by NoteEditor.svelte so it matches the design.
 *
 *  Filtering happens in the component, not in the suggestion plugin: the plugin
 *  resolves `items()` asynchronously and fires onStart with an empty list, so a
 *  fast "/" + ArrowDown + Enter would land on nothing. Handing the raw query to
 *  the component keeps the list synchronous and always populated. */
import { Extension, type Editor, type Range } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

export interface SlashItem {
	title: string;
	hint: string;
	/** extra search terms, so "table" also matches "grid" */
	keywords: string;
	run: (editor: Editor, range: Range) => void;
}

export interface SlashState {
	query: string;
	rect: DOMRect | null;
	pick: (item: SlashItem) => void;
}

export const SLASH_ITEMS: SlashItem[] = [
	{
		title: 'Text',
		hint: 'Plain paragraph',
		keywords: 'paragraph body p',
		run: (e, r) => e.chain().focus().deleteRange(r).setParagraph().run()
	},
	{
		title: 'Heading 1',
		hint: 'Large heading',
		keywords: 'h1 title big',
		run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 1 }).run()
	},
	{
		title: 'Heading 2',
		hint: 'Section',
		keywords: 'h2 subtitle',
		run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 2 }).run()
	},
	{
		title: 'Heading 3',
		hint: 'Subsection',
		keywords: 'h3 small heading',
		run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 3 }).run()
	},
	{
		title: 'To-do list',
		hint: 'Checkboxes to tick off',
		keywords: 'todo task checkbox check',
		run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run()
	},
	{
		title: 'Bullet list',
		hint: 'Unordered list',
		keywords: 'ul bullets points list',
		run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run()
	},
	{
		title: 'Numbered list',
		hint: 'Step by step',
		keywords: 'ol ordered numbers list',
		run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run()
	},
	{
		title: 'Table',
		hint: '3 × 3 with header row',
		keywords: 'grid columns rows',
		run: (e, r) =>
			e
				.chain()
				.focus()
				.deleteRange(r)
				.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
				.run()
	},
	{
		title: 'Quote',
		hint: 'Indented block',
		keywords: 'blockquote citation',
		run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run()
	},
	{
		title: 'Code',
		hint: 'Monospace block',
		keywords: 'pre snippet command',
		run: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run()
	},
	{
		title: 'Divider',
		hint: 'Horizontal rule',
		keywords: 'hr line separator break',
		run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run()
	}
];

/** Match a query against titles and keywords. Empty query = everything. */
export function filterSlashItems(query: string): SlashItem[] {
	const q = query.trim().toLowerCase();
	if (!q) return SLASH_ITEMS;
	return SLASH_ITEMS.filter((i) => `${i.title} ${i.keywords}`.toLowerCase().includes(q));
}

export interface SlashOptions {
	onOpen: (state: SlashState) => void;
	onUpdate: (state: SlashState) => void;
	onClose: () => void;
	/** true = key consumed by the menu, false = the editor handles it */
	onKeyDown: (event: KeyboardEvent) => boolean;
}

export const SlashCommands = Extension.create<SlashOptions>({
	name: 'slashCommands',

	addOptions() {
		return {
			onOpen: () => {},
			onUpdate: () => {},
			onClose: () => {},
			onKeyDown: () => false
		};
	},

	addProseMirrorPlugins() {
		const options = this.options;
		return [
			Suggestion<SlashItem>({
				editor: this.editor,
				char: '/',
				allowSpaces: false,
				startOfLine: false,
				// Constant list: the component does the filtering, this only has to
				// resolve immediately so the plugin never sits in a loading state.
				items: () => SLASH_ITEMS,
				command: ({ editor, range, props }) => props.run(editor, range),
				render: () => {
					const state = (props: {
						query: string;
						clientRect?: (() => DOMRect | null) | null;
						command: (item: SlashItem) => void;
					}): SlashState => ({
						query: props.query,
						rect: props.clientRect?.() ?? null,
						pick: props.command
					});

					return {
						onStart: (props) => options.onOpen(state(props)),
						onUpdate: (props) => options.onUpdate(state(props)),
						onKeyDown: ({ event }) => options.onKeyDown(event),
						onExit: () => options.onClose()
					};
				}
			})
		];
	}
});
