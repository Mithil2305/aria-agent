// Data Ingestion Layer
// Parses CSV and Excel files into normalized data structures

import Papa from "papaparse";
import ExcelJS from "exceljs";

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
		} else if (ext === "xlsx") {
			const reader = new FileReader();
			reader.onload = async (e) => {
				try {
					const workbook = new ExcelJS.Workbook();
					await workbook.xlsx.load(e.target.result);

					const worksheet = workbook.worksheets[0];
					if (!worksheet) {
						reject(new Error("The workbook does not contain any sheets"));
						return;
					}

					const headers = [];
					worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
						const headerValue = normalizeExcelValue(cell.value);
						headers[col - 1] =
							typeof headerValue === "string"
								? headerValue.trim()
								: String(headerValue ?? "").trim();
					});

					const jsonData = [];
					for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum += 1) {
						const row = worksheet.getRow(rowNum);
						const rowObject = {};
						let hasNonNullValue = false;

						headers.forEach((header, index) => {
							if (!header || header === "__EMPTY") return;
							const rawValue = row.getCell(index + 1).value;
							const value = normalizeExcelValue(rawValue);
							rowObject[header] =
								value === "" || value === undefined ? null : value;
							if (rowObject[header] !== null) hasNonNullValue = true;
						});

						if (hasNonNullValue) {
							jsonData.push(rowObject);
						}
					}

					resolve({
						data: cleanData(jsonData),
						fileName: file.name,
						rowCount: jsonData.length,
						sheetName: worksheet.name,
						totalSheets: workbook.worksheets.length,
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

function normalizeExcelValue(value) {
	if (value === undefined || value === null) return null;
	if (value instanceof Date) return value.toISOString().split("T")[0];
	if (typeof value !== "object") return value;

	if ("result" in value) return value.result ?? null;
	if ("text" in value && typeof value.text === "string") return value.text;
	if ("richText" in value && Array.isArray(value.richText)) {
		return value.richText.map((part) => part.text || "").join("");
	}
	if ("hyperlink" in value) return value.text || value.hyperlink || null;

	return null;
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
