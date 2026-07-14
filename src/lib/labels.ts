// Shared enum labels (client + server). E-Ink rule: state is always
// symbol + word — these strings are the single source for that language.

export const AREAS = ['uni', 'job', 'it', 'personal'] as const;
export type Area = (typeof AREAS)[number];

export const AREA_LABELS: Record<Area, string> = {
	uni: '🎓 Uni (Orga)',
	job: '💼 Job',
	it: '💻 IT',
	personal: '🏠 Personal'
};

export const PRIORITIES = ['high', 'medium', 'low'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, { label: string; tone: 'crit' | 'warn' | 'good' }> =
	{
		high: { label: '▲ Hoch', tone: 'crit' },
		medium: { label: '■ Mittel', tone: 'warn' },
		low: { label: '▽ Niedrig', tone: 'good' }
	};

export const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'wont_do', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
	backlog: '○ Backlog',
	todo: '○ To-do',
	in_progress: '◐ In Arbeit',
	wont_do: '✕ Won’t do',
	done: '✓ Done'
};

// Uni (brick 3) — task types mirror the Notion "Type" select.
export const UNI_TASK_TYPES = ['exc', 'vl', 'qz', 'ch'] as const;
export type UniTaskType = (typeof UNI_TASK_TYPES)[number];

export const UNI_TASK_TYPE_LABELS: Record<UniTaskType, string> = {
	exc: 'EXC · Übung',
	vl: 'VL · Vorlesung',
	qz: 'QZ · Quiz',
	ch: 'CH · Kapitel'
};

// Notes (brick 5) — Bereiche mirror the Notion Private-Notes sections.
export const BEREICHE = [
	'persoenlich',
	'ideen',
	'gesundheit',
	'reise',
	'orte_food',
	'musik_medien'
] as const;
export type Bereich = (typeof BEREICHE)[number];

export const BEREICH_LABELS: Record<Bereich, string> = {
	persoenlich: '🧍 Persönlich',
	ideen: '💡 Ideen',
	gesundheit: '🩺 Gesundheit',
	reise: '✈️ Reise',
	orte_food: '📍 Orte & Food',
	musik_medien: '🎵 Musik & Medien'
};

// Curriculum (brick 7)
export const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;

// Projects (brick 6)
export const PROJECT_TYPES = ['project', 'course', 'tutorial', 'research', 'other'] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
	project: '🛠 Projekt',
	course: '📚 Kurs',
	tutorial: '🧪 Tutorial',
	research: '🔬 Research',
	other: '📦 Sonstiges'
};

export const PROJECT_STATUSES = ['backlog', 'in_progress', 'done', 'paused', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, { label: string; tone: string }> = {
	backlog: { label: '○ Backlog', tone: '' },
	in_progress: { label: '◐ In Progress', tone: 'good' },
	done: { label: '✓ Done', tone: 'good' },
	paused: { label: '❚❚ Paused', tone: 'warn' },
	archived: { label: '▣ Archiviert', tone: '' }
};

export const PROJECT_VIEWS = ['grid', 'list', 'board'] as const;
export type ProjectView = (typeof PROJECT_VIEWS)[number];

/** Notes tags live as a JSON array in TEXT; tolerate malformed data. */
export function parseTags(raw: string): string[] {
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
	} catch {
		return [];
	}
}

export const CLASS_STATUSES = ['active', 'completed', 'on_hold'] as const;
export type ClassStatus = (typeof CLASS_STATUSES)[number];

export const CLASS_STATUS_LABELS: Record<ClassStatus, { label: string; tone: string }> = {
	active: { label: '● Aktiv', tone: 'good' },
	completed: { label: '✓ Abgeschlossen', tone: '' },
	on_hold: { label: '◐ On Hold', tone: 'warn' }
};
