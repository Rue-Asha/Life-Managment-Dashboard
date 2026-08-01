<script lang="ts">
	import { enhance } from '$app/forms';
	import { autosave, quietEnhance } from '$lib/autosave';
	import {
		STATUSES,
		STATUS_LABEL,
		UNI_TYPES,
		courseColor,
		prioColor,
		prioLabel,
		typeColor
	} from '$lib/labels';

	let { data } = $props();
	const t = $derived(data.task);
	const course = $derived(data.courses.find((c) => c.id === t.course_id));
</script>

<div class="detail-bar">
	<a class="btn-back" href="/uni?view=tasks">← ZURÜCK</a>
	<span class="tag" style="color:{courseColor(course?.hue)}">{course?.name ?? '—'}</span>
	<span class="tag" style="color:{typeColor(t.type)}">{t.type}</span>
	<span class="tag" style="color:{prioColor(t.prio)}">{prioLabel(t.prio)}</span>
	<form class="spacer" method="POST" action="?/delete" use:enhance>
		<button class="btn-text">aufgabe löschen</button>
	</form>
</div>

<div class="detail-grid">
	<section class="panel">
		<div class="panel-label">[ DETAILS ]</div>
		<div class="fields">
			<form method="POST" action="?/text" use:quietEnhance>
				<label class="field">
					<span>AUFGABE</span>
					<input class="title-input" name="text" value={t.text} use:autosave />
				</label>
			</form>
			<form method="POST" action="?/course" use:quietEnhance>
				<label class="field">
					<span>KURS</span>
					<select name="course" value={String(t.course_id)} style="color:{courseColor(course?.hue)}" use:autosave>
						{#each data.courses as c (c.id)}
							<option value={String(c.id)}>{c.name}</option>
						{/each}
					</select>
				</label>
			</form>
			<form method="POST" action="?/type" use:quietEnhance>
				<label class="field">
					<span>TYP</span>
					<select name="type" value={t.type} style="color:{typeColor(t.type)}" use:autosave>
						{#each UNI_TYPES as ty (ty)}
							<option value={ty}>{ty}</option>
						{/each}
					</select>
				</label>
			</form>
			<form method="POST" action="?/due" use:quietEnhance>
				<label class="field">
					<span>FÄLLIG AM</span>
					<input type="date" name="due" value={t.due ?? ''} use:autosave />
				</label>
			</form>
			<form method="POST" action="?/prio" use:quietEnhance>
				<label class="field">
					<span>PRIORITÄT</span>
					<select name="prio" value={String(t.prio)} style="color:{prioColor(t.prio)}" use:autosave>
						<option value="1">P1 HOCH</option>
						<option value="2">P2 MITTEL</option>
						<option value="3">P3 NIEDRIG</option>
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
				<span>{t.done ? 'erledigt' : 'als erledigt markieren'}</span>
			</button>
		</form>
	</section>

	<section class="panel">
		<div class="panel-label">[ NOTIZEN ]</div>
		<form method="POST" action="?/notes" use:quietEnhance>
			<textarea name="notes" placeholder="Kontext, Teilschritte, Literatur…" value={t.notes} use:autosave
			></textarea>
		</form>
	</section>
</div>
