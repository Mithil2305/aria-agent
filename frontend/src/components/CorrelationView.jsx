import { useState } from "react";
import {
	ScatterChart,
	Scatter,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { Link2, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function CorrelationView({ correlations }) {
	const [selected, setSelected] = useState(0);

	if (!correlations || correlations.length === 0) {
		return (
			<div className="card p-5">
				<h3 className="text-sm font-medium text-surface-900 mb-2">
					Relationships
				</h3>
				<div className="text-center py-8">
					<p className="text-sm text-surface-500">
						Not enough numeric data to find relationships
					</p>
				</div>
			</div>
		);
	}

	const corr = correlations[selected];
	const isPositive = corr.direction === "positive";
	const strengthLabel =
		corr.strength === "strong"
			? "strongly"
			: corr.strength === "moderate"
				? "moderately"
				: "slightly";
	const directionWord = isPositive ? "increase" : "decrease";

	// Plain language explanation
	const explanation = `When ${corr.label1} goes up, ${corr.label2} tends to ${directionWord}. They are ${strengthLabel} connected.`;

	return (
		<div className="card p-5">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className="text-sm font-medium text-surface-900">
						How Your Metrics Connect
					</h3>
					<p className="text-[11px] text-surface-500 mt-0.5">
						{correlations.length} relationship
						{correlations.length !== 1 ? "s" : ""} found
					</p>
				</div>
			</div>

			{/* Pair buttons */}
			<div className="flex flex-wrap gap-1.5 mb-4">
				{correlations.slice(0, 8).map((c, i) => (
					<button
						key={i}
						onClick={() => setSelected(i)}
						className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] transition-all border ${
							i === selected
								? "bg-gold-50 border-gold-200 text-gold-600"
								: "bg-surface-100 border-surface-300 text-surface-500 hover:border-surface-400"
						}`}
					>
						<Link2 size={9} />
						<span className="font-medium">{c.label1}</span>
						<span className="text-surface-400">↔</span>
						<span className="font-medium">{c.label2}</span>
					</button>
				))}
			</div>

			{/* Plain-language explanation */}
			<div className="mb-4 px-3 py-2.5 rounded-lg bg-surface-100 border border-surface-300">
				<p className="text-[11px] text-surface-600 leading-relaxed">
					{explanation}
				</p>
			</div>

			{/* Scatter Plot */}
			<div className="h-52">
				<ResponsiveContainer width="100%" height="100%">
					<ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="rgba(229,231,235,0.6)"
						/>
						<XAxis
							dataKey="x"
							name={corr.label1}
							tick={{ fontSize: 10, fill: "#9ca3af" }}
							axisLine={{ stroke: "#e5e7eb" }}
							tickLine={false}
							label={{
								value: corr.label1,
								position: "bottom",
								fontSize: 10,
								fill: "#9ca3af",
								offset: -5,
							}}
						/>
						<YAxis
							dataKey="y"
							name={corr.label2}
							tick={{ fontSize: 10, fill: "#9ca3af" }}
							axisLine={false}
							tickLine={false}
							width={55}
							label={{
								value: corr.label2,
								angle: -90,
								position: "insideLeft",
								fontSize: 10,
								fill: "#9ca3af",
							}}
						/>
						<Tooltip content={<ScatterTooltip corr={corr} />} />
						<Scatter
							data={corr.scatter}
							fill={isPositive ? "#22c55e" : "#ef4444"}
							fillOpacity={0.6}
							r={3}
						/>
					</ScatterChart>
				</ResponsiveContainer>
			</div>

			{/* Summary bar */}
			<div className="mt-3 flex items-center gap-4 px-4 py-2.5 rounded-lg bg-surface-100">
				<div
					className={`flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-500"}`}
				>
					{isPositive ? (
						<ArrowUpRight size={14} />
					) : (
						<ArrowDownRight size={14} />
					)}
					<span className="text-xs font-medium capitalize">
						{corr.strength} {corr.direction}
					</span>
				</div>
				<div className="text-[10px] text-surface-500">
					Score: {Math.abs(corr.correlation).toFixed(2)} · {corr.scatter.length}{" "}
					data points
				</div>
			</div>
		</div>
	);
}

function ScatterTooltip({ active, payload, corr }) {
	if (!active || !payload?.length) return null;
	return (
		<div className="card rounded-lg px-3 py-2 shadow-xl">
			<p className="text-[10px] text-surface-500 mb-1">
				{corr.label1}:{" "}
				<span className="text-surface-900 font-medium">
					{payload[0]?.value?.toFixed(2)}
				</span>
			</p>
			<p className="text-[10px] text-surface-500">
				{corr.label2}:{" "}
				<span className="text-surface-900 font-medium">
					{payload[1]?.value?.toFixed(2)}
				</span>
			</p>
		</div>
	);
}
