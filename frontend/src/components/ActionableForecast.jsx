import { useState, useEffect } from "react";
import {
	TrendingUp,
	TrendingDown,
	ArrowRight,
	Zap,
	AlertTriangle,
	Loader2,
	RefreshCw,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { saveSectionReport } from "../services/reportMemory";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getStoredAnalysis() {
	try {
		const raw = sessionStorage.getItem("yukti_analysis");
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

function formatValue(label, value) {
	if (value == null || value === "") return "--";
	const lower = String(label || "").toLowerCase();
	const numeric = Number(value);
	if (!Number.isFinite(numeric)) return String(value);
	if (
		["revenue", "sales", "income", "expense", "cost", "profit"].some((k) =>
			lower.includes(k),
		)
	) {
		return `Rs ${numeric.toLocaleString("en-IN")}`;
	}
	return numeric.toLocaleString("en-IN");
}

function buildFallbackForecasts(analysis) {
	if (!analysis) return [];
	const fromPredictions = (analysis.forecasts || []).slice(0, 4).map((fc) => {
		const growth = Number(fc.growth_rate ?? fc.growthRate ?? 0);
		const trend = fc.trend || "flat";
		const nextValue = fc.forecast?.[0]?.predicted;
		const label = fc.label || fc.column || "Business metric";

		if (trend === "downward" && growth < -5) {
			return {
				type: "warning",
				icon: "⚠",
				headline: `${label} may dip by ${Math.abs(growth).toFixed(0)}% soon`,
				detail: `Projected next value: ${formatValue(label, nextValue)}`,
				action:
					"Run a short promotion and trim non-essential spend for the next cycle.",
				urgency: "high",
			};
		}

		if (trend === "upward" && growth > 5) {
			return {
				type: "opportunity",
				icon: "↗",
				headline: `${label} is trending up by ${growth.toFixed(0)}%`,
				detail: `Projected next value: ${formatValue(label, nextValue)}`,
				action: "Increase ready stock and staffing to capture this upside.",
				urgency: "medium",
			};
		}

		return {
			type: "neutral",
			icon: "→",
			headline: `${label} is likely to stay steady`,
			detail: `Projected next value: ${formatValue(label, nextValue)}`,
			action: "Test one focused experiment this week to break the plateau.",
			urgency: "low",
		};
	});

	if (fromPredictions.length > 0) return fromPredictions;

	const topInsight = analysis.insights?.[0];
	if (!topInsight) return [];

	return [
		{
			type: "neutral",
			icon: "→",
			headline: topInsight.title || "Near-term outlook is stable",
			detail:
				"Forecast-specific signals are limited, using your latest analysis insights.",
			action:
				topInsight.recommendation ||
				"Keep tracking daily data to unlock richer forecasts.",
			urgency: "low",
		},
	];
}

const TYPE_STYLES = {
	warning: {
		bg: "bg-amber-50",
		border: "border-amber-300",
		icon: AlertTriangle,
		iconColor: "text-amber-500",
		badge: "bg-amber-100 text-amber-700",
		badgeText: "ACTION NEEDED",
	},
	opportunity: {
		bg: "bg-green-50",
		border: "border-green-200",
		icon: TrendingUp,
		iconColor: "text-green-500",
		badge: "bg-green-100 text-green-700",
		badgeText: "OPPORTUNITY",
	},
	neutral: {
		bg: "bg-surface-50",
		border: "border-surface-200",
		icon: ArrowRight,
		iconColor: "text-surface-400",
		badge: "bg-surface-100 text-surface-500",
		badgeText: "STEADY",
	},
};

const URGENCY_DOTS = {
	high: "bg-red-500",
	medium: "bg-amber-400",
	low: "bg-green-400",
};

export default function ActionableForecast({ token, analysisReady }) {
	const { user } = useAuth();
	const [forecasts, setForecasts] = useState([]);
	const [loading, setLoading] = useState(false);

	const fetchForecasts = async () => {
		if (!analysisReady) return;
		setLoading(true);
		try {
			const { data } = await axios.post(
				`${API_BASE}/api/forecast-actions`,
				{},
				{ headers: token ? { Authorization: `Bearer ${token}` } : {} },
			);
			const cards = data.forecast_actions || data.actions || [];
			setForecasts(
				cards.length > 0 ? cards : buildFallbackForecasts(getStoredAnalysis()),
			);
			saveSectionReport(user, "forecast_actions", {
				summary: `Generated ${cards.length} forecast action cards`,
				top_issue: cards[0]?.headline || null,
				action: cards[0]?.action || null,
				trend: cards[0]?.urgency || null,
			}).catch(() => {});
		} catch (err) {
			console.error("Forecast actions failed:", err);
			setForecasts(buildFallbackForecasts(getStoredAnalysis()));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (analysisReady) fetchForecasts();
	}, [analysisReady]);

	if (!analysisReady) return null;

	if (loading) {
		return (
			<div className="card p-5 flex items-center gap-3">
				<Loader2 size={16} className="animate-spin text-indigo-500" />
				<span className="text-sm text-surface-500">
					Analysing forecast trends…
				</span>
			</div>
		);
	}

	if (!forecasts.length) {
		return (
			<div className="card p-5">
				<p className="text-sm text-surface-600">
					No forecast cards yet. Add a few more days of logs to unlock What to
					Expect insights.
				</p>
			</div>
		);
	}

	return (
		<div className="card p-5">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<TrendingUp size={16} className="text-indigo-500" />
					<h3 className="text-sm font-semibold text-surface-900">
						What to Expect Next
					</h3>
				</div>
				<button
					onClick={fetchForecasts}
					className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 transition-colors"
				>
					<RefreshCw size={12} />
				</button>
			</div>

			<p className="text-xs text-surface-500 mb-4">
				Based on your data trends — here's what's coming and what to do about
				it.
			</p>

			<div className="space-y-3">
				{forecasts.map((fc, i) => {
					const style = TYPE_STYLES[fc.type] || TYPE_STYLES.neutral;
					const Icon = style.icon;

					return (
						<div
							key={i}
							className={`rounded-xl border p-4 ${style.bg} ${style.border}`}
						>
							<div className="flex items-start gap-3">
								<div className="flex items-center gap-1.5 shrink-0 mt-0.5">
									<span
										className={`w-2 h-2 rounded-full ${URGENCY_DOTS[fc.urgency] || "bg-surface-400"}`}
									/>
									<span className="text-lg leading-none">{fc.icon}</span>
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1.5 flex-wrap">
										<span
											className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${style.badge}`}
										>
											{style.badgeText}
										</span>
									</div>
									<p className="text-sm font-semibold text-surface-800 leading-snug mb-1">
										{fc.headline}
									</p>
									<p className="text-xs text-surface-600 mb-2">{fc.detail}</p>

									{/* Action box */}
									<div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white border border-surface-200">
										<Zap size={11} className="text-amber-500 shrink-0 mt-0.5" />
										<p className="text-xs text-surface-700 font-medium leading-relaxed">
											{fc.action}
										</p>
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
