import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { uploadDailyLogs, uploadFile } from "../services/api";
import {
	collection,
	getDocs,
	query,
	orderBy,
	addDoc,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAnalysisJob } from "../contexts/AnalysisJobContext";
import { formatCurrency } from "../utils/currency";
import {
	BarChart3,
	Loader2,
	AlertCircle,
	CheckCircle2,
	FileSpreadsheet,
	Upload,
	TrendingUp,
	ArrowRight,
	Database,
	Sparkles,
} from "lucide-react";

function toFirestoreErrorMessage(err, fallback) {
	if (err?.code === "permission-denied") {
		return "Firestore permission denied. Update your Firestore rules and ensure you are logged in.";
	}
	if (err?.code === "unauthenticated") {
		return "You are not authenticated. Please sign in again.";
	}
	return err?.message || fallback;
}

export default function AnalysePage() {
	const { user, userProfile, getIdToken } = useAuth();
	const navigate = useNavigate();
	const role = userProfile?.role || "paid-user";
	const currencyCode = userProfile?.currency || "INR";
	const {
		startAnalysisJob,
		isRunning,
		startActivity,
		updateActivityProgress,
		completeActivity,
	} = useAnalysisJob();

	const [logs, setLogs] = useState([]);
	const [loadingLogs, setLoadingLogs] = useState(true);
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
		} catch (err) {
			setError(
				toFirestoreErrorMessage(
					err,
					"Could not load daily logs from Firestore.",
				),
			);
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
			let uploadActivityId = null;
			try {
				uploadActivityId = startActivity({
					type: "upload",
					label: "Upload",
					message: "Uploading file and validating schema",
					fileName: csvFile.name,
					durationMs: 35000,
					progressCap: 90,
				});
				const token = await getIdToken();
				const result = await uploadFile(csvFile, token, user?.uid, role);
				updateActivityProgress(
					uploadActivityId,
					100,
					"Upload complete. Starting prediction pipeline",
				);
				completeActivity(uploadActivityId, {
					status: "success",
					message: "Upload complete. Prediction started in background",
					forceProgress: 100,
				});
				setFileName(result.filename);
				setRowCount(result.row_count);

				await startAnalysisJob({
					getToken: getIdToken,
					uid: user?.uid,
					role,
					fileName: result.filename,
					rowCount: result.row_count,
					onSuccess: async (analysisResult) => {
						if (!user) return;
						try {
							const reportData = {
								filename:
									analysisResult.filename || result.filename || "Unknown",
								rowCount: analysisResult.row_count || result.row_count || 0,
								ai_provider: analysisResult.ai_provider || "unknown",
								narrative: (analysisResult.narrative || "").slice(0, 800),
								kpiCount: analysisResult.kpis?.length || 0,
								insightCount: analysisResult.insights?.length || 0,
								createdAt: serverTimestamp(),
								date: new Date().toISOString(),
								analysisData: JSON.stringify(analysisResult),
							};
							await addDoc(
								collection(db, "users", user.uid, "reports"),
								reportData,
							);
						} catch (err) {
							console.error("Failed to save report to Firestore:", err);
							setError(
								toFirestoreErrorMessage(
									err,
									"Analysis completed, but report could not be saved to Firestore.",
								),
							);
						}
					},
				});

				navigate("/dashboard");
			} catch (err) {
				if (uploadActivityId) {
					completeActivity(uploadActivityId, {
						status: "error",
						message: "Upload failed",
						error:
							err.response?.data?.detail ||
							err.message ||
							"Upload failed. Is the backend running?",
						forceProgress: 100,
					});
				}
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

			let uploadActivityId = null;
			try {
				uploadActivityId = startActivity({
					type: "upload",
					label: "Upload",
					message: "Syncing daily logs for prediction",
					fileName: "Daily logs",
					rowCount: logs.length,
					durationMs: 25000,
					progressCap: 90,
				});
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
				updateActivityProgress(
					uploadActivityId,
					100,
					"Daily logs synced. Starting prediction pipeline",
				);
				completeActivity(uploadActivityId, {
					status: "success",
					message: "Logs uploaded. Prediction started in background",
					forceProgress: 100,
				});
				setFileName(result.filename);
				setRowCount(result.row_count);

				await startAnalysisJob({
					getToken: getIdToken,
					uid: user?.uid,
					role,
					fileName: result.filename,
					rowCount: result.row_count,
					onSuccess: async (analysisResult) => {
						if (!user) return;
						try {
							const reportData = {
								filename:
									analysisResult.filename || result.filename || "Unknown",
								rowCount: analysisResult.row_count || result.row_count || 0,
								ai_provider: analysisResult.ai_provider || "unknown",
								narrative: (analysisResult.narrative || "").slice(0, 800),
								kpiCount: analysisResult.kpis?.length || 0,
								insightCount: analysisResult.insights?.length || 0,
								createdAt: serverTimestamp(),
								date: new Date().toISOString(),
								analysisData: JSON.stringify(analysisResult),
							};
							await addDoc(
								collection(db, "users", user.uid, "reports"),
								reportData,
							);
						} catch (err) {
							console.error("Failed to save report to Firestore:", err);
							setError(
								toFirestoreErrorMessage(
									err,
									"Analysis completed, but report could not be saved to Firestore.",
								),
							);
						}
					},
				});

				navigate("/dashboard");
			} catch (err) {
				if (uploadActivityId) {
					completeActivity(uploadActivityId, {
						status: "error",
						message: "Upload failed",
						error:
							err.response?.data?.detail ||
							err.message ||
							"Failed to send logs. Is the backend running?",
						forceProgress: 100,
					});
				}
				setError(
					err.response?.data?.detail ||
						"Failed to send logs. Is the backend running?",
				);
			}
		}
	};

	// ── Prepare stage ──
	return (
		<div className="app-page">
			<div className="app-page-inner max-w-6xl mx-auto">
				<div className="space-y-6">
					{/* Header */}
					<div className="max-w-2xl animate-fade-in-up">
						<div className="inline-flex items-center justify-center p-2.5 mb-4 bg-white shadow-sm shadow-indigo-100 rounded-xl border border-slate-100">
							<BarChart3 className="w-6 h-6 text-indigo-600" />
						</div>
						<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight mb-2">
							Analyze & Predict
						</h1>
						<p className="text-sm text-slate-500 leading-relaxed">
							Harness the power of AI to analyze your business data. Uncover
							hidden growth strategies, predict demand, and forecast your
							revenue.
						</p>
					</div>

					<div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
						<div className="xl:col-span-8 space-y-5">
							{/* Data Source Selection - 12 Column Grid Structure */}
							<div
								className="grid grid-cols-1 md:grid-cols-12 gap-4 animate-fade-in-up"
								style={{ animationDelay: "60ms" }}
							>
								{/* Daily Logs Source */}
								<button
									onClick={() => {
										setDataSource("logs");
										setCsvFile(null);
										setError(null);
									}}
									className={`col-span-1 md:col-span-6 relative text-left p-4 sm:p-5 rounded-2xl transition-all duration-300 ease-out flex flex-col justify-between h-full
									${
										dataSource === "logs"
											? "bg-white shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-600"
											: "bg-white hover:bg-white border border-slate-200 hover:shadow-md hover:border-slate-300"
									}`}
								>
									<div>
										<div className="flex items-center justify-between mb-3">
											<div
												className={`p-3 rounded-xl inline-flex ${dataSource === "logs" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500"}`}
											>
												<Database size={20} strokeWidth={1.5} />
											</div>
											{dataSource === "logs" && (
												<span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
													<CheckCircle2 size={14} /> Selected
												</span>
											)}
										</div>
										<h3 className="text-base font-semibold text-slate-900 mb-1">
											Daily Logs
										</h3>
										<p className="text-xs sm:text-sm text-slate-500 mb-4">
											Analyze your recorded manual entries
										</p>
									</div>

									<div className="mt-auto">
										{loadingLogs ? (
											<div className="flex items-center gap-2 text-sm text-slate-400">
												<Loader2 size={16} className="animate-spin" />
												Loading entries…
											</div>
										) : (
											<div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
												<span
													className={`px-2.5 py-1 rounded-md font-semibold ${logs.length >= 3 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
												>
													{logs.length} entries
												</span>
												{logs.length > 0 && (
													<span className="text-slate-400 font-medium">
														{logs[0]?.date} &rarr; {logs[logs.length - 1]?.date}
													</span>
												)}
											</div>
										)}
									</div>
								</button>

								{/* CSV Upload Source */}
								<div
									onClick={() => {
										setDataSource("csv");
										setError(null);
									}}
									className={`col-span-1 md:col-span-6 relative text-left p-4 sm:p-5 rounded-2xl transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between h-full
									${
										dataSource === "csv"
											? "bg-white shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-600"
											: "bg-white hover:bg-white border border-slate-200 hover:shadow-md hover:border-slate-300"
									}`}
								>
									<div>
										<div className="flex items-center justify-between mb-3">
											<div
												className={`p-3 rounded-xl inline-flex ${dataSource === "csv" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500"}`}
											>
												<Upload size={20} strokeWidth={1.5} />
											</div>
											{dataSource === "csv" && csvFile && (
												<span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
													<CheckCircle2 size={14} /> Selected
												</span>
											)}
										</div>
										<h3 className="text-base font-semibold text-slate-900 mb-1">
											Upload Data File
										</h3>
										<p className="text-xs sm:text-sm text-slate-500 mb-4">
											Import historical data via CSV or Excel
										</p>
									</div>

									<div className="mt-auto">
										{csvFile ? (
											<div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
												<FileSpreadsheet
													size={18}
													className="text-indigo-600 shrink-0"
												/>
												<div className="min-w-0 flex-1">
													<p className="text-xs sm:text-sm font-medium text-slate-700 truncate">
														{csvFile.name}
													</p>
													<p className="text-xs text-slate-400">
														{(csvFile.size / 1024).toFixed(0)} KB
													</p>
												</div>
											</div>
										) : (
											<label
												className={`flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer
											${dataSource === "csv" ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
											>
												<FileSpreadsheet size={16} />
												Browse Files
												<input
													type="file"
													accept=".csv,.xlsx,.xls"
													onChange={handleCsvSelect}
													className="hidden"
													onClick={(e) => e.stopPropagation()}
												/>
											</label>
										)}
									</div>
								</div>
							</div>

							{/* Daily Logs Preview (when logs selected) */}
							{dataSource === "logs" && logs.length > 0 && (
								<div
									className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up"
									style={{ animationDelay: "120ms" }}
								>
									<div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
										<h3 className="text-sm font-semibold text-slate-700">
											Data Preview
										</h3>
										<span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
											Showing latest {Math.min(logs.length, 10)} of{" "}
											{logs.length}
										</span>
									</div>
									<div className="overflow-x-auto">
										<table className="w-full text-sm text-left">
											<thead>
												<tr className="bg-white border-b border-slate-100 text-slate-400">
													<th className="px-4 py-3 font-medium whitespace-nowrap">
														Date
													</th>
													<th className="px-4 py-3 font-medium text-right">
														Revenue
													</th>
													<th className="px-4 py-3 font-medium text-right hidden sm:table-cell">
														Customers
													</th>
													<th className="px-4 py-3 font-medium text-right hidden md:table-cell">
														Orders
													</th>
													<th className="px-4 py-3 font-medium text-right hidden lg:table-cell">
														Expenses
													</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-slate-50">
												{logs
													.slice(-10)
													.reverse()
													.map((log) => (
														<tr
															key={log.id}
															className="hover:bg-slate-50/50 transition-colors"
														>
															<td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap text-xs sm:text-sm">
																{log.date}
															</td>
															<td className="px-4 py-3 text-right font-semibold text-slate-900 text-xs sm:text-sm">
																{log.revenue != null
																	? formatCurrency(log.revenue, currencyCode)
																	: "—"}
															</td>
															<td className="px-4 py-3 text-right text-slate-500 hidden sm:table-cell text-xs sm:text-sm">
																{log.customers ?? "—"}
															</td>
															<td className="px-4 py-3 text-right text-slate-500 hidden md:table-cell text-xs sm:text-sm">
																{log.orders ?? "—"}
															</td>
															<td className="px-4 py-3 text-right text-slate-500 hidden lg:table-cell text-xs sm:text-sm">
																{log.expenses != null
																	? formatCurrency(log.expenses, currencyCode)
																	: "—"}
															</td>
														</tr>
													))}
											</tbody>
										</table>
									</div>
								</div>
							)}

							{/* Error State */}
							{error && (
								<div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-fade-in-up">
									<AlertCircle size={18} className="shrink-0 mt-0.5" />
									<p className="leading-relaxed font-medium">{error}</p>
								</div>
							)}
						</div>

						<div
							className="xl:col-span-4 space-y-4 animate-fade-in-up"
							style={{ animationDelay: "180ms" }}
						>
							<div className="card p-4 sm:p-5">
								<h3 className="text-sm font-semibold text-slate-800 mb-2">
									Run Analysis
								</h3>
								<p className="text-xs text-slate-500 mb-4">
									Start the model and continue using other pages while it
									processes.
								</p>
								<button
									onClick={handleStartAnalysis}
									disabled={
										isRunning ||
										(dataSource === "logs" &&
											(loadingLogs || logs.length < 3)) ||
										(dataSource === "csv" && !csvFile)
									}
									className="group relative flex items-center justify-center gap-2.5 w-full px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm shadow-md shadow-slate-900/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
								>
									{isRunning ? (
										<Loader2
											size={18}
											className="animate-spin text-indigo-300"
										/>
									) : (
										<Sparkles size={18} className="text-indigo-300" />
									)}
									{isRunning ? "Analysis Running..." : "Start Analysis"}
									{!isRunning && (
										<ArrowRight
											size={16}
											className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
										/>
									)}
								</button>

								{!isRunning && (fileName || rowCount) && (
									<p className="text-xs text-indigo-600 mt-4 font-medium flex items-center gap-2">
										<span className="relative flex h-2.5 w-2.5">
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
											<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
										</span>
										Analysis is running in the background.
									</p>
								)}

								{dataSource === "logs" && !loadingLogs && logs.length < 3 && (
									<div className="mt-4 flex items-center gap-2 text-xs text-amber-600 font-medium bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
										<AlertCircle size={16} />
										<span>Minimum 3 entries required.</span>
										<button
											onClick={() => navigate("/daily-log")}
											className="text-slate-900 underline decoration-slate-300 hover:decoration-slate-900 underline-offset-4 ml-1"
										>
											Add logs
										</button>
									</div>
								)}
							</div>

							<div
								className="card p-4 sm:p-5"
								style={{ animationDelay: "240ms" }}
							>
								<h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
									Analysis Deliverables
								</h3>
								<div className="grid grid-cols-2 xl:grid-cols-1 gap-3">
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
									].map((feature, idx) => (
										<div
											key={idx}
											className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100"
										>
											<div className="p-2 bg-slate-50 text-indigo-600 rounded-lg">
												<feature.icon size={16} strokeWidth={1.5} />
											</div>
											<div>
												<h4 className="text-xs font-bold text-slate-900 mb-0.5">
													{feature.label}
												</h4>
												<p className="text-[11px] text-slate-500 leading-relaxed">
													{feature.desc}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
