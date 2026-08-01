<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { CATS, CAT_META, STATUS_LABEL, prioColor, prioLabel, type Cat } from '$lib/labels';
	import { dueColor, dueLabel, isoInDays, todayISO } from '$lib/format';
	import type { Task } from '$lib/server/tasks';

	let { data, form } = $props();

	const today = todayISO();
	const weekEnd = isoInDays(7);

	// Anlege-Leiste: Kategorie & Prio zyklisch durchklicken (wie im Design).
	let newCat: Cat = $state('personal');
	let newPrio = $state(2);
	const cycleNewCat = () => (newCat = CATS[(CATS.indexOf(newCat) + 1) % CATS.length]);
	const cycleNewPrio = () => (newPrio = newPrio === 3 ? 1 : newPrio + 1);

	const catScoped = $derived(
		data.cat === 'all' ? data.tasks : data.tasks.filter((t) => t.cat === data.cat)
	);

	const byDue = (a: Task, b: Task) => ((a.due || '9') < (b.due || '9') ? -1 : 1);
	const byPrio = (a: Task, b: Task) => a.prio - b.prio || byDue(a, b);

	interface Group {
		title: string;
		accent: string;
		items: Task[];
	}
	const groups: Group[] = $derived.by(() => {
		if (data.view === 'all') {
			return CATS.filter((c) => data.cat === 'all' || data.cat === c).map((c) => ({
				title: CAT_META[c].label,
				accent: CAT_META[c].color,
				items: catScoped.filter((t) => t.cat === c).toSorted(byPrio)
			}));
		}
		if (data.view === 'week') {
			return [
				{
					title: 'Nächste 7 Tage',
					accent: '#8E8480',
					items: catScoped.filter((t) => t.due && t.due <= weekEnd).toSorted(byDue)
				}
			];
		}
		return [
			{
				title: 'Heute & überfällig',
				accent: '#8E8480',
				items: catScoped
					.filter((t) => t.due === today || (t.due && t.due < today && !t.done))
					.toSorted(byDue)
			}
		];
	});

	const boardCols = $derived(
		(['todo', 'doing', 'done'] as const).map((s) => ({
			id: s,
			label: `[ ${STATUS_LABEL[s]} ]`,
			items: catScoped.filter((t) => t.status === s)
		}))
	);

	const chips = $derived(
		[{ id: 'all', label: 'Alle', color: '#EDE7E1', dot: 'transparent' }, ...CATS.map((c) => ({
			id: c as string,
			label: CAT_META[c].label,
			color: CAT_META[c].color,
			dot: CAT_META[c].color
		}))].map((c) => ({
			...c,
			count: (c.id === 'all'
				? data.tasks.filter((t) => !t.done)
				: data.tasks.filter((t) => t.cat === c.id && !t.done)
			).length
		}))
	);

	function chipHref(id: string): string {
		const p = new URLSearchParams();
		if (data.view !== 'day') p.set('view', data.view!);
		if (id !== 'all') p.set('cat', id);
		const q = p.toString();
		return q ? `/tasks?${q}` : '/tasks';
	}

	const pad = (n: number) => String(n).padStart(2, '0');
	const advanceLabel = (s: string) => (s === 'todo' ? '→ arbeit' : s === 'doing' ? '→ fertig' : '↺ offen');
</script>

<div class="chips">
	<span class="chips-label">[ BEREICH ]</span>
	{#each chips as c (c.id)}
		<a
			class="chip"
			class:on={data.cat === c.id || (c.id === 'all' && data.cat === 'all')}
			style={data.cat === c.id && c.id !== 'all' ? `border-color:${c.color}` : ''}
			href={chipHref(c.id)}
		>
			<span class="dot" style="background:{c.dot}"></span>
			{c.label}
			<span class="n">{pad(c.count)}</span>
		</a>
	{/each}
</div>

{#if form?.message}<div class="form-error">{form.message}</div>{/if}

<form class="addbar" method="POST" action="?/create" use:enhance>
	<input type="text" name="text" placeholder="Was steht an?" required />
	<input type="date" name="due" />
	<input type="hidden" name="cat" value={newCat} />
	<input type="hidden" name="prio" value={newPrio} />
	<button type="button" class="cycle" style="color:{CAT_META[newCat].color}" onclick={cycleNewCat}>
		<span class="dot"></span>{CAT_META[newCat].label.toUpperCase()}
	</button>
	<button type="button" class="cycle" style="color:{prioColor(newPrio)}" onclick={cycleNewPrio}>
		{prioLabel(newPrio)}
	</button>
	<button type="submit" class="btn-primary">Anlegen</button>
</form>

{#if data.view === 'board'}
	<div class="board-grid">
		{#each boardCols as col (col.id)}
			<section class="board-col" style="min-height:280px">
				<div class="board-col-head">
					<span class="lbl">{col.label}</span>
					<span class="n">{pad(col.items.length)}</span>
				</div>
				<div class="board-col-body">
					{#each col.items as t (t.id)}
						<div class="board-card" style="border-left-color:{prioColor(t.prio)}">
							<button type="button" class="card-title" class:done={!!t.done} onclick={() => goto(`/tasks/${t.id}`)}>
								{t.text}
							</button>
							<div class="card-foot">
								<span style="display:flex;align-items:center;gap:8px">
									<form method="POST" action="?/cat" use:enhance style="display:contents">
										<input type="hidden" name="id" value={t.id} />
										<button
											class="badge"
											style="color:{CAT_META[t.cat].color};background:{CAT_META[t.cat].color}22"
											title="Bereich wechseln">{CAT_META[t.cat].label.toUpperCase()}</button
										>
									</form>
									<span class="due-mono" style="color:{dueColor(t.due, t.done)};font-size:9.5px"
										>{dueLabel(t.due)}</span
									>
								</span>
								<span style="display:flex;gap:6px">
									<form method="POST" action="?/advance" use:enhance style="display:contents">
										<input type="hidden" name="id" value={t.id} />
										<button class="mini-btn">{advanceLabel(t.status)}</button>
									</form>
									<form method="POST" action="?/delete" use:enhance style="display:contents">
										<input type="hidden" name="id" value={t.id} />
										<button class="mini-btn danger">✕</button>
									</form>
								</span>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/each}
	</div>
{:else}
	<div style="display:flex;flex-direction:column;gap:26px;animation:md-rise 300ms ease both">
		{#each groups as g (g.title)}
			<section>
				<div class="section-head">
					<span class="dot" style="background:{g.accent}"></span>
					<span class="serif-title">{g.title}</span>
					<span class="rule"></span>
					<span class="meta">{g.items.filter((t) => !t.done).length} OFFEN / {g.items.length}</span>
				</div>
				<div class="list-panel">
					{#each g.items as t (t.id)}
						<div class="row">
							<form method="POST" action="?/toggle" use:enhance style="display:contents">
								<input type="hidden" name="id" value={t.id} />
								<button class="checkbox" class:done={!!t.done} title={t.done ? 'wieder öffnen' : 'erledigt'}></button>
							</form>
							<form method="POST" action="?/prio" use:enhance style="display:contents">
								<input type="hidden" name="id" value={t.id} />
								<button class="prio-bar" style="background:{prioColor(t.prio)}" title="Priorität"></button>
							</form>
							<button type="button" class="row-text" class:done={!!t.done} title="Details öffnen" onclick={() => goto(`/tasks/${t.id}`)}>
								{t.text}
							</button>
							<span class="note-flag">{t.notes.trim() ? '✎' : ''}</span>
							<form method="POST" action="?/cat" use:enhance style="display:contents">
								<input type="hidden" name="id" value={t.id} />
								<button
									class="badge"
									style="color:{CAT_META[t.cat].color};background:{CAT_META[t.cat].color}22"
									title="Bereich wechseln">{CAT_META[t.cat].label.toUpperCase()}</button
								>
							</form>
							{#if data.view !== 'all'}
								<span class="status-mono">{STATUS_LABEL[t.status]}</span>
							{/if}
							<form method="POST" action="?/due" use:enhance style="display:contents">
								<input type="hidden" name="id" value={t.id} />
								<input
									type="date"
									name="due"
									value={t.due ?? ''}
									style="color:{dueColor(t.due, t.done)}"
									onchange={(e) => e.currentTarget.form?.requestSubmit()}
								/>
							</form>
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
{/if}
