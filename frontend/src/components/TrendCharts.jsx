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
	"#6366f1",
	"#22c55e",
	"#f59e0b",
	"#3b82f6",
	"#a855f7",
	"#ef4444",
];

export default function TrendCharts({ trends, expanded }) {
	const [selectedTrend, setSelectedTrend] = useState(0);

	if (!trends || trends.length === 0) return null;

	const current = trends[selectedTrend];
	const color = COLORS[selectedTrend % COLORS.length];

	return (
		<div className={`card p-5 ${expanded ? "col-span-full" : ""}`}>
			<div className="flex items-center justify-between mb-5">
				<div>
					<h3 className="text-sm font-medium text-surface-900">
						Performance Trends
					</h3>
					<p className="text-[11px] text-surface-500 mt-0.5">
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
									? "bg-gold-50 text-gold-600 border border-gold-200"
									: "text-surface-500 hover:text-surface-700 hover:bg-surface-100"
							}`}
						>
							{t.label}
						</button>
					))}
				</div>
			</div>

			<div
				className={expanded ? "h-80" : "h-64"}
				style={{ minWidth: 0, minHeight: 0 }}
			>
				<ResponsiveContainer
					width="100%"
					height="100%"
					minWidth={0}
					minHeight={0}
				>
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
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="rgba(229,231,235,0.6)"
						/>
						<XAxis
							dataKey="x"
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
								fill: "#ffffff",
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
					<span className="text-[10px] text-surface-500">Actual</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div
						className="w-4 h-0.5 rounded opacity-50"
						style={{ backgroundColor: color, borderTop: "2px dashed" }}
					/>
					<span className="text-[10px] text-surface-500">Moving Avg</span>
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
		<div className="card rounded-lg px-3 py-2 shadow-xl">
			<p className="text-[10px] text-surface-500 mb-1">{label}</p>
			<p className="text-sm font-semibold text-surface-900">
				{formatYAxis(val)}
			</p>
			{ma != null && (
				<p className="text-[10px] text-surface-500 mt-0.5">
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
