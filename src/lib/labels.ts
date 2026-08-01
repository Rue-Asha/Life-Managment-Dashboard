/** Zentrale Domänen-Konstanten des Redesigns (Artifact = Single Source of Truth).
 *  Farben sind Teil des Datenmodells (Kurs-Hues, Kategorie-Farben) und werden
 *  deshalb hier statt in CSS gepflegt. */

export const CATS = ['personal', 'uni', 'job'] as const;
export type Cat = (typeof CATS)[number];
export const CAT_META: Record<Cat, { label: string; color: string }> = {
	personal: { label: 'Persönlich', color: '#C79CBA' },
	uni: { label: 'Uni', color: '#9FBF9A' },
	job: { label: 'Job', color: '#7FA3C4' }
};

export const STATUSES = ['todo', 'doing', 'done'] as const;
export type Status = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<Status, string> = {
	todo: 'OFFEN',
	doing: 'IN ARBEIT',
	done: 'ERLEDIGT'
};

export const PRIOS = [1, 2, 3] as const;
export type Prio = (typeof PRIOS)[number];
export function prioLabel(p: number): string {
	return p === 1 ? 'P1 HOCH' : p === 2 ? 'P2 MITTEL' : 'P3 NIEDRIG';
}
export function prioColor(p: number): string {
	return p === 1 ? '#C58C86' : p === 2 ? '#CFA76E' : '#3A3233';
}

export const UNI_TYPES = ['VL', 'EXC', 'OTH'] as const;
export type UniType = (typeof UNI_TYPES)[number];
export function typeColor(t: string): string {
	return t === 'VL' ? '#7FA3C4' : t === 'EXC' ? '#CFA76E' : '#8E8480';
}

export const COURSE_HUES = [
	'#C79CBA',
	'#7FA3C4',
	'#9FBF9A',
	'#CFA76E',
	'#C58C86',
	'#A99AD0',
	'#8FBFB6'
] as const;
export function courseColor(hue: number | null | undefined): string {
	return COURSE_HUES[Math.abs(hue ?? 0) % COURSE_HUES.length];
}

export const PROJECT_STATUSES = ['backlog', 'paused', 'active', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; color: string }> = {
	backlog: { label: 'BACKLOG', color: '#8E8480' },
	paused: { label: 'PAUSIERT', color: '#CFA76E' },
	active: { label: 'AKTIV', color: '#C79CBA' },
	archived: { label: 'ARCHIV', color: '#5E5654' }
};

export const NOTE_KINDS = ['journal', 'scratch', 'ref'] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];
export const NOTE_KIND_LABEL: Record<NoteKind, string> = {
	journal: 'JOURNAL',
	scratch: 'SCRATCH',
	ref: 'REFERENZ'
};

/** Ordner-Akzentfarben; Index stabil über die Sortierreihenfolge, Inbox grau. */
export const FOLDER_HUES = ['#C79CBA', '#7FA3C4', '#9FBF9A', '#CFA76E', '#C58C86'] as const;
export function folderColor(index: number): string {
	return FOLDER_HUES[index % FOLDER_HUES.length];
}
export const INBOX_COLOR = '#6B6462';
