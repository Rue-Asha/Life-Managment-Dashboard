<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { autosave, quietEnhance } from '$lib/autosave';
	import { confirmEnhance } from '$lib/confirm';
	import { COURSE_HUES, courseColor, typeColor } from '$lib/labels';
	import { dueColor, dueLabel } from '$lib/format';

	let { data } = $props();
	const c = $derived(data.course);
	const accent = $derived(courseColor(c.hue));
</script>

<div class="detail-bar">
	<a class="btn-back" href="/uni">← ALL COURSES</a>
	<span class="tag" style="color:{accent}">{data.semester?.name ?? '—'}</span>
	<form
		class="spacer"
		method="POST"
		action="?/delete"
		use:confirmEnhance={`Delete course "${c.name}" and all its tasks? This cannot be undone.`}
	>
		<button class="btn-text">delete course</button>
	</form>
</div>

<div class="detail-grid">
	<section class="panel" style="border-top:2px solid {accent}">
		<div class="panel-label">[ KEY FACTS ]</div>
		<div class="fields">
			<form method="POST" action="?/name" use:quietEnhance>
				<label class="field">
					<span>COURSE</span>
					<input class="title-input" name="name" value={c.name} use:autosave />
				</label>
			</form>
			<form method="POST" action="?/field" use:quietEnhance>
				<input type="hidden" name="field" value="code" />
				<label class="field">
					<span>CODE</span>
					<input class="mono-input" name="value" value={c.code} use:autosave />
				</label>
			</form>
			<form method="POST" action="?/field" use:quietEnhance>
				<input type="hidden" name="field" value="docent" />
				<label class="field">
					<span>LECTURER</span>
					<input name="value" value={c.docent} placeholder="Prof. …" use:autosave />
				</label>
			</form>
			<form method="POST" action="?/field" use:quietEnhance>
				<input type="hidden" name="field" value="slot" />
				<label class="field">
					<span>SLOT / ROOM</span>
					<input name="value" value={c.slot} placeholder="Tue 10:15 · H12" use:autosave />
				</label>
			</form>
			<div class="field-pair">
				<form method="POST" action="?/field" use:quietEnhance>
					<input type="hidden" name="field" value="ects" />
					<label class="field">
						<span>ECTS</span>
						<input class="mono-input" name="value" value={c.ects} use:autosave />
					</label>
				</form>
				<form method="POST" action="?/field" use:quietEnhance>
					<input type="hidden" name="field" value="grade" />
					<label class="field">
						<span>GRADE</span>
						<input class="mono-input" name="value" value={c.grade} placeholder="—" use:autosave />
					</label>
				</form>
			</div>
			<form method="POST" action="?/hue" use:quietEnhance>
				<label class="field">
					<span>COLOUR</span>
					<select name="hue" value={String(c.hue)} style="color:{accent};border-color:{accent}" use:autosave>
						{#each COURSE_HUES as _, i (i)}
							<option value={String(i)}>COLOUR {i + 1}</option>
						{/each}
					</select>
				</label>
			</form>
		</div>
	</section>

	<section class="panel">
		<div class="panel-label">[ TASKS ]</div>
		<div class="check-list">
			{#each data.tasks as t (t.id)}
				<div class="check-row">
					<form method="POST" action="?/toggleTask" use:enhance style="display:contents">
						<input type="hidden" name="id" value={t.id} />
						<button
							class="checkbox"
							class:done={!!t.done}
							style="width:14px;height:14px"
							title={t.done ? 'reopen' : 'mark done'}
						></button>
					</form>
					<button
						type="button"
						class="row-text"
						class:done={!!t.done}
						style="font-size:13.5px"
						onclick={() => goto(`/uni/tasks/${t.id}`)}>{t.text}</button
					>
					<span class="badge" style="color:{typeColor(t.type)};padding:2px 6px">{t.type}</span>
					<span class="due-mono" style="color:{dueColor(t.due, t.done)};font-size:10px">{dueLabel(t.due)}</span>
				</div>
			{:else}
				<div style="padding:10px 0;color:var(--dim);font-size:13px;font-style:italic">
					no tasks for this course
				</div>
			{/each}
		</div>

		<div class="panel-label spaced">[ NOTES ]</div>
		<form method="POST" action="?/field" use:quietEnhance>
			<input type="hidden" name="field" value="notes" />
			<textarea
				name="value"
				placeholder="Exam format, reading, lecture notes…"
				style="min-height:300px"
				value={c.notes}
				use:autosave
			></textarea>
		</form>
	</section>
</div>
