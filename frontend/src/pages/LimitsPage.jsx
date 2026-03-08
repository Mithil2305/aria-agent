import { useState, useEffect, useCallback } from "react";
import {
	Gauge,
	Lightbulb,
	Crown,
	ScanLine,
	Upload,
	BarChart3,
	FileText,
	CalendarClock,
	RefreshCw,
	Loader2,
	AlertCircle,
	CheckCircle2,
	Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getLimitsDashboard, CATEGORIES } from "../services/usageLimits";

const ICON_MAP = {
	lightbulb: Lightbulb,
	crown: Crown,
	scan: ScanLine,
	upload: Upload,
	"bar-chart": BarChart3,
	"file-text": FileText,
};

const COLOR_MAP = {
	ai_strategy: {
		bg: "bg-amber-50",
		text: "text-amber-600",
		bar: "bg-amber-500",
		ring: "ring-amber-200",
	},
	ai_premium: {
		bg: "bg-purple-50",
		text: "text-purple-600",
		bar: "bg-purple-500",
		ring: "ring-purple-200",
	},
	bill_scan: {
		bg: "bg-sky-50",
		text: "text-sky-600",
		bar: "bg-sky-500",
		ring: "ring-sky-200",
	},
	data_upload: {
		bg: "bg-indigo-50",
		text: "text-indigo-600",
		bar: "bg-indigo-500",
		ring: "ring-indigo-200",
	},
	analysis: {
		bg: "bg-emerald-50",
		text: "text-emerald-600",
		bar: "bg-emerald-500",
		ring: "ring-emerald-200",
	},
	report_download: {
		bg: "bg-rose-50",
		text: "text-rose-600",
		bar: "bg-rose-500",
		ring: "ring-rose-200",
	},
};

export default function LimitsPage() {
	const { user } = useAuth();
	const [limitsData, setLimitsData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchLimits = useCallback(async () => {
		if (!user) return;
		setLoading(true);
		setError(null);
		try {
			const data = await getLimitsDashboard(user.uid);
			setLimitsData(data);
		} catch (err) {
			setError(err?.message || "Failed to load usage limits.");
		} finally {
			setLoading(false);
		}
	}, [user]);

	useEffect(() => {
		fetchLimits();
	}, [fetchLimits]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 size={24} className="text-gold-600 animate-spin" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen py-10 px-6">
				<div className="max-w-3xl mx-auto">
					<div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
						<AlertCircle size={16} />
						{error}
					</div>
				</div>
			</div>
		);
	}

	const { usage, categories, month, daysRemaining, resetDate } =
		limitsData || {};

	// Overall usage percentage
	const totalUsed = Object.values(usage || {}).reduce((s, u) => s + u.used, 0);
	const totalLimit = Object.values(usage || {}).reduce(
		(s, u) => s + u.limit,
		0,
	);
	const overallPct =
		totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;

	return (
		<div className="min-h-screen py-10 px-6">
			<div className="max-w-4xl mx-auto">
				{/* Page header */}
				<div className="mb-8">
					<h1 className="text-xl font-semibold text-surface-900 mb-1 flex items-center gap-3">
						<div className="p-2 rounded-lg bg-amber-50">
							<Gauge size={20} className="text-amber-600" />
						</div>
						Usage & Limits
					</h1>
					<p className="text-sm text-surface-500 ml-12">
						Monitor your monthly usage across all Yukti features.
					</p>
				</div>

				{/* Overview cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
					{/* Billing Period */}
					<div className="card p-5">
						<div className="flex items-center gap-2 mb-2">
							<CalendarClock size={14} className="text-indigo-600" />
							<span className="text-[11px] font-medium text-surface-400 uppercase tracking-wider">
								Period
							</span>
						</div>
						<p className="text-lg font-semibold text-surface-900">
							{month || "—"}
						</p>
						<p className="text-[11px] text-surface-400 mt-0.5">
							{daysRemaining} day{daysRemaining !== 1 ? "s" : ""} until reset
							{resetDate && ` (${resetDate})`}
						</p>
					</div>

					{/* Overall Usage */}
					<div className="card p-5">
						<div className="flex items-center gap-2 mb-2">
							<Users size={14} className="text-emerald-600" />
							<span className="text-[11px] font-medium text-surface-400 uppercase tracking-wider">
								Overall Usage
							</span>
						</div>
						<p
							className={`text-lg font-semibold ${overallPct > 80 ? "text-red-600" : overallPct > 50 ? "text-amber-600" : "text-green-600"}`}
						>
							{overallPct}%
						</p>
						<div className="w-full h-1.5 bg-surface-100 rounded-full mt-2 overflow-hidden">
							<div
								className={`h-full rounded-full transition-all duration-500 ${overallPct > 80 ? "bg-red-500" : overallPct > 50 ? "bg-amber-500" : "bg-green-500"}`}
								style={{ width: `${Math.min(overallPct, 100)}%` }}
							/>
						</div>
					</div>
				</div>

				{/* Usage breakdown */}
				<div className="card-elevated p-6 mb-6">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-sm font-semibold text-surface-900">
							Feature Usage Breakdown
						</h2>
						<button
							onClick={fetchLimits}
							className="flex items-center gap-1.5 text-[11px] font-medium text-surface-400 hover:text-surface-600 transition-colors"
						>
							<RefreshCw size={12} />
							Refresh
						</button>
					</div>

					<div className="space-y-5">
						{Object.entries(usage || {}).map(([key, data]) => {
							const cat = categories?.[key] || {};
							const colors = COLOR_MAP[key] || COLOR_MAP.analysis;
							const IconComp = ICON_MAP[cat.icon] || BarChart3;
							const pct = data.percentage || 0;
							const isNearLimit = pct >= 80;
							const isAtLimit = data.remaining === 0;

							return (
								<div key={key} className="group">
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-3">
											<div className={`p-2 rounded-lg ${colors.bg}`}>
												<IconComp size={14} className={colors.text} />
											</div>
											<div>
												<p className="text-[13px] font-medium text-surface-800">
													{cat.label || key}
												</p>
												<p className="text-[10px] text-surface-400">
													{cat.description || ""}
												</p>
											</div>
										</div>
										<div className="text-right">
											<p
												className={`text-sm font-semibold tabular-nums ${isAtLimit ? "text-red-600" : isNearLimit ? "text-amber-600" : "text-surface-800"}`}
											>
												{data.used}
												<span className="text-surface-400 font-normal">
													{" "}
													/ {data.limit}
												</span>
											</p>
											<p className="text-[10px] text-surface-400">
												{data.remaining} remaining
											</p>
										</div>
									</div>

									{/* Progress bar */}
									<div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
										<div
											className={`h-full rounded-full transition-all duration-500 ${isAtLimit ? "bg-red-500" : isNearLimit ? "bg-amber-400" : colors.bar}`}
											style={{ width: `${Math.min(pct, 100)}%` }}
										/>
									</div>

									{/* Warning */}
									{isAtLimit && (
										<div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-red-500 font-medium">
											<AlertCircle size={11} />
											Monthly limit reached — resets {resetDate}
										</div>
									)}
									{isNearLimit && !isAtLimit && (
										<div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-amber-500 font-medium">
											<AlertCircle size={11} />
											Approaching limit — {data.remaining} left
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Info card */}
				<div className="card p-5">
					<div className="flex items-start gap-3">
						<div className="p-2 rounded-lg bg-indigo-50 mt-0.5">
							<CheckCircle2 size={14} className="text-indigo-600" />
						</div>
						<div>
							<p className="text-sm font-medium text-surface-800 mb-1">
								About Rate Limits
							</p>
							<ul className="text-[12px] text-surface-500 space-y-1">
								<li>
									• All usage limits reset automatically on the{" "}
									<strong>1st of each month</strong>.
								</li>
								<li>
									• AI-powered features (Strategy Advisor, Premium Analysis,
									Bill Scanner) have lower limits to ensure fast response times
									for everyone.
								</li>
								<li>
									• If you hit a limit, your data and history remain intact —
									you can continue using the feature next month.
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
