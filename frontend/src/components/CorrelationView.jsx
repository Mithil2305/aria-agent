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
			<div className="glass rounded-xl p-5">
				<h3 className="text-sm font-semibold text-white mb-2">Relationships</h3>
				<div className="text-center py-8">
					<p className="text-sm text-slate-400">
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
		<div className="glass rounded-xl p-5">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className="text-sm font-semibold text-white">
						How Your Metrics Connect
					</h3>
					<p className="text-[11px] text-slate-500 mt-0.5">
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
								? "bg-brand-500/10 border-brand-500/30 text-brand-300"
								: "bg-slate-800/30 border-slate-700/30 text-slate-400 hover:border-slate-600/50"
						}`}
					>
						<Link2 size={9} />
						<span className="font-medium">{c.label1}</span>
						<span className="text-slate-600">↔</span>
						<span className="font-medium">{c.label2}</span>
					</button>
				))}
			</div>

			{/* Plain-language explanation */}
			<div className="mb-4 px-3 py-2.5 rounded-xl bg-slate-800/30 border border-slate-700/20">
				<p className="text-[11px] text-slate-300 leading-relaxed">
					{explanation}
				</p>
			</div>

			{/* Scatter Plot */}
			<div className="h-52">
				<ResponsiveContainer width="100%" height="100%">
					<ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
						<CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" />
						<XAxis
							dataKey="x"
							name={corr.label1}
							tick={{ fontSize: 10, fill: "#94a3b8" }}
							axisLine={{ stroke: "#334155" }}
							tickLine={false}
							label={{
								value: corr.label1,
								position: "bottom",
								fontSize: 10,
								fill: "#94a3b8",
								offset: -5,
							}}
						/>
						<YAxis
							dataKey="y"
							name={corr.label2}
							tick={{ fontSize: 10, fill: "#94a3b8" }}
							axisLine={false}
							tickLine={false}
							width={55}
							label={{
								value: corr.label2,
								angle: -90,
								position: "insideLeft",
								fontSize: 10,
								fill: "#94a3b8",
							}}
						/>
						<Tooltip content={<ScatterTooltip corr={corr} />} />
						<Scatter
							data={corr.scatter}
							fill={isPositive ? "#3381ff" : "#f43f5e"}
							fillOpacity={0.6}
							r={3}
						/>
					</ScatterChart>
				</ResponsiveContainer>
			</div>

			{/* Summary bar */}
			<div className="mt-3 flex items-center gap-4 px-4 py-2.5 rounded-xl bg-slate-800/30">
				<div
					className={`flex items-center gap-1 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
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
				<div className="text-[10px] text-slate-500">
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
		<div className="glass rounded-lg px-3 py-2 shadow-xl border border-slate-700/50">
			<p className="text-[10px] text-slate-400 mb-1">
				{corr.label1}:{" "}
				<span className="text-white font-medium">
					{payload[0]?.value?.toFixed(2)}
				</span>
			</p>
			<p className="text-[10px] text-slate-400">
				{corr.label2}:{" "}
				<span className="text-white font-medium">
					{payload[1]?.value?.toFixed(2)}
				</span>
			</p>
		</div>
	);
}
