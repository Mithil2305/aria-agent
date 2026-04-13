import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
	Crown,
	Sparkles,
	Clock,
	CheckCircle2,
	AlertCircle,
	TrendingUp,
	Loader2,
	ChevronRight,
	Lock,
	CalendarCheck,
	Zap,
	BarChart3,
	Target,
	ShieldAlert,
	Gauge,
	ListChecks,
	Lightbulb,
} from "lucide-react";
import { getPremiumAnalysis, getPremiumAnalysisStatus } from "../services/api";
import {
	collection,
	query,
	orderBy,
	limit,
	getDocs,
	addDoc,
	doc,
	getDoc,
	setDoc,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { formatCurrency } from "../utils/currency";
import { useAnalysisJob } from "../contexts/AnalysisJobContext";
import { getLimitsDashboard } from "../services/usageLimits";

/* ── Loading animation steps ─────────────────────── */
const PROGRESS_STEPS = [
	{ label: "Collecting business data…", icon: BarChart3, duration: 2500 },
	{ label: "Running deep analysis model…", icon: Sparkles, duration: 4000 },
	{ label: "Generating premium insights…", icon: TrendingUp, duration: 3000 },
	{ label: "Preparing your report…", icon: CheckCircle2, duration: 2000 },
];

const PREMIUM_JOB_KEY = "yukti_premium_job";
const MAX_PREMIUM_HISTORY = 20;
const PREMIUM_RELOAD_MAX_WAIT_MS = 45 * 1000;

export default function PremiumAnalysisPage() {
	const { user, userProfile } = useAuth();
	const { startActivity, completeActivity } = useAnalysisJob();
	const currencyCode = userProfile?.currency || "INR";
	const role = userProfile?.role || "paid-user";
	const mountedRef = useRef(true);
	const premiumActivityRef = useRef(null);

	const [status, setStatus] = useState(null); // { month, used, available }
	const [premiumQuota, setPremiumQuota] = useState(null);
	const [loading, setLoading] = useState(false);
	const [checking, setChecking] = useState(true);
	const [result, setResult] = useState(null);
	const [error, setError] = useState(null);
	const [progressIdx, setProgressIdx] = useState(0);
	const [history, setHistory] = useState([]);
	const [historyLoading, setHistoryLoading] = useState(false);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		if (!user) return;
		let cancelled = false;

		async function loadHistory() {
			setHistoryLoading(true);
			try {
				const q = query(
					collection(db, "users", user.uid, "premiumReports"),
					orderBy("createdAt", "desc"),
					limit(MAX_PREMIUM_HISTORY),
				);
				const snap = await getDocs(q);
				if (!cancelled) {
					setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
				}
			} catch {
				if (!cancelled) setHistory([]);
			} finally {
				if (!cancelled) setHistoryLoading(false);
			}
		}

		loadHistory();
		return () => {
			cancelled = true;
		};
	}, [user]);

	/* ── Check monthly status on mount ──────────── */
	useEffect(() => {
		async function init() {
			setChecking(true);
			try {
				const token = user ? await user.getIdToken() : null;
				const [s, limits] = await Promise.all([
					getPremiumAnalysisStatus(token),
					user ? getLimitsDashboard(user.uid, role) : Promise.resolve(null),
				]);
				setStatus(s);
				setPremiumQuota(limits?.usage?.ai_premium || null);

				if (s.used && s.generated_at) {
					try {
						const paRef = doc(
							db,
							"users",
							user.uid,
							"premiumAnalyses",
							s.month,
						);
						const snap = await getDoc(paRef);
						if (snap.exists()) {
							setResult({ cached: true, ...snap.data() });
						}
					} catch {
						// Firestore read failed
					}
				}
			} catch (e) {
				console.error("Premium status check failed:", e);
			} finally {
				setChecking(false);
			}
		}
		init();
	}, [user, role]);

	useEffect(() => {
		try {
			const raw = sessionStorage.getItem(PREMIUM_JOB_KEY);
			if (!raw) return;
			const job = JSON.parse(raw);
			if (
				job?.status === "running" &&
				Date.now() - Number(job?.startedAt || 0) < PREMIUM_RELOAD_MAX_WAIT_MS
			) {
				setLoading(true);
			} else if (job?.status === "running") {
				sessionStorage.removeItem(PREMIUM_JOB_KEY);
			}
		} catch {
			// Ignore malformed payload
		}
	}, []);

	useEffect(() => {
		if (!loading) return;
		const timer = setTimeout(() => {
			setLoading(false);
			sessionStorage.removeItem(PREMIUM_JOB_KEY);
		}, PREMIUM_RELOAD_MAX_WAIT_MS);
		return () => clearTimeout(timer);
	}, [loading]);

	/* ── Progress animation during loading ─────── */
	useEffect(() => {
		if (!loading) {
			setProgressIdx(0);
			return;
		}
		setProgressIdx(0);
		const timers = PROGRESS_STEPS.map((step, i) => {
			const delay = PROGRESS_STEPS.slice(0, i).reduce(
				(acc, s) => acc + s.duration,
				0,
			);
			return setTimeout(() => setProgressIdx(i), delay);
		});
		return () => timers.forEach(clearTimeout);
	}, [loading]);

	/* ── Generate premium analysis ──────────────── */
	async function handleGenerate() {
		setLoading(true);
		setError(null);
		const premiumActivityId = startActivity({
			type: "prediction",
			label: "Premium Prediction",
			message: "Running premium forecasting pipeline",
			fileName: "Premium monthly analysis",
			durationMs: 90000,
			progressCap: 95,
		});
		premiumActivityRef.current = premiumActivityId;
		sessionStorage.setItem(
			PREMIUM_JOB_KEY,
			JSON.stringify({
				status: "running",
				startedAt: Date.now(),
				month: status?.month || null,
			}),
		);
		try {
			const token = user ? await user.getIdToken() : null;

			// Fetch user's daily logs from Firestore
			const logsRef = collection(db, "users", user.uid, "dailyLogs");
			const logsSnap = await getDocs(
				query(logsRef, orderBy("date", "desc"), limit(30)),
			);
			const dailyLogs = logsSnap.docs.map((d) => ({
				id: d.id,
				...d.data(),
			}));

			// Fetch stock entries
			let stockEntries = [];
			try {
				const stockRef = collection(db, "users", user.uid, "stockEntries");
				const stockSnap = await getDocs(
					query(stockRef, orderBy("month", "desc"), limit(20)),
				);
				stockEntries = stockSnap.docs.map((d) => ({
					id: d.id,
					...d.data(),
				}));
			} catch {
				// Stock collection might not exist
			}

			if (dailyLogs.length < 3) {
				completeActivity(premiumActivityId, {
					status: "error",
					message: "Premium prediction failed",
					error:
						"You need at least 3 daily log entries for a premium analysis. Keep logging!",
					forceProgress: 100,
				});
				setError(
					"You need at least 3 daily log entries for a premium analysis. Keep logging!",
				);
				setLoading(false);
				return;
			}

			const data = await getPremiumAnalysis(
				dailyLogs,
				stockEntries,
				userProfile?.businessType,
				userProfile?.businessCategory,
				token,
				user?.uid,
				role,
			);

			const nowIso = new Date().toISOString();
			const monthKey =
				status?.month || new Date().toISOString().slice(0, 7).replace("-", "_");

			const reportPayload = {
				date: nowIso,
				createdAt: serverTimestamp(),
				month: monthKey,
				generated_by: data.generated_by || "yukti_model",
				provider_label: data.provider_label || "Yukti Custom Model",
				generation_time: data.generation_time || null,
				analysisPreview: (data.analysis || "").slice(0, 260),
				resultData: JSON.stringify(data),
			};

			const reportRef = await addDoc(
				collection(db, "users", user.uid, "premiumReports"),
				reportPayload,
			);

			await setDoc(
				doc(db, "users", user.uid, "premiumAnalyses", monthKey),
				{
					...data,
					generated_at: data.generated_at || nowIso,
					month: monthKey,
					updatedAt: serverTimestamp(),
				},
				{ merge: true },
			);

			if (mountedRef.current) {
				setResult(data);
				setStatus((prev) => ({ ...prev, used: true, available: false }));
				try {
					const limits = await getLimitsDashboard(user.uid, role);
					if (mountedRef.current) {
						setPremiumQuota(limits?.usage?.ai_premium || null);
					}
				} catch {
					// Ignore limits refresh errors and keep current quota state.
				}
				setHistory((prev) =>
					[{ id: reportRef.id, ...reportPayload }, ...prev].slice(
						0,
						MAX_PREMIUM_HISTORY,
					),
				);
			}

			completeActivity(premiumActivityId, {
				status: "success",
				message: "Premium prediction completed",
				forceProgress: 100,
			});

			sessionStorage.setItem(
				PREMIUM_JOB_KEY,
				JSON.stringify({
					status: "success",
					completedAt: Date.now(),
					reportId: reportRef.id,
					month: monthKey,
				}),
			);
		} catch (e) {
			console.error("Premium analysis failed:", e);
			const isTimeout =
				e?.code === "ECONNABORTED" ||
				String(e?.message || "")
					.toLowerCase()
					.includes("timeout");
			const isNetworkDrop =
				String(e?.message || "")
					.toLowerCase()
					.includes("network error") ||
				String(e?.message || "")
					.toLowerCase()
					.includes("empty_response");
			setError(
				e.response?.data?.detail ||
					(isTimeout
						? "Premium analysis is taking longer than expected. Please keep the backend running and try once more in a minute."
						: isNetworkDrop
							? "Could not reach backend server (connection dropped). Please confirm backend is running on port 8000 and retry."
							: "Failed to generate analysis. Please try again."),
			);
			completeActivity(premiumActivityId, {
				status: "error",
				message: "Premium prediction failed",
				error:
					e?.response?.data?.detail ||
					e?.message ||
					"Failed to generate analysis. Please try again.",
				forceProgress: 100,
			});
			sessionStorage.setItem(
				PREMIUM_JOB_KEY,
				JSON.stringify({
					status: "error",
					completedAt: Date.now(),
					error:
						e?.response?.data?.detail ||
						e?.message ||
						"Premium analysis failed",
				}),
			);
		} finally {
			if (mountedRef.current) {
				setLoading(false);
			}
			premiumActivityRef.current = null;
		}
	}

	/* ── Render helpers ─────────────────────────── */
	const currentMonth = new Date().toLocaleString("default", {
		month: "long",
		year: "numeric",
	});
	const isQuotaKnown = premiumQuota != null;
	const hasRemainingPremium = isQuotaKnown
		? !Number.isFinite(premiumQuota.limit) || premiumQuota.remaining > 0
		: !status?.used;
	const isPremiumLimitReached = !hasRemainingPremium;

	const loadHistoryItem = (item) => {
		if (!item?.resultData) return;
		try {
			const parsed = JSON.parse(item.resultData);
			setResult({ ...parsed, cached: true });
			setError(null);
		} catch {
			setError("Could not load this saved premium report.");
		}
	};

	if (checking) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Loader2 size={24} className="animate-spin text-surface-400" />
			</div>
		);
	}

	return (
		<div className="app-page">
			<div className="app-page-inner max-w-4xl mx-auto space-y-6">
				{/* ── Header ──────────────────────────────── */}
				<div className="flex items-start justify-between">
					<div>
						<div className="flex items-center gap-2">
							<div
								className="w-9 h-9 rounded-lg flex items-center justify-center"
								style={{
									background:
										"linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
								}}
							>
								<Crown size={18} className="text-white" />
							</div>
							<div>
								<h1 className="text-lg font-semibold text-surface-900">
									Premium Analysis
								</h1>
								<p className="text-xs text-surface-500">
									Deep AI-powered month-end business report
								</p>
							</div>
						</div>
					</div>

					<div className="flex flex-col items-end gap-2">
						{/* Monthly status badge */}
						<div
							className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
								isPremiumLimitReached
									? "bg-emerald-50 text-emerald-700 border border-emerald-200"
									: "bg-amber-50 text-amber-700 border border-amber-200"
							}`}
						>
							{isPremiumLimitReached ? (
								<>
									<CheckCircle2 size={12} />
									Used for this month
								</>
							) : (
								<>
									<Zap size={12} />
									{isQuotaKnown && Number.isFinite(premiumQuota.limit)
										? `${premiumQuota.remaining} analysis${premiumQuota.remaining === 1 ? "" : "es"} available`
										: "New analysis available"}
								</>
							)}
						</div>

						<button
							onClick={handleGenerate}
							disabled={loading || isPremiumLimitReached}
							className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							style={{
								background: "linear-gradient(90deg, #f59e0b 0%, #ea580c 100%)",
							}}
						>
							{loading ? (
								<Loader2 size={14} className="animate-spin" />
							) : (
								<Sparkles size={14} />
							)}
							{isPremiumLimitReached
								? "Used This Month"
								: "New Premium Analysis"}
						</button>
					</div>
				</div>

				{/* ── Explainer Card ──────────────────────── */}
				{!result && !loading && (
					<div className="bg-white rounded-xl border border-amber-200/70 p-6">
						<div className="flex items-start gap-4">
							<div
								className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
								style={{
									background:
										"linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
								}}
							>
								<Sparkles size={22} className="text-white" />
							</div>
							<div className="space-y-3">
								<div>
									<h2 className="text-sm font-semibold text-surface-900">
										Your Monthly Deep Dive
									</h2>
									<p className="text-xs text-surface-500 mt-1 leading-relaxed">
										Once per month, unlock a comprehensive AI-generated analysis
										of your business performance. This premium report includes
										revenue trends, profitability insights, customer
										intelligence, risk assessment, and a detailed action plan —
										all powered by Yukti&apos;s custom-trained model.
									</p>
								</div>

								<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
									{[
										{
											icon: TrendingUp,
											label: "Revenue Analysis",
										},
										{ icon: BarChart3, label: "Profitability" },
										{
											icon: Sparkles,
											label: "Customer Intel",
										},
										{
											icon: CalendarCheck,
											label: "Action Plan",
										},
									].map((item) => (
										<div
											key={item.label}
											className="flex items-center gap-2 text-xs text-surface-600"
										>
											<item.icon size={14} className="text-amber-500" />
											{item.label}
										</div>
									))}
								</div>

								{isPremiumLimitReached ? (
									<div className="flex items-center gap-2 text-xs text-surface-400 bg-white rounded-lg px-3 py-2 border border-surface-200">
										<Lock size={12} />
										You&apos;ve used your {currentMonth} analysis. Next one
										available next month.
									</div>
								) : (
									<button
										onClick={handleGenerate}
										disabled={loading}
										className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all"
										style={{
											background:
												"linear-gradient(90deg, #f59e0b 0%, #ea580c 100%)",
										}}
									>
										<Crown size={15} />
										Generate Premium Report
										<ChevronRight size={14} />
									</button>
								)}
							</div>
						</div>
					</div>
				)}

				{/* ── Loading State ───────────────────────── */}
				{loading && (
					<div className="bg-white rounded-xl border border-surface-200 p-8">
						<div className="max-w-sm mx-auto space-y-6">
							<div className="text-center">
								<div
									className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
									style={{
										background:
											"linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
									}}
								>
									<Crown size={26} className="text-white animate-pulse" />
								</div>
								<h3 className="text-sm font-semibold text-surface-900">
									Generating Your Premium Report
								</h3>
								<p className="text-xs text-surface-400 mt-1">
									This may take 30–60 seconds
								</p>
								<p className="text-[11px] text-surface-500 mt-3">
									Track progress from the single background progress bar above.
								</p>
							</div>

							<div className="space-y-3">
								{PROGRESS_STEPS.map((step, idx) => {
									const isActive = idx === progressIdx;
									const isDone = idx < progressIdx;
									return (
										<div
											key={idx}
											className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-500 ${
												isActive
													? "bg-amber-50 border border-amber-200"
													: isDone
														? "bg-emerald-50/50"
														: "opacity-40"
											}`}
										>
											{isDone ? (
												<CheckCircle2 size={16} className="text-emerald-500" />
											) : isActive ? (
												<Loader2
													size={16}
													className="text-amber-600 animate-spin"
												/>
											) : (
												<step.icon size={16} className="text-surface-300" />
											)}
											<span
												className={`text-xs font-medium ${
													isActive
														? "text-amber-800"
														: isDone
															? "text-emerald-700"
															: "text-surface-400"
												}`}
											>
												{step.label}
											</span>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				)}

				{/* ── Error State ─────────────────────────── */}
				{error && (
					<div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
						<AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
						<div>
							<p className="text-sm font-medium text-red-800">
								Analysis Failed
							</p>
							<p className="text-xs text-red-600 mt-0.5">{error}</p>
						</div>
					</div>
				)}

				{/* ── Analysis Result ─────────────────────── */}
				{result && !loading && (
					<div className="space-y-4">
						{/* Meta bar */}
						<div className="flex items-center justify-between bg-white rounded-xl border border-surface-200 px-5 py-3">
							<div className="flex items-center gap-3">
								{result.cached && (
									<span className="inline-flex items-center gap-1 text-xs text-surface-400">
										<Clock size={11} />
										Cached result
									</span>
								)}
							</div>
							<div className="flex items-center gap-4 text-xs text-surface-400">
								{result.generation_time && (
									<span>Generated in {result.generation_time}s</span>
								)}
								{result.generated_at && (
									<span>
										{new Date(result.generated_at).toLocaleDateString("en-IN", {
											day: "numeric",
											month: "short",
											year: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</span>
								)}
							</div>
						</div>

						{/* Report content */}
						<div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
							<div className="px-6 py-4 border-b border-surface-100 bg-amber-50/60">
								<div className="flex items-center gap-2">
									<Crown size={16} className="text-amber-500" />
									<h2 className="text-sm font-semibold text-surface-900">
										Premium Month-End Report — {currentMonth}
									</h2>
								</div>
							</div>
							<div className="px-6 py-5">
								<PremiumStructuredReport analysis={result.analysis} />
							</div>
						</div>

						{/* Stats summary if available */}
						{result.stats && (
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
								{[
									{
										label: "Avg Revenue",
										value: formatCurrency(
											result.stats.avg_daily_revenue || 0,
											currencyCode,
											{ maximumFractionDigits: 0 },
										),
									},
									{
										label: "Avg Customers",
										value: Math.round(result.stats.avg_daily_customers || 0),
									},
									{
										label: "Best Day",
										value: formatCurrency(
											result.stats.max_revenue_day || 0,
											currencyCode,
											{ maximumFractionDigits: 0 },
										),
									},
									{
										label: "Data Points",
										value: result.stats.total_entries || 0,
									},
								].map((s) => (
									<div
										key={s.label}
										className="bg-surface-50 rounded-lg px-4 py-3 border border-surface-200"
									>
										<p className="text-[11px] text-surface-400 font-medium">
											{s.label}
										</p>
										<p className="text-base font-semibold text-surface-800 mt-0.5">
											{s.value}
										</p>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{(historyLoading || history.length > 0) && (
					<div className="bg-white rounded-xl border border-surface-200 p-4">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-semibold text-surface-900">
								Previous Premium Analyses
							</h3>
							{historyLoading && (
								<Loader2 size={14} className="animate-spin text-surface-400" />
							)}
						</div>
						<div className="space-y-2">
							{history.map((item) => (
								<button
									key={item.id}
									onClick={() => loadHistoryItem(item)}
									className="w-full text-left rounded-lg border border-surface-200 hover:border-amber-300 hover:bg-amber-50/40 transition-all px-3 py-2.5"
								>
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="text-xs font-semibold text-surface-800">
												{item.month || "Premium Analysis"}
											</p>
											<p className="text-[11px] text-surface-500 mt-0.5 line-clamp-1">
												{item.analysisPreview || "Premium report"}
											</p>
										</div>
										<div className="text-right shrink-0">
											<p className="text-[11px] text-surface-500">
												{new Date(item.date || Date.now()).toLocaleDateString(
													"en-IN",
													{
														day: "numeric",
														month: "short",
														year: "numeric",
													},
												)}
											</p>
											<p className="text-[10px] text-amber-600 font-medium">
												Load report
											</p>
										</div>
									</div>
								</button>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function PremiumStructuredReport({ analysis }) {
	const sections = splitPremiumSections(analysis || "");
	const [copiedMap, setCopiedMap] = useState({});
	const [copiedFull, setCopiedFull] = useState(false);
	const fullChecklist = buildFullExecutionChecklist(sections);

	if (!sections.length) {
		return (
			<div className="prose prose-sm prose-surface max-w-none text-surface-700 leading-relaxed premium-report">
				{renderMarkdown(analysis)}
			</div>
		);
	}

	return (
		<div className="space-y-4 premium-report">
			{fullChecklist ? (
				<div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 flex items-center gap-3">
					<ListChecks size={14} className="text-amber-600 shrink-0" />
					<div className="min-w-0 flex-1">
						<p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
							Execution Toolkit
						</p>
						<p className="text-xs text-amber-700/90">
							Copy a consolidated 30-day checklist from all actionable sections.
						</p>
					</div>
					<button
						onClick={async () => {
							const ok = await copyText(fullChecklist);
							if (!ok) return;
							setCopiedFull(true);
							setTimeout(() => setCopiedFull(false), 1800);
						}}
						className="text-[11px] px-3 py-1.5 rounded-lg font-medium border border-amber-300 bg-white text-amber-700 hover:bg-amber-50 transition-colors"
					>
						{copiedFull ? "Copied" : "Copy full 30-day plan"}
					</button>
				</div>
			) : null}

			{sections.map((section, idx) => {
				const cfg = getSectionConfig(section.title);
				const Icon = cfg.icon;
				const sectionKey = `${section.title}-${idx}`;
				const actionPayload = buildActionCopyPayload(
					section.title,
					section.content,
				);

				const onCopy = async () => {
					if (!actionPayload) return;
					const ok = await copyText(actionPayload);
					if (!ok) return;
					setCopiedMap((prev) => ({ ...prev, [sectionKey]: true }));
					setTimeout(() => {
						setCopiedMap((prev) => ({ ...prev, [sectionKey]: false }));
					}, 1800);
				};

				return (
					<div
						key={`${section.title}-${idx}`}
						className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}
					>
						<div className="px-4 py-3 border-b border-white/50 flex items-center gap-2">
							<Icon size={14} className={cfg.iconColor} />
							<h3 className="text-sm font-semibold text-surface-900">
								{section.title}
							</h3>
							{actionPayload ? (
								<button
									onClick={onCopy}
									className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium border border-surface-300 bg-white text-surface-600 hover:bg-surface-50 transition-colors"
								>
									{copiedMap[sectionKey] ? "Copied" : "Copy action plan"}
								</button>
							) : null}
							{cfg.badge ? (
								<span
									className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}
								>
									{cfg.badgeLabel}
								</span>
							) : null}
						</div>
						<div className="px-4 py-3 bg-white/70">
							<div className="prose prose-sm max-w-none text-surface-700 leading-relaxed">
								{renderMarkdown(section.content)}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}

function buildFullExecutionChecklist(sections) {
	if (!sections?.length) return "";

	const blocks = [];
	const seen = new Set();

	for (const section of sections) {
		const payload = buildActionCopyPayload(section.title, section.content);
		if (!payload) continue;

		const lines = payload
			.split("\n")
			.map((l) => l.trim())
			.filter(Boolean);

		const header = lines[0] || `${section.title} - Action Plan`;
		const actions = lines.slice(1).filter((line) => {
			const normalized = line
				.replace(/^\d+\.\s+/, "")
				.trim()
				.toLowerCase();
			if (!normalized || seen.has(normalized)) return false;
			seen.add(normalized);
			return true;
		});

		if (!actions.length) continue;

		blocks.push([header, ...actions].join("\n"));
	}

	if (!blocks.length) return "";

	return [
		"Yukti Premium - 30-Day Execution Checklist",
		`Generated: ${new Date().toLocaleString("en-IN")}`,
		"",
		...blocks,
	].join("\n\n");
}

function buildActionCopyPayload(title, content) {
	if (!content) return "";
	const lines = content
		.split("\n")
		.map((l) => l.trim())
		.filter(Boolean);

	const actionable = lines.filter((line) => {
		const isBullet =
			line.startsWith("-") || line.startsWith("•") || /^\d+\.\s/.test(line);
		const hasActionVerb =
			/(run|launch|track|set|review|reduce|increase|create|plan|audit|monitor|prepare|negotiate|optimi[sz]e|execute|measure|implement|prioritize)/i.test(
				line,
			);
		const hasTimeSignal = /(week|day|month|today|tomorrow|next)/i.test(line);
		return isBullet || hasActionVerb || hasTimeSignal;
	});

	if (!actionable.length) return "";

	return [
		`${title} - Action Plan`,
		...actionable.map(
			(line, idx) =>
				`${idx + 1}. ${line.replace(/^[-•]\s+/, "").replace(/^\d+\.\s+/, "")}`,
		),
	].join("\n");
}

async function copyText(text) {
	try {
		if (navigator?.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
			return true;
		}
	} catch {
		// Fallback path below
	}

	try {
		const textarea = document.createElement("textarea");
		textarea.value = text;
		textarea.setAttribute("readonly", "");
		textarea.style.position = "absolute";
		textarea.style.left = "-9999px";
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand("copy");
		document.body.removeChild(textarea);
		return true;
	} catch {
		return false;
	}
}

function splitPremiumSections(text) {
	if (!text) return [];
	const lines = text.split("\n");
	const sections = [];
	let currentTitle = "";
	let buffer = [];

	const pushSection = () => {
		if (!currentTitle && buffer.length === 0) return;
		const content = buffer.join("\n").trim();
		if (currentTitle || content) {
			sections.push({
				title: currentTitle || "Summary",
				content,
			});
		}
	};

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (line.startsWith("## ")) {
			pushSection();
			currentTitle = line.replace(/^##\s+/, "").trim();
			buffer = [];
		} else {
			buffer.push(rawLine);
		}
	}

	pushSection();

	if (!sections.length && text.trim()) {
		return [{ title: "Premium Analysis", content: text }];
	}

	return sections;
}

function getSectionConfig(title) {
	const t = (title || "").toLowerCase();
	if (t.includes("executive")) {
		return {
			icon: Crown,
			bg: "bg-amber-50/50",
			border: "border-amber-200",
			iconColor: "text-amber-600",
			badge: "bg-amber-100 text-amber-700",
			badgeLabel: "High Priority",
		};
	}
	if (
		t.includes("top issue") ||
		t.includes("root-cause") ||
		t.includes("root cause")
	) {
		return {
			icon: AlertCircle,
			bg: "bg-red-50/40",
			border: "border-red-200",
			iconColor: "text-red-500",
			badge: "bg-red-100 text-red-700",
			badgeLabel: "Decision Critical",
		};
	}
	if (
		t.includes("strategic") ||
		t.includes("trade-off") ||
		t.includes("tradeoff")
	) {
		return {
			icon: Target,
			bg: "bg-indigo-50/50",
			border: "border-indigo-200",
			iconColor: "text-indigo-600",
			badge: "bg-indigo-100 text-indigo-700",
			badgeLabel: "Strategic",
		};
	}
	if (
		t.includes("30-day") ||
		t.includes("week") ||
		t.includes("plan") ||
		t.includes("roadmap")
	) {
		return {
			icon: ListChecks,
			bg: "bg-blue-50/40",
			border: "border-blue-200",
			iconColor: "text-blue-600",
			badge: "bg-blue-100 text-blue-700",
			badgeLabel: "Execution",
		};
	}
	if (t.includes("kpi") || t.includes("scorecard") || t.includes("metric")) {
		return {
			icon: Gauge,
			bg: "bg-emerald-50/40",
			border: "border-emerald-200",
			iconColor: "text-emerald-600",
			badge: "bg-emerald-100 text-emerald-700",
			badgeLabel: "Measurable",
		};
	}
	if (t.includes("risk") || t.includes("contingency")) {
		return {
			icon: ShieldAlert,
			bg: "bg-orange-50/40",
			border: "border-orange-200",
			iconColor: "text-orange-600",
			badge: "bg-orange-100 text-orange-700",
			badgeLabel: "Risk Watch",
		};
	}
	if (t.includes("closing") || t.includes("recommendation")) {
		return {
			icon: Lightbulb,
			bg: "bg-violet-50/40",
			border: "border-violet-200",
			iconColor: "text-violet-600",
			badge: "bg-violet-100 text-violet-700",
			badgeLabel: "Final Call",
		};
	}

	return {
		icon: Sparkles,
		bg: "bg-surface-50",
		border: "border-surface-200",
		iconColor: "text-surface-500",
		badge: "",
		badgeLabel: "",
	};
}

/* ── Simple Markdown → JSX renderer ─────────────────── */
function renderMarkdown(text) {
	if (!text) return null;

	const lines = text.split("\n");
	const elements = [];
	let key = 0;

	for (const line of lines) {
		const trimmed = line.trim();

		if (!trimmed) {
			elements.push(<div key={key++} className="h-2" />);
		} else if (trimmed.startsWith("# ")) {
			elements.push(
				<h1
					key={key++}
					className="text-lg font-bold text-surface-900 mt-4 mb-2"
				>
					{formatInline(trimmed.slice(2))}
				</h1>,
			);
		} else if (trimmed.startsWith("## ")) {
			elements.push(
				<h2
					key={key++}
					className="text-base font-semibold text-surface-800 mt-5 mb-1.5 pb-1 border-b border-surface-100"
				>
					{formatInline(trimmed.slice(3))}
				</h2>,
			);
		} else if (trimmed.startsWith("### ")) {
			elements.push(
				<h3
					key={key++}
					className="text-sm font-semibold text-surface-700 mt-3 mb-1"
				>
					{formatInline(trimmed.slice(4))}
				</h3>,
			);
		} else if (trimmed.startsWith("---")) {
			elements.push(<hr key={key++} className="my-4 border-surface-200" />);
		} else if (
			trimmed.startsWith("- ") ||
			trimmed.startsWith("• ") ||
			/^\d+\.\s/.test(trimmed)
		) {
			const content = trimmed.replace(/^[-•]\s+/, "").replace(/^\d+\.\s+/, "");
			elements.push(
				<div key={key++} className="flex items-start gap-2 ml-2 my-0.5">
					<span className="text-amber-400 mt-0.5 shrink-0">•</span>
					<span className="text-[13px] leading-relaxed text-surface-600">
						{formatInline(content)}
					</span>
				</div>,
			);
		} else if (trimmed.startsWith("*") && trimmed.endsWith("*")) {
			elements.push(
				<p key={key++} className="text-[11px] text-surface-400 italic mt-2">
					{trimmed.replace(/\*/g, "")}
				</p>,
			);
		} else {
			elements.push(
				<p
					key={key++}
					className="text-[13px] leading-relaxed text-surface-600 my-1"
				>
					{formatInline(trimmed)}
				</p>,
			);
		}
	}

	return elements;
}

function formatInline(text) {
	// Bold: **text**
	const parts = text.split(/(\*\*[^*]+\*\*)/g);
	return parts.map((part, i) => {
		if (part.startsWith("**") && part.endsWith("**")) {
			return (
				<strong key={i} className="font-semibold text-surface-800">
					{part.slice(2, -2)}
				</strong>
			);
		}
		return part;
	});
}
