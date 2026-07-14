<script lang="ts">
	import { enhance } from '$app/forms';
	import FinanceNav from '$lib/finance/FinanceNav.svelte';
	import Bar from '$lib/finance/Bar.svelte';
	import { formatCents, formatDate, centsToInput, daysUntil } from '$lib/format';

	let { data, form } = $props();

	const accountName = (id: number | null) =>
		id === null ? null : (data.accounts.find((a) => a.id === id)?.name ?? null);

	const totalCurrentCents = $derived(
		data.goals.reduce((sum, g) => sum + g.current_amount_cents, 0)
	);
	const totalTargetCents = $derived(
		data.goals.reduce((sum, g) => sum + g.target_amount_cents, 0)
	);
</script>

<svelte:head>
	<title>Rücklagen & Ziele · Zentrale</title>
</svelte:head>

<div class="page-head">
	<div>
		<p class="eyebrow">Finanzen</p>
		<h1>Rücklagen &amp; Ziele</h1>
	</div>
	{#if data.goals.length > 0}
		<span class="muted nums">
			gesamt {formatCents(totalCurrentCents)} von {formatCents(totalTargetCents)}
		</span>
	{/if}
</div>
<FinanceNav />

{#if form?.message}
	<p class="notice warn">{form.message}</p>
{/if}

<div class="stack">
	{#if data.goals.length === 0}
		<p class="notice">Noch keine Rücklagen oder Sparziele angelegt.</p>
	{/if}

	{#each data.goals as goal (goal.id)}
		{@const percent =
			goal.target_amount_cents > 0
				? Math.round((goal.current_amount_cents / goal.target_amount_cents) * 100)
				: 0}
		{@const days = goal.due_date ? daysUntil(goal.due_date) : null}
		<section class="card">
			<div class="page-head" style="margin-bottom: 0.5rem">
				<h2>
					{goal.name}
					<span class="badge">{goal.type === 'ruecklage' ? 'Rücklage' : 'Sparziel'}</span>
					{#if goal.monthly_rate_cents > 0}
						<span class="badge strong">+{formatCents(goal.monthly_rate_cents)}/Monat</span>
					{/if}
				</h2>
				<span class="muted small">
					{#if goal.due_date}
						fällig {formatDate(goal.due_date)}
						{#if days !== null && days >= 0}
							(in {days} Tagen)
						{:else if days !== null}
							<strong>(überfällig)</strong>
						{/if}
						·
					{/if}
					{#if accountName(goal.account_id)}
						liegt auf {accountName(goal.account_id)} ·
					{/if}
					aktualisiert {formatDate(goal.updated_at)}
				</span>
			</div>
			<div class="bar-row">
				<span class="nums">{percent} %</span>
				<Bar value={goal.current_amount_cents} max={goal.target_amount_cents} />
				<span class="nums">
					{formatCents(goal.current_amount_cents)} / {formatCents(goal.target_amount_cents)}
				</span>
			</div>
			<div class="actions" style="margin-top: 0.5rem">
				<form method="POST" action="?/updateAmount" use:enhance class="actions">
					<input type="hidden" name="id" value={goal.id} />
					<label class="field">
						<span>Neuer Stand (€)</span>
						<input
							type="text"
							inputmode="decimal"
							name="current_amount"
							class="input-amount"
							value={centsToInput(goal.current_amount_cents)}
						/>
					</label>
					<button class="btn ghost small" type="submit">Stand aktualisieren</button>
				</form>
			</div>
			<details class="editor" style="margin-top: 0.75rem">
				<summary>Bearbeiten</summary>
				<form method="POST" action="?/update" use:enhance>
					<input type="hidden" name="id" value={goal.id} />
					<div class="form-row">
						<label class="field">
							<span>Name</span>
							<input type="text" name="name" value={goal.name} required />
						</label>
						<label class="field">
							<span>Art</span>
							<select name="type" value={goal.type}>
								<option value="ruecklage">Rücklage</option>
								<option value="sparziel">Sparziel</option>
							</select>
						</label>
						<label class="field">
							<span>Zielbetrag (€)</span>
							<input
								type="text"
								inputmode="decimal"
								name="target_amount"
								class="input-amount"
								value={centsToInput(goal.target_amount_cents)}
								required
							/>
						</label>
						<label class="field">
							<span>Aktueller Stand (€)</span>
							<input
								type="text"
								inputmode="decimal"
								name="current_amount"
								class="input-amount"
								value={centsToInput(goal.current_amount_cents)}
								required
							/>
						</label>
						<label class="field">
							<span>Fällig am</span>
							<input type="date" name="due_date" value={goal.due_date ?? ''} />
						</label>
						<label class="field">
							<span>Liegt auf (Konto-Stand folgt automatisch)</span>
							<select name="account_id" value={goal.account_id ?? ''}>
								<option value="">–</option>
								{#each data.accounts as account (account.id)}
									<option value={account.id}>{account.name}</option>
								{/each}
							</select>
						</label>
						<label class="field">
							<span>Monatsrate (€) — wird im Budget abgezogen</span>
							<input
								type="text"
								inputmode="decimal"
								name="monthly_rate"
								class="input-amount"
								value={centsToInput(goal.monthly_rate_cents)}
								placeholder="0,00"
							/>
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
						if (!confirm('Ziel wirklich löschen?')) e.preventDefault();
					}}
					style="margin-top: 0.75rem"
				>
					<input type="hidden" name="id" value={goal.id} />
					<button class="btn ghost small" type="submit">Löschen</button>
				</form>
			</details>
		</section>
	{/each}

	<details class="editor">
		<summary>Neues Ziel anlegen</summary>
		<form method="POST" action="?/create" use:enhance>
			<div class="form-row">
				<label class="field">
					<span>Name</span>
					<input type="text" name="name" required />
				</label>
				<label class="field">
					<span>Art</span>
					<select name="type">
						<option value="ruecklage">Rücklage</option>
						<option value="sparziel">Sparziel</option>
					</select>
				</label>
				<label class="field">
					<span>Zielbetrag (€)</span>
					<input
						type="text"
						inputmode="decimal"
						name="target_amount"
						class="input-amount"
						required
					/>
				</label>
				<label class="field">
					<span>Aktueller Stand (€)</span>
					<input
						type="text"
						inputmode="decimal"
						name="current_amount"
						class="input-amount"
						value="0,00"
					/>
				</label>
				<label class="field">
					<span>Fällig am</span>
					<input type="date" name="due_date" />
				</label>
				<label class="field">
					<span>Liegt auf (Konto-Stand folgt automatisch)</span>
					<select name="account_id">
						<option value="">–</option>
						{#each data.accounts as account (account.id)}
							<option value={account.id}>{account.name}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span>Monatsrate (€) — wird im Budget abgezogen</span>
					<input
						type="text"
						inputmode="decimal"
						name="monthly_rate"
						class="input-amount"
						placeholder="0,00"
					/>
				</label>
				<div class="field">
					<span>&nbsp;</span>
					<button class="btn" type="submit">Anlegen</button>
				</div>
			</div>
		</form>
	</details>
</div>
