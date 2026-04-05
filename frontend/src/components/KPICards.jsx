import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { formatCompactCurrency } from "../utils/currency";

/**
 * KPICards — business metric summary cards
 * Shows key business numbers using profile currency formatting.
 * "Yukti Confidence: High / Medium / Low" instead of raw percentages.
 */

export default function KPICards({ kpis, expanded }) {
	const { userProfile } = useAuth();
	const currencyCode = userProfile?.currency || "INR";
	if (!kpis || kpis.length === 0) return null;
	const displayed = expanded ? kpis : kpis.slice(0, 6);

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{displayed.map((kpi, idx) => (
				<KPICard
					key={kpi.column || idx}
					kpi={kpi}
					index={idx}
					currencyCode={currencyCode}
				/>
			))}
		</div>
	);
}

function KPICard({ kpi, index, currencyCode }) {
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
						{formatCompactCurrency(kpi.current, currencyCode)}
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
				<span className="text-surface-500">
					Avg: {formatCompactCurrency(kpi.mean, currencyCode)}
				</span>
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
