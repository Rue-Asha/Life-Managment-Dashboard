<script lang="ts">
	// Shared priority field — the single source for the ▲/■/▽ select that
	// appears in every create/edit form (tasks, uni, projects).
	import { PRIORITIES, PRIORITY_LABELS, type Priority } from '$lib/labels';

	let {
		value = null,
		name = 'priority',
		label = 'Priorität'
	}: { value?: Priority | null; name?: string; label?: string } = $props();
</script>

<label class="field">
	<span>{label}</span>
	<select {name}>
		<option value="">—</option>
		{#each PRIORITIES as priority (priority)}
			<option value={priority} selected={value === priority}>
				{PRIORITY_LABELS[priority].label}
			</option>
		{/each}
	</select>
</label>
