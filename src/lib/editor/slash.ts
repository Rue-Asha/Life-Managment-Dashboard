/** „/“-Menü wie in Notion. Die Extension liefert nur Zustand nach außen —
 *  gezeichnet wird das Menü von NoteEditor.svelte, damit es zum Design passt. */
import { Extension, type Editor, type Range } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

export interface SlashItem {
	title: string;
	hint: string;
	/** zusätzliche Suchbegriffe (deutsch getippt, englisch gedacht) */
	keywords: string;
	run: (editor: Editor, range: Range) => void;
}

export interface SlashState {
	items: SlashItem[];
	rect: DOMRect | null;
	pick: (item: SlashItem) => void;
}

export const SLASH_ITEMS: SlashItem[] = [
	{
		title: 'Text',
		hint: 'Normaler Absatz',
		keywords: 'absatz paragraph p',
		run: (e, r) => e.chain().focus().deleteRange(r).setParagraph().run()
	},
	{
		title: 'Überschrift 1',
		hint: 'Große Überschrift',
		keywords: 'h1 titel heading',
		run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 1 }).run()
	},
	{
		title: 'Überschrift 2',
		hint: 'Abschnitt',
		keywords: 'h2 heading',
		run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 2 }).run()
	},
	{
		title: 'Überschrift 3',
		hint: 'Unterabschnitt',
		keywords: 'h3 heading',
		run: (e, r) => e.chain().focus().deleteRange(r).setNode('heading', { level: 3 }).run()
	},
	{
		title: 'To-do-Liste',
		hint: 'Kästchen zum Abhaken',
		keywords: 'todo aufgabe checkbox haken task',
		run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run()
	},
	{
		title: 'Aufzählung',
		hint: 'Punkteliste',
		keywords: 'liste bullet ul punkte',
		run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run()
	},
	{
		title: 'Nummerierte Liste',
		hint: 'Schritt für Schritt',
		keywords: 'ol nummer zahlen ordered',
		run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run()
	},
	{
		title: 'Tabelle',
		hint: '3 × 3 mit Kopfzeile',
		keywords: 'table raster spalten',
		run: (e, r) =>
			e
				.chain()
				.focus()
				.deleteRange(r)
				.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
				.run()
	},
	{
		title: 'Zitat',
		hint: 'Eingerückter Block',
		keywords: 'quote blockquote merksatz',
		run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run()
	},
	{
		title: 'Code',
		hint: 'Monospace-Block',
		keywords: 'code pre snippet befehl',
		run: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run()
	},
	{
		title: 'Trennlinie',
		hint: 'Horizontaler Strich',
		keywords: 'hr linie trenner divider',
		run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run()
	}
];

export interface SlashOptions {
	onOpen: (state: SlashState) => void;
	onUpdate: (state: SlashState) => void;
	onClose: () => void;
	/** true = Taste verbraucht (Menü navigiert), false = Editor macht weiter */
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
				items: ({ query }) => {
					const q = query.trim().toLowerCase();
					if (!q) return SLASH_ITEMS;
					return SLASH_ITEMS.filter((i) =>
						`${i.title} ${i.keywords}`.toLowerCase().includes(q)
					);
				},
				command: ({ editor, range, props }) => props.run(editor, range),
				render: () => {
					const state = (props: {
						items: SlashItem[];
						clientRect?: (() => DOMRect | null) | null;
						command: (item: SlashItem) => void;
					}): SlashState => ({
						items: props.items,
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
