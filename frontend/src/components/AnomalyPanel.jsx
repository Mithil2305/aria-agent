import {
	AlertTriangle,
	AlertCircle,
	ArrowUpRight,
	ArrowDownRight,
	CheckCircle2,
} from "lucide-react";

export default function AnomalyPanel({ anomalies }) {
	if (!anomalies || anomalies.length === 0) {
		return (
			<div className="card p-6">
				<h3 className="text-sm font-medium text-surface-900 mb-2">Alerts</h3>
				<div className="text-center py-8">
					<div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center mx-auto mb-3">
						<CheckCircle2 size={18} className="text-green-500" />
					</div>
					<p className="text-sm text-surface-500">Everything looks normal</p>
					<p className="text-[10px] text-surface-400 mt-1">
						No unusual activity found in your data
					</p>
				</div>
			</div>
		);
	}

	const critical = anomalies.filter((a) => a.severity === "critical");
	const high = anomalies.filter((a) => a.severity === "high");
	const medium = anomalies.filter((a) => a.severity === "medium");

	return (
		<div className="card p-5">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className="text-sm font-medium text-surface-900">
						Alerts &amp; Unusual Activity
					</h3>
					<p className="text-[11px] text-surface-500 mt-0.5">
						{anomalies.length} item{anomalies.length !== 1 ? "s" : ""} need your
						attention
					</p>
				</div>
				<div className="flex items-center gap-2">
					{critical.length > 0 && (
						<span className="px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-[10px] text-red-500 font-medium">
							{critical.length} Urgent
						</span>
					)}
					{high.length > 0 && (
						<span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] text-amber-500 font-medium">
							{high.length} Important
						</span>
					)}
					{medium.length > 0 && (
						<span className="px-2 py-0.5 rounded-md bg-surface-100 border border-surface-300 text-[10px] text-surface-500 font-medium">
							{medium.length} Minor
						</span>
					)}
				</div>
			</div>

			<div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
				{/* Render critical first, then high, then medium */}
				{[...critical, ...high, ...medium].map((anomaly, idx) => (
					<AlertCard key={idx} anomaly={anomaly} index={idx} />
				))}
			</div>
		</div>
	);
}

function AlertCard({ anomaly, index }) {
	const severityConfig = {
		critical: {
			bg: "bg-red-50",
			border: "border-red-200",
			icon: AlertCircle,
			color: "text-red-500",
			badge: "bg-red-50 text-red-500",
			label: "Urgent",
		},
		high: {
			bg: "bg-amber-50",
			border: "border-amber-200",
			icon: AlertTriangle,
			color: "text-amber-500",
			badge: "bg-amber-50 text-amber-500",
			label: "Important",
		},
		medium: {
			bg: "bg-surface-50",
			border: "border-surface-300",
			icon: AlertTriangle,
			color: "text-surface-500",
			badge: "bg-surface-100 text-surface-500",
			label: "Minor",
		},
	};

	const config = severityConfig[anomaly.severity] || severityConfig.medium;
	const Icon = config.icon;
	const isSpike = anomaly.type === "spike";
	const DirectionIcon = isSpike ? ArrowUpRight : ArrowDownRight;

	// Build a plain-language explanation
	const devAbs = Math.abs(anomaly.deviation || 0);
	const direction = isSpike ? "higher" : "lower";
	const explanation = `${anomaly.label} was ${devAbs.toFixed(0)}% ${direction} than normal (${formatNum(anomaly.value)} vs expected ${formatNum(anomaly.expected)})`;

	return (
		<div
			className={`px-4 py-3 rounded-lg ${config.bg} border ${config.border} animate-fade-in-up opacity-0`}
			style={{ animationDelay: `${index * 50}ms` }}
		>
			<div className="flex items-start gap-3">
				<div
					className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${anomaly.severity === "critical" ? "bg-red-50" : "bg-surface-100"}`}
				>
					<Icon size={14} className={config.color} />
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<p className="text-xs font-medium text-surface-900 truncate">
							{anomaly.label}
						</p>
						<span
							className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${config.badge}`}
						>
							{config.label}
						</span>
					</div>
					<p className="text-[11px] text-surface-500 leading-relaxed">
						{explanation}
					</p>
				</div>

				<div
					className={`flex items-center gap-1 shrink-0 ${isSpike ? "text-red-500" : "text-cyan-500"}`}
				>
					<DirectionIcon size={13} />
					<span className="text-xs font-semibold">
						{anomaly.deviation > 0 ? "+" : ""}
						{anomaly.deviation}%
					</span>
				</div>
			</div>
		</div>
	);
}

function formatNum(n) {
	if (n == null) return "—";
	if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + "M";
	if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
	return Number(n).toFixed(1);
}
