import { useState } from "react";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Line,
} from "recharts";

const COLORS = [
	"#3381ff",
	"#8b5cf6",
	"#06b6d4",
	"#10b981",
	"#f59e0b",
	"#f43f5e",
];

export default function TrendCharts({ trends, expanded }) {
	const [selectedTrend, setSelectedTrend] = useState(0);

	if (!trends || trends.length === 0) return null;

	const current = trends[selectedTrend];
	const color = COLORS[selectedTrend % COLORS.length];

	return (
		<div className={`glass rounded-xl p-5 ${expanded ? "col-span-full" : ""}`}>
			<div className="flex items-center justify-between mb-5">
				<div>
					<h3 className="text-sm font-semibold text-white">
						Performance Trends
					</h3>
					<p className="text-[11px] text-slate-500 mt-0.5">
						How your metrics changed over time
					</p>
				</div>
				<div className="flex gap-1 flex-wrap justify-end">
					{trends.slice(0, expanded ? 8 : 4).map((t, i) => (
						<button
							key={i}
							onClick={() => setSelectedTrend(i)}
							className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
								i === selectedTrend
									? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
									: "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
							}`}
						>
							{t.label}
						</button>
					))}
				</div>
			</div>

			<div className={expanded ? "h-80" : "h-64"}>
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart
						data={current.data}
						margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
					>
						<defs>
							<linearGradient
								id={`trendGrad-${selectedTrend}`}
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop offset="5%" stopColor={color} stopOpacity={0.25} />
								<stop offset="95%" stopColor={color} stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" />
						<XAxis
							dataKey="x"
							tick={{ fontSize: 10, fill: "#94a3b8" }}
							axisLine={{ stroke: "#334155" }}
							tickLine={false}
							interval="preserveStartEnd"
						/>
						<YAxis
							tick={{ fontSize: 10, fill: "#94a3b8" }}
							axisLine={false}
							tickLine={false}
							width={55}
							tickFormatter={(v) => formatYAxis(v)}
						/>
						<Tooltip
							content={<CustomTooltip label={current.label} color={color} />}
						/>
						<Area
							type="monotone"
							dataKey="y"
							stroke={color}
							strokeWidth={2}
							fill={`url(#trendGrad-${selectedTrend})`}
							dot={false}
							activeDot={{
								r: 4,
								stroke: color,
								strokeWidth: 2,
								fill: "#0f172a",
							}}
						/>
						{/* Moving average line */}
						<Line
							type="monotone"
							dataKey="ma"
							stroke={color}
							strokeWidth={1.5}
							strokeDasharray="4 4"
							strokeOpacity={0.5}
							dot={false}
							connectNulls
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>

			{/* Legend */}
			<div className="flex items-center gap-5 mt-3 justify-center">
				<div className="flex items-center gap-1.5">
					<div
						className="w-4 h-0.5 rounded"
						style={{ backgroundColor: color }}
					/>
					<span className="text-[10px] text-slate-500">Actual</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div
						className="w-4 h-0.5 rounded opacity-50"
						style={{ backgroundColor: color, borderTop: "2px dashed" }}
					/>
					<span className="text-[10px] text-slate-500">Moving Avg</span>
				</div>
			</div>
		</div>
	);
}

function CustomTooltip({ active, payload, label }) {
	if (!active || !payload?.length) return null;
	const val = payload[0]?.value;
	const ma = payload.find((p) => p.dataKey === "ma")?.value;

	return (
		<div className="glass rounded-lg px-3 py-2 shadow-xl border border-slate-700/50">
			<p className="text-[10px] text-slate-400 mb-1">{label}</p>
			<p className="text-sm font-semibold text-white">{formatYAxis(val)}</p>
			{ma != null && (
				<p className="text-[10px] text-slate-500 mt-0.5">
					Avg: {formatYAxis(ma)}
				</p>
			)}
		</div>
	);
}

function formatYAxis(value) {
	if (value == null) return "";
	if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(1) + "M";
	if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(1) + "K";
	return value?.toFixed?.(1) ?? value;
}
