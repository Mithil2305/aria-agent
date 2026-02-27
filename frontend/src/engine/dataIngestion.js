// Data Ingestion Layer
// Parses CSV and Excel files into normalized data structures

import Papa from "papaparse";
import * as XLSX from "xlsx";

export function parseFile(file) {
	return new Promise((resolve, reject) => {
		const ext = file.name.split(".").pop().toLowerCase();

		if (ext === "csv") {
			Papa.parse(file, {
				header: true,
				skipEmptyLines: true,
				dynamicTyping: true,
				complete: (results) => {
					resolve({
						data: cleanData(results.data),
						fileName: file.name,
						rowCount: results.data.length,
						parseErrors: results.errors.length,
					});
				},
				error: (err) => reject(err),
			});
		} else if (["xlsx", "xls"].includes(ext)) {
			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const wb = XLSX.read(e.target.result, { type: "array" });
					const sheetName = wb.SheetNames[0];
					const sheet = wb.Sheets[sheetName];
					const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });
					resolve({
						data: cleanData(jsonData),
						fileName: file.name,
						rowCount: jsonData.length,
						sheetName,
						totalSheets: wb.SheetNames.length,
					});
				} catch (err) {
					reject(err);
				}
			};
			reader.onerror = () => reject(new Error("Failed to read file"));
			reader.readAsArrayBuffer(file);
		} else {
			reject(new Error(`Unsupported file format: .${ext}`));
		}
	});
}

function cleanData(data) {
	return data
		.map((row) => {
			const cleaned = {};
			Object.entries(row).forEach(([key, value]) => {
				const cleanKey = key.trim();
				if (cleanKey === "" || cleanKey === "__EMPTY") return;
				cleaned[cleanKey] = value === "" || value === undefined ? null : value;
			});
			return cleaned;
		})
		.filter((row) => Object.values(row).some((v) => v !== null));
}

export function generateSampleData() {
	// Generate a realistic business dataset for demonstration
	const months = [];
	const startDate = new Date(2024, 0, 1);

	for (let i = 0; i < 24; i++) {
		const date = new Date(startDate);
		date.setMonth(date.getMonth() + i);

		const seasonality = Math.sin((i / 12) * Math.PI * 2) * 0.15;
		const trend = i * 0.02;
		const noise = (Math.random() - 0.5) * 0.1;

		const baseRevenue = 125000;
		const revenue = baseRevenue * (1 + trend + seasonality + noise);
		const customers = Math.round(
			3200 *
				(1 + trend * 0.7 + seasonality * 0.5 + (Math.random() - 0.5) * 0.08),
		);
		const avgOrderValue = 38 + (Math.random() - 0.3) * 8 + i * 0.3;
		const conversionRate = 3.2 + seasonality * 2 + (Math.random() - 0.5) * 0.5;
		const churnRate = 4.5 - trend * 3 + (Math.random() - 0.5) * 0.8;
		const marketingSpend = 18000 + i * 500 + (Math.random() - 0.5) * 3000;
		const nps = 42 + i * 0.8 + (Math.random() - 0.5) * 5;

		// Inject some anomalies
		const revenueMultiplier = i === 11 || i === 23 ? 1.35 : i === 7 ? 0.72 : 1;

		months.push({
			Date: date.toISOString().split("T")[0],
			Revenue: Math.round(revenue * revenueMultiplier),
			"Active Customers": customers,
			"Avg Order Value": parseFloat(avgOrderValue.toFixed(2)),
			"Conversion Rate": parseFloat(conversionRate.toFixed(2)),
			"Churn Rate": parseFloat(Math.max(0.5, churnRate).toFixed(2)),
			"Marketing Spend": Math.round(marketingSpend),
			"Net Promoter Score": Math.round(nps),
			Region: ["North", "South", "East", "West"][i % 4],
			"Product Category": ["SaaS", "Enterprise", "SMB"][i % 3],
		});
	}

	return {
		data: months,
		fileName: "business_metrics_2024_2025.csv",
		rowCount: months.length,
		isDemo: true,
	};
}
