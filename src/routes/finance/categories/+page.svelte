<script lang="ts">
	import { enhance } from '$app/forms';
	import FinanceNav from '$lib/finance/FinanceNav.svelte';
	import { CATEGORY_TYPE_LABELS } from '$lib/finance/types';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Kategorien · Zentrale</title>
</svelte:head>

<p class="eyebrow">💰 Finanzen</p>
<h1>Kategorien</h1>
<FinanceNav />

<p class="muted small">
	Bewusst wenige, aggregierte Kategorien — die Bank-Apps kategorisieren im Detail (Spec §11).
</p>

{#if form?.message}
	<p class="notice warn">{form.message}</p>
{/if}

<div class="stack">
	<section class="card">
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th></th>
						<th>Name</th>
						<th>Typ</th>
						<th>Konto</th>
						<th class="num">Sortierung</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.categories as category (category.id)}
						<tr>
							<td style="width: 4rem">
								<input
									form={`cat-${category.id}`}
									type="text"
									name="icon"
									value={category.icon ?? ''}
									style="width: 3.5rem"
								/>
							</td>
							<td>
								<input type="hidden" form={`cat-${category.id}`} name="id" value={category.id} />
								<input
									form={`cat-${category.id}`}
									type="text"
									name="name"
									value={category.name}
									required
								/>
							</td>
							<td>
								<select form={`cat-${category.id}`} name="type" value={category.type}>
									<option value="income">{CATEGORY_TYPE_LABELS.income}</option>
									<option value="fix">{CATEGORY_TYPE_LABELS.fix}</option>
									<option value="variable">{CATEGORY_TYPE_LABELS.variable}</option>
								</select>
							</td>
							<td>
								<select
									form={`cat-${category.id}`}
									name="account_id"
									value={category.account_id ?? ''}
								>
									<option value="">–</option>
									{#each data.accounts as account (account.id)}
										<option value={account.id}>{account.name}</option>
									{/each}
								</select>
							</td>
							<td class="num" style="width: 6rem">
								<input
									form={`cat-${category.id}`}
									type="number"
									name="sort_order"
									value={category.sort_order}
									style="width: 5rem"
								/>
							</td>
							<td>
								<div class="actions">
									<button form={`cat-${category.id}`} class="btn ghost small" type="submit">
										Speichern
									</button>
									<form method="POST" action="?/delete" use:enhance>
										<input type="hidden" name="id" value={category.id} />
										<button class="btn ghost small" type="submit" title="Kategorie löschen">✕</button>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#each data.categories as category (category.id)}
			<!-- Row inputs reference these via the form attribute; a <form> element
			     may not sit inside <tr>, so they live outside the table. -->
			<form method="POST" action="?/update" use:enhance id={`cat-${category.id}`}></form>
		{/each}
	</section>

	<details class="editor">
		<summary>Neue Kategorie anlegen</summary>
		<form method="POST" action="?/create" use:enhance>
			<div class="form-row">
				<label class="field">
					<span>Name</span>
					<input type="text" name="name" required />
				</label>
				<label class="field">
					<span>Typ</span>
					<select name="type">
						<option value="variable">{CATEGORY_TYPE_LABELS.variable}</option>
						<option value="fix">{CATEGORY_TYPE_LABELS.fix}</option>
						<option value="income">{CATEGORY_TYPE_LABELS.income}</option>
					</select>
				</label>
				<label class="field">
					<span>Icon (Emoji)</span>
					<input type="text" name="icon" />
				</label>
				<label class="field">
					<span>Konto</span>
					<select name="account_id">
						<option value="">–</option>
						{#each data.accounts as account (account.id)}
							<option value={account.id}>{account.name}</option>
						{/each}
					</select>
				</label>
				<label class="field">
					<span>Sortierung</span>
					<input type="number" name="sort_order" value="0" />
				</label>
				<div class="field">
					<span>&nbsp;</span>
					<button class="btn" type="submit">Anlegen</button>
				</div>
			</div>
		</form>
	</details>
</div>
