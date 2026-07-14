<script lang="ts">
	import FinanceNav from '$lib/finance/FinanceNav.svelte';
	import Bar from '$lib/finance/Bar.svelte';
	import TrendChart from '$lib/finance/TrendChart.svelte';
	import AllocationDonut from '$lib/finance/AllocationDonut.svelte';
	import {
		formatCents,
		formatCentsWhole,
		formatCentsSigned,
		formatDate,
		formatMonth,
		daysUntil
	} from '$lib/format';

	let { data } = $props();

	const assets = $derived(data.accounts.filter((a) => a.role === 'asset'));
	const liabilities = $derived(data.accounts.filter((a) => a.role === 'liability'));
	const sum = (list: typeof data.accounts) =>
		list.reduce((s, a) => s + (a.latest_balance_cents ?? 0), 0);

	const flowText = (flow: {
		fixOutCents: number;
		savingsInCents: number;
		variableCategoryNames: string[];
	}) => {
		const parts: string[] = [];
		if (flow.fixOutCents > 0) parts.push(`−${formatCents(flow.fixOutCents)}/M Fixkosten`);
		if (flow.savingsInCents > 0) parts.push(`+${formatCents(flow.savingsInCents)}/M Sparen`);
		if (flow.variableCategoryNames.length > 0) parts.push(flow.variableCategoryNames.join(', '));
		return parts.join(' · ');
	};

	const staleDays = $derived.by(() => {
		const dates = data.accounts
			.map((a) => a.latest_date)
			.filter((d): d is string => d !== null);
		if (dates.length === 0) return null;
		return -daysUntil(dates.sort()[0]);
	});
</script>

<svelte:head>
	<title>Finanzen · Zentrale</title>
</svelte:head>

<p class="eyebrow">💰 Finanzen</p>
<h1>Finanz-Dashboard</h1>
<FinanceNav />

<div class="stack">
	<!-- Netto-Vermögen: Headline + Trend (der Held der Seite) -->
	<section class="card">
		<div class="page-head" style="margin-bottom: 0.25rem">
			<div class="stat">
				<div class="label">Netto-Vermögen</div>
				<div class="value hero">{formatCentsWhole(data.netWorth.netWorthCents)}</div>
			</div>
			{#if staleDays !== null && staleDays > 35}
				<span class="badge strong">ältester Kontostand: vor {staleDays} Tagen</span>
			{/if}
		</div>
		<TrendChart points={data.series} />
	</section>

	{#if data.crossCheck.diffCents !== null && data.crossCheck.flagged}
		<p class="notice warn">
			<strong>Cross-Check {formatMonth(data.month)}:</strong>
			Budget sagt {formatCentsSigned(data.crossCheck.savedCents ?? 0)} gespart, die Konten (ohne Depot)
			haben sich um {formatCentsSigned(data.crossCheck.netChangeCents ?? 0)} verändert — Differenz
			{formatCentsSigned(data.crossCheck.diffCents)}. <a href="/finance/budget">Zum Budget →</a>
		</p>
	{/if}

	<div class="grid cols-2">
		<!-- Aufschlüsselung -->
		<section class="card">
			<h2>Konten</h2>
			<div class="table-wrap">
				<table>
					<tbody>
						{#each assets as account (account.id)}
							{@const flow = data.flows[account.id]}
							<tr>
								<td>
									{account.name}
									{#if !account.on_budget}<span class="badge">nur Tracking</span>{/if}
									{#if flow && flowText(flow)}
										<div class="muted small">{flowText(flow)}</div>
									{/if}
								</td>
								<td class="num">
									{account.latest_balance_cents !== null
										? formatCents(account.latest_balance_cents)
										: '–'}
								</td>
							</tr>
						{/each}
						{#each liabilities as account (account.id)}
							<tr>
								<td>{account.name} <span class="badge strong">Verbindlichkeit</span></td>
								<td class="num">
									{account.latest_balance_cents !== null
										? '−' + formatCents(account.latest_balance_cents)
										: '–'}
								</td>
							</tr>
						{/each}
						{#if data.netWorth.installmentDebtCents > 0}
							<tr>
								<td>Offene Raten <span class="badge strong">Verbindlichkeit</span></td>
								<td class="num">−{formatCents(data.netWorth.installmentDebtCents)}</td>
							</tr>
						{/if}
						<tr class="total">
							<td>Netto-Vermögen</td>
							<td class="num">{formatCents(data.netWorth.netWorthCents)}</td>
						</tr>
					</tbody>
				</table>
			</div>
			<p style="margin-top: 0.5rem"><a href="/finance/accounts">Stände aktualisieren →</a></p>
		</section>

		<!-- Dieser Monat -->
		<section class="card">
			<h2>Dieser Monat · {formatMonth(data.month)}</h2>
			<div class="stats" style="margin-bottom: 0.75rem">
				<div class="stat">
					<div class="label">Noch übrig</div>
					<div class="value">
						{data.summary.remainingCents !== null
							? formatCentsSigned(data.summary.remainingCents)
							: '–'}
					</div>
				</div>
				<div class="stat">
					<div class="label">Gespart</div>
					<div class="value">
						{data.summary.savedCents !== null
							? formatCentsSigned(data.summary.savedCents)
							: '–'}
					</div>
					{#if data.summary.savingsRate !== null}
						<div class="muted small">Sparquote {Math.round(data.summary.savingsRate * 100)} %</div>
					{/if}
				</div>
			</div>
			{#if data.summary.effectiveIncomeCents !== null && data.summary.remainingCents !== null}
				<AllocationDonut
					segments={[
						{ label: 'Fixkosten', cents: data.summary.fixTotalCents, kind: 'ink' },
						{ label: 'Sparen', cents: data.summary.savingsCents, kind: 'hatch' },
						{ label: 'Variables', cents: data.summary.variableActualCents, kind: 'accent' },
						{
							label: data.summary.incomeCents !== null ? 'Übrig' : 'Übrig (erwartet)',
							cents: Math.max(data.summary.remainingCents, 0),
							kind: 'outline'
						}
					]}
					centerLabel="Einkommen"
					centerCents={data.summary.effectiveIncomeCents}
				/>
			{:else}
				<p class="muted small">
					Erwartetes Einkommen im <a href="/finance/budget">Budget</a> setzen, dann rechnet sich der Monat
					von selbst.
				</p>
			{/if}
			<p style="margin-top: 0.75rem"><a href="/finance/budget">Zum Budget →</a></p>
		</section>

		<!-- Fällige Zahlungen -->
		<section class="card">
			<div class="page-head" style="margin-bottom: 0.5rem">
				<h2 style="margin-bottom: 0">Fällig in den nächsten 30 Tagen</h2>
				{#if data.coverage.due90Cents > 0}
					{#if data.coverage.gapCents <= 0}
						<span class="badge" title="Fälligkeiten der nächsten 90 Tage vs. Tagesgeld"
							>90 T. gedeckt ✓</span
						>
					{:else}
						<span class="badge strong" title="Fälligkeiten der nächsten 90 Tage vs. Tagesgeld">
							90 T.: Lücke {formatCents(data.coverage.gapCents)}
						</span>
					{/if}
				{/if}
			</div>
			{#if data.upcoming.length === 0}
				<p class="muted">Nichts fällig. 🎉</p>
			{:else}
				<div class="table-wrap">
					<table>
						<tbody>
							{#each data.upcoming as o (o.id)}
								{@const days = daysUntil(o.next_due)}
								<tr>
									<td>{o.name}</td>
									<td>
										{formatDate(o.next_due)}
										{#if days < 0}
											<span class="badge strong">überfällig</span>
										{:else if days <= 7}
											<span class="badge strong">in {days} T.</span>
										{:else}
											<span class="badge">in {days} T.</span>
										{/if}
									</td>
									<td class="num">{formatCents(o.amount_cents)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>

		<!-- Rücklagen & Ziele -->
		<section class="card">
			<h2>Rücklagen & Ziele</h2>
			{#if data.goals.length === 0}
				<p class="muted">Noch keine Ziele angelegt. <a href="/finance/goals">Anlegen →</a></p>
			{:else}
				{#each data.goals as goal (goal.id)}
					{@const percent =
						goal.target_amount_cents > 0
							? Math.round((goal.current_amount_cents / goal.target_amount_cents) * 100)
							: 0}
					<div class="bar-row">
						<span class="small">{goal.name}</span>
						<Bar value={goal.current_amount_cents} max={goal.target_amount_cents} />
						<span class="nums small">
							{percent} % · {formatCents(goal.current_amount_cents)}
						</span>
					</div>
				{/each}
				<p style="margin-top: 0.5rem"><a href="/finance/goals">Alle Ziele →</a></p>
			{/if}
		</section>
	</div>

	<!-- Raten-Countdown -->
	{#if data.installments.length > 0}
		<section class="card">
			<h2>Raten-Countdown</h2>
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Rate</th>
							<th class="num">Rate/Monat</th>
							<th class="num">Restschuld</th>
							<th>Abbezahlt</th>
							<th>Voraussichtlich fertig</th>
						</tr>
					</thead>
					<tbody>
						{#each data.installments as o (o.id)}
							{@const paidCents =
								o.total_amount_cents !== null && o.remaining_balance_cents !== null
									? o.total_amount_cents - o.remaining_balance_cents
									: null}
							<tr>
								<td>{o.name}</td>
								<td class="num">{formatCents(o.monthly_load_cents)}</td>
								<td class="num">
									{o.remaining_balance_cents !== null
										? formatCents(o.remaining_balance_cents)
										: '–'}
								</td>
								<td style="min-width: 10rem">
									{#if paidCents !== null && o.total_amount_cents}
										<div class="bar-row" style="grid-template-columns: 1fr auto">
											<Bar value={paidCents} max={o.total_amount_cents} />
											<span class="nums small">
												{Math.round((paidCents / o.total_amount_cents) * 100)} %
											</span>
										</div>
									{:else}
										<span class="muted">–</span>
									{/if}
								</td>
								<td>
									{#if o.end_date}
										{formatDate(o.end_date)}
									{:else if o.remaining_balance_cents !== null && o.amount_cents > 0}
										noch {Math.ceil(o.remaining_balance_cents / o.amount_cents)} Raten
									{:else}
										<span class="muted">–</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}
</div>
