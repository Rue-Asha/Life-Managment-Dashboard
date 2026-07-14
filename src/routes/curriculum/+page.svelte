<script lang="ts">
	import { enhance } from '$app/forms';
	import { WEEKDAYS, parseTags } from '$lib/labels';
	import type { Quota } from '$lib/server/curriculum';

	let { data, form } = $props();

	const rankLabel = (priorityId: number | null): string => {
		const p = data.priorities.find((x) => x.id === priorityId);
		return p ? `0${p.rank}` : '';
	};

	function confirmSubmit(message: string) {
		return (event: SubmitEvent) => {
			if (!confirm(message)) event.preventDefault();
		};
	}

	// JS getDay(): So=0 … Sa=6 → Schema Mo=0 … So=6.
	const todayIndex = (new Date().getDay() + 6) % 7;
</script>

<svelte:head><title>Curriculum · Zentrale</title></svelte:head>

{#snippet tally(quota: Quota)}
	{#if quota.target_count !== null}
		<span class="tally mono" aria-label="{quota.week_count} von {quota.target_count}">
			{#each Array(quota.target_count) as _, i (i)}
				<span class="tick" class:filled={i < quota.week_count}>{i < quota.week_count ? '▣' : '▢'}</span>
			{/each}
			{#if quota.week_count > quota.target_count}<span class="over">+{quota.week_count - quota.target_count}</span>{/if}
			<span class="count">{quota.week_count}/{quota.target_count}</span>
		</span>
	{:else}
		<span class="mono dim" style="font-size:12px;">qualitativ</span>
	{/if}
{/snippet}

<div class="page-head">
	<div>
		<p class="eyebrow">Curriculum</p>
		<h1>Schedule{#if data.phase} — {data.phase.name}{/if}</h1>
		{#if data.phase?.subtitle}
			<p class="lede" style="margin-bottom:0;">{data.phase.subtitle}</p>
		{/if}
	</div>
	<div class="actions mono" style="font-size:12.5px; color:var(--ink3);">{data.week}</div>
</div>

{#if form?.message}<p class="form-error">{form.message}</p>{/if}

{#if data.phases.length > 1 || !data.phase}
	<div class="filters">
		{#each data.phases as phase (phase.id)}
			<a class="fchip" class:on={phase.id === data.phase?.id} href="/curriculum?phase={phase.id}"
				>{phase.status === 'active' ? '● ' : phase.status === 'archived' ? '▣ ' : '○ '}{phase.name}</a
			>
		{/each}
	</div>
{/if}

{#if data.phase}
	{@const phase = data.phase}

	<!-- 25-5-Prioritäten -->
	<h2 class="sect">25-5 · Prioritäten</h2>
	<div class="prio-strip">
		{#each data.priorities as priority (priority.id)}
			<a class="prio lift" href="/curriculum/priorities/{priority.id}">
				<span class="mono rank">0{priority.rank}</span>
				<strong>{priority.name}</strong>
				{#if priority.note}<span class="dim small">{priority.note}</span>{/if}
				{#if priority.description}<span class="has-desc" title="Beschreibung vorhanden">✎</span>{/if}
				<span class="prio-arrow" aria-hidden="true">›</span>
			</a>
		{/each}
	</div>

	<!-- Wochen-Board -->
	<h2 class="sect">Wochenübersicht</h2>
	<div class="board">
		{#each WEEKDAYS as label, weekday (weekday)}
			{@const day = data.weekDays.find((d) => d.weekday === weekday)}
			<div class="bcol wcol" class:today={weekday === todayIndex}>
				<p class="bhead mono">{label}{weekday === todayIndex ? ' · heute' : ''}</p>
				<div class="bcard">
					<strong>{day?.day_label ?? '—'}</strong>
					{#if day?.template_name}
						<p class="dim small" style="margin:3px 0 0;">{day.template_name}</p>
					{/if}
					{#if day && parseTags(day.tags).length > 0}
						<p style="margin:7px 0 0; display:flex; gap:4px; flex-wrap:wrap;">
							{#each parseTags(day.tags) as tag (tag)}
								<span class="chip mono">{tag}</span>
							{/each}
						</p>
					{/if}
					<details class="edit-day">
						<summary>✎</summary>
						<form method="POST" action="?/setDay" use:enhance>
							<input type="hidden" name="phase_id" value={phase.id} />
							<input type="hidden" name="weekday" value={weekday} />
							<label class="field" style="margin-top:8px;">
								<span>Label</span>
								<input type="text" name="day_label" value={day?.day_label ?? ''} />
							</label>
							<label class="field" style="margin-top:6px;">
								<span>Template</span>
								<select name="template_id">
									<option value="">—</option>
									{#each data.templates as t (t.id)}
										<option value={t.id} selected={day?.day_template_id === t.id}>{t.name}</option>
									{/each}
								</select>
							</label>
							<label class="field" style="margin-top:6px;">
								<span>Tags (Komma)</span>
								<input type="text" name="tags" value={day ? parseTags(day.tags).join(', ') : ''} />
							</label>
							<button class="btn ghost small" style="margin-top:8px;">✓ Setzen</button>
						</form>
					</details>
				</div>
			</div>
		{/each}
	</div>

	<!-- Wochenquoten -->
	<h2 class="sect">Wochenquoten <span class="soft">der eigentliche Vertrag · {data.week}</span></h2>
	<div class="card">
		<div class="rows">
			{#each data.quotas as quota (quota.id)}
				<div class="row qrow">
					{#if quota.priority_rank}
						<span class="mono rank">0{quota.priority_rank}</span>
					{/if}
					<span class="title"><strong>{quota.title}</strong>
						{#if quota.note}<span class="dim small qnote">{quota.note}</span>{/if}
					</span>
					{@render tally(quota)}
					{#if quota.target_count !== null}
						<form class="inline" method="POST" action="?/tick" use:enhance>
							<input type="hidden" name="id" value={quota.id} />
							<input type="hidden" name="delta" value="1" />
							<button class="btn small" title="Tick für diese Woche">＋ Tick</button>
						</form>
						<form class="inline" method="POST" action="?/tick" use:enhance>
							<input type="hidden" name="id" value={quota.id} />
							<input type="hidden" name="delta" value="-1" />
							<button class="iconbtn" title="Tick zurücknehmen">−</button>
						</form>
					{/if}
					<details class="inline-edit">
						<summary class="iconbtn" title="Bearbeiten">✎</summary>
						<form method="POST" action="?/updateQuota" use:enhance>
							<input type="hidden" name="id" value={quota.id} />
							<div class="form-row" style="margin-top:8px;">
								<label class="field"><span>Titel</span><input type="text" name="title" value={quota.title} required /></label>
								<label class="field" style="flex:1;"><span>Notiz</span><input type="text" name="note" value={quota.note ?? ''} /></label>
								<label class="field" style="max-width:90px;"><span>Ziel/Woche</span><input type="number" name="target_count" value={quota.target_count ?? ''} min="1" /></label>
								<button class="btn ghost small">✓</button>
							</div>
						</form>
					</details>
					<form class="inline" method="POST" action="?/deleteQuota" use:enhance>
						<input type="hidden" name="id" value={quota.id} />
						<button class="iconbtn" title="Quote löschen">✕</button>
					</form>
				</div>
			{/each}
		</div>
		<details class="editor" style="margin-top:14px;">
			<summary>＋ Neue Quote</summary>
			<form method="POST" action="?/createQuota" use:enhance>
				<input type="hidden" name="phase_id" value={phase.id} />
				<div class="form-row">
					<label class="field"><span>Titel</span><input type="text" name="title" required /></label>
					<label class="field">
						<span>Priorität</span>
						<select name="priority_id">
							<option value="">—</option>
							{#each data.priorities as p (p.id)}
								<option value={p.id}>0{p.rank} {p.name}</option>
							{/each}
						</select>
					</label>
					<label class="field" style="max-width:100px;"><span>Ziel/Woche</span><input type="number" name="target_count" min="1" placeholder="leer = qualitativ" /></label>
					<label class="field" style="flex:1;"><span>Notiz</span><input type="text" name="note" /></label>
					<button class="btn">＋ Anlegen</button>
				</div>
			</form>
		</details>
	</div>

	<!-- Tages-Templates -->
	<h2 class="sect">Tages-Templates</h2>
	<div class="grid cols-3" style="align-items:start;">
		{#each data.templates as template (template.id)}
			<div class="card">
				<h3 style="display:flex; justify-content:space-between; gap:8px;">
					<span>{template.name}
						{#if template.meta}<span class="dim small mono" style="font-weight:400;"> {template.meta}</span>{/if}
					</span>
					<form class="inline" method="POST" action="?/deleteTemplate"
						onsubmit={confirmSubmit(`Template „${template.name}“ samt Blöcken löschen?`)}>
						<input type="hidden" name="id" value={template.id} />
						<button class="iconbtn" title="Template löschen">✕</button>
					</form>
				</h3>
				<div class="blocks">
					{#each template.blocks as block, i (block.id)}
						<div class="blockrow" class:hl={block.highlight}>
							<span class="thint mono">{block.time_hint ?? ''}</span>
							<span class="blabel">
								{#if block.priority_id}<span class="mono rank">{rankLabel(block.priority_id)}</span>{/if}
								{block.label}
								{#if block.duration_hint}<span class="dim mono small"> · {block.duration_hint}</span>{/if}
							</span>
							<span class="bops">
								{#if i > 0}
									<form class="inline" method="POST" action="?/moveBlock" use:enhance>
										<input type="hidden" name="id" value={block.id} />
										<input type="hidden" name="direction" value="up" />
										<button class="iconbtn" title="Nach oben">↑</button>
									</form>
								{/if}
								{#if i < template.blocks.length - 1}
									<form class="inline" method="POST" action="?/moveBlock" use:enhance>
										<input type="hidden" name="id" value={block.id} />
										<input type="hidden" name="direction" value="down" />
										<button class="iconbtn" title="Nach unten">↓</button>
									</form>
								{/if}
								<form class="inline" method="POST" action="?/deleteBlock" use:enhance>
									<input type="hidden" name="id" value={block.id} />
									<button class="iconbtn" title="Block löschen">✕</button>
								</form>
							</span>
						</div>
					{/each}
				</div>
				<details class="editor" style="margin-top:12px;">
					<summary>＋ Block</summary>
					<form method="POST" action="?/addBlock" use:enhance>
						<input type="hidden" name="template_id" value={template.id} />
						<div class="form-row">
							<label class="field" style="max-width:110px;"><span>Zeit-Hinweis</span><input type="text" name="time_hint" placeholder="08:30 / Pendeln" /></label>
							<label class="field" style="flex:1; min-width:160px;"><span>Label</span><input type="text" name="label" required /></label>
							<label class="field" style="max-width:90px;"><span>Dauer</span><input type="text" name="duration_hint" placeholder="90 min" /></label>
							<label class="field">
								<span>Priorität</span>
								<select name="priority_id">
									<option value="">—</option>
									{#each data.priorities as p (p.id)}
										<option value={p.id}>0{p.rank} {p.name}</option>
									{/each}
								</select>
							</label>
							<label class="check"><input type="checkbox" name="highlight" /> Highlight</label>
							<button class="btn ghost small">＋</button>
						</div>
					</form>
				</details>
			</div>
		{/each}
		<div class="card dashed">
			<h3>＋ Neues Template</h3>
			<form method="POST" action="?/createTemplate" use:enhance>
				<input type="hidden" name="phase_id" value={phase.id} />
				<div class="form-row">
					<label class="field" style="flex:1;"><span>Name</span><input type="text" name="name" required placeholder="Lerntag + Gym" /></label>
					<label class="field"><span>Meta</span><input type="text" name="meta" placeholder="Mo · Mi · Fr · Sa" /></label>
					<button class="btn">＋</button>
				</div>
			</form>
		</div>
	</div>

	<!-- Mini-Curricula -->
	<h2 class="sect">Mini-Curricula <span class="soft">eine Technik = ein Lernziel</span></h2>
	<div class="grid cols-2" style="align-items:start;">
		{#each data.miniCurricula as mini (mini.id)}
			<div class="card">
				<h3 style="display:flex; justify-content:space-between; gap:8px;">
					<span>{mini.name}</span>
					<form class="inline" method="POST" action="?/deleteMini"
						onsubmit={confirmSubmit(`„${mini.name}“ löschen?`)}>
						<input type="hidden" name="id" value={mini.id} />
						<button class="iconbtn" title="Löschen">✕</button>
					</form>
				</h3>
				<div class="rows">
					{#each mini.items as item (item.id)}
						<div class="row">
							<form class="inline" method="POST" action="?/toggleMiniItem" use:enhance>
								<input type="hidden" name="id" value={item.id} />
								<button class="cbox" class:checked={item.done === 1}
									aria-label="„{item.topic}“ {item.done ? 'wieder öffnen' : 'abhaken'}"
									>{item.done ? '✓' : ''}</button>
							</form>
							<span class="mono rank">W{item.week_no}</span>
							<span class="title" class:done-text={item.done === 1}>{item.topic}</span>
							<form class="inline" method="POST" action="?/deleteMiniItem" use:enhance>
								<input type="hidden" name="id" value={item.id} />
								<button class="iconbtn" title="Löschen">✕</button>
							</form>
						</div>
					{/each}
				</div>
				<form method="POST" action="?/addMiniItem" use:enhance>
					<input type="hidden" name="curriculum_id" value={mini.id} />
					<div class="form-row" style="margin-top:10px;">
						<label class="field" style="max-width:70px;"><span>Woche</span><input type="number" name="week_no" value={mini.items.length + 1} min="1" required /></label>
						<label class="field" style="flex:1;"><span>Thema</span><input type="text" name="topic" required /></label>
						<button class="btn ghost small">＋</button>
					</div>
				</form>
			</div>
		{/each}
		<div class="card dashed">
			<h3>＋ Neues Mini-Curriculum</h3>
			<form method="POST" action="?/createMini" use:enhance>
				<input type="hidden" name="phase_id" value={phase.id} />
				<div class="form-row">
					<label class="field" style="flex:1;"><span>Name</span><input type="text" name="name" required placeholder="FR-Grammatik-Curriculum" /></label>
					<label class="field">
						<span>Priorität</span>
						<select name="priority_id">
							<option value="">—</option>
							{#each data.priorities as p (p.id)}
								<option value={p.id}>0{p.rank} {p.name}</option>
							{/each}
						</select>
					</label>
					<button class="btn">＋</button>
				</div>
			</form>
		</div>
	</div>

	<!-- Phasen-Verwaltung -->
	<h2 class="sect">Phase</h2>
	<div class="card">
		<form method="POST" action="?/updatePhase" use:enhance>
			<input type="hidden" name="id" value={phase.id} />
			<div class="form-row">
				<label class="field"><span>Name</span><input type="text" name="name" value={phase.name} required /></label>
				<label class="field" style="flex:1;"><span>Untertitel</span><input type="text" name="subtitle" value={phase.subtitle ?? ''} /></label>
				<label class="field" style="flex:1; min-width:240px;"><span>Übergangs-Notiz („// Nach den Klausuren …“)</span><input type="text" name="transition_note" value={phase.transition_note ?? ''} /></label>
				<button class="btn ghost">✓ Speichern</button>
			</div>
		</form>
		{#if phase.transition_note}
			<p class="dim mono" style="margin:12px 0 0; font-size:13px;">// {phase.transition_note}</p>
		{/if}
		<div class="actions" style="margin-top:14px;">
			{#if phase.status !== 'active'}
				<form class="inline" method="POST" action="?/activatePhase" use:enhance>
					<input type="hidden" name="id" value={phase.id} />
					<button class="btn">● Aktivieren</button>
				</form>
			{/if}
			{#if phase.status !== 'archived'}
				<form class="inline" method="POST" action="?/archivePhase" use:enhance>
					<input type="hidden" name="id" value={phase.id} />
					<button class="btn ghost">▣ Archivieren</button>
				</form>
			{:else}
				<form class="inline" method="POST" action="?/planPhase" use:enhance>
					<input type="hidden" name="id" value={phase.id} />
					<button class="btn ghost">○ Zurück zu geplant</button>
				</form>
			{/if}
			<form class="inline" method="POST" action="?/deletePhase"
				onsubmit={confirmSubmit(`Phase „${phase.name}“ samt Board, Templates und Quoten löschen?`)}>
				<input type="hidden" name="id" value={phase.id} />
				<button class="btn ghost">✕ Löschen</button>
			</form>
		</div>
	</div>
{/if}

<h2 class="sect">＋ Neue Phase</h2>
<div class="card dashed">
	<form method="POST" action="?/createPhase" use:enhance>
		<div class="form-row">
			<label class="field" style="flex:1;"><span>Name</span><input type="text" name="name" required placeholder="Vorlesungszeit WS 26/27" /></label>
			<label class="field">
				<span>Gerüst übernehmen von</span>
				<select name="clone_from">
					<option value="">— (leer starten)</option>
					{#each data.phases as p (p.id)}
						<option value={p.id}>{p.name}</option>
					{/each}
				</select>
			</label>
			<button class="btn">＋ Anlegen</button>
		</div>
	</form>
	<p class="dimmer" style="margin:10px 0 0; font-size:12.5px;">
		Klonen kopiert Templates, Blöcke, Wochen-Board und Quoten — „das Gerüst bleibt identisch“.
	</p>
</div>

<style>
	.rank {
		font-size: 11px;
		color: var(--accent);
		font-weight: 700;
		letter-spacing: 0.04em;
	}

	.prio-strip {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.prio {
		border: 1px solid var(--line);
		border-radius: var(--r-md);
		background: var(--surface);
		box-shadow: var(--shadow-sm);
		padding: 11px 14px;
		display: flex;
		gap: 10px;
		align-items: baseline;
		text-decoration: none;
		color: var(--ink);
	}

	.prio strong {
		color: var(--ink);
	}

	.prio:hover strong {
		color: var(--accent);
	}

	.prio .has-desc {
		color: var(--accent);
		font-size: 12px;
	}

	.prio-arrow {
		margin-left: auto;
		color: var(--ink3);
		font-size: 17px;
		align-self: center;
	}

	.prio:hover .prio-arrow {
		color: var(--accent);
	}

	.board {
		display: flex;
		gap: 12px;
		overflow-x: auto;
		padding-bottom: 8px;
	}

	.bcol {
		flex: 1;
		min-width: 130px;
	}

	.bhead {
		font-size: 11.5px;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--ink3);
		border-bottom: 2px solid var(--line);
		padding-bottom: 6px;
		margin: 0 0 10px;
	}

	.wcol.today .bhead {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}

	.bcard {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--r-md);
		box-shadow: var(--shadow-sm);
		padding: 12px 14px;
		font-size: 14px;
	}

	.wcol.today .bcard {
		border-color: var(--accent);
	}

	.edit-day summary {
		cursor: pointer;
		color: var(--ink3);
		font-size: 12px;
		margin-top: 8px;
		list-style: none;
	}

	.qrow .qnote {
		display: block;
		font-weight: 400;
	}

	.tally .tick {
		letter-spacing: 2px;
	}

	.tally .tick.filled {
		color: var(--accent);
	}

	.tally .count {
		margin-left: 6px;
		font-size: 12px;
		color: var(--ink2);
	}

	.tally .over {
		color: var(--accent);
		font-weight: 700;
		font-size: 12px;
	}

	.inline-edit summary {
		list-style: none;
		cursor: pointer;
	}

	.blocks {
		display: flex;
		flex-direction: column;
	}

	.blockrow {
		display: grid;
		grid-template-columns: 74px 1fr auto;
		gap: 10px;
		align-items: baseline;
		padding: 6px 8px;
		border-bottom: 1px solid var(--line);
		font-size: 13.5px;
		border-radius: 6px;
	}

	.blockrow:last-child {
		border-bottom: none;
	}

	.blockrow.hl {
		background: var(--accent-soft);
	}

	.thint {
		font-size: 12px;
		color: var(--ink2);
		white-space: nowrap;
	}

	.bops {
		display: flex;
		gap: 2px;
		opacity: 0.35;
	}

	.blockrow:hover .bops {
		opacity: 1;
	}
</style>
