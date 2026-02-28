/**
 * API Service – Axios client for ARIA backend communication.
 * Handles all HTTP calls, auth tokens, and response normalization.
 */

import axios from "axios";

const API = axios.create({
	baseURL: "http://localhost:8000",
	timeout: 120_000,
});

/** Helper: attach auth header when a token is provided */
function authHeaders(token) {
	return token ? { Authorization: `Bearer ${token}` } : {};
}

// ──────────────────── Upload / Demo ────────────────────

export async function uploadFile(file, token) {
	const formData = new FormData();
	formData.append("file", file);
	const { data } = await API.post("/api/upload", formData, {
		headers: { "Content-Type": "multipart/form-data", ...authHeaders(token) },
	});
	return data;
}

export async function loadDemo(token) {
	const { data } = await API.post("/api/demo", null, {
		headers: authHeaders(token),
	});
	return data;
}

// ──────────────────── Full Analysis ────────────────────

export async function runAnalysis(token) {
	const { data } = await API.get("/api/analyze", {
		headers: authHeaders(token),
	});
	return normalizeAnalysis(data);
}

// ──────────────────── Daily Logs → Analysis ────────────────────

export async function uploadDailyLogs(
	logs,
	token,
	filename = "daily_logs.csv",
) {
	const { data } = await API.post(
		"/api/upload-logs",
		{ logs, filename },
		{ headers: { "Content-Type": "application/json", ...authHeaders(token) } },
	);
	return data;
}

// ──────────────────── PDF Report ────────────────────

export async function downloadReport(token) {
	const { data } = await API.get("/api/report", {
		responseType: "blob",
		headers: authHeaders(token),
	});
	const url = window.URL.createObjectURL(data);
	const a = document.createElement("a");
	a.href = url;
	a.download = "ARIA_Intelligence_Report.pdf";
	document.body.appendChild(a);
	a.click();
	a.remove();
	window.URL.revokeObjectURL(url);
}

// ──────────────────── Normalization ────────────────────

function normalizeAnalysis(raw) {
	return {
		filename: raw.filename,
		rowCount: raw.row_count,
		schema: normalizeSchema(raw.schema),
		kpis: (raw.kpis || []).map(normalizeKPI),
		trends: raw.trends || [],
		distributions: raw.distributions || [],
		forecasts: (raw.forecasts || []).map(normalizeForecast),
		anomalies: (raw.anomalies || []).map(normalizeAnomaly),
		correlations: raw.correlations || [],
		featureImportance: raw.feature_importance || [],
		riskScores: raw.risk_scores || [],
		insights: (raw.insights || []).map(normalizeInsight),
		narrative: raw.narrative || "",
		severitySummary: raw.severity_summary || {},
	};
}

function normalizeSchema(s) {
	if (!s) return { columns: [], types: {}, profiles: {}, summary: {} };
	// Build a "summary" map that SchemaView.jsx expects from profiles
	const summary = {};
	for (const col of s.columns || []) {
		const p = (s.profiles || {})[col] || {};
		const type = (s.types || {})[col];

		// Common fields every column type needs
		const base = {
			nonNull: p.non_null ?? p.nonNull ?? 0,
			totalCount: p.total_count ?? p.totalCount ?? 0,
			nullCount: p.null_count ?? p.nullCount ?? 0,
			uniqueCount: p.unique_count ?? p.uniqueCount ?? 0,
			completeness: p.completeness ?? 0,
		};

		if (type === "numeric") {
			summary[col] = {
				...base,
				min: p.min,
				max: p.max,
				mean: p.mean,
				median: p.median,
				stdDev: p.std_dev ?? p.stdDev ?? 0,
				skewness: p.skewness ?? 0,
				kurtosis: p.kurtosis ?? 0,
				q1: p.q1,
				q3: p.q3,
				iqr: p.iqr,
				cv: p.cv ?? 0,
			};
		} else if (type === "categorical") {
			summary[col] = {
				...base,
				cardinality: p.cardinality ?? p.unique_count ?? 0,
				topValues: p.top_values ?? p.topValues ?? [],
			};
		} else if (type === "temporal") {
			summary[col] = {
				...base,
				spanDays: p.span_days ?? p.spanDays ?? 0,
				earliest: p.earliest,
				latest: p.latest,
				frequency: p.frequency ?? null,
			};
		} else {
			summary[col] = { ...base, ...p };
		}
	}
	return {
		columns: s.columns || [],
		types: s.types || {},
		profiles: s.profiles || {},
		summary,
		type_counts: s.type_counts || {},
		data_quality: s.data_quality || {},
	};
}

function normalizeKPI(k) {
	return {
		...k,
		stdDev: k.std_dev ?? k.stdDev ?? 0,
		growthRate: k.growth_rate ?? k.growthRate ?? 0,
		pValue: k.p_value ?? k.pValue ?? 0,
		rSquared: k.r_squared ?? k.rSquared ?? 0,
	};
}

function normalizeForecast(f) {
	// Map backend "forecast" array to "predictions" for Dashboard compatibility
	const forecastPoints = f.forecast || [];
	const predictions = forecastPoints.map((pt) => ({
		...pt,
		value: pt.predicted ?? pt.value ?? 0,
	}));

	return {
		...f,
		predictions,
		growthRate: f.growth_rate ?? f.growthRate ?? 0,
		modelType: f.model_type ?? f.modelType ?? "linear",
		residualStd: f.residual_std ?? f.residualStd ?? 0,
		r2: f.r2 ?? 0,
	};
}

function normalizeAnomaly(a) {
	return {
		...a,
		zScore: a.z_score ?? a.zScore ?? 0,
		rowLabel: a.row_label ?? a.rowLabel ?? "",
	};
}

function normalizeInsight(ins, idx) {
	return {
		...ins,
		id: ins.id ?? idx + 1,
		type: ins.category ?? ins.type ?? "info",
	};
}
