import { useState, useEffect } from "react";
import {
	AlertTriangle,
	TrendingUp,
	TrendingDown,
	Zap,
	CheckCircle2,
	ChevronRight,
	Bell,
	RefreshCw,
	Loader2,
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

export default function SmartAlerts({ token, analysisReady }) {
	const [alerts, setAlerts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [expanded, setExpanded] = useState(null);

	const fetchAlerts = async () => {
		if (!analysisReady) return;
		setLoading(true);
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
			setLoading(false);
		}
	};

	useEffect(() => {
		if (analysisReady) fetchAlerts();
	}, [analysisReady]);

	if (!analysisReady) return null;

	if (loading) {
		return (
			<div className="card p-5 flex items-center gap-3">
				<Loader2 size={16} className="animate-spin text-indigo-500" />
				<span className="text-sm text-surface-500">Scanning for alerts…</span>
			</div>
		);
	}

	if (alerts.length === 0) {
		return (
			<div className="card p-5">
				<div className="flex items-center gap-2 mb-3">
					<Bell size={16} className="text-surface-500" />
					<h3 className="text-sm font-medium text-surface-700">Smart Alerts</h3>
				</div>
				<div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
					<CheckCircle2 size={16} className="text-green-500 shrink-0" />
					<p className="text-sm text-green-700">
						All clear — no urgent issues detected in your business data.
					</p>
				</div>
			</div>
		);
	}

	const criticalCount = alerts.filter((a) => a.severity === "critical").length;
	const highCount = alerts.filter((a) => a.severity === "high").length;

	return (
		<div className="card p-5">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<Bell size={16} className="text-surface-700" />
					<h3 className="text-sm font-semibold text-surface-900">
						Smart Alerts
					</h3>
					{criticalCount > 0 && (
						<span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
							{criticalCount} URGENT
						</span>
					)}
				</div>
				<button
					onClick={fetchAlerts}
					className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 transition-colors"
					title="Refresh alerts"
				>
					<RefreshCw size={13} />
				</button>
			</div>

			<div className="space-y-2">
				{alerts.map((alert, i) => {
					const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low;
					const isOpen = expanded === alert.id;
					<div
						key={alert.id || i}
						className={`rounded-xl border transition-all ${style.bg} ${style.border}`}
					>
						<button
							onClick={() => setExpanded(isOpen ? null : alert.id)}
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
					</div>;
				})}
			</div>
		</div>
	);
}
