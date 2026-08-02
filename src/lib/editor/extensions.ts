/** Eine Extension-Liste für Client-Editor UND Server-Rendering — beide Seiten
 *  müssen dasselbe Schema kennen, sonst weist generateHTML gespeicherte
 *  Dokumente zurück. Rein clientseitige Extensions (Placeholder, Drag-Handle,
 *  Slash-Menü) hängen im Editor-Component dran; sie berühren das Schema nicht. */
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { TableKit } from '@tiptap/extension-table';
import type { AnyExtension } from '@tiptap/core';

export function editorExtensions(): AnyExtension[] {
	return [
		StarterKit.configure({
			heading: { levels: [1, 2, 3] },
			link: { openOnClick: false, autolink: true }
		}),
		TaskList,
		TaskItem.configure({ nested: true }),
		TableKit.configure({ table: { resizable: false } })
	];
}
