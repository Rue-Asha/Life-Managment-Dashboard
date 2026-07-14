import { getDb } from './db';
import { isoWeekKey } from '$lib/format';

export interface Phase {
	id: number;
	name: string;
	status: 'active' | 'planned' | 'archived';
	subtitle: string | null;
	transition_note: string | null;
	created_at: string;
}

export interface Priority25 {
	id: number;
	rank: number;
	name: string;
	note: string | null;
}

export interface TemplateBlock {
	id: number;
	template_id: number;
	time_hint: string | null;
	label: string;
	duration_hint: string | null;
	priority_id: number | null;
	highlight: number;
	sort_order: number;
}

export interface DayTemplate {
	id: number;
	phase_id: number;
	name: string;
	meta: string | null;
	sort_order: number;
	blocks: TemplateBlock[];
}

export interface WeekDay {
	id: number;
	phase_id: number;
	weekday: number;
	day_template_id: number | null;
	day_label: string | null;
	tags: string; // JSON array
	template_name: string | null;
}

export interface Quota {
	id: number;
	phase_id: number;
	priority_id: number | null;
	title: string;
	note: string | null;
	target_count: number | null;
	sort_order: number;
	priority_rank: number | null;
	week_count: number;
}

export interface MiniCurriculum {
	id: number;
	priority_id: number | null;
	phase_id: number | null;
	name: string;
	items: MiniItem[];
}

export interface MiniItem {
	id: number;
	curriculum_id: number;
	week_no: number;
	topic: string;
	done: number;
}

// ── Phases ───────────────────────────────────────────────────────────────

export function listPhases(): Phase[] {
	return getDb()
		.prepare(
			`SELECT * FROM phases
			 ORDER BY status = 'archived', status = 'planned', created_at DESC`
		)
		.all() as unknown as Phase[];
}

export function getActivePhase(): Phase | null {
	return (getDb().prepare(`SELECT * FROM phases WHERE status = 'active' LIMIT 1`).get() ??
		null) as Phase | null;
}

export function getPhase(id: number): Phase | null {
	return (getDb().prepare('SELECT * FROM phases WHERE id = ?').get(id) ?? null) as Phase | null;
}

/** Create a phase; optionally clone the skeleton (templates, blocks, week
 *  board, quotas) of an existing phase — „das Gerüst bleibt identisch“. */
export function createPhase(name: string, cloneFromId: number | null): number {
	const db = getDb();
	const phaseId = Number(db.prepare(`INSERT INTO phases (name) VALUES (?)`).run(name).lastInsertRowid);
	if (cloneFromId !== null) {
		db.prepare(
			`UPDATE phases SET subtitle = (SELECT subtitle FROM phases WHERE id = ?) WHERE id = ?`
		).run(cloneFromId, phaseId);
		const templates = db
			.prepare('SELECT * FROM day_templates WHERE phase_id = ? ORDER BY sort_order')
			.all(cloneFromId) as unknown as DayTemplate[];
		const idMap = new Map<number, number>();
		for (const t of templates) {
			const newId = Number(
				db
					.prepare('INSERT INTO day_templates (phase_id, name, meta, sort_order) VALUES (?, ?, ?, ?)')
					.run(phaseId, t.name, t.meta, t.sort_order).lastInsertRowid
			);
			idMap.set(t.id, newId);
			db.prepare(
				`INSERT INTO template_blocks (template_id, time_hint, label, duration_hint, priority_id, highlight, sort_order)
				 SELECT ?, time_hint, label, duration_hint, priority_id, highlight, sort_order
				 FROM template_blocks WHERE template_id = ? ORDER BY sort_order`
			).run(newId, t.id);
		}
		const days = db
			.prepare('SELECT * FROM week_days WHERE phase_id = ?')
			.all(cloneFromId) as unknown as WeekDay[];
		for (const d of days) {
			db.prepare(
				'INSERT INTO week_days (phase_id, weekday, day_template_id, day_label, tags) VALUES (?, ?, ?, ?, ?)'
			).run(
				phaseId,
				d.weekday,
				d.day_template_id !== null ? (idMap.get(d.day_template_id) ?? null) : null,
				d.day_label,
				d.tags
			);
		}
		db.prepare(
			`INSERT INTO quotas (phase_id, priority_id, title, note, target_count, sort_order)
			 SELECT ?, priority_id, title, note, target_count, sort_order
			 FROM quotas WHERE phase_id = ? ORDER BY sort_order`
		).run(phaseId, cloneFromId);
	}
	return phaseId;
}

/** Exactly one active phase (spec §4.7): activating demotes the current one. */
export function activatePhase(id: number): void {
	const db = getDb();
	db.prepare(`UPDATE phases SET status = 'planned' WHERE status = 'active'`).run();
	db.prepare(`UPDATE phases SET status = 'active' WHERE id = ?`).run(id);
}

export function setPhaseStatus(id: number, status: 'planned' | 'archived'): void {
	getDb().prepare('UPDATE phases SET status = ? WHERE id = ?').run(status, id);
}

export function updatePhase(
	id: number,
	input: { name: string; subtitle: string | null; transitionNote: string | null }
): void {
	getDb()
		.prepare('UPDATE phases SET name = ?, subtitle = ?, transition_note = ? WHERE id = ?')
		.run(input.name, input.subtitle, input.transitionNote, id);
}

export function deletePhase(id: number): void {
	getDb().prepare('DELETE FROM phases WHERE id = ?').run(id);
}

// ── Priorities (25-5, global) ────────────────────────────────────────────

export function listPriorities(): Priority25[] {
	return getDb().prepare('SELECT * FROM priorities ORDER BY rank').all() as unknown as Priority25[];
}

export function updatePriority(id: number, name: string, note: string | null): void {
	getDb().prepare('UPDATE priorities SET name = ?, note = ? WHERE id = ?').run(name, note, id);
}

// ── Day templates & blocks ───────────────────────────────────────────────

export function listTemplates(phaseId: number): DayTemplate[] {
	const templates = getDb()
		.prepare('SELECT * FROM day_templates WHERE phase_id = ? ORDER BY sort_order, id')
		.all(phaseId) as unknown as DayTemplate[];
	const blocks = getDb()
		.prepare(
			`SELECT b.* FROM template_blocks b
			 JOIN day_templates t ON t.id = b.template_id
			 WHERE t.phase_id = ? ORDER BY b.sort_order, b.id`
		)
		.all(phaseId) as unknown as TemplateBlock[];
	for (const t of templates) t.blocks = blocks.filter((b) => b.template_id === t.id);
	return templates;
}

export function createTemplate(phaseId: number, name: string, meta: string | null): void {
	getDb()
		.prepare(
			`INSERT INTO day_templates (phase_id, name, meta, sort_order)
			 VALUES (?, ?, ?, COALESCE((SELECT MAX(sort_order) FROM day_templates WHERE phase_id = ?), 0) + 1)`
		)
		.run(phaseId, name, meta, phaseId);
}

export function updateTemplate(id: number, name: string, meta: string | null): void {
	getDb().prepare('UPDATE day_templates SET name = ?, meta = ? WHERE id = ?').run(name, meta, id);
}

export function deleteTemplate(id: number): void {
	getDb().prepare('DELETE FROM day_templates WHERE id = ?').run(id);
}

export function addBlock(
	templateId: number,
	input: {
		timeHint: string | null;
		label: string;
		durationHint: string | null;
		priorityId: number | null;
		highlight: number;
	}
): void {
	getDb()
		.prepare(
			`INSERT INTO template_blocks (template_id, time_hint, label, duration_hint, priority_id, highlight, sort_order)
			 VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT MAX(sort_order) FROM template_blocks WHERE template_id = ?), 0) + 1)`
		)
		.run(
			templateId,
			input.timeHint,
			input.label,
			input.durationHint,
			input.priorityId,
			input.highlight,
			templateId
		);
}

export function deleteBlock(id: number): void {
	getDb().prepare('DELETE FROM template_blocks WHERE id = ?').run(id);
}

/** Reorder verb (forms-first stand-in for drag): swap with the neighbour. */
export function moveBlock(id: number, direction: 'up' | 'down'): void {
	const db = getDb();
	const block = db.prepare('SELECT * FROM template_blocks WHERE id = ?').get(id) as unknown as
		| TemplateBlock
		| undefined;
	if (!block) return;
	const neighbour = db
		.prepare(
			`SELECT * FROM template_blocks
			 WHERE template_id = ? AND sort_order ${direction === 'up' ? '<' : '>'} ?
			 ORDER BY sort_order ${direction === 'up' ? 'DESC' : 'ASC'} LIMIT 1`
		)
		.get(block.template_id, block.sort_order) as unknown as TemplateBlock | undefined;
	if (!neighbour) return;
	db.prepare('UPDATE template_blocks SET sort_order = ? WHERE id = ?').run(
		neighbour.sort_order,
		block.id
	);
	db.prepare('UPDATE template_blocks SET sort_order = ? WHERE id = ?').run(
		block.sort_order,
		neighbour.id
	);
}

// ── Week board ───────────────────────────────────────────────────────────

export function getWeek(phaseId: number): WeekDay[] {
	return getDb()
		.prepare(
			`SELECT w.*, t.name AS template_name
			 FROM week_days w LEFT JOIN day_templates t ON t.id = w.day_template_id
			 WHERE w.phase_id = ? ORDER BY w.weekday`
		)
		.all(phaseId) as unknown as WeekDay[];
}

export function setWeekDay(
	phaseId: number,
	weekday: number,
	input: { templateId: number | null; dayLabel: string | null; tags: string[] }
): void {
	getDb()
		.prepare(
			`INSERT INTO week_days (phase_id, weekday, day_template_id, day_label, tags)
			 VALUES (?, ?, ?, ?, ?)
			 ON CONFLICT (phase_id, weekday) DO UPDATE SET
			   day_template_id = excluded.day_template_id,
			   day_label = excluded.day_label,
			   tags = excluded.tags`
		)
		.run(phaseId, weekday, input.templateId, input.dayLabel, JSON.stringify(input.tags));
}

// ── Quotas — the contract ────────────────────────────────────────────────

export function listQuotas(phaseId: number, week = isoWeekKey()): Quota[] {
	return getDb()
		.prepare(
			`SELECT q.*, p.rank AS priority_rank,
			        COALESCE((SELECT count FROM quota_ticks t WHERE t.quota_id = q.id AND t.week = ?), 0) AS week_count
			 FROM quotas q LEFT JOIN priorities p ON p.id = q.priority_id
			 WHERE q.phase_id = ? ORDER BY q.sort_order, q.id`
		)
		.all(week, phaseId) as unknown as Quota[];
}

export function createQuota(
	phaseId: number,
	input: { priorityId: number | null; title: string; note: string | null; targetCount: number | null }
): void {
	getDb()
		.prepare(
			`INSERT INTO quotas (phase_id, priority_id, title, note, target_count, sort_order)
			 VALUES (?, ?, ?, ?, ?, COALESCE((SELECT MAX(sort_order) FROM quotas WHERE phase_id = ?), 0) + 1)`
		)
		.run(phaseId, input.priorityId, input.title, input.note, input.targetCount, phaseId);
}

export function updateQuota(
	id: number,
	input: { title: string; note: string | null; targetCount: number | null }
): void {
	getDb()
		.prepare('UPDATE quotas SET title = ?, note = ?, target_count = ? WHERE id = ?')
		.run(input.title, input.note, input.targetCount, id);
}

export function deleteQuota(id: number): void {
	getDb().prepare('DELETE FROM quotas WHERE id = ?').run(id);
}

/** The evening verb: one tap = one tick for this ISO week (min 0, no shame). */
export function tickQuota(id: number, delta: 1 | -1, week = isoWeekKey()): void {
	getDb()
		.prepare(
			`INSERT INTO quota_ticks (quota_id, week, count) VALUES (?, ?, MAX(0, ?))
			 ON CONFLICT (quota_id, week) DO UPDATE SET count = MAX(0, count + ?)`
		)
		.run(id, week, delta, delta);
}

// ── Mini-curricula („eine Technik = ein Lernziel“) ───────────────────────

export function listMiniCurricula(phaseId: number | null): MiniCurriculum[] {
	const rows = getDb()
		.prepare(
			`SELECT * FROM mini_curricula
			 WHERE phase_id IS NULL OR phase_id = ? ORDER BY id`
		)
		.all(phaseId) as unknown as MiniCurriculum[];
	const items = getDb()
		.prepare('SELECT * FROM mini_items ORDER BY week_no, id')
		.all() as unknown as MiniItem[];
	for (const c of rows) c.items = items.filter((i) => i.curriculum_id === c.id);
	return rows;
}

export function createMiniCurriculum(
	name: string,
	priorityId: number | null,
	phaseId: number | null
): void {
	getDb()
		.prepare('INSERT INTO mini_curricula (name, priority_id, phase_id) VALUES (?, ?, ?)')
		.run(name, priorityId, phaseId);
}

export function deleteMiniCurriculum(id: number): void {
	getDb().prepare('DELETE FROM mini_curricula WHERE id = ?').run(id);
}

export function addMiniItem(curriculumId: number, weekNo: number, topic: string): void {
	getDb()
		.prepare('INSERT INTO mini_items (curriculum_id, week_no, topic) VALUES (?, ?, ?)')
		.run(curriculumId, weekNo, topic);
}

export function toggleMiniItem(id: number): void {
	getDb().prepare('UPDATE mini_items SET done = 1 - done WHERE id = ?').run(id);
}

export function deleteMiniItem(id: number): void {
	getDb().prepare('DELETE FROM mini_items WHERE id = ?').run(id);
}

// ── Home: today ──────────────────────────────────────────────────────────

export interface TodayView {
	phase: Phase;
	day: WeekDay | null;
	template: DayTemplate | null;
	quotas: Quota[];
}

/** JS getDay(): So=0 … Sa=6 → unser Schema Mo=0 … So=6. */
export function todayView(now = new Date()): TodayView | null {
	const phase = getActivePhase();
	if (!phase) return null;
	const weekday = (now.getDay() + 6) % 7;
	const day = getWeek(phase.id).find((d) => d.weekday === weekday) ?? null;
	const template =
		day?.day_template_id != null
			? (listTemplates(phase.id).find((t) => t.id === day.day_template_id) ?? null)
			: null;
	return { phase, day, template, quotas: listQuotas(phase.id) };
}
