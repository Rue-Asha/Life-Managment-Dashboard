import type { Actions, PageServerLoad } from './$types';
import {
	listPhases,
	getActivePhase,
	createPhase,
	activatePhase,
	setPhaseStatus,
	updatePhase,
	deletePhase,
	listPriorities,
	listTemplates,
	createTemplate,
	updateTemplate,
	deleteTemplate,
	addBlock,
	deleteBlock,
	moveBlock,
	getWeek,
	setWeekDay,
	listQuotas,
	createQuota,
	updateQuota,
	deleteQuota,
	tickQuota,
	listMiniCurricula,
	createMiniCurriculum,
	deleteMiniCurriculum,
	addMiniItem,
	toggleMiniItem,
	deleteMiniItem
} from '$lib/server/curriculum';
import { action, checkbox, int, intOrNull, oneOf, str, strOrNull } from '$lib/server/forms';
import { isoWeekKey } from '$lib/format';

export const load: PageServerLoad = ({ url }) => {
	const phases = listPhases();
	const requested = Number(url.searchParams.get('phase'));
	const phase =
		(Number.isInteger(requested) ? phases.find((p) => p.id === requested) : undefined) ??
		getActivePhase() ??
		phases[0] ??
		null;
	return {
		phases,
		phase,
		week: isoWeekKey(),
		priorities: listPriorities(),
		templates: phase ? listTemplates(phase.id) : [],
		weekDays: phase ? getWeek(phase.id) : [],
		quotas: phase ? listQuotas(phase.id) : [],
		miniCurricula: phase ? listMiniCurricula(phase.id) : []
	};
};

export const actions: Actions = {
	// Phasen
	createPhase: action((_event, data) => {
		createPhase(str(data, 'name', 'Name'), intOrNull(data, 'clone_from'));
	}),
	activatePhase: action((_event, data) => {
		activatePhase(int(data, 'id'));
	}),
	archivePhase: action((_event, data) => {
		setPhaseStatus(int(data, 'id'), 'archived');
	}),
	planPhase: action((_event, data) => {
		setPhaseStatus(int(data, 'id'), 'planned');
	}),
	updatePhase: action((_event, data) => {
		updatePhase(int(data, 'id'), {
			name: str(data, 'name', 'Name'),
			subtitle: strOrNull(data, 'subtitle'),
			transitionNote: strOrNull(data, 'transition_note')
		});
	}),
	deletePhase: action((_event, data) => {
		deletePhase(int(data, 'id'));
	}),
	// Templates & Blöcke
	createTemplate: action((_event, data) => {
		createTemplate(int(data, 'phase_id'), str(data, 'name', 'Name'), strOrNull(data, 'meta'));
	}),
	updateTemplate: action((_event, data) => {
		updateTemplate(int(data, 'id'), str(data, 'name', 'Name'), strOrNull(data, 'meta'));
	}),
	deleteTemplate: action((_event, data) => {
		deleteTemplate(int(data, 'id'));
	}),
	addBlock: action((_event, data) => {
		addBlock(int(data, 'template_id'), {
			timeHint: strOrNull(data, 'time_hint'),
			label: str(data, 'label', 'Label'),
			durationHint: strOrNull(data, 'duration_hint'),
			priorityId: intOrNull(data, 'priority_id'),
			highlight: checkbox(data, 'highlight')
		});
	}),
	deleteBlock: action((_event, data) => {
		deleteBlock(int(data, 'id'));
	}),
	moveBlock: action((_event, data) => {
		moveBlock(int(data, 'id'), oneOf(data, 'direction', ['up', 'down'] as const));
	}),
	// Wochen-Board
	setDay: action((_event, data) => {
		const tagsRaw = strOrNull(data, 'tags');
		setWeekDay(int(data, 'phase_id'), int(data, 'weekday'), {
			templateId: intOrNull(data, 'template_id'),
			dayLabel: strOrNull(data, 'day_label'),
			tags: tagsRaw
				? tagsRaw
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean)
				: []
		});
	}),
	// Quoten
	createQuota: action((_event, data) => {
		createQuota(int(data, 'phase_id'), {
			priorityId: intOrNull(data, 'priority_id'),
			title: str(data, 'title', 'Titel'),
			note: strOrNull(data, 'note'),
			targetCount: intOrNull(data, 'target_count')
		});
	}),
	updateQuota: action((_event, data) => {
		updateQuota(int(data, 'id'), {
			title: str(data, 'title', 'Titel'),
			note: strOrNull(data, 'note'),
			targetCount: intOrNull(data, 'target_count')
		});
	}),
	deleteQuota: action((_event, data) => {
		deleteQuota(int(data, 'id'));
	}),
	tick: action((_event, data) => {
		tickQuota(int(data, 'id'), data.get('delta') === '-1' ? -1 : 1);
	}),
	// Mini-Curricula
	createMini: action((_event, data) => {
		createMiniCurriculum(
			str(data, 'name', 'Name'),
			intOrNull(data, 'priority_id'),
			intOrNull(data, 'phase_id')
		);
	}),
	deleteMini: action((_event, data) => {
		deleteMiniCurriculum(int(data, 'id'));
	}),
	addMiniItem: action((_event, data) => {
		addMiniItem(int(data, 'curriculum_id'), int(data, 'week_no'), str(data, 'topic', 'Thema'));
	}),
	toggleMiniItem: action((_event, data) => {
		toggleMiniItem(int(data, 'id'));
	}),
	deleteMiniItem: action((_event, data) => {
		deleteMiniItem(int(data, 'id'));
	})
};
