import { useState, useCallback } from "react";
import {
	Lightbulb,
	TrendingUp,
	Users,
	Package,
	ShoppingCart,
	Calendar,
	Loader2,
	AlertCircle,
	CheckCircle2,
	ChevronRight,
	Sparkles,
	Target,
	MapPin,
	ArrowRight,
	RefreshCw,
	Star,
	Zap,
	Clock,
	BarChart3,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { getStrategyAdvice } from "../services/api";
import {
	getBusinessCategory,
	getCategoryLabel,
	needsStockManagement,
} from "../config/businessTypes";

const PRIORITY_STYLES = {
	high: "bg-red-50 text-red-600 border-red-200",
	medium: "bg-amber-50 text-amber-600 border-amber-200",
	low: "bg-green-50 text-green-600 border-green-200",
};

const PRIORITY_DOT = {
	high: "bg-red-500",
	medium: "bg-amber-500",
	low: "bg-green-500",
};

export default function StrategyAdvisorPage() {
	const { user, userProfile, getIdToken } = useAuth();

	const businessType = userProfile?.businessType || "";
	const category = getBusinessCategory(businessType);
	const categoryLabel = getCategoryLabel(businessType);
	const hasStock = needsStockManagement(businessType);

	const [loading, setLoading] = useState(false);
	const [strategy, setStrategy] = useState(null);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState("sales");

	const generateStrategy = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		setError(null);

		try {
			// Fetch daily logs
			const logsQ = query(
				collection(db, "users", user.uid, "dailyLogs"),
				orderBy("createdAt", "desc"),
				limit(60),
			);
			const logsSnap = await getDocs(logsQ);
			const dailyLogs = logsSnap.docs.map((d) => ({
				id: d.id,
				...d.data(),
			}));

			// Fetch stock entries if applicable
			let stockEntries = [];
			if (hasStock) {
				const stockQ = query(
					collection(db, "users", user.uid, "stockEntries"),
					orderBy("createdAt", "desc"),
					limit(30),
				);
				const stockSnap = await getDocs(stockQ);
				stockEntries = stockSnap.docs.map((d) => ({
					id: d.id,
					...d.data(),
				}));
			}

			if (dailyLogs.length === 0 && stockEntries.length === 0) {
				setError(
					"No data found. Please log a few daily entries first so ARIA can generate smart recommendations.",
				);
				setLoading(false);
				return;
			}

			const token = await getIdToken();
			const result = await getStrategyAdvice(
				dailyLogs,
				stockEntries,
				businessType,
				category,
				token,
			);

			setStrategy(result);
		} catch (err) {
			setError(
				err?.response?.data?.detail ||
					"Failed to generate strategy. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	}, [user, businessType, category, hasStock, getIdToken]);

	const TABS = [
		{ key: "sales", label: "Sales Tips", icon: TrendingUp },
		{ key: "customers", label: "Customer Strategies", icon: Users },
		{ key: "stock", label: "Stock Analysis", icon: Package },
		{ key: "purchase", label: "Buy Next Month", icon: ShoppingCart },
		{ key: "roadmap", label: "Monthly Roadmap", icon: Calendar },
	];

	return (
		<div className="min-h-screen py-10 px-6">
			<div className="max-w-5xl mx-auto">
				{/* Header */}
				<div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
					<div>
						<h1 className="text-xl font-semibold text-surface-900 mb-1 flex items-center gap-3">
							<div className="p-2 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50">
								<Lightbulb size={20} className="text-indigo-600" />
							</div>
							Strategy Advisor
						</h1>
						<p className="text-sm text-surface-500 ml-12">
							AI-powered tips to boost sales, attract customers, and optimise
							stock — tailored for{" "}
							<span className="font-medium text-indigo-500">
								{categoryLabel}
							</span>{" "}
							in{" "}
							<span className="font-medium text-indigo-500 inline-flex items-center gap-1">
								<MapPin size={11} />
								Tamil Nadu, India
							</span>
						</p>
					</div>
					{strategy && (
						<button
							onClick={generateStrategy}
							disabled={loading}
							className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-medium hover:bg-indigo-100 transition-all disabled:opacity-50 shrink-0"
						>
							{loading ? (
								<Loader2 size={13} className="animate-spin" />
							) : (
								<RefreshCw size={13} />
							)}
							{loading ? "Generating…" : "Regenerate"}
						</button>
					)}
				</div>

				{/* Intro card with Analyse button — shown before first run */}
				{!strategy && !loading && !error && (
					<div className="mb-6 bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-white rounded-xl border border-indigo-200/60 p-6">
						<div className="flex items-start gap-4">
							<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
								<Lightbulb size={22} className="text-white" />
							</div>
							<div className="space-y-3 flex-1">
								<div>
									<h2 className="text-sm font-semibold text-surface-900">
										Get Smart Business Recommendations
									</h2>
									<p className="text-xs text-surface-500 mt-1 leading-relaxed">
										ARIA will analyse your daily logs, revenue trends, and stock
										data to generate personalised strategies — including sales
										tips, customer acquisition ideas, stock optimisation, and a
										monthly roadmap tailored for your{" "}
										<span className="font-medium text-indigo-500">
											{categoryLabel}
										</span>{" "}
										business.
									</p>
								</div>

								<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
									{[
										{ icon: TrendingUp, label: "Sales Tips" },
										{ icon: Users, label: "Customer Strategies" },
										{ icon: Package, label: "Stock Analysis" },
										{ icon: Calendar, label: "Monthly Roadmap" },
									].map((item) => (
										<div
											key={item.label}
											className="flex items-center gap-2 text-xs text-surface-600"
										>
											<item.icon size={14} className="text-indigo-500" />
											{item.label}
										</div>
									))}
								</div>

								<button
									onClick={generateStrategy}
									disabled={loading}
									className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-sm transition-all"
								>
									<Sparkles size={15} />
									Analyse
									<ChevronRight size={14} />
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Error state */}
				{error && (
					<div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
						<AlertCircle size={14} />
						{error}
					</div>
				)}

				{/* Rule-based fallback banner */}
				{strategy && strategy.generated_by === "rule_based" && (
					<div className="mb-6 flex items-start gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs">
						<Zap size={13} className="shrink-0 mt-0.5" />
						<div>
							<span className="font-medium">
								Smart recommendations generated from your data patterns.
							</span>
							<span className="text-amber-500 ml-1">
								AI generation was unavailable (quota limit) — these are curated
								tips based on your business type and Tamil Nadu market insights.
								Hit <strong>Regenerate</strong> in a minute to try AI-powered
								recommendations.
							</span>
						</div>
					</div>
				)}

				{/* AI provider badge */}
				{strategy &&
					strategy.generated_by &&
					strategy.generated_by !== "rule_based" && (
						<div className="mb-6 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs">
							<Sparkles size={13} className="shrink-0" />
							<span>
								Powered by{" "}
								<strong>
									{strategy.generated_by === "gemini_ai"
										? "Google Gemini"
										: strategy.generated_by === "groq_ai"
											? "Groq (Kimi K2)"
											: strategy.generated_by === "claude_ai"
												? "Claude (Anthropic)"
												: "AI"}
								</strong>{" "}
								— personalised for your business data.
							</span>
						</div>
					)}

				{/* Loading state */}
				{loading && !strategy && (
					<div className="card-elevated p-12 text-center">
						<Loader2
							size={32}
							className="text-indigo-500 animate-spin mx-auto mb-6"
						/>
						<p className="text-sm text-surface-700 font-semibold mb-4">
							Generating Your Personalised Strategy…
						</p>
						<div className="max-w-xs mx-auto space-y-3 text-left">
							{[
								{ icon: "📊", text: "Fetching your daily logs & stock data" },
								{ icon: "🧮", text: "Computing revenue trends & patterns" },
								{ icon: "🤖", text: "Generating AI-powered recommendations" },
								{ icon: "📋", text: "Preparing your tailored report" },
							].map((step, i) => (
								<div
									key={i}
									className="flex items-center gap-2.5 text-xs text-surface-500 animate-pulse"
									style={{ animationDelay: `${i * 0.3}s` }}
								>
									<span className="text-sm">{step.icon}</span>
									<span>{step.text}</span>
								</div>
							))}
						</div>
						<p className="text-[10px] text-surface-400 mt-5">
							This may take 10-20 seconds depending on your data size
						</p>
					</div>
				)}

				{/* Strategy content */}
				{strategy && (
					<>
						{/* Quick stats bar */}
						{strategy.stats && (
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
								{strategy.stats.avg_daily_revenue != null && (
									<div className="card p-4">
										<p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider mb-1">
											Avg Daily Revenue
										</p>
										<p className="text-lg font-bold text-surface-900">
											₹{strategy.stats.avg_daily_revenue.toLocaleString()}
										</p>
									</div>
								)}
								{strategy.stats.avg_daily_customers != null && (
									<div className="card p-4">
										<p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider mb-1">
											Avg Customers/Day
										</p>
										<p className="text-lg font-bold text-surface-900">
											{strategy.stats.avg_daily_customers}
										</p>
									</div>
								)}
								{strategy.stats.avg_daily_orders != null && (
									<div className="card p-4">
										<p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider mb-1">
											Avg Orders/Day
										</p>
										<p className="text-lg font-bold text-surface-900">
											{strategy.stats.avg_daily_orders}
										</p>
									</div>
								)}
								{strategy.stats.total_entries != null && (
									<div className="card p-4">
										<p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider mb-1">
											Data Points
										</p>
										<p className="text-lg font-bold text-surface-900">
											{strategy.stats.total_entries}
										</p>
									</div>
								)}
							</div>
						)}

						{/* AI badge */}
						<div className="flex items-center gap-2 mb-5">
							<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-600 text-[10px] font-semibold uppercase tracking-wider">
								<Sparkles size={10} />
								{strategy.generated_by === "gemini_ai"
									? "Powered by Gemini AI"
									: strategy.generated_by === "groq_ai"
										? "Powered by Groq AI"
										: strategy.generated_by === "claude_ai"
											? "Powered by Claude AI"
											: "Data-Driven Analysis"}
							</span>
						</div>

						{/* Tab navigation */}
						<div className="flex gap-1 bg-surface-100 rounded-xl p-1 mb-6 overflow-x-auto">
							{TABS.map((tab) => (
								<button
									key={tab.key}
									onClick={() => setActiveTab(tab.key)}
									className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
										activeTab === tab.key
											? "bg-white shadow-sm text-indigo-600"
											: "text-surface-500 hover:text-surface-700"
									}`}
								>
									<tab.icon size={13} />
									{tab.label}
								</button>
							))}
						</div>

						{/* ── Tab content ── */}

						{/* SALES TIPS */}
						{activeTab === "sales" && (
							<div className="space-y-3">
								<h2 className="text-sm font-medium text-surface-700 flex items-center gap-2 mb-4">
									<TrendingUp size={15} className="text-indigo-500" />
									Sales Improvement Tips
								</h2>
								{(strategy.salesTips || []).map((tip, i) => (
									<div
										key={i}
										className="card-elevated p-5 flex items-start gap-4"
									>
										<div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
											<span className="text-xs font-bold text-indigo-500">
												{i + 1}
											</span>
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<h3 className="text-sm font-semibold text-surface-900">
													{tip.title}
												</h3>
												<span
													className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${PRIORITY_STYLES[tip.priority] || PRIORITY_STYLES.medium}`}
												>
													{tip.priority}
												</span>
											</div>
											<p className="text-xs text-surface-500 leading-relaxed">
												{tip.description}
											</p>
										</div>
									</div>
								))}
							</div>
						)}

						{/* CUSTOMER STRATEGIES */}
						{activeTab === "customers" && (
							<div className="space-y-3">
								<h2 className="text-sm font-medium text-surface-700 flex items-center gap-2 mb-4">
									<Users size={15} className="text-indigo-500" />
									Customer Attraction Strategies
								</h2>
								{(strategy.customerStrategies || []).map((strat, i) => (
									<div
										key={i}
										className="card-elevated p-5 flex items-start gap-4"
									>
										<div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
											<Target size={14} className="text-purple-500" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<h3 className="text-sm font-semibold text-surface-900">
													{strat.title}
												</h3>
												<span
													className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${PRIORITY_STYLES[strat.priority] || PRIORITY_STYLES.medium}`}
												>
													{strat.priority}
												</span>
											</div>
											<p className="text-xs text-surface-500 leading-relaxed">
												{strat.description}
											</p>
										</div>
									</div>
								))}
							</div>
						)}

						{/* STOCK ANALYSIS */}
						{activeTab === "stock" && (
							<div className="space-y-6">
								<div>
									<h2 className="text-sm font-medium text-surface-700 flex items-center gap-2 mb-4">
										<AlertCircle size={15} className="text-amber-500" />
										Why Stock is Pending
									</h2>
									<div className="card-elevated p-5 space-y-3">
										{(strategy.stockAnalysis?.pendingReasons || []).map(
											(reason, i) => (
												<div key={i} className="flex items-start gap-3">
													<div
														className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${PRIORITY_DOT.medium} bg-opacity-20`}
													>
														<span className="text-[9px] font-bold text-amber-700">
															{i + 1}
														</span>
													</div>
													<p className="text-xs text-surface-600 leading-relaxed">
														{reason}
													</p>
												</div>
											),
										)}
									</div>
								</div>

								<div>
									<h2 className="text-sm font-medium text-surface-700 flex items-center gap-2 mb-4">
										<CheckCircle2 size={15} className="text-green-500" />
										Stock Optimisation Recommendations
									</h2>
									<div className="card-elevated p-5 space-y-3">
										{(strategy.stockAnalysis?.recommendations || []).map(
											(rec, i) => (
												<div key={i} className="flex items-start gap-3">
													<ChevronRight
														size={14}
														className="text-green-500 shrink-0 mt-0.5"
													/>
													<p className="text-xs text-surface-600 leading-relaxed">
														{rec}
													</p>
												</div>
											),
										)}
									</div>
								</div>
							</div>
						)}

						{/* PURCHASE SUGGESTIONS */}
						{activeTab === "purchase" && (
							<div className="space-y-3">
								<h2 className="text-sm font-medium text-surface-700 flex items-center gap-2 mb-4">
									<ShoppingCart size={15} className="text-indigo-500" />
									Recommended Items to Purchase Next Month
								</h2>
								{(strategy.purchaseSuggestions || []).map((item, i) => (
									<div
										key={i}
										className="card-elevated p-5 flex items-start gap-4"
									>
										<div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
											<Star size={14} className="text-green-600" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<h3 className="text-sm font-semibold text-surface-900">
													{item.item}
												</h3>
												<span
													className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.medium}`}
												>
													{item.priority}
												</span>
											</div>
											<p className="text-xs text-surface-500 leading-relaxed">
												{item.reason}
											</p>
										</div>
									</div>
								))}
							</div>
						)}

						{/* MONTHLY ROADMAP */}
						{activeTab === "roadmap" && (
							<div className="space-y-4">
								<h2 className="text-sm font-medium text-surface-700 flex items-center gap-2 mb-4">
									<Calendar size={15} className="text-indigo-500" />
									4-Week Action Roadmap
								</h2>
								<div className="relative">
									{/* Vertical timeline line */}
									<div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-indigo-100" />

									{(strategy.roadmap || []).map((week, wi) => (
										<div
											key={wi}
											className="relative flex items-start gap-5 mb-6 last:mb-0"
										>
											{/* Timeline dot */}
											<div className="w-9 h-9 rounded-full bg-indigo-100 border-2 border-indigo-300 flex items-center justify-center shrink-0 z-10">
												<span className="text-[10px] font-bold text-indigo-600">
													W{wi + 1}
												</span>
											</div>

											{/* Week card */}
											<div className="card-elevated p-5 flex-1">
												<h3 className="text-sm font-semibold text-surface-900 mb-3">
													{week.week}
												</h3>
												<div className="space-y-2">
													{(week.actions || []).map((action, ai) => (
														<div key={ai} className="flex items-start gap-2.5">
															<ArrowRight
																size={12}
																className="text-indigo-400 shrink-0 mt-0.5"
															/>
															<p className="text-xs text-surface-600 leading-relaxed">
																{action}
															</p>
														</div>
													))}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
