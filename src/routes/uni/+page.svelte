<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { UNI_TYPES, courseColor, prioColor, prioLabel, typeColor, type UniType } from '$lib/labels';
	import { dueColor, dueLabel, fmtDay } from '$lib/format';

	let { data, form } = $props();

	const pad = (n: number) => String(n).padStart(2, '0');

	const semCourses = $derived(data.courses.filter((c) => c.semester_id === data.semId));
	const semIds = $derived(new Set(semCourses.map((c) => c.id)));
	const semTasks = $derived(data.uniTasks.filter((t) => semIds.has(t.course_id)));
	const visibleSems = $derived(
		data.semesters.filter((s) => data.showArchived || s.status === 'active')
	);

	// Anlege-Leiste Aufgaben: Typ & Prio zyklisch.
	let newType: UniType = $state('VL');
	let newPrio = $state(2);
	const cycleNewType = () => (newType = UNI_TYPES[(UNI_TYPES.indexOf(newType) + 1) % UNI_TYPES.length]);
	const cycleNewPrio = () => (newPrio = newPrio === 3 ? 1 : newPrio + 1);

	let addSemForm: HTMLFormElement | undefined = $state();
	let addSemName = $state('');
	function promptSemester() {
		const name = (window.prompt('Semester, z. B. WS 2026/27') || '').trim();
		if (!name) return;
		addSemName = name;
		// Warten bis der Wert im DOM steht, dann abschicken.
		queueMicrotask(() => addSemForm?.requestSubmit());
	}

	function semHref(params: Record<string, string | null>): string {
		const p = new URLSearchParams();
		if (data.view !== 'courses') p.set('view', data.view!);
		if (data.semId != null) p.set('sem', String(data.semId));
		if (data.showArchived) p.set('archiv', '1');
		for (const [k, v] of Object.entries(params)) {
			if (v === null) p.delete(k);
			else p.set(k, v);
		}
		const q = p.toString();
		return q ? `/uni?${q}` : '/uni';
	}

	const sessionIds = $derived(new Set(data.session.map((s) => s.task_id)));
	const sessionTasks = $derived(data.uniTasks.filter((t) => sessionIds.has(t.id)));
	const sessionDone = $derived(sessionTasks.filter((t) => t.done).length);
	const sessionPct = $derived(
		sessionTasks.length ? Math.round((sessionDone / sessionTasks.length) * 100) : 0
	);
	const sessionDate = $derived(data.session[0]?.date ?? '');
	const sessionStale = $derived(!!sessionDate && sessionDate !== data.today && sessionTasks.length > 0);

	const typeOrder = (t: string) => {
		const i = UNI_TYPES.indexOf(t as UniType);
		return i < 0 ? 99 : i;
	};
	const groups = $derived(
		(data.courseFilter ? semCourses.filter((c) => c.id === data.courseFilter) : semCourses).map(
			(c) => ({
				course: c,
				items: data.uniTasks
					.filter((t) => t.course_id === c.id)
					.toSorted(
						(a, b) =>
							typeOrder(a.type) - typeOrder(b.type) ||
							a.prio - b.prio ||
							((a.due || '9') < (b.due || '9') ? -1 : 1)
					)
			})
		)
	);

	const courseOf = (id: number) => data.courses.find((c) => c.id === id);
</script>

{#if form?.message}<div class="form-error">{form.message}</div>{/if}

<div class="chips" style="margin-bottom:16px">
	<span class="chips-label">[ SEMESTER ]</span>
	{#each visibleSems as sm (sm.id)}
		{@const on = sm.id === data.semId}
		{@const archived = sm.status === 'archived'}
		<span
			style="display:flex;align-items:center;border:1px solid {on
				? archived
					? 'var(--dim)'
					: 'var(--accent)'
				: 'var(--line)'};border-radius:2px;overflow:hidden;background:{on ? 'var(--card-hover)' : 'transparent'}"
		>
			<a
				class="chip"
				style="border:0;background:transparent;color:{on ? 'var(--ink)' : archived ? 'var(--dim)' : 'var(--mut)'}"
				href={semHref({ sem: String(sm.id) })}
			>
				{sm.name}
				<span class="n">{archived ? 'ARCHIV' : pad(data.courses.filter((c) => c.semester_id === sm.id).length)}</span>
			</a>
			<form method="POST" action="?/archiveSemester" use:enhance style="display:contents">
				<input type="hidden" name="id" value={sm.id} />
				<button
					class="btn-text"
					style="border-left:1px solid var(--line);padding:6px 10px;font-size:9px;letter-spacing:0.12em"
					title="archivieren">{archived ? '↺' : 'ARCH.'}</button
				>
			</form>
		</span>
	{/each}
	<button type="button" class="btn-ghost" onclick={promptSemester}>+ SEMESTER</button>
	<form bind:this={addSemForm} method="POST" action="?/addSemester" use:enhance hidden>
		<input type="hidden" name="name" value={addSemName} />
	</form>
	<a
		class="btn-text"
		style="margin-left:auto;letter-spacing:0.16em;font-size:9px"
		href={semHref({ archiv: data.showArchived ? null : '1' })}
		>{data.showArchived ? 'ARCHIV AUSBLENDEN' : 'ARCHIV ANZEIGEN'}</a
	>
	{#if data.semId != null}
		<form
			method="POST"
			action="?/deleteSemester"
			use:enhance
			onsubmit={(e) => {
				const sm = data.semesters.find((s) => s.id === data.semId);
				if (!window.confirm(`Semester „${sm?.name}“ mit allen Kursen löschen?`)) e.preventDefault();
			}}
		>
			<input type="hidden" name="id" value={data.semId} />
			<button class="btn-text" style="color:var(--faint);letter-spacing:0.16em;font-size:9px">SEMESTER LÖSCHEN</button>
		</form>
	{/if}
</div>

{#if data.view === 'courses'}
	<div style="animation:md-rise 300ms ease both">
		<form class="addbar" method="POST" action="?/addCourse" use:enhance>
			<input type="hidden" name="sem" value={data.semId ?? ''} />
			<input type="text" name="name" placeholder="Neuer Kurs…" required disabled={data.semId == null} />
			<input class="boxed" name="code" placeholder="kürzel" style="flex:0 1 140px" />
			<button type="submit" class="btn-primary" disabled={data.semId == null}>Anlegen</button>
		</form>

		<div class="tile-grid">
			{#each semCourses as c (c.id)}
				{@const accent = courseColor(c.hue)}
				{@const ts = data.uniTasks.filter((t) => t.course_id === c.id)}
				{@const open = ts.filter((t) => !t.done)}
				{@const next = open.toSorted((a, b) => ((a.due || '9') < (b.due || '9') ? -1 : 1))[0]}
				<a
					class="tile"
					href={`/uni/courses/${c.id}`}
					style="border-top-color:{accent};background:linear-gradient(135deg,{accent}1F 0%,rgba(18,16,17,0) 58%)"
				>
					<div class="tile-top">
						<span class="tile-name">{c.name}</span>
						<span class="badge" style="color:{accent}">{c.code || '—'}</span>
					</div>
					<div class="tile-meta">
						<span>{c.docent || '—'}</span>
						<span>{c.slot || '—'}</span>
						<span>{c.ects || '—'} ECTS</span>
						{#if c.grade}<span style="color:{accent}">NOTE {c.grade}</span>{/if}
					</div>
					<div class="tile-foot">
						<span class="tile-next">↳ {next?.text ?? 'nichts offen'}</span>
						<span class="mono">{open.length} / {ts.length} OFFEN</span>
					</div>
				</a>
			{/each}
		</div>
		{#if semCourses.length === 0}
			<div class="empty-serif" style="padding:26px 0">Noch keine Kurse in diesem Semester.</div>
		{/if}
	</div>
{:else if data.view === 'tasks'}
	<div style="animation:md-rise 300ms ease both">
		<div class="chips">
			<span class="chips-label">[ KURS ]</span>
			<a class="chip" class:on={data.courseFilter === null} href={semHref({ course: null })}>
				<span class="dot" style="background:transparent"></span>
				Alle
				<span class="n">{pad(semTasks.filter((t) => !t.done).length)}</span>
			</a>
			{#each semCourses as c (c.id)}
				{@const on = data.courseFilter === c.id}
				<a
					class="chip"
					class:on
					style={on ? `border-color:${courseColor(c.hue)}` : ''}
					href={semHref({ course: String(c.id) })}
				>
					<span class="dot" style="background:{courseColor(c.hue)}"></span>
					{c.name}
					<span class="n">{pad(data.uniTasks.filter((t) => t.course_id === c.id && !t.done).length)}</span>
				</a>
			{/each}
		</div>

		<form class="addbar" method="POST" action="?/addTask" use:enhance>
			<input type="text" name="text" placeholder="Was ist zu tun?" required />
			<select name="course" required>
				{#each semCourses as c (c.id)}
					<option value={c.id}>{c.name}</option>
				{/each}
			</select>
			<input type="date" name="due" />
			<input type="hidden" name="type" value={newType} />
			<input type="hidden" name="prio" value={newPrio} />
			<button type="button" class="cycle" style="color:{typeColor(newType)}" title="Typ" onclick={cycleNewType}>
				{newType}
			</button>
			<button type="button" class="cycle" style="color:{prioColor(newPrio)}" onclick={cycleNewPrio}>
				{prioLabel(newPrio)}
			</button>
			<button type="submit" class="btn-primary" disabled={semCourses.length === 0}>Anlegen</button>
		</form>

		<div style="display:flex;flex-direction:column;gap:26px">
			{#each groups as g (g.course.id)}
				<section>
					<div class="section-head">
						<span class="dot" style="background:{courseColor(g.course.hue)}"></span>
						<span class="serif-title">{g.course.name}</span>
						<span class="rule"></span>
						<span class="meta">{g.items.filter((t) => !t.done).length} OFFEN / {g.items.length}</span>
					</div>
					<div class="list-panel">
						{#each g.items as t (t.id)}
							{@const inSession = sessionIds.has(t.id)}
							<div class="row">
								<form method="POST" action="?/toggle" use:enhance style="display:contents">
									<input type="hidden" name="id" value={t.id} />
									<button class="checkbox" class:done={!!t.done} title={t.done ? 'wieder öffnen' : 'erledigt'}></button>
								</form>
								<span class="prio-bar" style="background:{prioColor(t.prio)};cursor:default"></span>
								<button type="button" class="row-text" class:done={!!t.done} title="Details öffnen" onclick={() => goto(`/uni/tasks/${t.id}`)}>
									{t.text}
								</button>
								<span class="note-flag">{t.notes.trim() ? '✎' : ''}</span>
								<form method="POST" action="?/session" use:enhance style="display:contents">
									<input type="hidden" name="id" value={t.id} />
									<button class="star-btn" title="zur Session" style="color:{inSession ? 'var(--gold)' : 'var(--faint)'}">
										{inSession ? '★' : '☆'}
									</button>
								</form>
								<form method="POST" action="?/type" use:enhance style="display:contents">
									<input type="hidden" name="id" value={t.id} />
									<button
										class="badge"
										style="color:{typeColor(t.type)};background:{typeColor(t.type)}22;letter-spacing:0.14em"
										title="Typ wechseln">{t.type}</button
									>
								</form>
								<span class="due-mono" style="color:{dueColor(t.due, t.done)}">{dueLabel(t.due)}</span>
								<form method="POST" action="?/delete" use:enhance style="display:contents">
									<input type="hidden" name="id" value={t.id} />
									<button class="x-btn">✕</button>
								</form>
							</div>
						{:else}
							<div class="empty">frei</div>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	</div>
{:else}
	<div style="animation:md-rise 300ms ease both">
		<section class="session-head">
			<div class="top">
				<div>
					<div class="mono-label">
						[ LERNSESSION · {sessionDate ? fmtDay(sessionDate).toUpperCase() : 'KEINE SESSION'} ]
					</div>
					<div class="count">{pad(sessionTasks.length)} Aufgaben gewählt</div>
				</div>
				<div style="display:flex;gap:8px;align-items:center">
					<form method="POST" action="?/sweepSession" use:enhance>
						<button class="btn-ghost" style="color:var(--mut)">ERLEDIGTE ENTFERNEN</button>
					</form>
					<form method="POST" action="?/clearSession" use:enhance>
						<button class="btn-ghost danger" style="color:var(--dim)">SESSION LEEREN</button>
					</form>
				</div>
			</div>
			<div class="progress" style="margin:20px 0 8px">
				<div style="background:var(--gold);width:{sessionPct}%"></div>
			</div>
			<div class="mono-dim" style="letter-spacing:0.14em;font-size:9.5px">
				{sessionDone} / {sessionTasks.length} ERLEDIGT
			</div>
			{#if sessionStale}
				<div class="stale">↳ SESSION VON EINEM FRÜHEREN TAG</div>
			{/if}
		</section>

		<div class="list-panel">
			{#each sessionTasks as t (t.id)}
				{@const c = courseOf(t.course_id)}
				<div class="row" style="padding:12px 18px">
					<form method="POST" action="?/toggle" use:enhance style="display:contents">
						<input type="hidden" name="id" value={t.id} />
						<button
							class="checkbox"
							class:done={!!t.done}
							style="width:16px;height:16px"
							title={t.done ? 'wieder öffnen' : 'erledigt'}
						></button>
					</form>
					<span class="prio-bar" style="background:{prioColor(t.prio)};height:17px"></span>
					<button type="button" class="row-text" class:done={!!t.done} style="font-size:14.5px" onclick={() => goto(`/uni/tasks/${t.id}`)}>
						{t.text}
					</button>
					<span class="badge" style="color:{courseColor(c?.hue)};max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
						{c?.name ?? '—'}
					</span>
					<span class="mono-dim" style="color:{typeColor(t.type)};letter-spacing:0.14em">{t.type}</span>
					<span class="due-mono" style="color:{dueColor(t.due, t.done)}">{dueLabel(t.due)}</span>
					<form method="POST" action="?/session" use:enhance style="display:contents">
						<input type="hidden" name="id" value={t.id} />
						<button class="x-btn" title="aus Session entfernen">✕</button>
					</form>
				</div>
			{:else}
				<div class="empty-serif" style="padding:26px 20px">
					Noch nichts gewählt — markiere Aufgaben mit ☆ in der Aufgabenliste.
				</div>
			{/each}
		</div>
	</div>
{/if}
