/** One extension list for the client editor AND server rendering — both sides
 *  must agree on the schema, or generateHTML rejects stored documents. Purely
 *  client-side extensions (placeholder, drag handle, slash menu) are added in
 *  the editor component; they do not touch the schema. */
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
