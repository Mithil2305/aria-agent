import { useState, useEffect } from "react";
import {
	BrainCircuit,
	Bell,
	Zap,
	RefreshCw,
	Loader2,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	ChevronRight,
	Star,
	Target,
	AlertTriangle,
	Sparkles,
} from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SEVERITY_STYLES = {
	critical: {
		bg: "bg-red-50",
		border: "border-red-300",
		icon: "text-red-500",
		badge: "bg-red-100 text-red-700",
		dot: "bg-red-500",
		label: "URGENT",
	},
	high: {
		bg: "bg-amber-50",
		border: "border-amber-300",
		icon: "text-amber-500",
		badge: "bg-amber-100 text-amber-700",
		dot: "bg-amber-500",
		label: "IMPORTANT",
	},
	medium: {
		bg: "bg-blue-50",
		border: "border-blue-200",
		icon: "text-blue-500",
		badge: "bg-blue-100 text-blue-700",
		dot: "bg-blue-400",
		label: "WATCH",
	},
	positive: {
		bg: "bg-green-50",
		border: "border-green-200",
		icon: "text-green-500",
		badge: "bg-green-100 text-green-700",
		dot: "bg-green-500",
		label: "GOOD NEWS",
	},
	low: {
		bg: "bg-surface-50",
		border: "border-surface-200",
		icon: "text-surface-400",
		badge: "bg-surface-100 text-surface-500",
		dot: "bg-surface-400",
		label: "INFO",
	},
};

/* ================================================================
   COMBINED YUKTI ADVISOR PANEL
   Shows at the top of the dashboard, merging:
   - AI Business Advisor (SmartAlerts from backend)
   - Yukti Advisor insights (from analysis)
   ================================================================ */

export default function YuktiAdvisorPanel({
	token,
	analysisReady,
	insights = {},
	allInsights = [],
	trendLock = {},
	expandedInsight,
	setExpandedInsight,
}) {
	const [alerts, setAlerts] = useState([]);
	const [loadingAlerts, setLoadingAlerts] = useState(false);
	const [expandedAlert, setExpandedAlert] = useState(null);
	const [activeTab, setActiveTab] = useState("alerts"); // "alerts" | "advisor"

	const advisorInsights = [
		...(insights.advisor || []),
		...(insights.growth || []),
		...(insights.savings || []),
		...(insights.opportunity || []),
	];

	const fetchAlerts = async () => {
		if (!analysisReady) return;
		setLoadingAlerts(true);
		try {
			const { data } = await axios.post(
				`${API_BASE}/api/smart-alerts`,
				{},
				{ headers: token ? { Authorization: `Bearer ${token}` } : {} },
			);
			setAlerts(data.alerts || []);
		} catch (err) {
			console.error("Smart alerts failed:", err);
		} finally {
			setLoadingAlerts(false);
		}
	};

	useEffect(() => {
		if (analysisReady) fetchAlerts();
	}, [analysisReady]);

	if (!analysisReady) return null;

	const criticalCount = alerts.filter((a) => a.severity === "critical").length;

	return (
		<div className="card mb-6 overflow-hidden border-indigo-200 animate-fade-in-up">
			{/* Panel Header */}
			<div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-200 bg-gradient-to-r from-indigo-50/60 to-purple-50/40">
				<div className="flex items-center gap-2.5">
					<div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
						<BrainCircuit size={16} className="text-indigo-600" />
					</div>
					<div>
						<h2 className="text-sm font-bold text-surface-900 flex items-center gap-2">
							Yukti AI Business Advisor
							{criticalCount > 0 && (
								<span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
									{criticalCount} URGENT
								</span>
							)}
						</h2>
						<p className="text-[10px] text-surface-500 mt-0.5">
							AI-powered alerts &amp; action plan for your business
						</p>
					</div>
					<span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-semibold ml-1">
						<Sparkles size={9} /> Powered by Yukti AI
					</span>
				</div>
				<button
					onClick={fetchAlerts}
					className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 transition-colors"
					title="Refresh alerts"
				>
					<RefreshCw
						size={13}
						className={loadingAlerts ? "animate-spin" : ""}
					/>
				</button>
			</div>

			{/* Sub-tabs */}
			<div className="flex border-b border-surface-200 bg-surface-50/50">
				<TabButton
					active={activeTab === "alerts"}
					onClick={() => setActiveTab("alerts")}
					icon={Bell}
					label="Smart Alerts"
					badge={
						criticalCount > 0
							? criticalCount
							: alerts.length > 0
								? alerts.length
								: null
					}
					badgeColor={
						criticalCount > 0
							? "bg-red-100 text-red-600"
							: "bg-surface-200 text-surface-500"
					}
				/>
				<TabButton
					active={activeTab === "advisor"}
					onClick={() => setActiveTab("advisor")}
					icon={Target}
					label="Action Plan"
					badge={advisorInsights.length > 0 ? advisorInsights.length : null}
					badgeColor="bg-indigo-100 text-indigo-600"
				/>
			</div>

			{/* Tab Content */}
			<div className="p-5">
				{activeTab === "alerts" && (
					<AlertsTab
						alerts={alerts}
						loading={loadingAlerts}
						expandedAlert={expandedAlert}
						setExpandedAlert={setExpandedAlert}
					/>
				)}
				{activeTab === "advisor" && (
					<AdvisorTab
						advisorInsights={advisorInsights}
						allInsights={allInsights}
						trendLock={trendLock}
						expandedInsight={expandedInsight}
						setExpandedInsight={setExpandedInsight}
					/>
				)}
			</div>
		</div>
	);
}

/* ── Sub-tab button ── */
function TabButton({ active, onClick, icon: Icon, label, badge, badgeColor }) {
	return (
		<button
			onClick={onClick}
			className={`flex items-center gap-2 px-5 py-3 text-xs font-medium border-b-2 transition-all ${
				active
					? "border-indigo-500 text-indigo-600 bg-white"
					: "border-transparent text-surface-500 hover:text-surface-700 hover:bg-white/60"
			}`}
		>
			<Icon
				size={13}
				className={active ? "text-indigo-500" : "text-surface-400"}
			/>
			{label}
			{badge != null && (
				<span
					className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}
				>
					{badge}
				</span>
			)}
		</button>
	);
}

/* ── Smart Alerts tab ── */
function AlertsTab({ alerts, loading, expandedAlert, setExpandedAlert }) {
	if (loading) {
		return (
			<div className="flex items-center gap-3 py-4">
				<Loader2 size={16} className="animate-spin text-indigo-500" />
				<span className="text-sm text-surface-500">Scanning for alerts…</span>
			</div>
		);
	}

	if (alerts.length === 0) {
		return (
			<div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
				<CheckCircle2 size={16} className="text-green-500 shrink-0" />
				<p className="text-sm text-green-700">
					All clear — no urgent issues detected in your business data.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{alerts.map((alert, i) => {
				const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low;
				const alertKey = alert.id ? `${alert.id}_${i}` : i;
				const isOpen = expandedAlert === alertKey;

				return (
					<div
						key={alertKey}
						className={`rounded-xl border transition-all ${style.bg} ${style.border}`}
					>
						<button
							onClick={() => setExpandedAlert(isOpen ? null : alertKey)}
							className="w-full flex items-start gap-3 p-4 text-left"
						>
							<div className="flex items-center gap-2 shrink-0 mt-0.5">
								<span className={`w-2 h-2 rounded-full ${style.dot}`} />
								<span className="text-lg leading-none">{alert.icon}</span>
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<span
										className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${style.badge}`}
									>
										{style.label}
									</span>
								</div>
								<p className="text-sm font-medium text-surface-800 leading-snug">
									{alert.title}
								</p>
								{!isOpen && (
									<p className="text-xs text-surface-500 mt-0.5 truncate">
										{alert.detail}
									</p>
								)}
							</div>
							<ChevronRight
								size={14}
								className={`text-surface-400 mt-1 transition-transform ${isOpen ? "rotate-90" : ""}`}
							/>
						</button>

						{isOpen && (
							<div className="px-4 pb-4 pl-10 space-y-3">
								<p className="text-xs text-surface-600 leading-relaxed">
									{alert.detail}
								</p>
								<div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-white border border-surface-200">
									<Zap size={12} className="text-amber-500 shrink-0 mt-0.5" />
									<div>
										<p className="text-[10px] font-semibold text-surface-500 uppercase tracking-wide mb-0.5">
											Recommended Action
										</p>
										<p className="text-xs text-surface-700 leading-relaxed font-medium">
											{alert.action}
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

/* ── Advisor Action Plan tab ── */
function AdvisorTab({
	advisorInsights,
	allInsights,
	trendLock,
	expandedInsight,
	setExpandedInsight,
}) {
	return (
		<div className="space-y-4">
			{/* Business Status Banner */}
			{trendLock?.direction && (
				<div
					className={`p-4 rounded-xl border-l-4 bg-surface-50 border border-surface-200 ${
						trendLock.direction === "up"
							? "border-l-green-500"
							: trendLock.direction === "down"
								? "border-l-red-500"
								: "border-l-surface-400"
					}`}
				>
					<div className="flex items-center gap-2 mb-1">
						<Target size={14} className="text-indigo-500" />
						<h3 className="text-xs font-semibold text-surface-900">
							Business Status
						</h3>
					</div>
					<p className="text-xs text-surface-600 leading-relaxed">
						{trendLock.direction === "up"
							? `Your ${trendLock.metric} is growing at ${trendLock.change}%. Great work! Now focus on sustaining this momentum.`
							: trendLock.direction === "down"
								? `Your ${trendLock.metric} is down ${Math.abs(trendLock.change || 0)}%. Let's focus on recovery this week.`
								: "Your business is running steady. A great time to plan for growth."}
					</p>
				</div>
			)}

			{/* Insight Cards */}
			<div className="space-y-2">
				{advisorInsights.map((ins, i) => (
					<AdvisorInsightCard
						key={i}
						insight={ins}
						index={i}
						expanded={expandedInsight}
						onToggle={setExpandedInsight}
					/>
				))}
				{advisorInsights.length === 0 && (
					<div className="text-center py-6 text-xs text-surface-400">
						Run an analysis with more data to get personalized advisor insights.
					</div>
				)}
			</div>

			{/* Top Priority callout */}
			{allInsights.length > 0 && (
				<div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
					<div className="flex items-center gap-2 mb-1.5">
						<Star size={14} className="text-indigo-600" />
						<h3 className="text-xs font-semibold text-indigo-700">
							Top Priority This Week
						</h3>
					</div>
					<p className="text-sm text-surface-700 mb-1 font-medium">
						{allInsights[0].title}
					</p>
					<p className="text-xs text-surface-600 leading-relaxed">
						{allInsights[0].recommendation}
					</p>
				</div>
			)}
		</div>
	);
}

/* ── Advisor Insight Card ── */
function AdvisorInsightCard({ insight, index, expanded, onToggle }) {
	if (!insight) return null;
	const sevConfig = {
		critical: {
			bg: "bg-red-50 border-red-200",
			dot: "bg-red-500",
			tag: "Urgent",
			tagBg: "bg-red-100 text-red-700",
		},
		high: {
			bg: "bg-amber-50 border-amber-200",
			dot: "bg-amber-500",
			tag: "Important",
			tagBg: "bg-amber-100 text-amber-700",
		},
		moderate: {
			bg: "bg-indigo-50 border-indigo-200",
			dot: "bg-indigo-500",
			tag: "Insight",
			tagBg: "bg-indigo-100 text-indigo-700",
		},
		low: {
			bg: "bg-green-50 border-green-200",
			dot: "bg-green-500",
			tag: "Good News",
			tagBg: "bg-green-100 text-green-700",
		},
		info: {
			bg: "bg-blue-50 border-blue-200",
			dot: "bg-blue-500",
			tag: "Info",
			tagBg: "bg-blue-100 text-blue-700",
		},
	};
	const cfg = sevConfig[insight.severity] || sevConfig.moderate;
	const uid = (insight.title || "") + index;
	const isOpen = expanded === uid;

	return (
		<div
			className={`rounded-xl border p-4 transition-all hover:shadow-sm ${cfg.bg}`}
		>
			<div
				className="flex items-start gap-3 cursor-pointer"
				onClick={() => onToggle(isOpen ? null : uid)}
			>
				<div
					className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${cfg.dot}`}
				/>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1 flex-wrap">
						<span
							className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.tagBg}`}
						>
							{cfg.tag}
						</span>
					</div>
					<p className="text-sm font-medium text-surface-800 leading-snug">
						{insight.title}
					</p>
					<p className="text-xs text-surface-600 mt-1 leading-relaxed">
						{insight.description}
					</p>
				</div>
				{isOpen ? (
					<ChevronUp size={16} className="text-surface-400 shrink-0 mt-1" />
				) : (
					<ChevronDown size={16} className="text-surface-400 shrink-0 mt-1" />
				)}
			</div>
			{isOpen && insight.recommendation && (
				<div className="mt-3 ml-5 pl-3 border-l-2 border-surface-300">
					<p className="text-xs font-semibold text-surface-700 mb-1 flex items-center gap-1.5">
						<Zap size={12} className="text-amber-500" /> Recommended Action
					</p>
					<p className="text-xs text-surface-600 leading-relaxed">
						{insight.recommendation}
					</p>
				</div>
			)}
		</div>
	);
}
