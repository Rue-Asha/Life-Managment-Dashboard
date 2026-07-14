// One extension list for client editor AND server HTML rendering — both sides
// must agree on the schema or generateHTML rejects stored documents.
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { TableKit } from '@tiptap/extension-table';
import type { AnyExtension } from '@tiptap/core';

export function editorExtensions(): AnyExtension[] {
	return [
		StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
		TaskList,
		TaskItem.configure({ nested: true }),
		TableKit.configure({ table: { resizable: false } })
	];
}

export const EMPTY_DOC = '{"type":"doc","content":[{"type":"paragraph"}]}';
