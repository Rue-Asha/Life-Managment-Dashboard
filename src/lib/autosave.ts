import { enhance } from '$app/forms';

/** Auto-save forms (detail pages): changing a field submits the surrounding
 *  form without reloading the page or losing input focus. Text and textarea
 *  are debounced while typing, everything else fires straight away. */

export function quietEnhance(node: HTMLFormElement) {
	return enhance(node, () => async ({ update }) => {
		await update({ reset: false, invalidateAll: false });
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
