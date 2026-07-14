<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatCents, formatDate } from '$lib/format';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>{data.account.name} · Zentrale</title>
</svelte:head>

<div class="page-head">
	<div>
		<p class="eyebrow"><a href="/finance/accounts">Finanzen · Konten</a></p>
		<h1>{data.account.name}</h1>
	</div>
	<a class="btn ghost small" href="/finance/accounts">← Alle Konten</a>
</div>

{#if form?.message}
	<p class="notice warn">{form.message}</p>
{/if}

<div class="grid cols-2">
	<section class="card">
		<h2>Konto bearbeiten</h2>
		<form method="POST" action="?/update" use:enhance>
			<div class="form-row">
				<label class="field">
					<span>Name</span>
					<input type="text" name="name" value={data.account.name} required />
				</label>
				<label class="field">
					<span>Institut</span>
					<input type="text" name="institution" value={data.account.institution ?? ''} />
				</label>
				<label class="field">
					<span>Typ</span>
					<select name="type" value={data.account.type}>
						<option value="giro">Girokonto</option>
						<option value="tagesgeld">Tagesgeld</option>
						<option value="depot">Depot</option>
						<option value="other">Sonstiges</option>
					</select>
				</label>
				<label class="field">
					<span>Rolle</span>
					<select name="role" value={data.account.role}>
						<option value="asset">Asset</option>
						<option value="liability">Verbindlichkeit</option>
					</select>
				</label>
				<label class="field">
					<span>&nbsp;</span>
					<span>
						<input type="checkbox" name="on_budget" checked={data.account.on_budget === 1} />
						spendable (on budget)
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
				if (!confirm('Konto und alle Snapshots wirklich löschen?')) e.preventDefault();
			}}
			style="margin-top: 1rem"
		>
			<button class="btn ghost small" type="submit">Konto löschen</button>
		</form>
	</section>

	<section class="card">
		<h2>Neuer Snapshot</h2>
		<form method="POST" action="?/addSnapshot" use:enhance>
			<div class="form-row">
				<label class="field">
					<span>Datum</span>
					<input type="date" name="date" value={data.today} required />
				</label>
				<label class="field">
					<span>Kontostand (€)</span>
					<input type="text" inputmode="decimal" name="balance" class="input-amount" required />
				</label>
				<div class="field">
					<span>&nbsp;</span>
					<button class="btn" type="submit">Eintragen</button>
				</div>
			</div>
		</form>

		<h3 style="margin-top: 1.25rem">Verlauf</h3>
		{#if data.snapshots.length === 0}
			<p class="muted">Noch keine Snapshots.</p>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Datum</th>
							<th class="num">Stand</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.snapshots as snapshot (snapshot.id)}
							<tr>
								<td>{formatDate(snapshot.date)}</td>
								<td class="num">{formatCents(snapshot.balance_cents)}</td>
								<td>
									<form method="POST" action="?/deleteSnapshot" use:enhance>
										<input type="hidden" name="snapshot_id" value={snapshot.id} />
										<button class="btn ghost small" type="submit" title="Snapshot löschen">✕</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
