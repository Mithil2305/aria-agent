import { Hash, Calendar, Type, ShieldCheck, AlertCircle } from "lucide-react";

export default function SchemaView({ schema }) {
	if (!schema || !schema.columns) return null;

	const typeIcons = {
		numeric: {
			icon: Hash,
			color: "text-brand-400",
			bg: "bg-brand-500/10",
			label: "Numbers",
		},
		categorical: {
			icon: Type,
			color: "text-violet-400",
			bg: "bg-violet-500/10",
			label: "Categories",
		},
		temporal: {
			icon: Calendar,
			color: "text-emerald-400",
			bg: "bg-emerald-500/10",
			label: "Dates",
		},
	};

	const numericCount = schema.columns.filter(
		(c) => schema.types[c] === "numeric",
	).length;
	const categoricalCount = schema.columns.filter(
		(c) => schema.types[c] === "categorical",
	).length;
	const temporalCount = schema.columns.filter(
		(c) => schema.types[c] === "temporal",
	).length;

	// Compute overall completeness
	let totalFilled = 0;
	let totalCells = 0;
	schema.columns.forEach((col) => {
		const s = schema.summary[col];
		if (s) {
			totalFilled += s.nonNull || 0;
			totalCells += s.totalCount || 0;
		}
	});
	const overallPct =
		totalCells > 0 ? ((totalFilled / totalCells) * 100).toFixed(1) : 0;
	const healthLabel =
		overallPct >= 95
			? "Excellent"
			: overallPct >= 80
				? "Good"
				: overallPct >= 60
					? "Fair"
					: "Needs Work";
	const healthColor =
		overallPct >= 95
			? "text-emerald-400"
			: overallPct >= 80
				? "text-brand-400"
				: overallPct >= 60
					? "text-amber-400"
					: "text-rose-400";
	const healthBg =
		overallPct >= 95
			? "bg-emerald-500"
			: overallPct >= 80
				? "bg-brand-500"
				: overallPct >= 60
					? "bg-amber-500"
					: "bg-rose-500";

	// Find columns with low completeness
	const lowQuality = schema.columns.filter((col) => {
		const s = schema.summary[col];
		return s && s.totalCount > 0 && s.nonNull / s.totalCount < 0.8;
	});

	return (
		<div className="glass rounded-xl p-5">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
						<ShieldCheck size={14} className="text-slate-400" />
					</div>
					<div>
						<h3 className="text-sm font-semibold text-white">
							Data Health Report
						</h3>
						<p className="text-[11px] text-slate-500">
							{schema.columns.length} columns ·{" "}
							{totalCells > 0
								? (totalCells / schema.columns.length).toFixed(0)
								: 0}{" "}
							rows
						</p>
					</div>
				</div>
				<div className="text-right">
					<p className={`text-sm font-bold ${healthColor}`}>{healthLabel}</p>
					<p className="text-[10px] text-slate-500">{overallPct}% complete</p>
				</div>
			</div>

			{/* Overall completeness bar */}
			<div className="mb-4">
				<div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
					<div
						className={`h-full rounded-full ${healthBg} transition-all`}
						style={{ width: `${Math.min(overallPct, 100)}%` }}
					/>
				</div>
			</div>

			{/* Quality warning */}
			{lowQuality.length > 0 && (
				<div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
					<AlertCircle size={13} className="text-amber-400 shrink-0 mt-0.5" />
					<p className="text-[11px] text-amber-300 leading-relaxed">
						<span className="font-semibold">
							{lowQuality.length} column
							{lowQuality.length !== 1 ? "s have" : " has"}
						</span>{" "}
						missing data ({lowQuality.map((c) => c).join(", ")}). This may
						affect analysis accuracy.
					</p>
				</div>
			)}

			{/* Type Summary */}
			<div className="grid grid-cols-3 gap-2 mb-4">
				<TypeBadge
					type="Numbers"
					count={numericCount}
					total={schema.columns.length}
					color="brand"
				/>
				<TypeBadge
					type="Categories"
					count={categoricalCount}
					total={schema.columns.length}
					color="violet"
				/>
				<TypeBadge
					type="Dates"
					count={temporalCount}
					total={schema.columns.length}
					color="emerald"
				/>
			</div>

			{/* Column Details */}
			<div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
				{schema.columns.map((col, idx) => {
					const type = schema.types[col];
					const summary = schema.summary[col];
					const config = typeIcons[type] || typeIcons.categorical;
					const Icon = config.icon;
					const fillPct =
						summary?.totalCount > 0
							? (summary.nonNull / summary.totalCount) * 100
							: 0;
					const fillColor =
						fillPct >= 95
							? "bg-emerald-500"
							: fillPct >= 80
								? "bg-brand-500"
								: fillPct >= 60
									? "bg-amber-500"
									: "bg-rose-500";

					return (
						<div
							key={col}
							className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/20 hover:bg-slate-800/40 transition-all animate-fade-in-up opacity-0"
							style={{ animationDelay: `${idx * 30}ms` }}
						>
							<div
								className={`w-6 h-6 rounded flex items-center justify-center ${config.bg}`}
							>
								<Icon size={11} className={config.color} />
							</div>

							<div className="flex-1 min-w-0">
								<p className="text-xs font-medium text-white truncate">{col}</p>
								<p className="text-[10px] text-slate-500">
									{type === "numeric" &&
										`${fmtNum(summary.min)} – ${fmtNum(summary.max)} · Avg: ${fmtNum(summary.mean)}`}
									{type === "categorical" &&
										`${summary.cardinality} categories · Most common: ${summary.topValues?.[0]?.[0] || "—"}`}
									{type === "temporal" &&
										`Covers ${summary.spanDays} days · ${summary.nonNull} records`}
								</p>
							</div>

							<div className="flex items-center gap-2 shrink-0">
								<div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
									<div
										className={`h-full rounded-full ${fillColor}`}
										style={{ width: `${fillPct}%` }}
									/>
								</div>
								<span className="text-[10px] text-slate-500 w-8 text-right">
									{fillPct.toFixed(0)}%
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function TypeBadge({ type, count, total, color }) {
	const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
	const colorClasses = {
		brand: "bg-brand-500/10 border-brand-500/20 text-brand-400",
		violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
		emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
	};

	return (
		<div className={`rounded-lg border px-3 py-2 ${colorClasses[color]}`}>
			<p className="text-lg font-bold">{count}</p>
			<p className="text-[10px] opacity-70">
				{type} ({pct}%)
			</p>
		</div>
	);
}

function fmtNum(n) {
	if (n == null) return "—";
	if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + "M";
	if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
	return n.toFixed(2);
}
