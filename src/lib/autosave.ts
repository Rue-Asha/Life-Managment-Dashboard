import { enhance } from '$app/forms';

/** Auto-Save-Formulare (Detailseiten): Feldänderung schickt das umgebende
 *  Formular ab, ohne die Seite neu zu laden oder Eingabefokus zu verlieren.
 *  Text/Textarea debounced beim Tippen, sofort bei blur/change. */

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
