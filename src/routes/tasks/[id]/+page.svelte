<script lang="ts">
	import { enhance } from '$app/forms';
	import { autosave, quietEnhance } from '$lib/autosave';
	import { CATS, CAT_META, STATUSES, STATUS_LABEL, prioColor, prioLabel } from '$lib/labels';

	let { data } = $props();
	const t = $derived(data.task);
</script>

<div class="detail-bar">
	<a class="btn-back" href="/tasks">← ALL TASKS</a>
	<span class="tag" style="color:{CAT_META[t.cat].color}">{CAT_META[t.cat].label.toUpperCase()}</span>
	<span class="tag" style="color:{prioColor(t.prio)}">{prioLabel(t.prio)}</span>
	<form class="spacer" method="POST" action="?/delete" use:enhance>
		<button class="btn-text">delete task</button>
	</form>
</div>

<div class="detail-grid">
	<section class="panel">
		<div class="panel-label">[ DETAILS ]</div>
		<div class="fields">
			<form method="POST" action="?/text" use:quietEnhance>
				<label class="field">
					<span>TASK</span>
					<input class="title-input" name="text" value={t.text} use:autosave />
				</label>
			</form>
			<form method="POST" action="?/due" use:quietEnhance>
				<label class="field">
					<span>DUE</span>
					<input type="date" name="due" value={t.due ?? ''} use:autosave />
				</label>
			</form>
			<form method="POST" action="?/prio" use:quietEnhance>
				<label class="field">
					<span>PRIORITY</span>
					<select name="prio" value={String(t.prio)} style="color:{prioColor(t.prio)}" use:autosave>
						<option value="1">P1 HIGH</option>
						<option value="2">P2 MEDIUM</option>
						<option value="3">P3 LOW</option>
					</select>
				</label>
			</form>
			<form method="POST" action="?/cat" use:quietEnhance>
				<label class="field">
					<span>AREA</span>
					<select name="cat" value={t.cat} style="color:{CAT_META[t.cat].color}" use:autosave>
						{#each CATS as c (c)}
							<option value={c}>{CAT_META[c].label}</option>
						{/each}
					</select>
				</label>
			</form>
			<form method="POST" action="?/status" use:quietEnhance>
				<label class="field">
					<span>STATUS</span>
					<select name="status" value={t.status} use:autosave>
						{#each STATUSES as s (s)}
							<option value={s}>{STATUS_LABEL[s]}</option>
						{/each}
					</select>
				</label>
			</form>
		</div>
		<form method="POST" action="?/toggle" use:enhance>
			<button class="toggle-done">
				<span class="checkbox" class:done={!!t.done}></span>
				<span>{t.done ? 'done' : 'mark as done'}</span>
			</button>
		</form>
	</section>

	<section class="panel">
		<div class="panel-label">[ NOTES ]</div>
		<form method="POST" action="?/notes" use:quietEnhance>
			<textarea name="notes" placeholder="Context, sub-steps, links…" value={t.notes} use:autosave
			></textarea>
		</form>
	</section>
</div>
