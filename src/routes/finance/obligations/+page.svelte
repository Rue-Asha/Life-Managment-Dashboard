<script lang="ts">
	import { enhance } from '$app/forms';
	import FinanceNav from '$lib/finance/FinanceNav.svelte';
	import { formatCents, formatDate, daysUntil } from '$lib/format';
	import { CADENCE_LABELS } from '$lib/finance/types';

	let { data, form } = $props();

	const active = $derived(data.obligations.filter((o) => o.active === 1));
	const inactive = $derived(data.obligations.filter((o) => o.active !== 1));

	// Show installment-only fields in the create form when needed.
	let newType = $state('ongoing');

	const dueBadge = (nextDue: string) => {
		const days = daysUntil(nextDue);
		if (days < 0) return { text: `überfällig (${-days} T.)`, strong: true };
		if (days === 0) return { text: 'heute fällig', strong: true };
		if (days <= 7) return { text: `in ${days} T.`, strong: true };
		if (days <= 30) return { text: `in ${days} T.`, strong: false };
		return null;
	};
</script>

<svelte:head>
	<title>Fixkosten & Raten · Zentrale</title>
</svelte:head>

<p class="eyebrow">Finanzen</p>
<h1>Fixkosten &amp; Raten</h1>
<FinanceNav />

{#if form?.message}
	<p class="notice warn">{form.message}</p>
{/if}

<div class="stack">
	<div class="stats">
		<div class="card stat">
			<div class="label">Monatliche Grundlast</div>
			<div class="value">{formatCents(data.totalMonthlyLoadCents)}</div>
		</div>
		<div class="card stat">
			<div class="label">Offene Ratenschuld</div>
			<div class="value">{formatCents(data.openInstallmentDebtCents)}</div>
		</div>
	</div>

	<section class="card">
		<h2>Aktive Posten</h2>
		{#if active.length === 0}
			<p class="muted">Noch keine Fixkosten erfasst.</p>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Kategorie</th>
							<th class="num">Betrag</th>
							<th>Rhythmus</th>
							<th class="num">€/Monat</th>
							<th>Nächste Fälligkeit</th>
							<th>Rate</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each active as o (o.id)}
							{@const badge = dueBadge(o.next_due)}
							<tr>
								<td><a href={`/finance/obligations/${o.id}`}>{o.name}</a></td>
								<td class="muted">{o.category_name}</td>
								<td class="num">{formatCents(o.amount_cents)}</td>
								<td class="muted">{CADENCE_LABELS[o.cadence]}</td>
								<td class="num">
									{o.cadence === 'once' ? '–' : formatCents(o.monthly_load_cents)}
								</td>
								<td>
									{formatDate(o.next_due)}
									{#if badge}
										<span class="badge" class:strong={badge.strong}>{badge.text}</span>
									{/if}
								</td>
								<td>
									{#if o.type === 'installment' && o.remaining_balance_cents !== null}
										<span class="small">
											noch {formatCents(o.remaining_balance_cents)}
											{#if o.amount_cents > 0}
												· {Math.ceil(o.remaining_balance_cents / o.amount_cents)} Raten
											{/if}
											{#if o.end_date}
												· bis {formatDate(o.end_date)}
											{/if}
										</span>
									{:else}
										<span class="muted">–</span>
									{/if}
								</td>
								<td>
									<div class="actions" style="flex-wrap: nowrap">
										<form method="POST" action="?/markPaid" use:enhance>
											<input type="hidden" name="id" value={o.id} />
											<button
												class="btn ghost small"
												type="submit"
												title={o.cadence === 'once'
													? 'Als bezahlt markieren (Posten wird inaktiv)'
													: 'Fälligkeit um einen Rhythmus weiterschieben'}
											>
												Bezahlt ✓
											</button>
										</form>
										<a class="btn ghost small" href={`/finance/obligations/${o.id}`}>Bearbeiten</a>
										<form
											method="POST"
											action="?/delete"
											use:enhance
											onsubmit={(e) => {
												if (!confirm(`„${o.name}“ wirklich löschen?`)) e.preventDefault();
											}}
										>
											<input type="hidden" name="id" value={o.id} />
											<button class="btn ghost small" type="submit" title="Posten löschen">✕</button>
										</form>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	{#if inactive.length > 0}
		<details class="editor">
			<summary>Inaktive Posten ({inactive.length})</summary>
			<div class="table-wrap">
				<table>
					<tbody>
						{#each inactive as o (o.id)}
							<tr class="inactive">
								<td><a href={`/finance/obligations/${o.id}`}>{o.name}</a></td>
								<td class="num">{formatCents(o.amount_cents)}</td>
								<td class="muted">{CADENCE_LABELS[o.cadence]}</td>
								<td>
									<div class="actions" style="flex-wrap: nowrap">
										<a class="btn ghost small" href={`/finance/obligations/${o.id}`}>Bearbeiten</a>
										<form
											method="POST"
											action="?/delete"
											use:enhance
											onsubmit={(e) => {
												if (!confirm(`„${o.name}“ wirklich löschen?`)) e.preventDefault();
											}}
										>
											<input type="hidden" name="id" value={o.id} />
											<button class="btn ghost small" type="submit" title="Posten löschen">✕</button>
										</form>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</details>
	{/if}

	<details class="editor">
		<summary>Neuen Posten anlegen</summary>
		<form method="POST" action="?/create" use:enhance>
			<div class="form-row">
				<label class="field">
					<span>Name</span>
					<input type="text" name="name" required />
				</label>
				<label class="field">
					<span>Betrag pro Vorkommen (€)</span>
					<input type="text" inputmode="decimal" name="amount" class="input-amount" required />
				</label>
				<label class="field">
					<span>Rhythmus</span>
					<select name="cadence">
						<option value="monthly">monatlich</option>
						<option value="quarterly">vierteljährlich</option>
						<option value="yearly">jährlich</option>
						<option value="once">einmalig (zukünftige Ausgabe)</option>
					</select>
				</label>
				<label class="field">
					<span>Kategorie</span>
					<select name="category_id" required>
						{#each data.categories as category (category.id)}
							<option value={category.id}>{category.name}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span>Nächste Fälligkeit</span>
					<input type="date" name="next_due" value={data.today} required />
				</label>
				<label class="field">
					<span>Konto (Abbuchung)</span>
					<select name="account_id">
						<option value="">–</option>
						{#each data.accounts as account (account.id)}
							<option value={account.id}>{account.name}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span>Art</span>
					<select name="type" bind:value={newType}>
						<option value="ongoing">Abo / laufend</option>
						<option value="installment">Rate</option>
					</select>
				</label>
				{#if newType === 'installment'}
					<label class="field">
						<span>Gesamtbetrag (€)</span>
						<input type="text" inputmode="decimal" name="total_amount" class="input-amount" />
					</label>
					<label class="field">
						<span>Restschuld (€)</span>
						<input type="text" inputmode="decimal" name="remaining_balance" class="input-amount" />
					</label>
					<label class="field">
						<span>Enddatum</span>
						<input type="date" name="end_date" />
					</label>
				{/if}
				<label class="check">
					<input type="checkbox" name="active" checked /> aktiv
				</label>
				<div class="field">
					<span>&nbsp;</span>
					<button class="btn" type="submit">Anlegen</button>
				</div>
			</div>
		</form>
	</details>

	{#if data.categories.length === 0}
		<p class="notice">
			Es gibt noch keine Kategorie vom Typ „Fixkosten“ — bitte zuerst unter
			<a href="/finance/categories">Kategorien</a> anlegen.
		</p>
	{/if}
</div>
