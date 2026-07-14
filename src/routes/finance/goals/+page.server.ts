import { listGoals, createGoal, updateGoal, updateGoalAmount, deleteGoal } from '$lib/server/finance/goals';
import { listAccounts } from '$lib/server/finance/accounts';
import {
	action,
	str,
	strOrNull,
	amountCents,
	amountCentsOrNull,
	oneOf,
	int,
	intOrNull
} from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { goals: listGoals(), accounts: listAccounts() };
};

function goalInput(data: FormData) {
	return {
		name: str(data, 'name', 'Name'),
		type: oneOf(data, 'type', ['ruecklage', 'sparziel'] as const),
		target_amount_cents: amountCents(data, 'target_amount', 'Zielbetrag'),
		current_amount_cents: amountCents(data, 'current_amount', 'Aktueller Stand'),
		due_date: strOrNull(data, 'due_date'),
		account_id: intOrNull(data, 'account_id'),
		monthly_rate_cents: amountCentsOrNull(data, 'monthly_rate') ?? 0
	};
}

export const actions: Actions = {
	create: action((_event, data) => {
		createGoal(goalInput(data));
	}),

	update: action((_event, data) => {
		updateGoal(int(data, 'id'), goalInput(data));
	}),

	updateAmount: action((_event, data) => {
		updateGoalAmount(int(data, 'id'), amountCents(data, 'current_amount', 'Aktueller Stand'));
	}),

	delete: action((_event, data) => {
		deleteGoal(int(data, 'id'));
	})
};
