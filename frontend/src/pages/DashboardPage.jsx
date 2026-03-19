import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import ReportHistory from "../components/ReportHistory";
import SmartAlerts from "../components/SmartAlerts";
import BusinessChat from "../components/BusinessChat";
import WeeklyDigest from "../components/WeeklyDigest";
import MarketBenchmark from "../components/MarketBenchmark";
import ActionableForecast from "../components/ActionableForecast";
import PricingInsights from "../components/PricingInsights";
import { useAuth } from "../contexts/AuthContext";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { getBusinessCategory } from "../config/businessTypes";
import {
	TrendingUp,
	Target,
	Lightbulb,
	ArrowRight,
	Sparkles,
	Calendar,
	ShoppingCart,
	BarChart3,
	MessageCircle,
	Bell,
	Award,
	Zap,
	Brain,
} from "lucide-react";

/**
 * DashboardPage — AI Business Decision System
 * Shows analysis results OR a welcoming empty state.
 * The AI Advisor section integrates all new smart features.
 */
export default function DashboardPage() {
	const [analysis, setAnalysis] = useState(null);
	const [rowCount, setRowCount] = useState(0);
	const [savedReports, setSavedReports] = useState([]);
	const [reportsLoading, setReportsLoading] = useState(false);
	const [advisorTab, setAdvisorTab] = useState("alerts");
	const [token, setToken] = useState(null);
	const navigate = useNavigate();
	const { user, userProfile, getIdToken } = useAuth();

	// Load current session analysis
	useEffect(() => {
		const stored = sessionStorage.getItem("yukti_analysis");
		const storedRows = sessionStorage.getItem("yukti_rowCount");
		if (stored) {
			try {
				setAnalysis(JSON.parse(stored));
				setRowCount(Number(storedRows) || 0);
			} catch {
				// Invalid JSON — ignore
			}
		}
	}, []);

	// Fetch token for API calls
	useEffect(() => {
		if (user) {
			getIdToken()
				.then(setToken)
				.catch(() => {});
		}
	}, [user, getIdToken]);

	// Fetch saved reports from Firestore
	useEffect(() => {
		if (!user) return;
		let cancelled = false;
		const fetchReports = async () => {
			setReportsLoading(true);
			try {
				const q = query(
					collection(db, "users", user.uid, "reports"),
					orderBy("createdAt", "desc"),
					limit(20),
				);
				const snap = await getDocs(q);
				if (!cancelled) {
					setSavedReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
				}
			} catch {
				// Silent
			} finally {
				if (!cancelled) setReportsLoading(false);
			}
		};
		fetchReports();
		return () => {
			cancelled = true;
		};
	}, [user]);

	const handleReset = () => {
		sessionStorage.removeItem("yukti_analysis");
		sessionStorage.removeItem("yukti_rowCount");
		setAnalysis(null);
		navigate("/analyse");
	};

	const handleLoadReport = (report) => {
		try {
			const data = JSON.parse(report.analysisData);
			setAnalysis(data);
			setRowCount(report.rowCount || data.row_count || 0);
			sessionStorage.setItem("yukti_analysis", report.analysisData);
			sessionStorage.setItem("yukti_rowCount", String(report.rowCount || 0));
		} catch {
			// Invalid data
		}
	};

	const handleDeleteReport = (reportId) => {
		setSavedReports((prev) => prev.filter((r) => r.id !== reportId));
	};

	const category = getBusinessCategory(userProfile?.businessType || "");
	const analysisReady = !!analysis;

	const ADVISOR_TABS = [
		{ key: "alerts", label: "Smart Alerts", icon: Bell },
		{ key: "chat", label: "Ask Yukti", icon: MessageCircle },
		{ key: "forecast", label: "What to Expect", icon: TrendingUp },
		{ key: "pricing", label: "Pricing Tips", icon: Zap },
		{ key: "benchmark", label: "Market Compare", icon: Award },
		{ key: "digest", label: "Weekly Digest", icon: Calendar },
	];

	// ── If we have analysis data, show the full dashboard ──
	if (analysis) {
		const kpis = analysis.kpis || [];

		return (
			<div>
				<Dashboard
					analysis={analysis}
					rowCount={rowCount}
					onReset={handleReset}
					token={token}
					analysisReady={analysisReady}
				/>

				{/* ── AI BUSINESS ADVISOR SECTION ── */}
				<div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-12">
					<div className="mb-6">
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50">
								<Brain size={20} className="text-indigo-600" />
							</div>
							<div>
								<h2 className="text-lg font-semibold text-surface-900">
									AI Business Advisor
								</h2>
								<p className="text-xs text-surface-500">
									Real actions, not just charts. Yukti tells you exactly what to
									do.
								</p>
							</div>
							<span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-600 text-[10px] font-semibold">
								<Sparkles size={10} />
								AI-Powered
							</span>
						</div>
					</div>

					{/* Advisor Tab Navigation */}
					<div className="flex gap-1 bg-surface-100 rounded-xl p-1 mb-6 overflow-x-auto">
						{ADVISOR_TABS.map((tab) => {
							const TabIcon = tab.icon;
							const isActive = advisorTab === tab.key;
							return (
								<button
									key={tab.key}
									onClick={() => setAdvisorTab(tab.key)}
									className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
										isActive
											? "bg-white shadow-sm text-indigo-600 border border-surface-300"
											: "text-surface-500 hover:text-surface-700 hover:bg-white/60"
									}`}
								>
									<TabIcon
										size={13}
										className={
											isActive ? "text-indigo-500" : "text-surface-400"
										}
									/>
									{tab.label}
								</button>
							);
						})}
					</div>

					{/* Tab Content */}
					<div className="animate-fade-in-up">
						{advisorTab === "alerts" && (
							<SmartAlerts token={token} analysisReady={analysisReady} />
						)}
						{advisorTab === "chat" && (
							<BusinessChat
								token={token}
								category={category}
								analysisReady={analysisReady}
							/>
						)}
						{advisorTab === "forecast" && (
							<ActionableForecast token={token} analysisReady={analysisReady} />
						)}
						{advisorTab === "pricing" && (
							<PricingInsights token={token} analysisReady={analysisReady} />
						)}
						{advisorTab === "benchmark" && (
							<MarketBenchmark token={token} category={category} kpis={kpis} />
						)}
						{advisorTab === "digest" && (
							<WeeklyDigest token={token} analysisReady={analysisReady} />
						)}
					</div>
				</div>

				{/* Past Reports */}
				{savedReports.length > 1 && (
					<div className="max-w-[1200px] mx-auto px-6 pb-10">
						<ReportHistory
							reports={savedReports.filter(
								(r) => r.analysisData !== JSON.stringify(analysis),
							)}
							loading={false}
							onLoadReport={handleLoadReport}
							onDelete={handleDeleteReport}
						/>
					</div>
				)}
			</div>
		);
	}

	// ── Empty / Welcome state ──
	const businessName = userProfile?.businessName;
	const greeting = businessName
		? `Welcome back, ${businessName}`
		: "Welcome to Yukti";

	return (
		<div className="min-h-screen py-10 px-6">
			<div className="max-w-4xl mx-auto">
				{/* Hero greeting */}
				<div className="mb-12 animate-fade-in-up">
					<h1 className="text-2xl font-semibold text-surface-900 mb-2">
						{greeting}
					</h1>
					<p className="text-surface-500 text-sm max-w-lg">
						Your AI business decision system. Track daily metrics or import data
						to unlock forecasts, smart alerts, pricing tips, and what-to-do-next
						recommendations.
					</p>
				</div>

				{/* Quick action cards — Daily Log FIRST */}
				<div
					className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14 animate-fade-in-up"
					style={{ animationDelay: "80ms" }}
				>
					<button
						onClick={() => navigate("/daily-log")}
						className="group card-hover p-6 text-left"
					>
						<div className="flex items-center gap-3 mb-3">
							<div className="p-2.5 rounded-lg bg-gold-50">
								<Calendar size={20} className="text-gold-600" />
							</div>
							<div>
								<h3 className="text-base font-medium text-surface-900">
									Daily Log Entry
								</h3>
								<p className="text-xs text-surface-400">
									Revenue, customers, expenses
								</p>
							</div>
						</div>
						<p className="text-sm text-surface-500 mb-4">
							Record today's sales, footfall, expenses, and inventory — build
							your business intelligence over time.
						</p>
						<span className="flex items-center gap-1 text-xs text-gold-600 font-medium group-hover:gap-2 transition-all">
							Log Today <ArrowRight size={14} />
						</span>
					</button>

					<button
						onClick={() => navigate("/analyse")}
						className="group card-hover p-6 text-left"
					>
						<div className="flex items-center gap-3 mb-3">
							<div className="p-2.5 rounded-lg bg-surface-100">
								<BarChart3 size={20} className="text-surface-500" />
							</div>
							<div>
								<h3 className="text-base font-medium text-surface-900">
									Analyse & Get Advice
								</h3>
								<p className="text-xs text-surface-400">
									AI tells you what to do next
								</p>
							</div>
						</div>
						<p className="text-sm text-surface-500 mb-4">
							Run AI analysis on your logs or CSV data — get smart alerts,
							pricing tips, forecast warnings, and a chat advisor.
						</p>
						<span className="flex items-center gap-1 text-xs text-surface-500 font-medium group-hover:gap-2 transition-all">
							Start Analysis <ArrowRight size={14} />
						</span>
					</button>
				</div>

				{/* What Yukti does for you */}
				<div className="animate-fade-in-up" style={{ animationDelay: "160ms" }}>
					<h2 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-5">
						Yukti Acts Like Your Business Advisor
					</h2>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
						{[
							{
								icon: Bell,
								label: "Smart Alerts",
								desc: "⚠️ Sales dropped 18% this week. Here's what to do.",
							},
							{
								icon: MessageCircle,
								label: "Ask Anything",
								desc: '"Which day has lowest sales?" → Monday. Run combo deals.',
							},
							{
								icon: TrendingUp,
								label: "Forecast Actions",
								desc: "Stock will run out in 4 days. Order now.",
							},
							{
								icon: Zap,
								label: "Pricing Tips",
								desc: "Your margin is 18%. Market avg is 28%. Here's how to close the gap.",
							},
							{
								icon: Award,
								label: "Market Compare",
								desc: "Your basket size vs. similar businesses in your area.",
							},
							{
								icon: Calendar,
								label: "Weekly Digest",
								desc: "Revenue up 12%. Top action: promote Paneer Tikka combo.",
							},
						].map((feature) => {
							const Icon = feature.icon;
							return (
								<div key={feature.label} className="card p-4">
									<div className="inline-flex p-2 rounded-lg bg-indigo-50 mb-2">
										<Icon
											size={15}
											className="text-indigo-600"
											strokeWidth={1.5}
										/>
									</div>
									<h3 className="text-sm font-medium text-surface-800 mb-1">
										{feature.label}
									</h3>
									<p className="text-[11px] text-surface-500 leading-relaxed">
										{feature.desc}
									</p>
								</div>
							);
						})}
					</div>
				</div>

				{/* Subtle branding */}
				<div className="mt-16 text-center">
					<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-200 border border-surface-300">
						<Sparkles size={11} className="text-gold-500" />
						<span className="text-[11px] text-surface-500">
							Yukti — AI Business Decision System
						</span>
					</div>
				</div>

				{/* Past Reports */}
				{(savedReports.length > 0 || reportsLoading) && (
					<div
						className="mt-12 animate-fade-in-up"
						style={{ animationDelay: "240ms" }}
					>
						<ReportHistory
							reports={savedReports}
							loading={reportsLoading}
							onLoadReport={handleLoadReport}
							onDelete={handleDeleteReport}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
