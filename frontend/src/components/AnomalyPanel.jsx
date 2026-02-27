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
			<div className="glass rounded-xl p-6">
				<h3 className="text-sm font-semibold text-white mb-2">Alerts</h3>
				<div className="text-center py-8">
					<div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
						<CheckCircle2 size={18} className="text-emerald-400" />
					</div>
					<p className="text-sm text-slate-400">Everything looks normal</p>
					<p className="text-[10px] text-slate-600 mt-1">
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
		<div className="glass rounded-xl p-5">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className="text-sm font-semibold text-white">
						Alerts &amp; Unusual Activity
					</h3>
					<p className="text-[11px] text-slate-500 mt-0.5">
						{anomalies.length} item{anomalies.length !== 1 ? "s" : ""} need your
						attention
					</p>
				</div>
				<div className="flex items-center gap-2">
					{critical.length > 0 && (
						<span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 font-medium">
							{critical.length} Urgent
						</span>
					)}
					{high.length > 0 && (
						<span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-medium">
							{high.length} Important
						</span>
					)}
					{medium.length > 0 && (
						<span className="px-2 py-0.5 rounded-md bg-slate-500/10 border border-slate-700/20 text-[10px] text-slate-400 font-medium">
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
			bg: "bg-rose-500/5",
			border: "border-rose-500/20",
			icon: AlertCircle,
			color: "text-rose-400",
			badge: "bg-rose-500/10 text-rose-400",
			label: "Urgent",
		},
		high: {
			bg: "bg-amber-500/5",
			border: "border-amber-500/20",
			icon: AlertTriangle,
			color: "text-amber-400",
			badge: "bg-amber-500/10 text-amber-400",
			label: "Important",
		},
		medium: {
			bg: "bg-slate-500/5",
			border: "border-slate-700/30",
			icon: AlertTriangle,
			color: "text-slate-400",
			badge: "bg-slate-500/10 text-slate-400",
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
			className={`px-4 py-3 rounded-xl ${config.bg} border ${config.border} animate-fade-in-up opacity-0`}
			style={{ animationDelay: `${index * 50}ms` }}
		>
			<div className="flex items-start gap-3">
				<div
					className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${anomaly.severity === "critical" ? "bg-rose-500/10" : "bg-slate-800/50"}`}
				>
					<Icon size={14} className={config.color} />
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<p className="text-xs font-medium text-white truncate">
							{anomaly.label}
						</p>
						<span
							className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${config.badge}`}
						>
							{config.label}
						</span>
					</div>
					<p className="text-[11px] text-slate-400 leading-relaxed">
						{explanation}
					</p>
				</div>

				<div
					className={`flex items-center gap-1 shrink-0 ${isSpike ? "text-rose-400" : "text-cyan-400"}`}
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
