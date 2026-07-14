<script lang="ts">
	// Progress bar that stays readable in greyscale: solid fill, hard border,
	// and a hatched pattern once the value overshoots 100 % (never colour-only).
	let { value, max }: { value: number; max: number } = $props();

	const ratio = $derived(max > 0 ? value / max : 0);
	const percent = $derived(Math.round(ratio * 100));
	const width = $derived(Math.max(0, Math.min(1, ratio)) * 100);
</script>

<div class="bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
	<div class="fill" class:over={ratio > 1} style="width: {ratio > 1 ? 100 : width}%"></div>
</div>

<style>
	.bar {
		height: 10px;
		border: 1px solid var(--line);
		border-radius: 6px;
		background: var(--surface2);
		overflow: hidden;
	}

	.fill {
		height: 100%;
		background: var(--accent);
		border-radius: 5px 0 0 5px;
		transition: width 0.2s ease;
	}

	.fill.over {
		background: repeating-linear-gradient(
			135deg,
			var(--crit),
			var(--crit) 4px,
			var(--surface) 4px,
			var(--surface) 7px
		);
	}
</style>
