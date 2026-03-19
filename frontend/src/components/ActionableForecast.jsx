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
			setForecasts(cards);
			saveSectionReport(user, "forecast_actions", {
				summary: `Generated ${cards.length} forecast action cards`,
				top_issue: cards[0]?.headline || null,
				action: cards[0]?.action || null,
				trend: cards[0]?.urgency || null,
			}).catch(() => {});
		} catch (err) {
			console.error("Forecast actions failed:", err);
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

	if (!forecasts.length) return null;

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
