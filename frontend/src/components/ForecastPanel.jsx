import { useState } from "react";
import {
	ComposedChart,
	Line,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Target, ArrowRight } from "lucide-react";

export default function ForecastPanel({ forecasts, expanded }) {
	const [selected, setSelected] = useState(0);

	if (!forecasts || forecasts.length === 0) return null;

	const fc = forecasts[selected];

	// Combine historical + forecast data
	const combinedData = [
		...fc.historical.map((h) => ({
			label: h.label,
			actual: h.actual,
			predicted: null,
			upper: null,
			lower: null,
		})),
		// Bridge point
		{
			label: fc.historical[fc.historical.length - 1]?.label,
			actual: fc.historical[fc.historical.length - 1]?.actual,
			predicted: fc.historical[fc.historical.length - 1]?.actual,
			upper: fc.historical[fc.historical.length - 1]?.actual,
			lower: fc.historical[fc.historical.length - 1]?.actual,
		},
		...fc.forecast.map((f) => ({
			label: f.label,
			actual: null,
			predicted: f.predicted,
			upper: f.upper,
			lower: f.lower,
		})),
	];

	const TrendIcon =
		fc.trend === "upward"
			? TrendingUp
			: fc.trend === "downward"
				? TrendingDown
				: Target;
	const trendColor =
		fc.trend === "upward"
			? "text-green-600"
			: fc.trend === "downward"
				? "text-red-500"
				: "text-surface-400";
	const trendWord =
		fc.trend === "upward"
			? "Growing"
			: fc.trend === "downward"
				? "Declining"
				: "Steady";

	// Compute projected end value
	const lastForecast = fc.forecast[fc.forecast.length - 1];
	const lastActual = fc.historical[fc.historical.length - 1]?.actual || 0;

	return (
		<div className={`card p-5 ${expanded ? "col-span-full" : ""}`}>
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className="text-sm font-medium text-surface-900">
						{expanded ? "Business Forecast" : "Forecast"}
					</h3>
					<p className="text-[11px] text-surface-500 mt-0.5">
						Where your metrics are heading
					</p>
				</div>
				<div className="flex gap-1 flex-wrap justify-end">
					{forecasts.map((f, i) => (
						<button
							key={i}
							onClick={() => setSelected(i)}
							className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
								i === selected
									? "bg-gold-50 text-gold-600 border border-gold-200"
									: "text-surface-500 hover:text-surface-700 hover:bg-surface-100"
							}`}
						>
							{f.label}
						</button>
					))}
				</div>
			</div>

			{/* Summary cards */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
				<SummaryCard
					label="Direction"
					value={trendWord}
					icon={<TrendIcon size={13} className={trendColor} />}
				/>
				<SummaryCard
					label="Projected Change"
					value={`${fc.growthRate > 0 ? "+" : ""}${fc.growthRate}%`}
				/>
				<SummaryCard
					label="Confidence"
					value={`${(fc.confidence * 100).toFixed(0)}%`}
				/>
				<SummaryCard label="Model Fit" value={`${(fc.r2 * 100).toFixed(0)}%`} />
			</div>

			{expanded && lastForecast && (
				<div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-lg bg-gold-50 border border-gold-200">
					<ArrowRight size={14} className="text-gold-600 shrink-0" />
					<p className="text-xs text-gold-700 leading-relaxed">
						<span className="font-semibold">{fc.label}</span> is projected to go
						from <span className="font-semibold">{formatAxis(lastActual)}</span>{" "}
						to{" "}
						<span className="font-semibold">
							{formatAxis(lastForecast.predicted)}
						</span>{" "}
						over the next {fc.forecast.length} periods
						{fc.confidence >= 0.7
							? " with good reliability."
							: ". Treat with caution — model confidence is moderate."}
					</p>
				</div>
			)}

			<div className={expanded ? "h-72" : "h-56"}>
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart
						data={combinedData}
						margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
					>
						<defs>
							<linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#9ca3af" stopOpacity={0.15} />
								<stop offset="95%" stopColor="#9ca3af" stopOpacity={0.02} />
							</linearGradient>
						</defs>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="rgba(229,231,235,0.6)"
						/>
						<XAxis
							dataKey="label"
							tick={{ fontSize: 10, fill: "#9ca3af" }}
							axisLine={{ stroke: "#e5e7eb" }}
							tickLine={false}
							interval="preserveStartEnd"
						/>
						<YAxis
							tick={{ fontSize: 10, fill: "#9ca3af" }}
							axisLine={false}
							tickLine={false}
							width={55}
							tickFormatter={(v) => formatAxis(v)}
						/>
						<Tooltip content={<ForecastTooltip />} />
						<Area
							type="monotone"
							dataKey="upper"
							stroke="none"
							fill="url(#forecastBand)"
						/>
						<Area
							type="monotone"
							dataKey="lower"
							stroke="none"
							fill="transparent"
						/>
						<Line
							type="monotone"
							dataKey="actual"
							stroke="#6366f1"
							strokeWidth={2}
							dot={false}
							connectNulls={false}
						/>
						<Line
							type="monotone"
							dataKey="predicted"
							stroke="#9ca3af"
							strokeWidth={2}
							strokeDasharray="6 3"
							dot={false}
							connectNulls={false}
						/>
						<Line
							type="monotone"
							dataKey="upper"
							stroke="#9ca3af"
							strokeWidth={1}
							strokeDasharray="3 3"
							strokeOpacity={0.3}
							dot={false}
							connectNulls={false}
						/>
						<Line
							type="monotone"
							dataKey="lower"
							stroke="#9ca3af"
							strokeWidth={1}
							strokeDasharray="3 3"
							strokeOpacity={0.3}
							dot={false}
							connectNulls={false}
						/>
					</ComposedChart>
				</ResponsiveContainer>
			</div>

			<div className="flex items-center gap-6 mt-3 justify-center">
				<div className="flex items-center gap-1.5">
					<div className="w-4 h-0.5 bg-gold-500 rounded" />
					<span className="text-[10px] text-surface-500">Past Data</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-4 h-0.5 bg-surface-400 rounded opacity-70" />
					<span className="text-[10px] text-surface-500">Projection</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-4 h-3 bg-surface-300 rounded" />
					<span className="text-[10px] text-surface-500">Range</span>
				</div>
			</div>
		</div>
	);
}

function SummaryCard({ label, value, icon }) {
	return (
		<div className="bg-surface-100 rounded-lg px-3 py-2.5">
			<p className="text-[10px] text-surface-500 mb-1">{label}</p>
			<div className="flex items-center gap-1.5">
				{icon}
				<span className="text-xs font-semibold text-surface-900">{value}</span>
			</div>
		</div>
	);
}

function ForecastTooltip({ active, payload, label }) {
	if (!active || !payload?.length) return null;
	return (
		<div className="card rounded-lg px-3 py-2 shadow-xl">
			<p className="text-[10px] text-surface-500 mb-1">{label}</p>
			{payload
				.filter((p) => p.value != null)
				.map((p, i) => (
					<div key={i} className="flex items-center gap-2">
						<div
							className="w-1.5 h-1.5 rounded-full"
							style={{ background: p.stroke || p.color }}
						/>
						<span className="text-[10px] text-surface-500">
							{p.dataKey === "actual"
								? "Actual"
								: p.dataKey === "predicted"
									? "Projected"
									: p.dataKey === "upper"
										? "High est."
										: "Low est."}
							:
						</span>
						<span className="text-xs font-medium text-surface-900">
							{formatAxis(p.value)}
						</span>
					</div>
				))}
		</div>
	);
}

function formatAxis(value) {
	if (value == null) return "—";
	if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(1) + "M";
	if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(1) + "K";
	return value?.toFixed?.(1) ?? value;
}
