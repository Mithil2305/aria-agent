import { useState, useEffect } from "react";
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
} from "lucide-react";
import { getPremiumAnalysis, getPremiumAnalysisStatus } from "../services/api";
import {
	collection,
	query,
	orderBy,
	limit,
	getDocs,
	doc,
	getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

/* ── Loading animation steps ─────────────────────── */
const PROGRESS_STEPS = [
	{ label: "Collecting business data…", icon: BarChart3, duration: 2500 },
	{ label: "Running deep analysis model…", icon: Sparkles, duration: 4000 },
	{ label: "Generating premium insights…", icon: TrendingUp, duration: 3000 },
	{ label: "Preparing your report…", icon: CheckCircle2, duration: 2000 },
];

/* ── Provider badge ──────────────────────────────── */
function ProviderBadge({ generatedBy, label }) {
	const isModel = generatedBy === "yukti_model";
	// yukti_rule_based = Yukti's own data-driven engine (no external API)
	const isRuleBased = generatedBy === "yukti_rule_based";

	return (
		<span
			className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
				isModel
					? "bg-purple-50 text-purple-700 border border-purple-200"
					: isRuleBased
						? "bg-amber-50 text-amber-700 border border-amber-200"
						: "bg-surface-100 text-surface-600 border border-surface-200"
			}`}
		>
			{isModel ? <Crown size={12} /> : <BarChart3 size={12} />}
			{label || "Yukti Custom Model"}
		</span>
	);
}

export default function PremiumAnalysisPage() {
	const { user, userProfile } = useAuth();

	const [status, setStatus] = useState(null); // { month, used, available }
	const [loading, setLoading] = useState(false);
	const [checking, setChecking] = useState(true);
	const [result, setResult] = useState(null);
	const [error, setError] = useState(null);
	const [progressIdx, setProgressIdx] = useState(0);

	/* ── Check monthly status on mount ──────────── */
	useEffect(() => {
		async function init() {
			setChecking(true);
			try {
				const token = user ? await user.getIdToken() : null;
				const s = await getPremiumAnalysisStatus(token);
				setStatus(s);

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
	}, [user]);

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
			);

			setResult(data);
			setStatus((prev) => ({ ...prev, used: true, available: false }));
		} catch (e) {
			console.error("Premium analysis failed:", e);
			setError(
				e.response?.data?.detail ||
					"Failed to generate analysis. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	}

	/* ── Render helpers ─────────────────────────── */
	const currentMonth = new Date().toLocaleString("default", {
		month: "long",
		year: "numeric",
	});

	if (checking) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Loader2 size={24} className="animate-spin text-surface-400" />
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-6 mt-5">
			{/* ── Header ──────────────────────────────── */}
			<div className="flex items-start justify-between">
				<div>
					<div className="flex items-center gap-2">
						<div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
							<Crown size={18} className="text-white" />
						</div>
						<div>
							<h1 className="text-lg font-semibold text-surface-900">
								Premium Analysis
							</h1>
							<p className="text-xs text-surface-400">
								Deep AI-powered month-end business report
							</p>
						</div>
					</div>
				</div>

				{/* Monthly status badge */}
				<div
					className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
						status?.used
							? "bg-emerald-50 text-emerald-700 border border-emerald-200"
							: "bg-amber-50 text-amber-700 border border-amber-200"
					}`}
				>
					{status?.used ? (
						<>
							<CheckCircle2 size={12} />
							Used for {currentMonth}
						</>
					) : (
						<>
							<Zap size={12} />1 analysis available
						</>
					)}
				</div>
			</div>

			{/* ── Explainer Card ──────────────────────── */}
			{!result && !loading && (
				<div className="bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-white rounded-xl border border-amber-200/60 p-6">
					<div className="flex items-start gap-4">
						<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
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
									revenue trends, profitability insights, customer intelligence,
									risk assessment, and a detailed action plan — all powered by
									Yukti&apos;s custom-trained model.
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

							{status?.used ? (
								<div className="flex items-center gap-2 text-xs text-surface-400 bg-white rounded-lg px-3 py-2 border border-surface-200">
									<Lock size={12} />
									You&apos;ve used your {currentMonth} analysis. Next one
									available next month.
								</div>
							) : (
								<button
									onClick={handleGenerate}
									disabled={loading}
									className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm transition-all"
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
							<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
								<Crown size={26} className="text-white animate-pulse" />
							</div>
							<h3 className="text-sm font-semibold text-surface-900">
								Generating Your Premium Report
							</h3>
							<p className="text-xs text-surface-400 mt-1">
								This may take 30–60 seconds
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
						<p className="text-sm font-medium text-red-800">Analysis Failed</p>
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
							<ProviderBadge
								generatedBy={result.generated_by}
								label={result.provider_label}
							/>
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
						<div className="px-6 py-4 border-b border-surface-100 bg-gradient-to-r from-amber-50/50 to-white">
							<div className="flex items-center gap-2">
								<Crown size={16} className="text-amber-500" />
								<h2 className="text-sm font-semibold text-surface-900">
									Premium Month-End Report — {currentMonth}
								</h2>
							</div>
						</div>
						<div className="px-6 py-5">
							<div className="prose prose-sm prose-surface max-w-none text-surface-700 leading-relaxed premium-report">
								{renderMarkdown(result.analysis)}
							</div>
						</div>
					</div>

					{/* Stats summary if available */}
					{result.stats && (
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
							{[
								{
									label: "Avg Revenue",
									value: `₹${(
										result.stats.avg_daily_revenue || 0
									).toLocaleString("en-IN", {
										maximumFractionDigits: 0,
									})}`,
								},
								{
									label: "Avg Customers",
									value: Math.round(result.stats.avg_daily_customers || 0),
								},
								{
									label: "Best Day",
									value: `₹${(result.stats.max_revenue_day || 0).toLocaleString(
										"en-IN",
										{
											maximumFractionDigits: 0,
										},
									)}`,
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
		</div>
	);
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
