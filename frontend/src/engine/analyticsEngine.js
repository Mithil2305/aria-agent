// Analytics & Modeling Engine
// Computes KPIs, trends, anomalies, correlations, forecasts

export function computeKPIs(data, schema) {
	const kpis = [];
	const numericCols = schema.columns.filter(
		(c) => schema.types[c] === "numeric",
	);

	numericCols.forEach((col) => {
		const s = schema.summary[col];
		const values = data
			.map((r) => Number(String(r[col]).replace(/[,$%]/g, "")))
			.filter((n) => !isNaN(n));

		if (values.length < 2) return;

		const current = values[values.length - 1];
		const previous =
			values[Math.max(0, values.length - Math.ceil(values.length * 0.1))];
		const change =
			previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0;

		const trend = detectTrend(values);
		const volatility = (s.stdDev / Math.abs(s.mean || 1)) * 100;

		kpis.push({
			label: formatLabel(col),
			column: col,
			value: s.mean,
			current,
			change: parseFloat(change.toFixed(2)),
			trend,
			volatility: parseFloat(volatility.toFixed(1)),
			min: s.min,
			max: s.max,
			median: s.median,
			confidence: Math.max(0.6, Math.min(0.99, 1 - volatility / 200)),
			significance: computeSignificance(values),
		});
	});

	// Sort by significance
	kpis.sort((a, b) => b.significance - a.significance);
	return kpis;
}

export function computeTrends(data, schema) {
	const temporalCol = schema.columns.find(
		(c) => schema.types[c] === "temporal",
	);
	const numericCols = schema.columns.filter(
		(c) => schema.types[c] === "numeric",
	);

	if (!temporalCol || numericCols.length === 0) {
		// Use index as x-axis
		return numericCols.slice(0, 4).map((col) => {
			const values = data.map((r, i) => ({
				x: i,
				y: Number(String(r[col]).replace(/[,$%]/g, "")) || 0,
			}));
			return { column: col, label: formatLabel(col), data: values };
		});
	}

	const sorted = [...data].sort(
		(a, b) => new Date(a[temporalCol]) - new Date(b[temporalCol]),
	);

	return numericCols.slice(0, 4).map((col) => {
		const values = sorted.map((r) => ({
			x: formatDate(r[temporalCol]),
			y: Number(String(r[col]).replace(/[,$%]/g, "")) || 0,
			raw: r[temporalCol],
		}));
		return { column: col, label: formatLabel(col), data: values };
	});
}

export function detectAnomalies(data, schema) {
	const anomalies = [];
	const numericCols = schema.columns.filter(
		(c) => schema.types[c] === "numeric",
	);

	numericCols.forEach((col) => {
		const s = schema.summary[col];
		const values = data.map((r, i) => ({
			index: i,
			value: Number(String(r[col]).replace(/[,$%]/g, "")) || 0,
			row: r,
		}));

		const mean = s.mean;
		const std = s.stdDev;
		const threshold = 2.5;

		values.forEach(({ index, value }) => {
			const zScore = std > 0 ? Math.abs((value - mean) / std) : 0;
			if (zScore > threshold) {
				anomalies.push({
					column: col,
					label: formatLabel(col),
					index,
					value,
					expected: mean,
					deviation: parseFloat((((value - mean) / mean) * 100).toFixed(1)),
					zScore: parseFloat(zScore.toFixed(2)),
					severity: zScore > 3.5 ? "critical" : zScore > 3 ? "high" : "medium",
					type: value > mean ? "spike" : "dip",
				});
			}
		});
	});

	anomalies.sort((a, b) => b.zScore - a.zScore);
	return anomalies.slice(0, 20);
}

export function computeCorrelations(data, schema) {
	const numericCols = schema.columns.filter(
		(c) => schema.types[c] === "numeric",
	);
	const correlations = [];

	for (let i = 0; i < numericCols.length; i++) {
		for (let j = i + 1; j < numericCols.length; j++) {
			const col1 = numericCols[i];
			const col2 = numericCols[j];

			const pairs = data
				.map((r) => [
					Number(String(r[col1]).replace(/[,$%]/g, "")),
					Number(String(r[col2]).replace(/[,$%]/g, "")),
				])
				.filter(([a, b]) => !isNaN(a) && !isNaN(b));

			if (pairs.length < 5) continue;

			const corr = pearsonCorrelation(
				pairs.map((p) => p[0]),
				pairs.map((p) => p[1]),
			);

			if (Math.abs(corr) > 0.3) {
				correlations.push({
					col1,
					col2,
					label1: formatLabel(col1),
					label2: formatLabel(col2),
					correlation: parseFloat(corr.toFixed(3)),
					strength:
						Math.abs(corr) > 0.7
							? "strong"
							: Math.abs(corr) > 0.5
								? "moderate"
								: "weak",
					direction: corr > 0 ? "positive" : "negative",
					scatter: pairs.slice(0, 200).map(([x, y]) => ({ x, y })),
				});
			}
		}
	}

	correlations.sort(
		(a, b) => Math.abs(b.correlation) - Math.abs(a.correlation),
	);
	return correlations.slice(0, 15);
}

export function generateForecasts(data, schema) {
	const temporalCol = schema.columns.find(
		(c) => schema.types[c] === "temporal",
	);
	const numericCols = schema.columns.filter(
		(c) => schema.types[c] === "numeric",
	);
	const forecasts = [];

	numericCols.slice(0, 3).forEach((col) => {
		const values = data.map(
			(r) => Number(String(r[col]).replace(/[,$%]/g, "")) || 0,
		);

		if (values.length < 5) return;

		// Simple linear regression + seasonal mock
		const n = values.length;
		const xMean = (n - 1) / 2;
		const yMean = values.reduce((a, b) => a + b, 0) / n;

		let num = 0,
			den = 0;
		values.forEach((y, x) => {
			num += (x - xMean) * (y - yMean);
			den += (x - xMean) * (x - xMean);
		});

		const slope = den !== 0 ? num / den : 0;
		const intercept = yMean - slope * xMean;

		const residuals = values.map((y, x) => y - (slope * x + intercept));
		const residualStd = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / n);

		const forecastSteps = Math.max(5, Math.ceil(n * 0.2));
		const forecastData = [];

		// Historical
		const historical = values.map((v, i) => ({
			index: i,
			actual: v,
			label: temporalCol ? formatDate(data[i]?.[temporalCol]) : `${i + 1}`,
		}));

		// Forecast
		for (let i = 0; i < forecastSteps; i++) {
			const x = n + i;
			const predicted = slope * x + intercept;
			const noise = Math.sin(i * 0.5) * residualStd * 0.3;
			const uncertainty = residualStd * (1 + i * 0.1);

			forecastData.push({
				index: x,
				predicted: parseFloat((predicted + noise).toFixed(2)),
				upper: parseFloat((predicted + noise + 1.96 * uncertainty).toFixed(2)),
				lower: parseFloat((predicted + noise - 1.96 * uncertainty).toFixed(2)),
				label: `F+${i + 1}`,
			});
		}

		forecasts.push({
			column: col,
			label: formatLabel(col),
			historical,
			forecast: forecastData,
			trend: slope > 0 ? "upward" : slope < 0 ? "downward" : "flat",
			growthRate:
				yMean !== 0 ? parseFloat(((slope / yMean) * 100).toFixed(2)) : 0,
			confidence: Math.max(
				0.5,
				Math.min(0.95, 1 - residualStd / (Math.abs(yMean) || 1)),
			),
			r2: computeR2(
				values,
				values.map((_, i) => slope * i + intercept),
			),
		});
	});

	return forecasts;
}

// Helper Functions

function detectTrend(values) {
	if (values.length < 3) return "insufficient";
	const half = Math.floor(values.length / 2);
	const firstHalf = values.slice(0, half);
	const secondHalf = values.slice(half);
	const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
	const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
	const change = ((secondMean - firstMean) / Math.abs(firstMean || 1)) * 100;
	if (change > 5) return "rising";
	if (change < -5) return "falling";
	return "stable";
}

function computeSignificance(values) {
	const std = Math.sqrt(
		values.reduce(
			(s, v) =>
				s + Math.pow(v - values.reduce((a, b) => a + b, 0) / values.length, 2),
			0,
		) / values.length,
	);
	const range = Math.max(...values) - Math.min(...values);
	const cv =
		std / (Math.abs(values.reduce((a, b) => a + b, 0) / values.length) || 1);
	return parseFloat(Math.min(1, cv * 0.5 + (range > 0 ? 0.3 : 0)).toFixed(2));
}

function pearsonCorrelation(x, y) {
	const n = x.length;
	const xMean = x.reduce((a, b) => a + b, 0) / n;
	const yMean = y.reduce((a, b) => a + b, 0) / n;

	let num = 0,
		denX = 0,
		denY = 0;
	for (let i = 0; i < n; i++) {
		const dx = x[i] - xMean;
		const dy = y[i] - yMean;
		num += dx * dy;
		denX += dx * dx;
		denY += dy * dy;
	}

	const den = Math.sqrt(denX * denY);
	return den === 0 ? 0 : num / den;
}

function computeR2(actual, predicted) {
	const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
	const ssRes = actual.reduce(
		(s, v, i) => s + Math.pow(v - predicted[i], 2),
		0,
	);
	const ssTot = actual.reduce((s, v) => s + Math.pow(v - mean, 2), 0);
	return ssTot === 0 ? 0 : parseFloat((1 - ssRes / ssTot).toFixed(3));
}

function formatLabel(col) {
	return col
		.replace(/[_-]/g, " ")
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(val) {
	try {
		const d = new Date(val);
		if (isNaN(d)) return String(val);
		return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
	} catch {
		return String(val);
	}
}
