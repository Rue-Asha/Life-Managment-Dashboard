import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteImage, readImage, validSlot, writeImage } from '$lib/server/images';

const MAX_BYTES = 15 * 1024 * 1024;

export const GET: RequestHandler = ({ params }) => {
	if (!validSlot(params.slot)) throw error(400, 'Ungültiger Slot');
	const img = readImage(params.slot);
	if (!img) throw error(404, 'Kein Bild');
	return new Response(new Uint8Array(img.data), {
		headers: {
			'content-type': img.mime,
			'cache-control': 'private, max-age=60'
		}
	});
};

export const PUT: RequestHandler = async ({ params, request }) => {
	if (!validSlot(params.slot)) throw error(400, 'Ungültiger Slot');
	const mime = request.headers.get('content-type') ?? '';
	const buf = Buffer.from(await request.arrayBuffer());
	if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) {
		throw error(413, 'Bild fehlt oder ist zu groß (max. 15 MB)');
	}
	if (!writeImage(params.slot, buf, mime)) {
		throw error(415, 'Nur JPEG/PNG/WebP/GIF/AVIF');
	}
	return new Response(null, { status: 204 });
};

export const DELETE: RequestHandler = ({ params }) => {
	if (!validSlot(params.slot)) throw error(400, 'Ungültiger Slot');
	deleteImage(params.slot);
	return new Response(null, { status: 204 });
};
