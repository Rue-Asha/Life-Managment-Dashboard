<script lang="ts">
	import { enhance } from '$app/forms';
	import FinanceNav from '$lib/finance/FinanceNav.svelte';
	import { formatCents, formatDate, centsToInput, daysUntil } from '$lib/format';
	import { ACCOUNT_TYPE_LABELS } from '$lib/finance/types';

	let { data, form } = $props();

	const ageDays = (iso: string | null) => (iso === null ? null : -daysUntil(iso));

	const totalCents = $derived(
		data.accounts.reduce(
			(sum, a) =>
				sum + (a.latest_balance_cents ?? 0) * (a.role === 'liability' ? -1 : 1),
			0
		)
	);
</script>

<svelte:head>
	<title>Konten · Zentrale</title>
</svelte:head>

<p class="eyebrow">Finanzen</p>
<h1>Konten</h1>
<FinanceNav />

{#if form?.message}
	<p class="notice warn">{form.message}</p>
{/if}

<div class="stack">
	<section class="card">
		<h2>Stände aktualisieren</h2>
		<p class="muted small">
			Wöchentliches/monatliches Ritual: Datum wählen, aktuelle Kontostände eintragen. Leere Felder
			werden übersprungen; ein zweiter Eintrag am selben Tag überschreibt den ersten.
		</p>
		<form method="POST" action="?/snapshots" use:enhance>
			<div class="form-row">
				<label class="field">
					<span>Datum</span>
					<input type="date" name="date" value={data.today} required />
				</label>
				{#each data.accounts as account (account.id)}
					<label class="field">
						<span>{account.name}</span>
						<input
							type="text"
							inputmode="decimal"
							name={`balance_${account.id}`}
							placeholder={account.latest_balance_cents !== null
								? centsToInput(account.latest_balance_cents)
								: '0,00'}
							class="input-amount"
						/>
					</label>
				{/each}
				<div class="field">
					<span>&nbsp;</span>
					<button class="btn" type="submit">Stände speichern</button>
				</div>
			</div>
		</form>
	</section>

	<section class="card">
		<h2>Übersicht</h2>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Konto</th>
						<th>Institut</th>
						<th>Typ</th>
						<th class="num">Stand</th>
						<th>Zuletzt aktualisiert</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.accounts as account (account.id)}
						{@const age = ageDays(account.latest_date)}
						<tr>
							<td>
								{account.name}
								{#if !account.on_budget}
									<span class="badge" title="Zählt nicht zum Budget, nur zum Vermögen"
										>nur Tracking</span
									>
								{/if}
								{#if account.role === 'liability'}
									<span class="badge strong">Verbindlichkeit</span>
								{/if}
							</td>
							<td class="muted">{account.institution ?? '–'}</td>
							<td class="muted">{ACCOUNT_TYPE_LABELS[account.type]}</td>
							<td class="num">
								{account.latest_balance_cents !== null
									? formatCents(account.latest_balance_cents)
									: '–'}
							</td>
							<td>
								{#if account.latest_date}
									{formatDate(account.latest_date)}
									{#if age !== null && age > 35}
										<span class="badge strong">vor {age} Tagen</span>
									{:else if age !== null && age > 0}
										<span class="badge">vor {age} Tagen</span>
									{/if}
								{:else}
									<span class="muted">noch kein Snapshot</span>
								{/if}
							</td>
							<td><a class="btn ghost small" href={`/finance/accounts/${account.id}`}>Details</a></td>
						</tr>
					{/each}
					<tr class="total">
						<td colspan="3">Summe (Assets − Verbindlichkeiten)</td>
						<td class="num">{formatCents(totalCents)}</td>
						<td colspan="2"></td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<details class="editor">
		<summary>Neues Konto anlegen</summary>
		<form method="POST" action="?/create" use:enhance>
			<div class="form-row">
				<label class="field">
					<span>Name</span>
					<input type="text" name="name" required />
				</label>
				<label class="field">
					<span>Institut</span>
					<input type="text" name="institution" />
				</label>
				<label class="field">
					<span>Typ</span>
					<select name="type">
						<option value="giro">Girokonto</option>
						<option value="tagesgeld">Tagesgeld</option>
						<option value="depot">Depot</option>
						<option value="other">Sonstiges</option>
					</select>
				</label>
				<label class="field">
					<span>Rolle</span>
					<select name="role">
						<option value="asset">Asset</option>
						<option value="liability">Verbindlichkeit</option>
					</select>
				</label>
				<label class="check">
						<input type="checkbox" name="on_budget" checked /> spendable (on budget)
					</label>
				<div class="field">
					<span>&nbsp;</span>
					<button class="btn" type="submit">Anlegen</button>
				</div>
			</div>
		</form>
	</details>
</div>
