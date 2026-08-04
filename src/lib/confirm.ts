import { enhance } from '$app/forms';

/** `use:confirmEnhance={message}` — an enhanced submit for destructive actions
 *  that asks first and really does nothing when the answer is no.
 *
 *  The cancelling has to go through enhance's own `cancel()`. An `onsubmit`
 *  handler calling `preventDefault()` does not help: `use:enhance` registers a
 *  separate submit listener and never looks at `defaultPrevented`, so the
 *  dialog would appear and the row would be deleted either way.
 *
 *  Tasks deliberately stay unguarded — they are one line and cheap to retype.
 *  This is for the things that carry content: projects, notes, folders,
 *  courses, semesters, images. */
export function confirmEnhance(node: HTMLFormElement, message: string) {
	let ask = message;

	const enhanced = enhance(node, ({ cancel }) => {
		if (!window.confirm(ask)) cancel();
	});

	return {
		update(next: string) {
			ask = next;
		},
		destroy() {
			enhanced.destroy?.();
		}
	};
}
