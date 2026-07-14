<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import FinanceNav from '$lib/finance/FinanceNav.svelte';
	import Bar from '$lib/finance/Bar.svelte';
	import { formatCents, formatCentsSigned, formatMonth, centsToInput } from '$lib/format';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Budget {data.month} · Zentrale</title>
</svelte:head>

<div class="page-head">
	<div>
		<p class="eyebrow">💰 Finanzen</p>
		<h1>Budget · {formatMonth(data.month)}</h1>
	</div>
	<div class="actions">
		<a class="btn ghost small" href={`/finance/budget?month=${data.prevMonth}`}>← {data.prevMonth}</a>
		<input
			type="month"
			value={data.month}
			onchange={(e) => goto(`/finance/budget?month=${e.currentTarget.value}`)}
		/>
		<a class="btn ghost small" href={`/finance/budget?month=${data.nextMonth}`}>{data.nextMonth} →</a>
		{#if data.month !== data.currentMonth}
			<a class="btn ghost small" href="/finance/budget">Heute</a>
		{/if}
	</div>
</div>
<FinanceNav />

{#if form?.message}
	<p class="notice warn">{form.message}</p>
{/if}

<div class="stack">
	{#if data.crossCheck.diffCents !== null}
		<p class="notice" class:warn={data.crossCheck.flagged}>
			<strong>Cross-Check:</strong>
			Gespart laut Budget {formatCentsSigned(data.crossCheck.savedCents ?? 0)}, Konten-Veränderung
			(ohne Depot) {formatCentsSigned(data.crossCheck.netChangeCents ?? 0)} — Differenz
			{formatCentsSigned(data.crossCheck.diffCents)}.
			{#if data.crossCheck.flagged}
				Da klafft etwas auseinander — vermutlich wurde eine Kategorie oder ein Kontostand
				übersehen.
			{/if}
		</p>
	{/if}

	<section class="card">
		<form method="POST" action="?/save" use:enhance>
			<input type="hidden" name="month" value={data.month} />

			<!-- Einkommen -->
			<div class="form-row" style="margin-bottom: 0.75rem">
				<label class="field">
					<span>Erwartetes Einkommen (€) — zu Monatsbeginn setzen</span>
					<input
						type="text"
						inputmode="decimal"
						name="expected_income"
						class="input-amount"
						value={centsToInput(data.summary.expectedIncomeCents)}
						placeholder="–"
					/>
				</label>
				<label class="field">
					<span>Einkommen Ist (€) — am Monatsende ablesen</span>
					<input
						type="text"
						inputmode="decimal"
						name="income"
						class="input-amount"
						value={centsToInput(data.summary.incomeCents)}
						placeholder="–"
					/>
				</label>
			</div>

			<!-- Wasserfall -->
			<div class="table-wrap">
				<table>
					<tbody>
						<tr>
							<td>
								Einkommen
								{#if data.summary.incomeCents === null && data.summary.expectedIncomeCents !== null}
									<span class="badge">erwartet</span>
								{:else if data.summary.incomeCents !== null}
									<span class="badge strong">Ist</span>
								{/if}
							</td>
							<td class="num">
								{data.summary.effectiveIncomeCents !== null
									? formatCents(data.summary.effectiveIncomeCents)
									: '–'}
							</td>
						</tr>
						<tr>
							<td>
								− Fixkosten <span class="badge">automatisch</span>
								<a class="small" href="/finance/obligations">Registry →</a>
								{#if data.fixItems.length > 0 || data.onceItems.length > 0}
									<div class="muted small">
										{#each data.fixItems as item (item.id)}
											<div>{item.name}: {formatCents(item.monthly_load_cents)}</div>
										{/each}
										{#each data.onceItems as item (item.id)}
											<div>
												{item.name}: {formatCents(item.amount_cents)}
												<span class="badge">einmalig</span>
											</div>
										{/each}
									</div>
								{/if}
							</td>
							<td class="num">− {formatCents(data.summary.fixTotalCents)}</td>
						</tr>
						<tr>
							<td>
								− Sparen
								{#if data.summary.savingsBooked}
									<span class="badge strong">verbucht</span>
								{:else}
									<span class="badge">geplant</span>
								{/if}
								<a class="small" href="/finance/goals">Ziele →</a>
								{#if data.savingGoals.length > 0}
									<div class="muted small">
										{#each data.savingGoals as goal (goal.id)}
											<div>
												{goal.name}: {formatCents(goal.monthly_rate_cents)}
											</div>
										{/each}
									</div>
								{/if}
							</td>
							<td class="num">− {formatCents(data.summary.savingsCents)}</td>
						</tr>
						<tr class="total">
							<td>= Verfügbar für Variables</td>
							<td class="num">
								{data.summary.availableCents !== null
									? formatCents(data.summary.availableCents)
									: '–'}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<!-- Variable Ausgaben: nur Ist -->
			<h3 style="margin-top: 1.25rem">Variable Ausgaben (Ist aus der Bank-App)</h3>
			<div class="table-wrap">
				<table>
					<tbody>
						{#each data.rows as row (row.id)}
							<tr>
								<td>
									{#if row.category_icon}{row.category_icon}{/if}
									{row.category_name}
								</td>
								<td class="num">
									<input
										type="text"
										inputmode="decimal"
										name={`actual_${row.id}`}
										value={centsToInput(row.actual_cents)}
										placeholder="–"
										class="input-amount num"
									/>
								</td>
							</tr>
						{/each}
						<tr class="total">
							<td>Summe Variables</td>
							<td class="num">{formatCents(data.summary.variableActualCents)}</td>
						</tr>
					</tbody>
				</table>
			</div>

			<!-- Ergebnis -->
			{#if data.summary.availableCents !== null}
				<div style="margin-top: 1rem">
					<div class="bar-row">
						<span><strong>Noch übrig</strong></span>
						<Bar
							value={data.summary.variableActualCents}
							max={Math.max(data.summary.availableCents, 0)}
						/>
						<span class="nums">
							<strong>
								{formatCentsSigned(data.summary.remainingCents ?? 0)}
							</strong>
						</span>
					</div>
				</div>
			{/if}

			{#if data.summary.savedCents !== null}
				<p class="notice" style="margin-top: 0.75rem">
					<strong>Gespart: {formatCentsSigned(data.summary.savedCents)}</strong>
					{#if data.summary.savingsRate !== null}
						· Sparquote {Math.round(data.summary.savingsRate * 100)} %
					{/if}
					{#if data.summary.savingsCents > 0}
						<span class="muted small">
							(davon {formatCents(data.summary.savingsCents)} zweckgebunden in Ziele)
						</span>
					{/if}
				</p>
			{/if}

			<div class="actions" style="margin-top: 1rem">
				<button class="btn" type="submit">Monat speichern</button>
			</div>
		</form>
	</section>
</div>
