<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import ImageSlot from '$lib/ImageSlot.svelte';
	import { CAT_META, NOTE_KIND_LABEL, courseColor } from '$lib/labels';
	import { dueColor, dueLabel, todayLabel } from '$lib/format';

	let { data } = $props();

	const pad = (n: number) => String(n).padStart(2, '0');
	const dayDone = $derived(data.dayTodos.filter((t) => t.done).length);
	const slots = $derived(new Set(page.data.imageSlots as string[]));
</script>

<div class="stats-grid">
	<div class="stat">
		<div class="num">{pad(data.stats.openTasks)}</div>
		<div class="lbl">OFFENE AUFGABEN</div>
	</div>
	<div class="stat">
		<div class="num">{pad(data.stats.uniOpen)}</div>
		<div class="lbl">UNI · {data.stats.semesterName}</div>
	</div>
	<div class="stat">
		<div class="num">{pad(data.stats.activeProjects)}</div>
		<div class="lbl">PROJEKTE AKTIV</div>
	</div>
	<div class="stat">
		<div class="num">{pad(data.stats.sessionOpen)}</div>
		<div class="lbl">IN DER SESSION</div>
	</div>
</div>

<div class="dash-grid">
	<div class="dash-col" style="gap:26px">
		<div class="dash-head">
			<span class="h">heute</span>
			<span class="sub">[ {dayDone} / {data.dayTodos.length} ERLEDIGT ]</span>
		</div>
		<div style="display:flex;flex-direction:column">
			{#each data.dayTodos as t (t.id)}
				<div class="dash-row">
					<form method="POST" action="?/toggle" use:enhance>
						<input type="hidden" name="id" value={t.id} />
						<button
							class="checkbox"
							class:done={!!t.done}
							style="width:14px;height:14px"
							title={t.done ? 'wieder öffnen' : 'erledigt'}
						></button>
					</form>
					<span
						class="cat-dot"
						title={CAT_META[t.cat].label}
						style="background:{CAT_META[t.cat].color}"
					></span>
					<span class="txt" class:done={!!t.done} style="font-size:14.5px">{t.text}</span>
					<span class="due" style="color:{dueColor(t.due, t.done)}">{dueLabel(t.due).toUpperCase()}</span>
				</div>
			{:else}
				<div class="empty-serif" style="font-size:20px">Nichts geplant. Selten.</div>
			{/each}
		</div>

		<div class="dash-head" style="margin-top:16px">
			<span class="h">fristen</span>
			<span class="rule"></span>
		</div>
		<div style="display:flex;flex-direction:column">
			{#each data.deadlines as dl (dl.id)}
				<a class="dash-row" href={`/uni/tasks/${dl.id}`}>
					<span class="accent-bar" style="background:{courseColor(dl.hue)}"></span>
					<span class="txt">{dl.text}</span>
					<span class="mono-sm">{dl.course}</span>
					<span class="due" style="color:{dueColor(dl.due, false)}">{dueLabel(dl.due).toUpperCase()}</span>
				</a>
			{:else}
				<div class="empty-serif" style="font-size:18px">Keine offenen Fristen.</div>
			{/each}
		</div>
	</div>

	<div class="dash-col">
		<div class="plate">
			<ImageSlot slot="dash-plate" placeholder="Bild — Stimmung des Monats" has={slots.has('dash-plate')} />
			<div class="plate-shade"></div>
		</div>
		<div class="plate-caption">
			<span>PLATE 001</span>
			<span>{todayLabel()}</span>
		</div>
	</div>
</div>

<div class="quote">
	<span class="mark">“</span>
	<p>Alles, was ich zweimal manuell mache, gehört in ein Skript.</p>
	<div class="src">— JOURNAL, WOCHE 31</div>
</div>

<div class="dash-grid-2">
	<div class="dash-col">
		<div class="dash-head">
			<span class="h">projekte</span>
			<span class="rule"></span>
		</div>
		{#each data.activeProjectRows as p (p.id)}
			<a class="dash-proj-row" href={`/projects/${p.id}`}>
				<div class="top">
					<span class="name">{p.name}</span>
					<span class="stack">{p.stack}</span>
				</div>
				<div class="progress thin" style="margin-top:12px">
					<div style="background:var(--accent);width:{p.pct}%"></div>
				</div>
			</a>
		{:else}
			<div class="empty-serif">Kein aktives Projekt.</div>
		{/each}
	</div>

	<div class="dash-col">
		<div class="dash-head">
			<span class="h">zuletzt notiert</span>
			<span class="rule"></span>
		</div>
		{#each data.recentNotes as n (n.id)}
			<a class="dash-note-row" href={`/notes?id=${n.id}`}>
				<div class="top">
					<span class="title">{n.title}</span>
					<span class="kind">{NOTE_KIND_LABEL[n.kind]}</span>
				</div>
				<div class="excerpt">{n.excerpt}</div>
			</a>
		{:else}
			<div class="empty-serif">Noch nichts notiert.</div>
		{/each}
	</div>
</div>

<style>
	.dash-row form {
		display: contents;
	}
</style>
