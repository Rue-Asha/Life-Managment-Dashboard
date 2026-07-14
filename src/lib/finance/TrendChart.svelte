<script lang="ts">
	// Net-worth trend line. Monochrome by design (e-ink constraint): the line is
	// ink-coloured, the grid recessive, first/last values are always labelled
	// (hover doesn't exist on the Boox); a crosshair tooltip is progressive
	// enhancement for mouse devices.
	import { formatCents, formatCentsWhole } from '$lib/format';
	import type { NetWorthPoint } from '$lib/finance/types';

	let { points, height = 260 }: { points: NetWorthPoint[]; height?: number } = $props();

	const width = 720;
	const pad = { top: 18, right: 16, bottom: 26, left: 64 };

	const xs = $derived(points.map((p) => new Date(p.date + 'T00:00:00Z').getTime()));
	const ys = $derived(points.map((p) => p.cents));

	const xMin = $derived(Math.min(...xs));
	const xMax = $derived(Math.max(...xs));
	const yRange = $derived.by(() => {
		let min = Math.min(...ys);
		let max = Math.max(...ys);
		if (min === max) {
			min -= 100_00;
			max += 100_00;
		}
		const padY = (max - min) * 0.08;
		return { min: min - padY, max: max + padY };
	});

	const x = $derived((t: number) =>
		xMax === xMin
			? (pad.left + width - pad.right) / 2
			: pad.left + ((t - xMin) / (xMax - xMin)) * (width - pad.left - pad.right)
	);
	const y = $derived(
		(v: number) =>
			height - pad.bottom - ((v - yRange.min) / (yRange.max - yRange.min)) * (height - pad.top - pad.bottom)
	);

	// 4 "nice" horizontal gridlines.
	const yTicks = $derived.by(() => {
		const span = yRange.max - yRange.min;
		const rawStep = span / 4;
		const magnitude = 10 ** Math.floor(Math.log10(rawStep));
		const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? rawStep;
		const first = Math.ceil(yRange.min / step) * step;
		const ticks: number[] = [];
		for (let v = first; v <= yRange.max; v += step) ticks.push(v);
		return ticks;
	});

	// X labels: at most ~5 month boundaries.
	const monthLabel = new Intl.DateTimeFormat('de-DE', { month: 'short', year: '2-digit' });
	const xTicks = $derived.by(() => {
		if (points.length < 2) return [];
		const months: number[] = [];
		const d = new Date(xMin);
		d.setUTCDate(1);
		d.setUTCMonth(d.getUTCMonth() + 1);
		while (d.getTime() <= xMax) {
			months.push(d.getTime());
			d.setUTCMonth(d.getUTCMonth() + 1);
		}
		const every = Math.max(1, Math.ceil(months.length / 5));
		return months.filter((_, i) => i % every === 0);
	});

	const path = $derived(
		points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(xs[i]).toFixed(1)},${y(p.cents).toFixed(1)}`).join(' ')
	);

	const first = $derived(points[0]);
	const last = $derived(points[points.length - 1]);

	// --- hover (mouse only) ---
	let hoverIndex = $state<number | null>(null);
	let svgEl: SVGSVGElement | undefined = $state();

	function onMove(event: MouseEvent) {
		if (!svgEl || points.length === 0) return;
		const rect = svgEl.getBoundingClientRect();
		const px = ((event.clientX - rect.left) / rect.width) * width;
		let best = 0;
		let bestDist = Infinity;
		for (let i = 0; i < xs.length; i++) {
			const dist = Math.abs(x(xs[i]) - px);
			if (dist < bestDist) {
				bestDist = dist;
				best = i;
			}
		}
		hoverIndex = best;
	}

	const dateLabel = new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	});
</script>

{#if points.length < 2}
	<p class="muted">
		Der Trend braucht mindestens zwei Snapshots — Kontostände unter <a href="/finance/accounts">Konten</a>
		eintragen.
	</p>
{:else}
	<svg
		bind:this={svgEl}
		viewBox={`0 0 ${width} ${height}`}
		role="img"
		aria-label={`Netto-Vermögen von ${dateLabel.format(new Date(first.date))} (${formatCents(first.cents)}) bis ${dateLabel.format(new Date(last.date))} (${formatCents(last.cents)})`}
		style="width: 100%; height: auto; display: block"
		onmousemove={onMove}
		onmouseleave={() => (hoverIndex = null)}
	>
		<!-- grid + y labels -->
		{#each yTicks as tick (tick)}
			<line
				x1={pad.left}
				x2={width - pad.right}
				y1={y(tick)}
				y2={y(tick)}
				stroke="var(--line)"
				stroke-width="1"
			/>
			<text
				x={pad.left - 8}
				y={y(tick) + 4}
				text-anchor="end"
				font-size="11"
				fill="var(--ink2)"
				style="font-variant-numeric: tabular-nums"
			>
				{formatCentsWhole(tick)}
			</text>
		{/each}

		<!-- x labels at month boundaries -->
		{#each xTicks as tick (tick)}
			<line
				x1={x(tick)}
				x2={x(tick)}
				y1={height - pad.bottom}
				y2={height - pad.bottom + 4}
				stroke="var(--ink3)"
			/>
			<text
				x={x(tick)}
				y={height - pad.bottom + 16}
				text-anchor="middle"
				font-size="11"
				fill="var(--ink2)"
			>
				{monthLabel.format(new Date(tick))}
			</text>
		{/each}

		<!-- baseline -->
		<line
			x1={pad.left}
			x2={width - pad.right}
			y1={height - pad.bottom}
			y2={height - pad.bottom}
			stroke="var(--ink3)"
			stroke-width="1"
		/>

		<!-- subtle area under the line -->
		<path
			d={`${path} L${x(xs[xs.length - 1]).toFixed(1)},${height - pad.bottom} L${x(xs[0]).toFixed(1)},${height - pad.bottom} Z`}
			fill="var(--accent)"
			opacity="0.08"
		/>

		<!-- the line -->
		<path d={path} fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" />

		<!-- data points -->
		{#each points as p, i (p.date)}
			<circle
				cx={x(xs[i])}
				cy={y(p.cents)}
				r={hoverIndex === i ? 5 : 2.8}
				fill="var(--accent)"
				stroke="var(--surface2)"
				stroke-width="1.5"
			/>
		{/each}

		<!-- always-visible end label (no hover on e-ink) -->
		<text
			x={Math.min(x(xs[xs.length - 1]), width - pad.right)}
			y={Math.max(y(last.cents) - 10, 12)}
			text-anchor="end"
			font-size="12"
			font-weight="650"
			fill="var(--ink)"
			style="font-variant-numeric: tabular-nums"
		>
			{formatCents(last.cents)}
		</text>

		<!-- crosshair + tooltip -->
		{#if hoverIndex !== null}
			{@const hp = points[hoverIndex]}
			{@const hx = x(xs[hoverIndex])}
			{@const boxW = 150}
			{@const boxX = Math.min(Math.max(hx - boxW / 2, pad.left), width - pad.right - boxW)}
			<line
				x1={hx}
				x2={hx}
				y1={pad.top}
				y2={height - pad.bottom}
				stroke="var(--ink3)"
				stroke-dasharray="3 3"
			/>
			<g>
				<rect
					x={boxX}
					y={pad.top}
					width={boxW}
					height="36"
					rx="8"
					fill="var(--surface2)"
					stroke="var(--ink3)"
				/>
				<text x={boxX + 10} y={pad.top + 15} font-size="11" fill="var(--ink2)">
					{dateLabel.format(new Date(hp.date + 'T00:00:00Z'))}
				</text>
				<text
					x={boxX + 10}
					y={pad.top + 29}
					font-size="12"
					font-weight="650"
					fill="var(--ink)"
					style="font-variant-numeric: tabular-nums"
				>
					{formatCents(hp.cents)}
				</text>
			</g>
		{/if}
	</svg>
{/if}
