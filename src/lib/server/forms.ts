import { fail, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { parseAmountToCents } from '$lib/format';

/** Validation guards for form-action input. Invalid values throw FormError,
 *  which `action()` converts into a `fail(400, { message })` result. */

export class FormError extends Error {}

type ActionResult = ActionFailure<{ message: string }> | { success: true } | void;

export function action<E extends RequestEvent>(
	fn: (event: E, data: FormData) => ActionResult | Promise<ActionResult>
): (event: E) => Promise<ActionResult> {
	return async (event: E) => {
		const data = await event.request.formData();
		try {
			return (await fn(event, data)) ?? { success: true };
		} catch (err) {
			if (err instanceof FormError) {
				return fail(400, { message: err.message });
			}
			throw err;
		}
	};
}

export function str(data: FormData, name: string, label = name): string {
	const v = data.get(name);
	if (typeof v !== 'string' || !v.trim()) {
		throw new FormError(`Feld „${label}“ fehlt.`);
	}
	return v.trim();
}

export function strOrNull(data: FormData, name: string): string | null {
	const v = data.get(name);
	return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export function int(data: FormData, name: string): number {
	const v = Number(data.get(name));
	if (!Number.isInteger(v)) {
		throw new FormError(`Feld „${name}“ ist keine Zahl.`);
	}
	return v;
}

export function amountCents(data: FormData, name: string, label = 'Betrag'): number {
	const cents = parseAmountToCents(String(data.get(name) ?? ''));
	if (cents === null) {
		throw new FormError(`Ungültiger Betrag für „${label}“.`);
	}
	return cents;
}

export function amountCentsOrNull(data: FormData, name: string): number | null {
	const raw = String(data.get(name) ?? '').trim();
	if (!raw) return null;
	const cents = parseAmountToCents(raw);
	if (cents === null) {
		throw new FormError('Ungültiger Betrag.');
	}
	return cents;
}

export function intOrNull(data: FormData, name: string): number | null {
	const raw = data.get(name);
	if (typeof raw !== 'string' || !raw.trim()) return null;
	const v = Number(raw);
	if (!Number.isInteger(v)) {
		throw new FormError(`Feld „${name}“ ist keine Zahl.`);
	}
	return v;
}

export function numOrNull(data: FormData, name: string, label = name): number | null {
	const raw = data.get(name);
	if (typeof raw !== 'string' || !raw.trim()) return null;
	const v = Number(raw.replace(',', '.'));
	if (!Number.isFinite(v)) {
		throw new FormError(`Feld „${label}“ ist keine Zahl.`);
	}
	return v;
}

export function oneOf<T extends string>(data: FormData, name: string, allowed: readonly T[]): T {
	const v = String(data.get(name) ?? '');
	if (!allowed.includes(v as T)) {
		throw new FormError(`Ungültiger Wert für „${name}“.`);
	}
	return v as T;
}

export function oneOfOrNull<T extends string>(
	data: FormData,
	name: string,
	allowed: readonly T[]
): T | null {
	const v = String(data.get(name) ?? '').trim();
	if (!v) return null;
	if (!allowed.includes(v as T)) {
		throw new FormError(`Ungültiger Wert für „${name}“.`);
	}
	return v as T;
}

export function checkbox(data: FormData, name: string): number {
	return data.get(name) ? 1 : 0;
}
