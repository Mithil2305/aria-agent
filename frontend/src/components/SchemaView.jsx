import { Hash, Calendar, Type, ShieldCheck, AlertCircle } from "lucide-react";

export default function SchemaView({ schema }) {
	if (!schema || !schema.columns) return null;

	const typeIcons = {
		numeric: {
			icon: Hash,
			color: "text-gold-600",
			bg: "bg-gold-50",
			label: "Numbers",
		},
		categorical: {
			icon: Type,
			color: "text-surface-500",
			bg: "bg-surface-100",
			label: "Categories",
		},
		temporal: {
			icon: Calendar,
			color: "text-green-600",
			bg: "bg-green-50",
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
			? "text-green-600"
			: overallPct >= 80
				? "text-gold-600"
				: overallPct >= 60
					? "text-amber-500"
					: "text-red-500";
	const healthBg =
		overallPct >= 95
			? "bg-green-500"
			: overallPct >= 80
				? "bg-gold-500"
				: overallPct >= 60
					? "bg-amber-500"
					: "bg-red-500";

	// Find columns with low completeness
	const lowQuality = schema.columns.filter((col) => {
		const s = schema.summary[col];
		return s && s.totalCount > 0 && s.nonNull / s.totalCount < 0.8;
	});

	return (
		<div className="card p-5">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center">
						<ShieldCheck size={14} className="text-surface-500" />
					</div>
					<div>
						<h3 className="text-sm font-medium text-surface-900">
							Data Health Report
						</h3>
						<p className="text-[11px] text-surface-500">
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
					<p className="text-[10px] text-surface-500">{overallPct}% complete</p>
				</div>
			</div>

			{/* Overall completeness bar */}
			<div className="mb-4">
				<div className="w-full h-2 rounded-full bg-surface-200 overflow-hidden">
					<div
						className={`h-full rounded-full ${healthBg} transition-all`}
						style={{ width: `${Math.min(overallPct, 100)}%` }}
					/>
				</div>
			</div>

			{/* Quality warning */}
			{lowQuality.length > 0 && (
				<div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
					<AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
					<p className="text-[11px] text-amber-600 leading-relaxed">
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
					color="gold"
				/>
				<TypeBadge
					type="Categories"
					count={categoricalCount}
					total={schema.columns.length}
					color="surface"
				/>
				<TypeBadge
					type="Dates"
					count={temporalCount}
					total={schema.columns.length}
					color="green"
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
							? "bg-green-500"
							: fillPct >= 80
								? "bg-gold-500"
								: fillPct >= 60
									? "bg-amber-500"
									: "bg-red-500";

					return (
						<div
							key={col}
							className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-50 hover:bg-surface-100 transition-all animate-fade-in-up opacity-0"
							style={{ animationDelay: `${idx * 30}ms` }}
						>
							<div
								className={`w-6 h-6 rounded flex items-center justify-center ${config.bg}`}
							>
								<Icon size={11} className={config.color} />
							</div>

							<div className="flex-1 min-w-0">
								<p className="text-xs font-medium text-surface-900 truncate">
									{col}
								</p>
								<p className="text-[10px] text-surface-500">
									{type === "numeric" &&
										`${fmtNum(summary.min)} – ${fmtNum(summary.max)} · Avg: ${fmtNum(summary.mean)}`}
									{type === "categorical" &&
										`${summary.cardinality} categories · Most common: ${summary.topValues?.[0]?.[0] || "—"}`}
									{type === "temporal" &&
										`Covers ${summary.spanDays} days · ${summary.nonNull} records`}
								</p>
							</div>

							<div className="flex items-center gap-2 shrink-0">
								<div className="w-12 h-1.5 rounded-full bg-surface-200 overflow-hidden">
									<div
										className={`h-full rounded-full ${fillColor}`}
										style={{ width: `${fillPct}%` }}
									/>
								</div>
								<span className="text-[10px] text-surface-500 w-8 text-right">
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
		gold: "bg-gold-50 border-gold-200 text-gold-600",
		surface: "bg-surface-100 border-surface-300 text-surface-500",
		green: "bg-green-50 border-green-200 text-green-600",
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
