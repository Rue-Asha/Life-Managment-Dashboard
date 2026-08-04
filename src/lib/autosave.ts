import { applyAction, enhance } from '$app/forms';

/** Auto-save forms (detail pages): changing a field submits the surrounding
 *  form without reloading the page or losing input focus. Text and textarea
 *  are debounced while typing, everything else fires straight away. */

export function quietEnhance(node: HTMLFormElement) {
	return enhance(node, () => async ({ result }) => {
		// Deliberately no `update()`. It ends in applyAction, and applyAction
		// resets focus to <body> after a successful action — right for a button
		// press, wrong here: the save fires mid-word, so it would rip the caret
		// out of the field the user is still typing in (worst in the note
		// editor, which then swallows every further keystroke until it is
		// clicked again). A quiet save must not touch focus at all. Redirects,
		// errors and validation failures still need to be applied.
		if (result.type !== 'success') {
			await applyAction(result);
		}
	});
}

export function autosave(node: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
	let timer: ReturnType<typeof setTimeout> | undefined;

	const submit = () => {
		clearTimeout(timer);
		node.form?.requestSubmit();
	};

	const onInput = () => {
		clearTimeout(timer);
		timer = setTimeout(submit, 650);
	};

	const isTexty =
		node instanceof HTMLTextAreaElement ||
		(node instanceof HTMLInputElement && (node.type === 'text' || node.type === 'search'));

	if (isTexty) node.addEventListener('input', onInput);
	node.addEventListener('change', submit);

	return {
		destroy() {
			clearTimeout(timer);
			node.removeEventListener('input', onInput);
			node.removeEventListener('change', submit);
		}
	};
}
