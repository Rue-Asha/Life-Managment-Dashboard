import { env } from '$env/dynamic/private';
import fs from 'node:fs';
import path from 'node:path';

/** Bild-Slots (Hero, Mood, Plate, Notiz-Cover): Dateien im IMAGES_DIR,
 *  benannt nach Slot-Id, MIME-Typ in einer Sidecar-Datei. Kein DB-Eintrag. */

const SLOT_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

function imagesDir(): string {
	return env.IMAGES_DIR || './images';
}

export function validSlot(slot: string): boolean {
	return SLOT_RE.test(slot);
}

function filePath(slot: string): string {
	return path.join(imagesDir(), slot + '.img');
}

function mimePath(slot: string): string {
	return path.join(imagesDir(), slot + '.mime');
}

export function readImage(slot: string): { data: Buffer; mime: string } | null {
	try {
		const data = fs.readFileSync(filePath(slot));
		const mime = fs.readFileSync(mimePath(slot), 'utf8').trim() || 'image/jpeg';
		return { data, mime };
	} catch {
		return null;
	}
}

export function writeImage(slot: string, data: Buffer, mime: string): boolean {
	if (!ALLOWED_MIME.has(mime)) return false;
	fs.mkdirSync(imagesDir(), { recursive: true });
	fs.writeFileSync(filePath(slot), data);
	fs.writeFileSync(mimePath(slot), mime);
	return true;
}

export function deleteImage(slot: string): void {
	for (const p of [filePath(slot), mimePath(slot)]) {
		try {
			fs.unlinkSync(p);
		} catch {
			// war nicht vorhanden
		}
	}
}

/** Für den initialen Seitenaufbau: welche Slots haben ein Bild? */
export function existingSlots(): string[] {
	try {
		return fs
			.readdirSync(imagesDir())
			.filter((f) => f.endsWith('.img'))
			.map((f) => f.slice(0, -4));
	} catch {
		return [];
	}
}
