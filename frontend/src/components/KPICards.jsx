import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

/**
 * KPICards — Indian SMB edition
 * Shows key business numbers with ₹ formatting.
 * "Yukti Confidence: High / Medium / Low" instead of raw percentages.
 */

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
	const trendColor = isNeutral
		? "text-surface-400"
		: isPositive
			? "text-green-600"
			: "text-red-500";
	const trendBg = isNeutral
		? "bg-surface-100"
		: isPositive
			? "bg-green-50"
			: "bg-red-50";

	const trendWord =
		kpi.trend === "rising"
			? "Growing"
			: kpi.trend === "falling"
				? "Declining"
				: "Steady";

	// Confidence: High / Medium / Low instead of raw %
	const conf = kpi.confidence || 0;
	const confLabel = conf > 0.8 ? "High" : conf > 0.5 ? "Medium" : "Low";
	const confColor =
		conf > 0.8
			? "text-green-600 bg-green-50"
			: conf > 0.5
				? "text-amber-600 bg-amber-50"
				: "text-surface-500 bg-surface-100";

	return (
		<div
			className="card p-5 hover:border-surface-400 transition-all group animate-fade-in-up opacity-0"
			style={{ animationDelay: `${index * 60}ms` }}
		>
			{/* Header: Label + Trend Badge */}
			<div className="flex items-start justify-between mb-3">
				<div className="flex-1 min-w-0">
					<p className="text-xs text-surface-500 font-medium mb-1 truncate">
						{kpi.label}
					</p>
					<p className="text-2xl font-bold text-surface-900 tracking-tight">
						{formatINR(kpi.current)}
					</p>
				</div>
				<div
					className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${trendBg} shrink-0`}
				>
					{isNeutral ? (
						<Minus size={13} className={trendColor} />
					) : isPositive ? (
						<ArrowUpRight size={13} className={trendColor} />
					) : (
						<ArrowDownRight size={13} className={trendColor} />
					)}
					<span className={`text-xs font-semibold ${trendColor}`}>
						{kpi.change > 0 ? "+" : ""}
						{kpi.change}%
					</span>
				</div>
			</div>

			{/* Context row */}
			<div className="flex items-center justify-between text-[11px] mb-3">
				<span className={`font-medium ${trendColor}`}>{trendWord}</span>
				<span className="text-surface-500">Avg: {formatINR(kpi.mean)}</span>
			</div>

			{/* Yukti Confidence: simple label */}
			<div className="flex items-center gap-2">
				<span
					className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${confColor}`}
				>
					Yukti Confidence: {confLabel}
				</span>
			</div>
		</div>
	);
}

function formatINR(value) {
	if (value == null) return "—";
	const num = Number(value);
	if (isNaN(num)) return String(value);
	if (Math.abs(num) >= 10000000) return `₹${(num / 10000000).toFixed(1)} Cr`;
	if (Math.abs(num) >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
	if (Math.abs(num) >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
	if (Number.isInteger(num)) return num.toLocaleString("en-IN");
	return num.toFixed(2);
}
