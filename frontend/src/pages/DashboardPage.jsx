import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import { useAuth } from "../contexts/AuthContext";
import {
	Upload,
	TrendingUp,
	Target,
	Lightbulb,
	Users,
	ArrowRight,
	Sparkles,
	Calendar,
	ShoppingCart,
	BarChart3,
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
	const businessName = userProfile?.businessName;
	const greeting = businessName
		? `Welcome back, ${businessName}`
		: "Welcome to ARIA";

	return (
		<div className="min-h-screen py-10 px-6">
			<div className="max-w-4xl mx-auto">
				{/* Hero greeting */}
				<div className="mb-12 animate-fade-in-up">
					<h1 className="text-2xl font-semibold text-surface-100 mb-2">
						{greeting}
					</h1>
					<p className="text-surface-500 text-sm max-w-lg">
						Your business intelligence hub. Track daily metrics or import
						historical data to unlock forecasts, insights, and growth
						strategies.
					</p>
				</div>

				{/* Quick action cards — Daily Log FIRST */}
				<div
					className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14 animate-fade-in-up"
					style={{ animationDelay: "80ms" }}
				>
					{/* Primary: Daily Log */}
					<button
						onClick={() => navigate("/daily-log")}
						className="group card-hover p-6 text-left"
					>
						<div className="flex items-center gap-3 mb-3">
							<div className="p-2.5 rounded-lg bg-gold-500/10">
								<Calendar size={20} className="text-gold-400" />
							</div>
							<div>
								<h3 className="text-base font-medium text-surface-100">
									Daily Log Entry
								</h3>
								<p className="text-xs text-surface-500">
									Revenue, customers, expenses
								</p>
							</div>
						</div>
						<p className="text-sm text-surface-400 mb-4">
							Record today's sales, footfall, expenses, and inventory — watch
							your business trends build over time.
						</p>
						<span className="flex items-center gap-1 text-xs text-gold-400 font-medium group-hover:gap-2 transition-all">
							Log Today <ArrowRight size={14} />
						</span>
					</button>

					{/* Secondary: Upload */}
					<button
						onClick={() => navigate("/upload")}
						className="group card-hover p-6 text-left"
					>
						<div className="flex items-center gap-3 mb-3">
							<div className="p-2.5 rounded-lg bg-surface-800">
								<Upload size={20} className="text-surface-400" />
							</div>
							<div>
								<h3 className="text-base font-medium text-surface-100">
									Import Data
								</h3>
								<p className="text-xs text-surface-500">CSV or Excel files</p>
							</div>
						</div>
						<p className="text-sm text-surface-400 mb-4">
							Upload historical business data for comprehensive analysis, trend
							detection, and actionable forecasts.
						</p>
						<span className="flex items-center gap-1 text-xs text-surface-400 font-medium group-hover:gap-2 transition-all">
							Get Started <ArrowRight size={14} />
						</span>
					</button>
				</div>

				{/* Feature highlights */}
				<div
					className="animate-fade-in-up"
					style={{ animationDelay: "160ms" }}
				>
					<h2 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-5">
						What You'll Unlock
					</h2>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{[
							{
								icon: TrendingUp,
								label: "Sales Forecasts",
								desc: "Predict revenue & demand trends",
							},
							{
								icon: ShoppingCart,
								label: "Retail Insights",
								desc: "Basket size, footfall, shrinkage",
							},
							{
								icon: Lightbulb,
								label: "Smart Actions",
								desc: "Actionable growth recommendations",
							},
							{
								icon: BarChart3,
								label: "Executive Reports",
								desc: "At-a-glance business health",
							},
						].map((feature) => {
							const Icon = feature.icon;
							return (
								<div key={feature.label} className="card p-4 text-center">
									<div className="inline-flex p-2.5 rounded-lg bg-surface-800 mb-3">
										<Icon
											size={17}
											className="text-surface-400"
											strokeWidth={1.5}
										/>
									</div>
									<h3 className="text-sm font-medium text-surface-200 mb-0.5">
										{feature.label}
									</h3>
									<p className="text-[11px] text-surface-500">
										{feature.desc}
									</p>
								</div>
							);
						})}
					</div>
				</div>

				{/* Subtle branding */}
				<div className="mt-16 text-center">
					<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-900/60 border border-surface-800">
						<Sparkles size={11} className="text-gold-500" />
						<span className="text-[11px] text-surface-500">
							Powered by ARIA Decision Intelligence
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
