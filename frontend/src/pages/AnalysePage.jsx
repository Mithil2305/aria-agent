import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { uploadDailyLogs, uploadFile, runAnalysis } from "../services/api";
import {
	collection,
	getDocs,
	query,
	orderBy,
	doc,
	setDoc,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import ProcessingView from "../components/ProcessingView";
import {
	BarChart3,
	Loader2,
	AlertCircle,
	CheckCircle2,
	FileSpreadsheet,
	Upload,
	Calendar,
	TrendingUp,
	ArrowRight,
	Database,
	Sparkles,
} from "lucide-react";

export default function AnalysePage() {
	const { user, userProfile, getIdToken } = useAuth();
	const navigate = useNavigate();
	const role = userProfile?.role || "paid-user";

	const [logs, setLogs] = useState([]);
	const [loadingLogs, setLoadingLogs] = useState(true);
	const [stage, setStage] = useState("prepare"); // prepare | processing
	const [error, setError] = useState(null);
	const [dataSource, setDataSource] = useState("logs"); // logs | csv
	const [csvFile, setCsvFile] = useState(null);
	const [fileName, setFileName] = useState("");
	const [rowCount, setRowCount] = useState(0);

	// Fetch daily logs from Firestore
	const loadLogs = useCallback(async () => {
		if (!user) return;
		setLoadingLogs(true);
		try {
			const q = query(
				collection(db, "users", user.uid, "dailyLogs"),
				orderBy("date", "asc"),
			);
			const snapshot = await getDocs(q);
			const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
			setLogs(data);
		} catch {
			// Silent fail
		} finally {
			setLoadingLogs(false);
		}
	}, [user]);

	useEffect(() => {
		loadLogs();
	}, [loadLogs]);

	const handleCsvSelect = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const ext = file.name.split(".").pop().toLowerCase();
		if (!["csv", "xlsx", "xls"].includes(ext)) {
			setError("Please select a CSV or Excel file.");
			return;
		}
		setCsvFile(file);
		setDataSource("csv");
		setError(null);
	};

	const handleStartAnalysis = async () => {
		setError(null);

		if (dataSource === "csv" && csvFile) {
			// CSV upload path
			try {
				const token = await getIdToken();
				const result = await uploadFile(csvFile, token, user?.uid, role);
				setFileName(result.filename);
				setRowCount(result.row_count);
				setStage("processing");
			} catch (err) {
				setError(
					err.response?.data?.detail ||
						"Upload failed. Is the backend running?",
				);
			}
		} else {
			// Daily logs path
			if (logs.length < 3) {
				setError(
					"You need at least 3 daily log entries to run analysis. Start by logging your daily metrics.",
				);
				return;
			}

			try {
				const token = await getIdToken();

				// Build payload dynamically — include all non-null fields from each log
				const SKIP_KEYS = new Set(["id", "createdAt", "notes"]);
				const logPayload = logs.map((log) => {
					const entry = {};
					for (const [key, value] of Object.entries(log)) {
						if (SKIP_KEYS.has(key) || value === undefined) continue;
						entry[key] = value ?? null;
					}
					return entry;
				});

				const result = await uploadDailyLogs(logPayload, token);
				setFileName(result.filename);
				setRowCount(result.row_count);
				setStage("processing");
			} catch (err) {
				setError(
					err.response?.data?.detail ||
						"Failed to send logs. Is the backend running?",
				);
			}
		}
	};

	const handleProcessingComplete = useCallback(async () => {
		try {
			setError(null);
			const token = await getIdToken();
			const result = await runAnalysis(token, user?.uid, role);

			if (user) {
				try {
					await setDoc(doc(db, "users", user.uid, "analyses", "latest"), {
						filename: result.filename,
						rowCount: result.rowCount,
						analysisData: JSON.stringify(result),
						createdAt: serverTimestamp(),
					});
				} catch {
					// Silently fail Firestore save
				}
			}

			sessionStorage.setItem("yukti_analysis", JSON.stringify(result));
			sessionStorage.setItem("yukti_rowCount", rowCount.toString());
			navigate("/");
		} catch (err) {
			setError(err.response?.data?.detail || "Analysis failed.");
			setStage("prepare");
		}
	}, [getIdToken, user, role, rowCount, navigate]);

	// ── Processing stage ──
	if (stage === "processing") {
		return (
			<div className="min-h-screen">
				{error && (
					<div className="max-w-2xl mx-auto mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
						{error}
					</div>
				)}
				<ProcessingView
					onComplete={handleProcessingComplete}
					fileName={fileName}
					rowCount={rowCount}
				/>
			</div>
		);
	}

	// ── Prepare stage ──
	return (
		<div className="min-h-screen py-10 px-6">
			<div className="max-w-3xl mx-auto">
				{/* Header */}
				<div className="mb-8 animate-fade-in-up">
					<h1 className="text-xl font-semibold text-surface-900 mb-1 flex items-center gap-3">
						<div className="p-2 rounded-lg bg-gold-50">
							<BarChart3 size={20} className="text-gold-600" />
						</div>
						Analyse & Predict
					</h1>
					<p className="text-sm text-surface-500 ml-12">
						Run AI-powered analysis on your business data to get forecasts,
						insights, and growth strategies.
					</p>
				</div>

				{/* Data Source Selection */}
				<div
					className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-fade-in-up"
					style={{ animationDelay: "60ms" }}
				>
					{/* Daily Logs Source */}
					<button
						onClick={() => {
							setDataSource("logs");
							setCsvFile(null);
							setError(null);
						}}
						className={`group text-left p-5 rounded-xl border-2 transition-all ${
							dataSource === "logs"
								? "border-gold-500 bg-gold-50/50 shadow-sm"
								: "border-surface-300 bg-white hover:border-surface-400"
						}`}
					>
						<div className="flex items-center gap-3 mb-3">
							<div
								className={`p-2 rounded-lg ${dataSource === "logs" ? "bg-gold-100" : "bg-surface-100"}`}
							>
								<Database
									size={18}
									className={
										dataSource === "logs" ? "text-gold-600" : "text-surface-500"
									}
								/>
							</div>
							<div>
								<h3 className="text-sm font-medium text-surface-900">
									Daily Logs
								</h3>
								<p className="text-[11px] text-surface-400">
									Use your recorded entries
								</p>
							</div>
						</div>
						{loadingLogs ? (
							<div className="flex items-center gap-2 text-xs text-surface-400">
								<Loader2 size={12} className="animate-spin" />
								Loading entries…
							</div>
						) : (
							<div className="flex items-center gap-4 text-xs">
								<span
									className={`font-medium ${logs.length >= 3 ? "text-green-600" : "text-amber-500"}`}
								>
									{logs.length} entries
								</span>
								{logs.length > 0 && (
									<span className="text-surface-400">
										{logs[0]?.date} → {logs[logs.length - 1]?.date}
									</span>
								)}
							</div>
						)}
						{dataSource === "logs" && (
							<div className="flex items-center gap-1 mt-3 text-[11px] text-gold-600 font-medium">
								<CheckCircle2 size={12} /> Selected
							</div>
						)}
					</button>

					{/* CSV Upload Source */}
					<div
						onClick={() => {
							setDataSource("csv");
							setError(null);
						}}
						className={`group text-left p-5 rounded-xl border-2 transition-all cursor-pointer ${
							dataSource === "csv"
								? "border-gold-500 bg-gold-50/50 shadow-sm"
								: "border-surface-300 bg-white hover:border-surface-400"
						}`}
					>
						<div className="flex items-center gap-3 mb-3">
							<div
								className={`p-2 rounded-lg ${dataSource === "csv" ? "bg-gold-100" : "bg-surface-100"}`}
							>
								<Upload
									size={18}
									className={
										dataSource === "csv" ? "text-gold-600" : "text-surface-500"
									}
								/>
							</div>
							<div>
								<h3 className="text-sm font-medium text-surface-900">
									Upload CSV / Excel
								</h3>
								<p className="text-[11px] text-surface-400">
									Import historical data file
								</p>
							</div>
						</div>

						{csvFile ? (
							<div className="flex items-center gap-2 text-xs">
								<FileSpreadsheet size={12} className="text-gold-600" />
								<span className="text-surface-700 font-medium truncate">
									{csvFile.name}
								</span>
								<span className="text-surface-400">
									({(csvFile.size / 1024).toFixed(0)} KB)
								</span>
							</div>
						) : (
							<label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-100 border border-surface-300 text-surface-500 text-xs font-medium cursor-pointer hover:border-gold-200 transition-all w-fit">
								<FileSpreadsheet size={13} />
								Choose file…
								<input
									type="file"
									accept=".csv,.xlsx,.xls"
									onChange={handleCsvSelect}
									className="hidden"
									onClick={(e) => e.stopPropagation()}
								/>
							</label>
						)}

						{dataSource === "csv" && csvFile && (
							<div className="flex items-center gap-1 mt-3 text-[11px] text-gold-600 font-medium">
								<CheckCircle2 size={12} /> Selected
							</div>
						)}
					</div>
				</div>

				{/* Daily Logs Preview (when logs selected) */}
				{dataSource === "logs" && logs.length > 0 && (
					<div
						className="card overflow-hidden mb-6 animate-fade-in-up"
						style={{ animationDelay: "120ms" }}
					>
						<div className="px-5 py-3 border-b border-surface-300 flex items-center justify-between">
							<h3 className="text-xs font-medium text-surface-500">
								Data Preview
							</h3>
							<span className="text-[10px] text-surface-400">
								Showing latest {Math.min(logs.length, 10)} of {logs.length}{" "}
								entries
							</span>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-surface-300">
										<th className="text-left px-4 py-2.5 text-[11px] font-medium text-surface-400">
											Date
										</th>
										<th className="text-right px-4 py-2.5 text-[11px] font-medium text-surface-400">
											Revenue
										</th>
										<th className="text-right px-4 py-2.5 text-[11px] font-medium text-surface-400 hidden sm:table-cell">
											Customers
										</th>
										<th className="text-right px-4 py-2.5 text-[11px] font-medium text-surface-400 hidden md:table-cell">
											Orders
										</th>
										<th className="text-right px-4 py-2.5 text-[11px] font-medium text-surface-400 hidden lg:table-cell">
											Expenses
										</th>
									</tr>
								</thead>
								<tbody>
									{logs
										.slice(-10)
										.reverse()
										.map((log) => (
											<tr
												key={log.id}
												className="border-b border-surface-200 last:border-b-0"
											>
												<td className="px-4 py-2 text-surface-700 text-xs whitespace-nowrap">
													{log.date}
												</td>
												<td className="text-right px-4 py-2 text-gold-600 text-xs font-medium">
													{log.revenue != null
														? `$${Number(log.revenue).toLocaleString()}`
														: "—"}
												</td>
												<td className="text-right px-4 py-2 text-surface-500 text-xs hidden sm:table-cell">
													{log.customers ?? "—"}
												</td>
												<td className="text-right px-4 py-2 text-surface-500 text-xs hidden md:table-cell">
													{log.orders ?? "—"}
												</td>
												<td className="text-right px-4 py-2 text-surface-500 text-xs hidden lg:table-cell">
													{log.expenses != null
														? `$${Number(log.expenses).toLocaleString()}`
														: "—"}
												</td>
											</tr>
										))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* Error */}
				{error && (
					<div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm mb-6 animate-fade-in-up">
						<AlertCircle size={14} className="shrink-0" />
						{error}
					</div>
				)}

				{/* Analyse Button */}
				<div className="animate-fade-in-up" style={{ animationDelay: "180ms" }}>
					<button
						onClick={handleStartAnalysis}
						disabled={
							(dataSource === "logs" && (loadingLogs || logs.length < 3)) ||
							(dataSource === "csv" && !csvFile)
						}
						className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
					>
						<Sparkles size={16} />
						Start Analysis & Prediction
						<ArrowRight size={15} />
					</button>

					{dataSource === "logs" && !loadingLogs && logs.length < 3 && (
						<p className="text-xs text-amber-500 mt-2.5 flex items-center gap-1.5">
							<AlertCircle size={12} />
							Need at least 3 daily log entries.{" "}
							<button
								onClick={() => navigate("/daily-log")}
								className="text-gold-600 font-medium hover:underline"
							>
								Add logs →
							</button>
						</p>
					)}
				</div>

				{/* What happens */}
				<div
					className="mt-12 animate-fade-in-up"
					style={{ animationDelay: "240ms" }}
				>
					<h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-4">
						What you'll get
					</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
						{[
							{
								icon: TrendingUp,
								label: "Forecasts",
								desc: "Revenue & demand predictions",
							},
							{
								icon: BarChart3,
								label: "KPIs",
								desc: "Key performance metrics",
							},
							{
								icon: AlertCircle,
								label: "Anomalies",
								desc: "Unusual patterns detected",
							},
							{
								icon: Sparkles,
								label: "Insights",
								desc: "AI-powered recommendations",
							},
						].map((f) => (
							<div key={f.label} className="card p-3.5 text-center">
								<f.icon
									size={16}
									className="text-surface-400 mx-auto mb-2"
									strokeWidth={1.5}
								/>
								<p className="text-xs font-medium text-surface-700">
									{f.label}
								</p>
								<p className="text-[10px] text-surface-400 mt-0.5">{f.desc}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
