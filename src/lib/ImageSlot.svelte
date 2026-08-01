<script lang="ts">
	/** Bild-Slot nach Design: leerer Platzhalter, Bild per Klick oder Drag&Drop.
	 *  Dateien landen über PUT /api/images/[slot] im IMAGES_DIR des Servers. */
	let {
		slot,
		placeholder = 'Bild',
		has = false
	}: { slot: string; placeholder?: string; has?: boolean } = $props();

	let localHas: boolean | null = $state(null);
	let version = $state(0);
	let dragging = $state(false);
	let fileInput: HTMLInputElement | undefined = $state();

	// svelte-ignore state_referenced_locally -- Startwert bewusst festgehalten
	let lastSlot = $state(slot);
	$effect(() => {
		if (slot !== lastSlot) {
			lastSlot = slot;
			localHas = null;
			dragging = false;
		}
	});

	const shown = $derived(localHas ?? has);

	async function upload(file: File | undefined | null) {
		if (!file || !file.type.startsWith('image/')) return;
		const res = await fetch(`/api/images/${slot}`, {
			method: 'PUT',
			headers: { 'content-type': file.type },
			body: file
		});
		if (res.ok) {
			version += 1;
			localHas = true;
		}
	}

	async function clear(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		await fetch(`/api/images/${slot}`, { method: 'DELETE' });
		localHas = false;
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		upload(e.dataTransfer?.files?.[0]);
	}
</script>

<div
	class="img-slot"
	class:dragging
	role="button"
	tabindex="-1"
	ondragover={(e) => {
		e.preventDefault();
		dragging = true;
	}}
	ondragleave={() => (dragging = false)}
	ondrop={onDrop}
>
	{#if shown}
		<img src={`/api/images/${slot}?v=${version}`} alt="" />
		<button type="button" class="clear" title="Bild entfernen" onclick={clear}>✕</button>
	{:else}
		<button type="button" class="ph" onclick={() => fileInput?.click()}>
			{placeholder}
		</button>
	{/if}
	<input
		type="file"
		accept="image/*"
		hidden
		bind:this={fileInput}
		onchange={(e) => upload(e.currentTarget.files?.[0])}
	/>
</div>
