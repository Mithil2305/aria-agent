// Schema Intelligence Engine
// Identifies numeric, categorical, and temporal features from raw data

export function analyzeSchema(data) {
	if (!data || data.length === 0)
		return { columns: [], types: {}, summary: {} };

	const columns = Object.keys(data[0]);
	const types = {};
	const summary = {};

	columns.forEach((col) => {
		const values = data
			.map((row) => row[col])
			.filter((v) => v !== null && v !== undefined && v !== "");
		const type = inferType(values, col);
		types[col] = type;

		summary[col] = {
			type,
			totalCount: data.length,
			nonNull: values.length,
			nullCount: data.length - values.length,
			uniqueCount: new Set(values.map(String)).size,
		};

		if (type === "numeric") {
			const nums = values.map(Number).filter((n) => !isNaN(n));
			summary[col] = {
				...summary[col],
				min: Math.min(...nums),
				max: Math.max(...nums),
				mean: nums.reduce((a, b) => a + b, 0) / nums.length,
				median: getMedian(nums),
				stdDev: getStdDev(nums),
			};
		} else if (type === "temporal") {
			const dates = values.map((v) => new Date(v)).filter((d) => !isNaN(d));
			summary[col] = {
				...summary[col],
				earliest: new Date(Math.min(...dates)),
				latest: new Date(Math.max(...dates)),
				spanDays: Math.round(
					(Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24),
				),
			};
		} else if (type === "categorical") {
			const freq = {};
			values.forEach((v) => {
				freq[v] = (freq[v] || 0) + 1;
			});
			const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
			summary[col] = {
				...summary[col],
				topValues: sorted.slice(0, 10),
				cardinality: sorted.length,
			};
		}
	});

	return { columns, types, summary };
}

function inferType(values, colName) {
	const sample = values.slice(0, 100);
	const lowerName = colName.toLowerCase();

	// Check temporal by name and value
	const temporalKeywords = [
		"date",
		"time",
		"year",
		"month",
		"day",
		"created",
		"updated",
		"timestamp",
		"period",
	];
	if (temporalKeywords.some((k) => lowerName.includes(k))) {
		const dateCount = sample.filter((v) => !isNaN(Date.parse(v))).length;
		if (dateCount / sample.length > 0.7) return "temporal";
	}

	// Check if values look like dates
	const dateCount = sample.filter((v) => {
		if (typeof v === "number") return false;
		const str = String(v);
		return (
			/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(str) ||
			/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(str) ||
			!isNaN(Date.parse(str))
		);
	}).length;
	if (dateCount / sample.length > 0.8) return "temporal";

	// Check numeric
	const numCount = sample.filter((v) => {
		const n = Number(String(v).replace(/[,$%]/g, ""));
		return !isNaN(n) && String(v).trim() !== "";
	}).length;
	if (numCount / sample.length > 0.8) return "numeric";

	return "categorical";
}

function getMedian(nums) {
	const sorted = [...nums].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 !== 0
		? sorted[mid]
		: (sorted[mid - 1] + sorted[mid]) / 2;
}

function getStdDev(nums) {
	const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
	const variance =
		nums.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / nums.length;
	return Math.sqrt(variance);
}
