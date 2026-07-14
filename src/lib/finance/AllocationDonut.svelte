<script lang="ts">
	// Donut: where this month's income goes. Slices stay distinguishable in
	// greyscale (ink / solid accent / hatched accent / dotted) and the legend
	// always carries swatch + label + value — never colour alone.
	import { formatCents, formatCentsWhole } from '$lib/format';

	interface Segment {
		label: string;
		cents: number;
		kind: 'ink' | 'accent' | 'hatch' | 'outline';
	}

	let {
		segments,
		centerLabel = '',
		centerCents = null
	}: { segments: Segment[]; centerLabel?: string; centerCents?: number | null } = $props();

	const size = 240;
	const cx = size / 2;
	const cy = size / 2;
	const R = 112;
	const r = 70;

	const total = $derived(segments.reduce((s, seg) => s + Math.max(0, seg.cents), 0));

	const polar = (radius: number, angle: number) => ({
		x: cx + radius * Math.cos(angle),
		y: cy + radius * Math.sin(angle)
	});

	// Annulus sector from startAngle to endAngle (radians, clockwise).
	function slicePath(startAngle: number, endAngle: number): string {
		const large = endAngle - startAngle > Math.PI ? 1 : 0;
		const o1 = polar(R, startAngle);
		const o2 = polar(R, endAngle);
		const i1 = polar(r, endAngle);
		const i2 = polar(r, startAngle);
		return [
			`M${o1.x.toFixed(2)},${o1.y.toFixed(2)}`,
			`A${R},${R} 0 ${large} 1 ${o2.x.toFixed(2)},${o2.y.toFixed(2)}`,
			`L${i1.x.toFixed(2)},${i1.y.toFixed(2)}`,
			`A${r},${r} 0 ${large} 0 ${i2.x.toFixed(2)},${i2.y.toFixed(2)}`,
			'Z'
		].join(' ');
	}

	const slices = $derived.by(() => {
		if (total <= 0) return [];
		let angle = -Math.PI / 2;
		return segments
			.filter((seg) => seg.cents > 0)
			.map((seg) => {
				const sweep = Math.min((Math.max(0, seg.cents) / total) * 2 * Math.PI, 2 * Math.PI - 1e-4);
				const path = slicePath(angle, angle + sweep);
				angle += sweep;
				return { ...seg, path };
			});
	});

	const fills: Record<Segment['kind'], string> = {
		ink: 'var(--ink)',
		accent: 'var(--accent)',
		hatch: 'url(#donut-hatch)',
		outline: 'url(#donut-dots)'
	};
</script>

{#if total > 0}
	<div class="donut">
		<svg
			viewBox={`0 0 ${size} ${size}`}
			role="img"
			aria-label={segments.map((s) => `${s.label} ${formatCents(s.cents)}`).join(', ')}
		>
			<defs>
				<pattern id="donut-hatch" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
					<rect width="7" height="7" fill="var(--surface2)" />
					<rect width="4" height="7" fill="var(--accent)" />
				</pattern>
				<pattern id="donut-dots" patternUnits="userSpaceOnUse" width="8" height="8">
					<rect width="8" height="8" fill="var(--surface2)" />
					<circle cx="4" cy="4" r="1.4" fill="var(--ink3)" />
				</pattern>
			</defs>
			{#each slices as slice (slice.label)}
				<path d={slice.path} fill={fills[slice.kind]} stroke="var(--surface2)" stroke-width="2.5" />
			{/each}
			{#if centerCents !== null}
				<text
					x={cx}
					y={cy - 4}
					text-anchor="middle"
					font-size="26"
					font-weight="700"
					fill="var(--ink)"
					style="font-variant-numeric: tabular-nums; letter-spacing: -0.02em"
				>
					{formatCentsWhole(centerCents)}
				</text>
				<text x={cx} y={cy + 18} text-anchor="middle" font-size="12" fill="var(--ink2)">
					{centerLabel}
				</text>
			{/if}
		</svg>
		<div class="legend">
			{#each segments as seg (seg.label)}
				<span class="item">
					<span class="swatch {seg.kind}"></span>
					{seg.label}
					<strong class="nums">{formatCents(seg.cents)}</strong>
				</span>
			{/each}
		</div>
	</div>
{/if}

<style>
	.donut {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.85rem;
	}

	svg {
		width: min(100%, 250px);
		height: auto;
		display: block;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem 1.25rem;
		font-size: 0.88rem;
		color: var(--ink2);
	}

	.item {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.item strong {
		color: var(--ink);
		font-variant-numeric: tabular-nums;
	}

	.swatch {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.swatch.ink {
		background: var(--ink);
	}

	.swatch.accent {
		background: var(--accent);
	}

	.swatch.hatch {
		background: repeating-linear-gradient(
			135deg,
			var(--accent),
			var(--accent) 3px,
			var(--surface) 3px,
			var(--surface) 5px
		);
	}

	.swatch.outline {
		background: var(--surface);
		border: 1.5px dashed var(--ink3);
	}
</style>
