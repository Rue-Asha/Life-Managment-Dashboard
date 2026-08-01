<script lang="ts">
	import { enhance } from '$app/forms';
	import { autosave, quietEnhance } from '$lib/autosave';
	import { PROJECT_STATUSES, PROJECT_STATUS_META } from '$lib/labels';

	let { data } = $props();
	const p = $derived(data.project);
	const statusColor = $derived(PROJECT_STATUS_META[p.status].color);
	const done = $derived(data.tasks.filter((t) => t.done).length);
	const pct = $derived(data.tasks.length ? Math.round((done / data.tasks.length) * 100) : 0);

	let stepInput = $state('');
</script>

<div class="detail-bar">
	<a class="btn-back" href="/projects">← ALLE PROJEKTE</a>
	<span class="mono-dim" style="letter-spacing:0.18em">STATUS</span>
	<form method="POST" action="?/status" use:quietEnhance style="display:contents">
		<select
			name="status"
			value={p.status}
			use:autosave
			style="background:var(--panel2);border:1px solid {statusColor};color:{statusColor};font-family:var(--font-mono);font-size:9px;letter-spacing:0.16em;padding:7px 11px;border-radius:2px;cursor:pointer"
		>
			{#each PROJECT_STATUSES as s (s)}
				<option value={s}>{PROJECT_STATUS_META[s].label}</option>
			{/each}
		</select>
	</form>
	<form class="spacer" method="POST" action="?/delete" use:enhance>
		<button class="btn-text">projekt löschen</button>
	</form>
</div>

<div class="detail-grid">
	<section class="panel">
		<div class="panel-label">[ ECKDATEN ]</div>
		<div class="fields">
			<form method="POST" action="?/name" use:quietEnhance>
				<label class="field">
					<span>NAME</span>
					<input class="title-input" name="name" value={p.name} use:autosave />
				</label>
			</form>
			<form method="POST" action="?/stack" use:quietEnhance>
				<label class="field">
					<span>STACK</span>
					<input class="mono-input" name="stack" value={p.stack} use:autosave />
				</label>
			</form>
			<form method="POST" action="?/repo" use:quietEnhance>
				<label class="field">
					<span>REPO / LINK</span>
					<input
						class="mono-input"
						name="repo"
						value={p.repo}
						placeholder="git.example.dev/…"
						style="color:var(--accent)"
						use:autosave
					/>
				</label>
			</form>
		</div>
		<div class="progress" style="margin:20px 0 6px">
			<div style="background:{statusColor};width:{pct}%"></div>
		</div>
		<div class="mono-dim" style="letter-spacing:0.12em;font-size:9.5px">
			{pct}% · {done} VON {data.tasks.length} ERLEDIGT
		</div>
	</section>

	<section class="panel">
		<div class="panel-label">[ PLAN &amp; AUFGABEN ]</div>
		<div class="check-list">
			{#each data.tasks as t (t.id)}
				<div class="check-row">
					<form method="POST" action="?/toggleTask" use:enhance style="display:contents">
						<input type="hidden" name="id" value={t.id} />
						<button
							class="checkbox"
							class:done={!!t.done}
							style="width:14px;height:14px"
							title={t.done ? 'wieder öffnen' : 'erledigt'}
						></button>
					</form>
					<span class="txt" class:done={!!t.done}>{t.text}</span>
					<form method="POST" action="?/deleteTask" use:enhance style="display:contents">
						<input type="hidden" name="id" value={t.id} />
						<button class="x-btn" style="font-size:11px">✕</button>
					</form>
				</div>
			{:else}
				<div style="padding:10px 0;color:var(--dim);font-size:13px;font-style:italic">
					noch keine Schritte geplant
				</div>
			{/each}
		</div>
		<form
			method="POST"
			action="?/addTask"
			use:enhance={() =>
				async ({ update }) => {
					stepInput = '';
					await update();
				}}
		>
			<input
				class="add-step"
				name="text"
				placeholder="+ Schritt → enter"
				bind:value={stepInput}
				required
			/>
		</form>

		<div class="panel-label spaced">[ NOTIZEN ]</div>
		<form method="POST" action="?/notes" use:quietEnhance>
			<textarea
				name="notes"
				placeholder="Überlegungen, Entscheidungen, Links, alles was zum Projekt gehört…"
				style="min-height:260px"
				value={p.notes}
				use:autosave
			></textarea>
		</form>
	</section>
</div>
