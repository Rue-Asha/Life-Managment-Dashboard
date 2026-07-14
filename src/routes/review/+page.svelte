<script lang="ts">
	let { data } = $props();

	// Ampel je Schritt: erledigt (✓) vs. offen (Anzahl).
	const quotaOpen = $derived(
		data.quotas.filter((q) => q.target_count !== null && q.week_count < (q.target_count ?? 0))
	);
</script>

<svelte:head><title>Review · Zentrale</title></svelte:head>

<p class="eyebrow">◔ Sonntags-Review · {data.week}</p>
<h1>Wochen-Review</h1>
<p class="lede">
	{#if data.isSunday}Heute ist Review-Tag.{:else}Nächster Review: Sonntag.{/if}
	Vier Schritte, ~25 Minuten — dann ist die Woche gebaut.
</p>

<div class="rows review-steps">
	<div class="card step">
		<h3>
			<span class="mono stepno">1</span> Inbox leeren
			{#if data.inbox === 0}<span class="badge good">✓ leer</span>
			{:else}<span class="badge warn">● {data.inbox} offen</span>{/if}
		</h3>
		<p class="dim">
			Jede Capture-Notiz entweder in einen Bereich einsortieren, in eine Task umwandeln oder
			löschen.
		</p>
		<a class="more" href="/notes">Zur Inbox →</a>
	</div>

	<div class="card step">
		<h3>
			<span class="mono stepno">2</span> Woche befüllen
			<span class="badge">{data.taskBacklog} Alltag-Backlog</span>
			<span class="badge">{data.uniBacklog} Uni-Backlog</span>
		</h3>
		<p class="dim">
			Beide Task-Datenbanken durchgehen: Was gehört in die neue Woche? („→ This Week“).
			Letzte Woche: {data.stats.done}/{data.stats.total} Alltag · {data.uniStats.done}/{data.uniStats.total}
			Uni erledigt.
		</p>
		<a class="more" href="/tasks">Tasks →</a>
		<a class="more" href="/uni" style="margin-left:14px;">Uni →</a>
	</div>

	<div class="card step">
		<h3>
			<span class="mono stepno">3</span> Quota-Bilanz
			{#if data.phaseName === null}<span class="badge">keine aktive Phase</span>
			{:else if quotaOpen.length === 0}<span class="badge good">✓ Vertrag erfüllt</span>
			{:else}<span class="badge warn">● {quotaOpen.length} unter Soll</span>{/if}
		</h3>
		{#if data.quotas.length > 0}
			<div class="rows" style="margin-bottom:6px;">
				{#each data.quotas.filter((q) => q.target_count !== null) as quota (quota.id)}
					<div class="row">
						<span class="title">{quota.title}</span>
						<span class="mono" class:crit-text={quota.week_count < (quota.target_count ?? 0)}
							>{quota.week_count}/{quota.target_count}</span
						>
					</div>
				{/each}
			</div>
			<p class="dim">
				Kein Streak-Shaming — unter Soll heißt: nächste Woche anpassen (Quote oder Realität).
			</p>
		{:else}
			<p class="dim">Keine Quoten definiert.</p>
		{/if}
		<a class="more" href="/curriculum">Zum Schedule →</a>
	</div>

	<div class="card step" class:dashed={!data.financeSunday}>
		<h3>
			<span class="mono stepno">4</span> Finanz-Ritual
			{#if data.financeSunday}
				<span class="badge good">● diesen Sonntag</span>
			{:else}
				<span class="badge">erst am 1. Sonntag im Monat</span>
			{/if}
			{#if data.staleAccounts > 0}
				<span class="badge warn">⚠ {data.staleAccounts} Konto/Konten veraltet</span>
			{/if}
		</h3>
		<p class="dim">
			Kontostände eintragen → Budget-Monat abschließen (Einkommen Ist, Variables) → Cross-Check
			ansehen.
		</p>
		<a class="more" href="/finance/accounts">Konten →</a>
		<a class="more" href="/finance/budget" style="margin-left:14px;">Budget →</a>
	</div>
</div>

<style>
	.review-steps {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.step h3 {
		display: flex;
		align-items: baseline;
		gap: 10px;
		flex-wrap: wrap;
	}

	.stepno {
		color: var(--accent);
		font-size: 15px;
		font-weight: 700;
	}

	.crit-text {
		color: var(--crit);
		font-weight: 650;
	}
</style>
