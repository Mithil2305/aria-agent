import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import { useAuth } from "../contexts/AuthContext";
import {
	LayoutDashboard,
	Upload,
	TrendingUp,
	Target,
	Lightbulb,
	Users,
	ArrowRight,
	BarChart3,
	Sparkles,
	Calendar,
} from "lucide-react";

/**
 * DashboardPage – either shows analysis results or a welcoming empty state
 * that guides the user to upload data or enter daily logs.
 */
export default function DashboardPage() {
	const [analysis, setAnalysis] = useState(null);
	const [rowCount, setRowCount] = useState(0);
	const navigate = useNavigate();
	const { userProfile } = useAuth();

	useEffect(() => {
		const stored = sessionStorage.getItem("aria_analysis");
		const storedRows = sessionStorage.getItem("aria_rowCount");
		if (stored) {
			try {
				setAnalysis(JSON.parse(stored));
				setRowCount(Number(storedRows) || 0);
			} catch {
				// Invalid JSON — ignore
			}
		}
	}, []);

	const handleReset = () => {
		sessionStorage.removeItem("aria_analysis");
		sessionStorage.removeItem("aria_rowCount");
		setAnalysis(null);
		navigate("/upload");
	};

	// ── If we have analysis data, show the full dashboard ──
	if (analysis) {
		return (
			<Dashboard
				analysis={analysis}
				rowCount={rowCount}
				onReset={handleReset}
			/>
		);
	}

	// ── Empty / Welcome state ──
	const greeting = userProfile?.businessName
		? `Welcome back, ${userProfile.businessName}`
		: "Welcome to ARIA";

	return (
		<div className="min-h-screen py-8 px-4">
			<div className="max-w-5xl mx-auto">
				{/* Hero greeting */}
				<div className="text-center mb-10">
					<h1 className="text-3xl font-bold text-white mb-2">{greeting}</h1>
					<p className="text-slate-400 text-sm max-w-xl mx-auto">
						Your business intelligence hub. Upload a dataset or enter daily
						metrics to unlock powerful insights, predictions, and
						recommendations.
					</p>
				</div>

				{/* Quick action cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
					<button
						onClick={() => navigate("/upload")}
						className="group glass rounded-2xl p-6 text-left hover:border-brand-500/30 transition-all duration-300"
					>
						<div className="flex items-center gap-3 mb-3">
							<div className="p-3 rounded-xl bg-brand-500/10">
								<Upload size={22} className="text-brand-400" />
							</div>
							<div>
								<h3 className="text-lg font-semibold text-white">
									Upload Dataset
								</h3>
								<p className="text-xs text-slate-500">CSV or Excel files</p>
							</div>
						</div>
						<p className="text-sm text-slate-400 mb-4">
							Import your business data for comprehensive AI-powered analysis,
							trend detection, and actionable forecasts.
						</p>
						<span className="flex items-center gap-1 text-xs text-brand-400 font-medium group-hover:gap-2 transition-all">
							Get Started <ArrowRight size={14} />
						</span>
					</button>

					<button
						onClick={() => navigate("/daily-log")}
						className="group glass rounded-2xl p-6 text-left hover:border-emerald-500/30 transition-all duration-300"
					>
						<div className="flex items-center gap-3 mb-3">
							<div className="p-3 rounded-xl bg-emerald-500/10">
								<Calendar size={22} className="text-emerald-400" />
							</div>
							<div>
								<h3 className="text-lg font-semibold text-white">
									Daily Log Entry
								</h3>
								<p className="text-xs text-slate-500">Track day-by-day</p>
							</div>
						</div>
						<p className="text-sm text-slate-400 mb-4">
							Enter daily business metrics — revenue, customers, expenses — and
							watch your trends build over time.
						</p>
						<span className="flex items-center gap-1 text-xs text-emerald-400 font-medium group-hover:gap-2 transition-all">
							Log Today <ArrowRight size={14} />
						</span>
					</button>
				</div>

				{/* Feature highlights */}
				<div className="text-center mb-6">
					<h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
						What You'll Get
					</h2>
				</div>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{[
						{
							icon: TrendingUp,
							label: "Future Predictions",
							desc: "AI forecasts for key metrics",
							color: "text-brand-400",
							bg: "bg-brand-500/10",
						},
						{
							icon: Target,
							label: "Revenue Strategy",
							desc: "Growth opportunities & tactics",
							color: "text-emerald-400",
							bg: "bg-emerald-500/10",
						},
						{
							icon: Lightbulb,
							label: "Smart Insights",
							desc: "Actionable recommendations",
							color: "text-amber-400",
							bg: "bg-amber-500/10",
						},
						{
							icon: Users,
							label: "Management View",
							desc: "Executive-ready summaries",
							color: "text-violet-400",
							bg: "bg-violet-500/10",
						},
					].map((feature) => {
						const Icon = feature.icon;
						return (
							<div
								key={feature.label}
								className="glass rounded-xl p-4 text-center"
							>
								<div
									className={`inline-flex p-2.5 rounded-lg ${feature.bg} mb-3`}
								>
									<Icon size={18} className={feature.color} />
								</div>
								<h3 className="text-sm font-semibold text-white mb-1">
									{feature.label}
								</h3>
								<p className="text-[11px] text-slate-500">{feature.desc}</p>
							</div>
						);
					})}
				</div>

				{/* Subtle branding */}
				<div className="mt-16 text-center">
					<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/30 border border-slate-700/30">
						<Sparkles size={12} className="text-brand-400" />
						<span className="text-[11px] text-slate-500">
							Powered by ARIA Decision Intelligence Engine
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
