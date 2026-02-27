import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

export default function KPICards({ kpis, expanded }) {
	if (!kpis || kpis.length === 0) return null;

	const displayed = expanded ? kpis : kpis.slice(0, 6);

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{displayed.map((kpi, idx) => (
				<KPICard key={kpi.column || idx} kpi={kpi} index={idx} />
			))}
		</div>
	);
}

function KPICard({ kpi, index }) {
	const isPositive = kpi.change > 0;
	const isNeutral = Math.abs(kpi.change) < 2;
	const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
	const trendColor = isNeutral
		? "text-slate-400"
		: isPositive
			? "text-emerald-400"
			: "text-rose-400";
	const trendBg = isNeutral
		? "bg-slate-500/10"
		: isPositive
			? "bg-emerald-500/10"
			: "bg-rose-500/10";

	const trendWord =
		kpi.trend === "rising"
			? "Growing"
			: kpi.trend === "falling"
				? "Declining"
				: "Stable";

	return (
		<div
			className="glass rounded-xl p-5 hover:border-slate-600/50 transition-all group animate-fade-in-up opacity-0"
			style={{ animationDelay: `${index * 60}ms` }}
		>
			{/* Header: Label + Trend Badge */}
			<div className="flex items-start justify-between mb-3">
				<div className="flex-1 min-w-0">
					<p className="text-xs text-slate-400 font-medium mb-1 truncate">
						{kpi.label}
					</p>
					<p className="text-2xl font-bold text-white tracking-tight">
						{formatValue(kpi.current)}
					</p>
				</div>
				<div
					className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${trendBg} shrink-0`}
				>
					<TrendIcon size={13} className={trendColor} />
					<span className={`text-xs font-semibold ${trendColor}`}>
						{kpi.change > 0 ? "+" : ""}
						{kpi.change}%
					</span>
				</div>
			</div>

			{/* Context row */}
			<div className="flex items-center justify-between text-[11px] mb-3">
				<span className={`font-medium ${trendColor}`}>{trendWord}</span>
				<span className="text-slate-500">Avg: {formatValue(kpi.mean)}</span>
			</div>

			{/* Confidence bar with label */}
			<div>
				<div className="flex items-center justify-between mb-1">
					<span className="text-[10px] text-slate-500 flex items-center gap-1">
						<Activity size={9} className="text-slate-600" />
						Reliability
					</span>
					<span className="text-[10px] text-slate-500">
						{(kpi.confidence * 100).toFixed(0)}%
					</span>
				</div>
				<div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
					<div
						className={`h-full rounded-full transition-all duration-1000 ${
							kpi.confidence > 0.8
								? "bg-emerald-500"
								: kpi.confidence > 0.6
									? "bg-amber-500"
									: "bg-rose-500"
						}`}
						style={{ width: `${kpi.confidence * 100}%` }}
					/>
				</div>
			</div>
		</div>
	);
}

function formatValue(num) {
	if (num === null || num === undefined) return "—";
	if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
	if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K";
	if (Number.isInteger(num)) return num.toLocaleString();
	return num.toFixed(2);
}
