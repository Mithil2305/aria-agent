import { useState } from "react";
import {
	BarChart3,
	Brain,
	Download,
	RefreshCcw,
	ChevronRight,
	Sparkles,
	ShieldCheck,
	TrendingUp,
	AlertTriangle,
	Database,
	Activity,
	Target,
	Lightbulb,
	Users,
	DollarSign,
	Zap,
	ArrowUpRight,
	ArrowDownRight,
	CheckCircle2,
	Clock,
	BarChart,
} from "lucide-react";
import KPICards from "./KPICards";
import TrendCharts from "./TrendCharts";
import ForecastPanel from "./ForecastPanel";
import AnomalyPanel from "./AnomalyPanel";
import CorrelationView from "./CorrelationView";
import InsightPanel from "./InsightPanel";
import SchemaView from "./SchemaView";
import { downloadReport } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const TABS = [
	{ id: "overview", label: "Overview", icon: BarChart3 },
	{ id: "performance", label: "Performance", icon: TrendingUp },
	{ id: "predictions", label: "Predictions", icon: Brain },
	{ id: "strategy", label: "Revenue Strategy", icon: Target },
	{ id: "improvements", label: "Business Health", icon: Lightbulb },
	{ id: "management", label: "Management", icon: Users },
	{ id: "alerts", label: "Alerts", icon: AlertTriangle },
	{ id: "data", label: "Data Health", icon: Database },
];

export default function Dashboard({ analysis, rowCount, onReset }) {
	const [activeTab, setActiveTab] = useState("overview");
	const { user, getIdToken } = useAuth();

	const { schema, kpis, trends, forecasts, anomalies, correlations, insights } =
		analysis;

	/* Business health score 0-100 */
	const healthScore = computeHealthScore(kpis, anomalies, insights, schema);
	const healthLabel =
		healthScore >= 80
			? "Excellent"
			: healthScore >= 60
				? "Good"
				: healthScore >= 40
					? "Needs Attention"
					: "Critical";
	const healthColor =
		healthScore >= 80
			? "text-green-600"
			: healthScore >= 60
				? "text-gold-600"
				: healthScore >= 40
					? "text-amber-600"
					: "text-red-600";
	const healthBg =
		healthScore >= 80
			? "bg-green-50 border-green-200"
			: healthScore >= 60
				? "bg-indigo-50 border-indigo-200"
				: healthScore >= 40
					? "bg-amber-50 border-amber-200"
					: "bg-red-50 border-red-200";

	const criticalCount = anomalies.filter(
		(a) => a.severity === "critical",
	).length;
	const highCount = anomalies.filter((a) => a.severity === "high").length;
	const alertTotal = criticalCount + highCount;

	const handleExportPDF = async () => {
		try {
			const token = await getIdToken();
			await downloadReport(token, user?.uid);
		} catch (err) {
			console.error("Report download failed:", err);
		}
	};

	return (
		<div className="min-h-[calc(100vh-60px)]">
			<div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
				{/* ── Executive Summary ── */}
				<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
					<div className="flex-1">
						<div className="flex items-center gap-3 mb-2 flex-wrap">
							<div
								className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${healthBg}`}
							>
								<ShieldCheck size={14} className={healthColor} />
								<span className={`text-sm font-bold ${healthColor}`}>
									{healthScore}
								</span>
								<span className={`text-xs ${healthColor}`}>{healthLabel}</span>
							</div>
							{alertTotal > 0 && (
								<button
									onClick={() => setActiveTab("alerts")}
									className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
								>
									<AlertTriangle size={13} className="text-red-500" />
									<span className="text-xs text-red-600 font-medium">
										{alertTotal} alert{alertTotal !== 1 ? "s" : ""}
									</span>
								</button>
							)}
						</div>
						<p className="text-sm text-surface-500 leading-relaxed max-w-2xl">
							{analysis.narrative ||
								`Analyzed ${rowCount?.toLocaleString()} records across ${schema.columns.length} metrics. ${insights.length} recommendations generated.`}
						</p>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<button
							onClick={handleExportPDF}
							className="btn-primary flex items-center gap-2 text-xs"
						>
							<Download size={14} /> Download Report
						</button>
						<button
							onClick={onReset}
							className="btn-secondary flex items-center gap-2 text-xs"
						>
							<RefreshCcw size={14} /> New Analysis
						</button>
					</div>
				</div>

				{/* ── Tabs ── */}
				<div className="flex items-center gap-1 mb-6 p-1 bg-surface-100 rounded-lg border border-surface-300 overflow-x-auto">
					{TABS.map((tab) => {
						const Icon = tab.icon;
						const isActive = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${isActive ? "bg-white text-surface-900 shadow-sm border border-surface-300" : "text-surface-500 hover:text-surface-700 hover:bg-white/60"}`}
							>
								<Icon size={14} />
								{tab.label}
								{tab.id === "alerts" && alertTotal > 0 && (
									<span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 text-[10px] font-bold">
										{alertTotal}
									</span>
								)}
								{tab.id === "insights" && insights.length > 0 && (
									<span className="ml-1 px-1.5 py-0.5 rounded-full bg-gold-50 text-gold-600 text-[10px] font-bold">
										{insights.length}
									</span>
								)}
							</button>
						);
					})}
				</div>

				{/* ── Overview ── */}
				{activeTab === "overview" && (
					<div className="space-y-6 animate-fade-in-up">
						<KPICards kpis={kpis} />
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<TrendCharts trends={trends} />
							<ForecastPanel forecasts={forecasts} />
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Quick Alerts */}
							<div className="card p-5">
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center gap-2">
										<AlertTriangle size={14} className="text-amber-500" />
										<h3 className="text-sm font-medium text-surface-900">
											Alerts
										</h3>
										{alertTotal > 0 && (
											<span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 text-[10px] font-bold">
												{alertTotal}
											</span>
										)}
									</div>
									<button
										onClick={() => setActiveTab("alerts")}
										className="flex items-center gap-1 text-[11px] text-gold-600 hover:text-gold-700 transition-colors"
									>
										View All <ChevronRight size={12} />
									</button>
								</div>
								{anomalies.length === 0 ? (
									<div className="text-center py-6">
										<ShieldCheck
											size={24}
											className="text-green-500 mx-auto mb-2"
										/>
										<p className="text-xs text-surface-500">
											All metrics are within normal range
										</p>
									</div>
								) : (
									<div className="space-y-2">
										{anomalies.slice(0, 3).map((a, i) => (
											<div
												key={i}
												className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-100"
											>
												<div
													className={`w-2 h-2 rounded-full shrink-0 ${a.severity === "critical" ? "bg-red-500" : a.severity === "high" ? "bg-amber-500" : "bg-surface-400"}`}
												/>
												<div className="min-w-0 flex-1">
													<p className="text-xs text-surface-700 truncate">
														{a.label}
													</p>
													<p className="text-[10px] text-surface-500">
														{a.type === "spike"
															? "Unusually high"
															: "Unusually low"}{" "}
														— {Math.abs(a.deviation)}% from normal
													</p>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
							{/* Quick Recommendations */}
							<div className="card p-5">
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center gap-2">
										<Sparkles size={14} className="text-gold-600" />
										<h3 className="text-sm font-medium text-surface-900">
											Top Recommendations
										</h3>
									</div>
									<button
										onClick={() => setActiveTab("insights")}
										className="flex items-center gap-1 text-[11px] text-gold-600 hover:text-gold-700 transition-colors"
									>
										View All <ChevronRight size={12} />
									</button>
								</div>
								<div className="space-y-2">
									{insights.slice(0, 3).map((insight, i) => (
										<div
											key={insight.id || i}
											className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-100"
										>
											<div
												className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${insight.severity === "critical" ? "bg-red-500" : insight.severity === "high" ? "bg-amber-500" : "bg-gold-500"}`}
											/>
											<div>
												<p className="text-xs text-surface-700 leading-snug">
													{insight.title}
												</p>
												<p className="text-[10px] text-surface-500 mt-0.5">
													{insight.category} ·{" "}
													{(insight.confidence * 100).toFixed(0)}% confidence
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab === "performance" && (
					<div className="space-y-6 animate-fade-in-up">
						<KPICards kpis={kpis} expanded />
						<TrendCharts trends={trends} expanded />
						<CorrelationView correlations={correlations} />
					</div>
				)}

				{activeTab === "predictions" && (
					<div className="space-y-6 animate-fade-in-up">
						{/* Prediction summary hero */}
						<div className="card-elevated p-6">
							<div className="flex items-center gap-3 mb-4">
								<div className="p-2.5 rounded-lg bg-gold-50">
									<Brain size={20} className="text-gold-600" />
								</div>
								<div>
									<h2 className="text-base font-semibold text-surface-900">
										Future Predictions
									</h2>
									<p className="text-xs text-surface-500">
										AI-powered forecasts based on your historical data patterns
									</p>
								</div>
							</div>
							{forecasts.length > 0 && (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
									{forecasts.slice(0, 6).map((f, i) => {
										const isGrowth = (f.growthRate || 0) > 0;
										return (
											<div
												key={i}
												className="rounded-lg bg-surface-100 border border-surface-300 p-4"
											>
												<p className="text-xs text-surface-500 mb-1 truncate">
													{f.label || f.column}
												</p>
												<div className="flex items-end gap-2 mb-2">
													<span className="text-xl font-bold text-surface-900">
														{f.predictions?.[0]?.value != null
															? formatCompact(f.predictions[0].value)
															: "—"}
													</span>
													<span
														className={`flex items-center gap-0.5 text-xs font-semibold ${isGrowth ? "text-green-600" : "text-red-500"}`}
													>
														{isGrowth ? (
															<ArrowUpRight size={12} />
														) : (
															<ArrowDownRight size={12} />
														)}
														{Math.abs(f.growthRate || 0).toFixed(1)}%
													</span>
												</div>
												<div className="flex items-center gap-1.5">
													<div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden">
														<div
															className={`h-full rounded-full ${isGrowth ? "bg-green-500" : "bg-red-500"}`}
															style={{
																width: `${Math.min(100, Math.abs(f.r2 || 0) * 100)}%`,
															}}
														/>
													</div>
													<span className="text-[10px] text-surface-500">
														{((f.r2 || 0) * 100).toFixed(0)}% accuracy
													</span>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
						<ForecastPanel forecasts={forecasts} expanded />
					</div>
				)}

				{activeTab === "strategy" && (
					<div className="space-y-6 animate-fade-in-up">
						{/* Revenue Strategy */}
						<div className="card-elevated p-6">
							<div className="flex items-center gap-3 mb-6">
								<div className="p-2.5 rounded-lg bg-gold-50">
									<DollarSign size={20} className="text-gold-600" />
								</div>
								<div>
									<h2 className="text-base font-semibold text-surface-900">
										Revenue Growth Strategy
									</h2>
									<p className="text-xs text-surface-500">
										Data-driven recommendations to increase your revenue
									</p>
								</div>
							</div>

							{/* Top revenue drivers */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{/* Growth Opportunities */}
								<div className="rounded-lg bg-surface-100 border border-surface-300 p-5">
									<h3 className="text-sm font-medium text-surface-900 mb-4 flex items-center gap-2">
										<Zap size={14} className="text-gold-600" />
										Growth Opportunities
									</h3>
									<div className="space-y-3">
										{insights
											.filter(
												(i) =>
													i.category === "growth" ||
													i.category === "opportunity" ||
													i.type === "growth",
											)
											.slice(0, 4)
											.map((insight, i) => (
												<div
													key={i}
													className="flex items-start gap-3 p-3 rounded-lg bg-surface-50"
												>
													<div className="w-6 h-6 rounded-full bg-gold-50 flex items-center justify-center shrink-0 mt-0.5">
														<span className="text-[10px] font-bold text-gold-600">
															{i + 1}
														</span>
													</div>
													<div>
														<p className="text-xs text-surface-700 font-medium">
															{insight.title}
														</p>
														<p className="text-[11px] text-surface-500 mt-0.5">
															{insight.description?.slice(0, 100)}
														</p>
													</div>
												</div>
											))}
										{insights.filter(
											(i) =>
												i.category === "growth" ||
												i.category === "opportunity" ||
												i.type === "growth",
										).length === 0 && (
											<p className="text-xs text-surface-500 text-center py-4">
												Upload more data to reveal growth opportunities
											</p>
										)}
									</div>
								</div>

								{/* Revenue Metrics */}
								<div className="rounded-lg bg-surface-100 border border-surface-300 p-5">
									<h3 className="text-sm font-medium text-surface-900 mb-4 flex items-center gap-2">
										<BarChart size={14} className="text-surface-400" />
										Key Revenue Metrics
									</h3>
									<div className="space-y-3">
										{kpis.slice(0, 5).map((kpi, i) => {
											const isUp = kpi.change > 0;
											return (
												<div
													key={i}
													className="flex items-center justify-between p-3 rounded-lg bg-surface-50"
												>
													<div className="flex items-center gap-2 min-w-0">
														<div
															className={`w-2 h-2 rounded-full ${isUp ? "bg-green-500" : "bg-red-500"}`}
														/>
														<span className="text-xs text-surface-600 truncate">
															{kpi.label}
														</span>
													</div>
													<div className="flex items-center gap-3">
														<span className="text-sm font-bold text-surface-900">
															{formatCompact(kpi.current)}
														</span>
														<span
															className={`text-[11px] font-semibold ${isUp ? "text-green-600" : "text-red-500"}`}
														>
															{isUp ? "+" : ""}
															{kpi.change}%
														</span>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							</div>
						</div>

						{/* Forecasted Revenue Potential */}
						{forecasts.length > 0 && (
							<div className="card-elevated p-6">
								<h3 className="text-sm font-medium text-surface-900 mb-4 flex items-center gap-2">
									<Target size={14} className="text-gold-600" />
									Revenue Forecast Potential
								</h3>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
									{forecasts
										.filter((f) => (f.growthRate || 0) > 0)
										.slice(0, 3)
										.map((f, i) => (
											<div
												key={i}
												className="rounded-lg bg-green-50 border border-green-200 p-4 text-center"
											>
												<p className="text-[11px] text-surface-500 mb-1">
													{f.label || f.column}
												</p>
												<p className="text-2xl font-bold text-green-600">
													+{(f.growthRate || 0).toFixed(1)}%
												</p>
												<p className="text-[10px] text-surface-500 mt-1">
													projected growth
												</p>
											</div>
										))}
								</div>
							</div>
						)}
					</div>
				)}

				{activeTab === "improvements" && (
					<div className="space-y-6 animate-fade-in-up">
						{/* Business Health Overview */}
						<div className="card-elevated p-6">
							<div className="flex items-center gap-3 mb-6">
								<div className="p-2.5 rounded-lg bg-amber-50">
									<Lightbulb size={20} className="text-amber-500" />
								</div>
								<div>
									<h2 className="text-base font-semibold text-surface-900">
										Business Health & Improvements
									</h2>
									<p className="text-xs text-surface-500">
										Identify areas that need attention and quick wins
									</p>
								</div>
							</div>

							{/* Health score hero */}
							<div className="flex flex-col sm:flex-row items-center gap-6 mb-6 p-4 rounded-lg bg-surface-100">
								<div className="relative w-24 h-24">
									<svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
										<path
											d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
											fill="none"
											stroke="#e5e7eb"
											strokeWidth="3"
										/>
										<path
											d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
											fill="none"
											stroke={
												healthScore >= 80
													? "#22c55e"
													: healthScore >= 60
														? "#6366f1"
														: healthScore >= 40
															? "#f59e0b"
															: "#ef4444"
											}
											strokeWidth="3"
											strokeDasharray={`${healthScore}, 100`}
											strokeLinecap="round"
										/>
									</svg>
									<div className="absolute inset-0 flex items-center justify-center">
										<span className={`text-2xl font-bold ${healthColor}`}>
											{healthScore}
										</span>
									</div>
								</div>
								<div>
									<h3 className={`text-lg font-bold ${healthColor}`}>
										{healthLabel} Health
									</h3>
									<p className="text-sm text-surface-500 mt-1">
										{healthScore >= 80
											? "Your business metrics are performing well across the board."
											: healthScore >= 60
												? "Good performance with some areas for improvement."
												: healthScore >= 40
													? "Several metrics need your attention."
													: "Critical issues detected that require immediate action."}
									</p>
								</div>
							</div>

							{/* Improvement areas */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
								{/* Critical Issues */}
								<div className="rounded-lg bg-red-50 border border-red-200 p-5">
									<h3 className="text-sm font-medium text-red-600 mb-3 flex items-center gap-2">
										<AlertTriangle size={14} /> Needs Immediate Attention
									</h3>
									<div className="space-y-2">
										{anomalies
											.filter(
												(a) =>
													a.severity === "critical" || a.severity === "high",
											)
											.slice(0, 4)
											.map((a, i) => (
												<div
													key={i}
													className="flex items-start gap-2 p-2 rounded-lg bg-white"
												>
													<div
														className={`w-2 h-2 rounded-full mt-1.5 ${a.severity === "critical" ? "bg-red-500" : "bg-amber-500"}`}
													/>
													<div>
														<p className="text-xs text-surface-700">
															{a.label}
														</p>
														<p className="text-[10px] text-surface-500">
															{Math.abs(a.deviation)}% deviation from normal
														</p>
													</div>
												</div>
											))}
										{anomalies.filter(
											(a) => a.severity === "critical" || a.severity === "high",
										).length === 0 && (
											<div className="flex items-center gap-2 py-4 justify-center">
												<CheckCircle2 size={14} className="text-green-500" />
												<span className="text-xs text-green-600">
													No critical issues found!
												</span>
											</div>
										)}
									</div>
								</div>

								{/* Quick Wins */}
								<div className="rounded-lg bg-green-50 border border-green-200 p-5">
									<h3 className="text-sm font-medium text-green-600 mb-3 flex items-center gap-2">
										<Sparkles size={14} /> Quick Wins & Recommendations
									</h3>
									<div className="space-y-2">
										{insights.slice(0, 4).map((ins, i) => (
											<div
												key={i}
												className="flex items-start gap-2 p-2 rounded-lg bg-white"
											>
												<div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
													<CheckCircle2 size={10} className="text-green-600" />
												</div>
												<div>
													<p className="text-xs text-surface-700">
														{ins.title}
													</p>
													<p className="text-[10px] text-surface-500">
														{(ins.confidence * 100).toFixed(0)}% confidence
													</p>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* Data quality section */}
						<SchemaView schema={schema} />
					</div>
				)}

				{activeTab === "management" && (
					<div className="space-y-6 animate-fade-in-up">
						{/* Executive Summary */}
						<div className="card-elevated p-6">
							<div className="flex items-center gap-3 mb-6">
								<div className="p-2.5 rounded-lg bg-surface-100">
									<Users size={20} className="text-surface-400" />
								</div>
								<div>
									<h2 className="text-base font-semibold text-surface-900">
										Management Dashboard
									</h2>
									<p className="text-xs text-surface-500">
										Executive-ready metrics and strategic overview
									</p>
								</div>
							</div>

							{/* Top-line metrics */}
							<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
								<div className="rounded-lg bg-surface-100 border border-surface-300 p-4 text-center">
									<ShieldCheck
										size={20}
										className="text-green-500 mx-auto mb-2"
									/>
									<p className="text-2xl font-bold text-surface-900">
										{healthScore}
									</p>
									<p className="text-[10px] text-surface-500">Health Score</p>
								</div>
								<div className="rounded-lg bg-surface-100 border border-surface-300 p-4 text-center">
									<TrendingUp
										size={20}
										className="text-gold-600 mx-auto mb-2"
									/>
									<p className="text-2xl font-bold text-surface-900">
										{kpis.filter((k) => k.trend === "rising").length}
									</p>
									<p className="text-[10px] text-surface-500">
										Growing Metrics
									</p>
								</div>
								<div className="rounded-lg bg-surface-100 border border-surface-300 p-4 text-center">
									<AlertTriangle
										size={20}
										className="text-amber-500 mx-auto mb-2"
									/>
									<p className="text-2xl font-bold text-surface-900">
										{alertTotal}
									</p>
									<p className="text-[10px] text-surface-500">Active Alerts</p>
								</div>
								<div className="rounded-lg bg-surface-100 border border-surface-300 p-4 text-center">
									<Sparkles size={20} className="text-gold-600 mx-auto mb-2" />
									<p className="text-2xl font-bold text-surface-900">
										{insights.length}
									</p>
									<p className="text-[10px] text-surface-500">
										Recommendations
									</p>
								</div>
							</div>

							{/* Narrative summary */}
							<div className="rounded-lg bg-surface-100 border border-surface-300 p-5 mb-6">
								<h3 className="text-sm font-medium text-surface-900 mb-2 flex items-center gap-2">
									<Clock size={14} className="text-surface-400" />
									Executive Summary
								</h3>
								<p className="text-sm text-surface-600 leading-relaxed">
									{analysis.narrative ||
										`Analysis of ${schema.columns.length} business metrics across your dataset reveals ${kpis.filter((k) => k.trend === "rising").length} growing metrics, ${alertTotal} items requiring attention, and ${insights.length} actionable recommendations. ${healthScore >= 70 ? "Overall business health is strong." : "Several areas need management attention."}`}
								</p>
							</div>

							{/* Key decisions table */}
							<div className="rounded-lg bg-surface-100 border border-surface-300 overflow-hidden">
								<div className="px-5 py-3 border-b border-surface-300">
									<h3 className="text-sm font-medium text-surface-900 flex items-center gap-2">
										<Target size={14} className="text-gold-600" />
										Key Decision Points
									</h3>
								</div>
								<div className="divide-y divide-surface-200">
									{insights.slice(0, 6).map((ins, i) => (
										<div
											key={i}
											className="flex items-center gap-4 px-5 py-3 hover:bg-surface-50 transition-colors"
										>
											<div
												className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ins.severity === "critical" ? "bg-red-50" : ins.severity === "high" ? "bg-amber-50" : "bg-gold-50"}`}
											>
												<span
													className={`text-xs font-bold ${ins.severity === "critical" ? "text-red-500" : ins.severity === "high" ? "text-amber-500" : "text-gold-600"}`}
												>
													{i + 1}
												</span>
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-xs text-surface-700 font-medium truncate">
													{ins.title}
												</p>
												<p className="text-[10px] text-surface-500">
													{ins.category} · {(ins.confidence * 100).toFixed(0)}%
													confidence
												</p>
											</div>
											<span
												className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ins.severity === "critical" ? "bg-red-50 text-red-500" : ins.severity === "high" ? "bg-amber-50 text-amber-500" : "bg-gold-50 text-gold-600"}`}
											>
												{ins.severity === "critical"
													? "Urgent"
													: ins.severity === "high"
														? "Important"
														: "Review"}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Correlation insights for management */}
						<CorrelationView correlations={correlations} />
					</div>
				)}

				{activeTab === "alerts" && (
					<div className="animate-fade-in-up">
						<AnomalyPanel anomalies={anomalies} />
					</div>
				)}

				{activeTab === "data" && (
					<div className="animate-fade-in-up">
						<SchemaView schema={schema} />
						<div className="mt-6">
							<InsightPanel insights={insights} />
						</div>
					</div>
				)}

				<footer className="mt-12 pb-8 text-center">
					<div className="flex items-center justify-center gap-2 mb-3">
						<div className="h-px w-12 bg-surface-300" />
						<Activity size={10} className="text-surface-400" />
						<div className="h-px w-12 bg-surface-300" />
					</div>
					<p className="text-[10px] text-surface-400">
						Yukti · Autonomous Decision Intelligence · v1.0
					</p>
				</footer>
			</div>
		</div>
	);
}

function computeHealthScore(kpis, anomalies, insights, schema) {
	let score = 75;
	score += Math.min(10, kpis.filter((k) => k.trend === "rising").length * 2);
	score -= anomalies.filter((a) => a.severity === "critical").length * 8;
	score -= anomalies.filter((a) => a.severity === "high").length * 3;
	score -= insights.filter((i) => i.severity === "critical").length * 5;
	const completeness = schema?.data_quality?.overall_completeness ?? 100;
	if (completeness >= 98) score += 5;
	else if (completeness < 90) score -= 10;
	return Math.max(0, Math.min(100, Math.round(score)));
}

function formatCompact(value) {
	if (value == null) return "—";
	const num = Number(value);
	if (isNaN(num)) return String(value);
	if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
	if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
	if (Number.isInteger(num)) return num.toLocaleString();
	return num.toFixed(2);
}
