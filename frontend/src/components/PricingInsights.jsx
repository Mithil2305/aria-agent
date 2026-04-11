import { useState, useEffect } from "react";
import {
	IndianRupee,
	TrendingUp,
	ArrowUp,
	Loader2,
	RefreshCw,
	Target,
	Zap,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { saveSectionReport } from "../services/reportMemory";

const API_BASE = `${window.location.protocol}//${window.location.hostname}:8000`;

const PRIORITY_STYLES = {
	high: {
		bg: "bg-red-50",
		border: "border-red-200",
		badge: "bg-red-100 text-red-700",
		label: "HIGH IMPACT",
	},
	medium: {
		bg: "bg-amber-50",
		border: "border-amber-200",
		badge: "bg-amber-100 text-amber-700",
		label: "MEDIUM",
	},
	low: {
		bg: "bg-green-50",
		border: "border-green-200",
		badge: "bg-green-100 text-green-700",
		label: "LOW",
	},
};

export default function PricingInsights({ token, analysisReady }) {
	const { user } = useAuth();
	const [insights, setInsights] = useState([]);
	const [loading, setLoading] = useState(false);

	const fetchInsights = async () => {
		if (!analysisReady) return;
		setLoading(true);
		try {
			const { data } = await axios.post(
				`${API_BASE}/api/pricing-insights`,
				{},
				{ headers: token ? { Authorization: `Bearer ${token}` } : {} },
			);
			setInsights(data.insights || []);
			const top = (data.insights || [])[0] || {};
			saveSectionReport(user, "pricing_insights", {
				summary: `Generated ${(data.insights || []).length} pricing insights`,
				top_issue: top.title || null,
				action: top.action || null,
				trend: top.priority || null,
			}).catch(() => {});
		} catch (err) {
			console.error("Pricing insights failed:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (analysisReady) fetchInsights();
	}, [analysisReady]);

	if (!analysisReady || loading) {
		if (loading) {
			return (
				<div className="card p-5 flex items-center gap-3">
					<Loader2 size={16} className="animate-spin text-indigo-500" />
					<span className="text-sm text-surface-500">Analysing pricing…</span>
				</div>
			);
		}
		return null;
	}

	if (!insights.length) return null;

	return (
		<div className="card p-5">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<IndianRupee size={16} className="text-indigo-500" />
					<h3 className="text-sm font-semibold text-surface-900">
						Pricing & Margin Opportunities
					</h3>
				</div>
				<button
					onClick={fetchInsights}
					className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 transition-colors"
				>
					<RefreshCw size={12} />
				</button>
			</div>

			<p className="text-xs text-surface-500 mb-4">
				Based on your data and market benchmarks — here's how to improve
				margins.
			</p>

			<div className="space-y-3">
				{insights.map((insight, i) => {
					const style =
						PRIORITY_STYLES[insight.priority] || PRIORITY_STYLES.medium;

					return (
						<div
							key={i}
							className={`rounded-xl border p-4 ${style.bg} ${style.border}`}
						>
							<div className="flex items-start gap-3">
								<span className="text-xl leading-none shrink-0 mt-0.5">
									{insight.icon}
								</span>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1.5 flex-wrap">
										<span
											className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${style.badge}`}
										>
											{style.label}
										</span>
									</div>
									<p className="text-sm font-semibold text-surface-800 leading-snug mb-1">
										{insight.title}
									</p>
									<p className="text-xs text-surface-600 mb-2 leading-relaxed">
										{insight.detail}
									</p>

									<div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white border border-surface-200">
										<Zap size={11} className="text-amber-500 shrink-0 mt-0.5" />
										<p className="text-xs text-surface-700 font-medium leading-relaxed">
											{insight.action}
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
