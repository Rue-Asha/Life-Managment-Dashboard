<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { PROJECT_STATUSES, PROJECT_STATUS_META } from '$lib/labels';
	import type { Project, ProjectTask } from '$lib/server/projects';

	let { data, form } = $props();

	const pad = (n: number) => String(n).padStart(2, '0');

	function tasksOf(p: Project): ProjectTask[] {
		return data.projectTasks.filter((t) => t.project_id === p.id);
	}
	function pctOf(p: Project): number {
		const ts = tasksOf(p);
		const done = ts.filter((t) => t.done).length;
		return ts.length ? Math.round((done / ts.length) * 100) : 0;
	}
	function openLabel(p: Project): string {
		const ts = tasksOf(p);
		return `${ts.filter((t) => !t.done).length} / ${ts.length} OPEN`;
	}
	function nextTask(p: Project): string {
		return tasksOf(p).find((t) => !t.done)?.text ?? 'no open task';
	}

	const groups = $derived(
		PROJECT_STATUSES.map((s) => ({
			id: s,
			...PROJECT_STATUS_META[s],
			items: data.projects.filter((p) => p.status === s)
		}))
	);
</script>

{#if form?.message}<div class="form-error">{form.message}</div>{/if}

<form class="addbar" method="POST" action="?/create" use:enhance>
	<input type="text" name="name" placeholder="Project idea…" required />
	<input class="boxed" name="stack" placeholder="stack" style="flex:0 1 180px" />
	<button type="submit" class="btn-primary">Add</button>
</form>

{#if data.view === 'tiles'}
	<div style="display:flex;flex-direction:column;gap:34px;animation:md-rise 300ms ease both">
		{#each groups.filter((g) => g.items.length > 0) as g (g.id)}
			<section style="min-width:0">
				<div class="section-head" style="margin-bottom:14px">
					<span class="dot" style="background:{g.color};width:5px;height:5px"></span>
					<span class="mono-label" style="letter-spacing:0.22em">{g.label}</span>
					<span class="rule" style="background:var(--line2)"></span>
					<span class="meta">{pad(g.items.length)}</span>
				</div>
				<div class="tile-grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">
					{#each g.items as p (p.id)}
						<a class="tile" href={`/projects/${p.id}`} style="border-top-color:{g.color}">
							<div class="tile-top">
								<span class="tile-name">{p.name}</span>
								<span class="badge" style="color:{g.color}">{g.label}</span>
							</div>
							<div class="tile-meta" style="margin-top:6px;font-size:10px;letter-spacing:0.12em">
								<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{p.stack}</span>
							</div>
							<div class="progress" style="margin:18px 0 6px">
								<div style="background:{g.color};width:{pctOf(p)}%"></div>
							</div>
							<div
								style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:9.5px;letter-spacing:0.12em;color:var(--dim)"
							>
								<span>{openLabel(p)}</span>
								<span>{pctOf(p)}%</span>
							</div>
							<div class="tile-foot" style="margin-top:14px">
								<span class="tile-next">↳ {nextTask(p)}</span>
								<span class="mono" style="color:var(--accent)">DETAILS →</span>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{:else}
			<div class="empty-serif">No projects yet.</div>
		{/each}
	</div>
{:else}
	<div class="board-grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
		{#each groups as g (g.id)}
			<section class="board-col" style="border-top:2px solid {g.color}">
				<div class="board-col-head">
					<span class="lbl">[ {g.label} ]</span>
					<span class="n">{pad(g.items.length)}</span>
				</div>
				<div class="board-col-body">
					{#each g.items as p (p.id)}
						<div class="board-card" style="border-left-color:{g.color};padding:12px 13px">
							<button type="button" class="card-title" onclick={() => goto(`/projects/${p.id}`)}>
								<span style="display:block;font-family:var(--font-serif);font-size:18px;line-height:1.2;color:var(--ink)"
									>{p.name}</span
								>
								<span
									style="display:block;font-family:var(--font-mono);font-size:9px;letter-spacing:0.12em;color:var(--mut);margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
									>{p.stack}</span
								>
							</button>
							<div class="progress" style="margin:12px 0 8px">
								<div style="background:{g.color};width:{pctOf(p)}%"></div>
							</div>
							<div class="card-foot" style="margin-top:0">
								<span style="font-family:var(--font-mono);font-size:9px;color:var(--dim);letter-spacing:0.1em"
									>{openLabel(p)}</span
								>
								<form method="POST" action="?/advance" use:enhance style="display:contents">
									<input type="hidden" name="id" value={p.id} />
									<button class="mini-btn" title="Advance status">→</button>
								</form>
							</div>
						</div>
					{:else}
						<div style="padding:8px 2px;color:var(--dim);font-size:12.5px;font-style:italic">empty</div>
					{/each}
				</div>
			</section>
		{/each}
	</div>
{/if}
