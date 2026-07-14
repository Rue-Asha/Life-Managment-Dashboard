<script lang="ts">
	import { enhance } from '$app/forms';
	import { centsToInput } from '$lib/format';

	let { data, form } = $props();

	// svelte-ignore state_referenced_locally
	let type = $state(data.obligation.type);
	// Reset the select when another obligation is loaded or after a save.
	$effect(() => {
		type = data.obligation.type;
	});
</script>

<svelte:head>
	<title>{data.obligation.name} · Zentrale</title>
</svelte:head>

<div class="page-head">
	<div>
		<p class="eyebrow"><a href="/finance/obligations">💰 Finanzen · Fixkosten</a></p>
		<h1>{data.obligation.name}</h1>
	</div>
	<a class="btn ghost small" href="/finance/obligations">← Alle Posten</a>
</div>

{#if form?.message}
	<p class="notice warn">{form.message}</p>
{/if}

<section class="card">
	<h2>Posten bearbeiten</h2>
	<form method="POST" action="?/update" use:enhance>
		<div class="form-row">
			<label class="field">
				<span>Name</span>
				<input type="text" name="name" value={data.obligation.name} required />
			</label>
			<label class="field">
				<span>Betrag pro Vorkommen (€)</span>
				<input
					type="text"
					inputmode="decimal"
					name="amount"
					class="input-amount"
					value={centsToInput(data.obligation.amount_cents)}
					required
				/>
			</label>
			<label class="field">
				<span>Rhythmus</span>
				<select name="cadence" value={data.obligation.cadence}>
					<option value="monthly">monatlich</option>
					<option value="quarterly">vierteljährlich</option>
					<option value="yearly">jährlich</option>
					<option value="once">einmalig (zukünftige Ausgabe)</option>
				</select>
			</label>
			<label class="field">
				<span>Kategorie</span>
				<select name="category_id" value={data.obligation.category_id}>
					{#each data.categories as category (category.id)}
						<option value={category.id}>{category.name}</option>
					{/each}
				</select>
			</label>
			<label class="field">
				<span>Nächste Fälligkeit</span>
				<input type="date" name="next_due" value={data.obligation.next_due} required />
			</label>
			<label class="field">
				<span>Konto (Abbuchung)</span>
				<select name="account_id" value={data.obligation.account_id ?? ''}>
					<option value="">–</option>
					{#each data.accounts as account (account.id)}
						<option value={account.id}>{account.name}</option>
					{/each}
				</select>
			</label>
			<label class="field">
				<span>Art</span>
				<select name="type" bind:value={type}>
					<option value="ongoing">Abo / laufend</option>
					<option value="installment">Rate</option>
				</select>
			</label>
			{#if type === 'installment'}
				<label class="field">
					<span>Gesamtbetrag (€)</span>
					<input
						type="text"
						inputmode="decimal"
						name="total_amount"
						class="input-amount"
						value={centsToInput(data.obligation.total_amount_cents)}
					/>
				</label>
				<label class="field">
					<span>Restschuld (€)</span>
					<input
						type="text"
						inputmode="decimal"
						name="remaining_balance"
						class="input-amount"
						value={centsToInput(data.obligation.remaining_balance_cents)}
					/>
				</label>
				<label class="field">
					<span>Enddatum</span>
					<input type="date" name="end_date" value={data.obligation.end_date ?? ''} />
				</label>
			{/if}
			<label class="field">
				<span>&nbsp;</span>
				<span>
					<input type="checkbox" name="active" checked={data.obligation.active === 1} /> aktiv
				</span>
			</label>
			<div class="field">
				<span>&nbsp;</span>
				<button class="btn" type="submit">Speichern</button>
			</div>
		</div>
	</form>
	<form
		method="POST"
		action="?/delete"
		use:enhance
		onsubmit={(e) => {
			if (!confirm('Posten wirklich löschen?')) e.preventDefault();
		}}
		style="margin-top: 1rem"
	>
		<button class="btn ghost small" type="submit">Posten löschen</button>
	</form>
</section>
