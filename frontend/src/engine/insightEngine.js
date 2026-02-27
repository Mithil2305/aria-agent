// AI Reasoning & Insight Generation Engine
// Generates human-readable interpretations, narratives, and decision support

export function generateInsights(
	kpis,
	anomalies,
	correlations,
	forecasts,
	schema,
) {
	const insights = [];
	let id = 0;

	// KPI-based insights
	kpis.forEach((kpi) => {
		if (Math.abs(kpi.change) > 10) {
			const direction = kpi.change > 0 ? "increased" : "decreased";
			insights.push({
				id: ++id,
				type: "trend",
				severity: Math.abs(kpi.change) > 25 ? "high" : "medium",
				confidence: kpi.confidence,
				title: `${kpi.label} ${direction} by ${Math.abs(kpi.change).toFixed(1)}%`,
				description: `${kpi.label} has ${direction} significantly from recent baseline. This ${kpi.change > 0 ? "growth" : "decline"} pattern suggests a ${kpi.trend === "rising" ? "sustained upward momentum" : kpi.trend === "falling" ? "continued downward pressure" : "transitional phase"} that warrants attention.`,
				recommendation:
					kpi.change > 0
						? `Investigate drivers behind the ${kpi.label.toLowerCase()} growth to determine if this trend is sustainable and can be amplified.`
						: `Assess root causes of the ${kpi.label.toLowerCase()} decline and identify potential intervention points.`,
				category: "Growth Pattern",
			});
		}

		if (kpi.volatility > 40) {
			insights.push({
				id: ++id,
				type: "risk",
				severity: kpi.volatility > 70 ? "high" : "medium",
				confidence: 0.85,
				title: `High volatility detected in ${kpi.label}`,
				description: `${kpi.label} exhibits a coefficient of variation of ${kpi.volatility.toFixed(1)}%, indicating significant instability. This level of variance may introduce forecasting uncertainty and operational risk.`,
				recommendation: `Consider implementing smoothing strategies or investigate external factors contributing to ${kpi.label.toLowerCase()} variance.`,
				category: "Volatility Signal",
			});
		}
	});

	// Anomaly-based insights
	if (anomalies.length > 0) {
		const critical = anomalies.filter((a) => a.severity === "critical");
		const grouped = {};
		anomalies.forEach((a) => {
			if (!grouped[a.column]) grouped[a.column] = [];
			grouped[a.column].push(a);
		});

		Object.entries(grouped).forEach(([col, anoms]) => {
			insights.push({
				id: ++id,
				type: "anomaly",
				severity: anoms.some((a) => a.severity === "critical")
					? "high"
					: "medium",
				confidence: 0.88,
				title: `${anoms.length} anomalies detected in ${formatLabel(col)}`,
				description: `Statistical analysis identified ${anoms.length} significant deviations in ${formatLabel(col)}. ${anoms[0].type === "spike" ? "Upward spikes" : "Downward dips"} with z-scores up to ${anoms[0].zScore.toFixed(1)} suggest ${anoms.length > 3 ? "systematic data quality issues or regime changes" : "isolated outlier events"}.`,
				recommendation: `Review flagged data points for ${formatLabel(col)} to distinguish between genuine business events and data quality issues.`,
				category: "Anomaly Detection",
			});
		});

		if (critical.length > 0) {
			insights.push({
				id: ++id,
				type: "risk",
				severity: "critical",
				confidence: 0.92,
				title: `${critical.length} critical deviations require immediate review`,
				description: `Critical-severity anomalies with z-scores exceeding 3.5σ were detected across ${new Set(critical.map((c) => c.column)).size} metrics. These extreme deviations fall outside normal statistical bounds and may indicate data integrity issues or significant business events.`,
				recommendation:
					"Prioritize investigation of critical anomalies. Cross-reference with external events or data pipeline changes.",
				category: "Risk Marker",
			});
		}
	}

	// Correlation insights
	correlations
		.filter((c) => c.strength === "strong")
		.forEach((corr) => {
			insights.push({
				id: ++id,
				type: "correlation",
				severity: "medium",
				confidence: 0.82,
				title: `Strong ${corr.direction} relationship: ${corr.label1} ↔ ${corr.label2}`,
				description: `A ${corr.strength} ${corr.direction} correlation (r=${corr.correlation.toFixed(2)}) exists between ${corr.label1} and ${corr.label2}. This ${corr.direction === "positive" ? "means they tend to move together" : "suggests an inverse relationship where one increases as the other decreases"}.`,
				recommendation: `Leverage this dependency for predictive modeling. Changes in ${corr.label1.toLowerCase()} can serve as a leading indicator for ${corr.label2.toLowerCase()}.`,
				category: "Dependency Map",
			});
		});

	// Forecast insights
	forecasts.forEach((fc) => {
		insights.push({
			id: ++id,
			type: "forecast",
			severity: fc.trend === "downward" ? "high" : "low",
			confidence: fc.confidence,
			title: `${fc.label}: ${fc.trend} trajectory projected (${fc.growthRate > 0 ? "+" : ""}${fc.growthRate}% rate)`,
			description: `Predictive modeling indicates a ${fc.trend} trend for ${fc.label} with a per-period growth rate of ${fc.growthRate}%. Model fit (R²=${fc.r2}) suggests ${fc.r2 > 0.7 ? "reliable" : fc.r2 > 0.4 ? "moderate" : "low"} forecast confidence over the projection horizon.`,
			recommendation:
				fc.trend === "downward"
					? `Proactive measures recommended to address projected decline in ${fc.label.toLowerCase()}. Consider scenario planning for continued deterioration.`
					: `Current trajectory for ${fc.label.toLowerCase()} is favorable. Monitor for deviation from projected path.`,
			category: "Predictive Intelligence",
		});
	});

	// Meta insight
	const numericCount = schema.columns.filter(
		(c) => schema.types[c] === "numeric",
	).length;
	const categoricalCount = schema.columns.filter(
		(c) => schema.types[c] === "categorical",
	).length;
	const temporalCount = schema.columns.filter(
		(c) => schema.types[c] === "temporal",
	).length;

	insights.push({
		id: ++id,
		type: "schema",
		severity: "info",
		confidence: 0.95,
		title: `Dataset profiled: ${schema.columns.length} features across ${data_count_text(schema)}`,
		description: `Schema Intelligence Engine identified ${numericCount} numeric, ${categoricalCount} categorical, and ${temporalCount} temporal features. ${numericCount >= 3 ? "Rich numeric feature space enables multi-dimensional analytics and correlation analysis." : "Limited numeric features may constrain analytical depth."} ${temporalCount > 0 ? "Temporal features enable time-series analysis and forecasting." : "No temporal features detected — index-based sequencing applied."}`,
		recommendation:
			"Review the inferred schema to validate feature classifications. Reclassification may improve analytical accuracy.",
		category: "Schema Intelligence",
	});

	// Sort by severity then confidence
	const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
	insights.sort(
		(a, b) =>
			(severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5) ||
			b.confidence - a.confidence,
	);

	return insights;
}

export function generateNarrative(kpis, anomalies, forecasts, schema) {
	const lines = [];

	lines.push(`## Executive Intelligence Summary`);
	lines.push("");
	lines.push(
		`Analysis processed **${schema.summary[schema.columns[0]]?.totalCount || 0} records** across **${schema.columns.length} dimensions**. `,
	);

	const risingKpis = kpis.filter((k) => k.trend === "rising");
	const fallingKpis = kpis.filter((k) => k.trend === "falling");

	if (risingKpis.length > 0) {
		lines.push(
			`**${risingKpis.length}** metrics show upward momentum, led by ${risingKpis[0]?.label} (+${risingKpis[0]?.change?.toFixed(1)}%).`,
		);
	}
	if (fallingKpis.length > 0) {
		lines.push(
			`**${fallingKpis.length}** metrics exhibit decline, most notably ${fallingKpis[0]?.label} (${fallingKpis[0]?.change?.toFixed(1)}%).`,
		);
	}

	if (anomalies.length > 0) {
		lines.push(
			`**${anomalies.length} statistical anomalies** were flagged, with ${anomalies.filter((a) => a.severity === "critical").length} requiring immediate attention.`,
		);
	}

	if (forecasts.length > 0) {
		const upward = forecasts.filter((f) => f.trend === "upward").length;
		const downward = forecasts.filter((f) => f.trend === "downward").length;
		lines.push(
			`Predictive models project **${upward} upward** and **${downward} downward** trajectories across key metrics.`,
		);
	}

	return lines.join("\n");
}

function formatLabel(col) {
	return col
		.replace(/[_-]/g, " ")
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function data_count_text(schema) {
	const n = schema.columns.filter((c) => schema.types[c] === "numeric").length;
	const c = schema.columns.filter(
		(c2) => schema.types[c2] === "categorical",
	).length;
	const t = schema.columns.filter(
		(c3) => schema.types[c3] === "temporal",
	).length;
	const parts = [];
	if (n) parts.push(`${n} numeric`);
	if (c) parts.push(`${c} categorical`);
	if (t) parts.push(`${t} temporal`);
	return parts.join(", ") + " dimensions";
}
