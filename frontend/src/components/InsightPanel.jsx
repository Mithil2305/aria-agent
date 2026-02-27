import { useState } from "react";
import {
	AlertTriangle,
	TrendingUp,
	Link2,
	Brain,
	Layers,
	ChevronDown,
	ChevronUp,
	Sparkles,
	ArrowRight,
	Rocket,
	ShieldAlert,
} from "lucide-react";

const TYPE_CONFIG = {
	trend: {
		icon: TrendingUp,
		color: "text-brand-400",
		bg: "bg-brand-500/10",
		border: "border-brand-500/20",
		label: "Trend",
	},
	risk: {
		icon: ShieldAlert,
		color: "text-rose-400",
		bg: "bg-rose-500/10",
		border: "border-rose-500/20",
		label: "Risk",
	},
	anomaly: {
		icon: AlertTriangle,
		color: "text-amber-400",
		bg: "bg-amber-500/10",
		border: "border-amber-500/20",
		label: "Alert",
	},
	correlation: {
		icon: Link2,
		color: "text-violet-400",
		bg: "bg-violet-500/10",
		border: "border-violet-500/20",
		label: "Link",
	},
	forecast: {
		icon: Brain,
		color: "text-cyan-400",
		bg: "bg-cyan-500/10",
		border: "border-cyan-500/20",
		label: "Forecast",
	},
	schema: {
		icon: Layers,
		color: "text-slate-400",
		bg: "bg-slate-500/10",
		border: "border-slate-700/30",
		label: "Data",
	},
};

const PRIORITY_MAP = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
const PRIORITY_COLORS = {
	critical: "bg-rose-500/10 text-rose-400 border-rose-500/20",
	high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
	medium: "bg-slate-500/10 text-slate-400 border-slate-700/30",
	low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
	info: "bg-brand-500/10 text-brand-400 border-brand-500/20",
};
const PRIORITY_LABELS = {
	critical: "Urgent",
	high: "Important",
	medium: "Review",
	low: "Good news",
	info: "FYI",
};

export default function InsightPanel({ insights }) {
	const [expandedId, setExpandedId] = useState(null);
	const [filter, setFilter] = useState("all");

	if (!insights || insights.length === 0) return null;

	// Sort by priority
	const sorted = [...insights].sort(
		(a, b) => (PRIORITY_MAP[a.severity] ?? 4) - (PRIORITY_MAP[b.severity] ?? 4),
	);

	const filtered =
		filter === "all" ? sorted : sorted.filter((i) => i.type === filter);

	const typeCount = {};
	insights.forEach((i) => {
		typeCount[i.type] = (typeCount[i.type] || 0) + 1;
	});

	// Count actionable (critical + high)
	const actionable = insights.filter(
		(i) => i.severity === "critical" || i.severity === "high",
	).length;

	return (
		<div className="glass rounded-xl p-5">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500/20 to-violet-500/20 flex items-center justify-center">
						<Sparkles size={14} className="text-brand-400" />
					</div>
					<div>
						<h3 className="text-sm font-semibold text-white">
							Recommendations
						</h3>
						<p className="text-[11px] text-slate-500">
							{actionable > 0
								? `${actionable} action${actionable !== 1 ? "s" : ""} recommended now`
								: `${insights.length} insights for your review`}
						</p>
					</div>
				</div>
			</div>

			{/* Quick action banner for critical items */}
			{actionable > 0 && (
				<div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
					<Rocket size={13} className="text-amber-400 shrink-0" />
					<p className="text-[11px] text-amber-300">
						<span className="font-semibold">
							{actionable} item{actionable !== 1 ? "s" : ""}
						</span>{" "}
						need action — review the urgent and important items below
					</p>
				</div>
			)}

			{/* Filters */}
			<div className="flex flex-wrap gap-1.5 mb-4">
				<FilterChip
					label="All"
					count={insights.length}
					active={filter === "all"}
					onClick={() => setFilter("all")}
				/>
				{Object.entries(typeCount).map(([type, count]) => {
					const cfg = TYPE_CONFIG[type];
					return (
						<FilterChip
							key={type}
							label={cfg?.label || type}
							count={count}
							active={filter === type}
							onClick={() => setFilter(type)}
						/>
					);
				})}
			</div>

			{/* Insights List */}
			<div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
				{filtered.map((insight, idx) => (
					<InsightCard
						key={insight.id}
						insight={insight}
						index={idx}
						expanded={expandedId === insight.id}
						onToggle={() =>
							setExpandedId(expandedId === insight.id ? null : insight.id)
						}
					/>
				))}
			</div>
		</div>
	);
}

function FilterChip({ label, count, active, onClick }) {
	return (
		<button
			onClick={onClick}
			className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
				active
					? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
					: "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent"
			}`}
		>
			{label}
			<span
				className={`px-1 py-0.5 rounded text-[9px] ${active ? "bg-brand-500/30" : "bg-slate-800"}`}
			>
				{count}
			</span>
		</button>
	);
}

function InsightCard({ insight, index, expanded, onToggle }) {
	const config = TYPE_CONFIG[insight.type] || TYPE_CONFIG.schema;
	const Icon = config.icon;
	const priorityLabel = PRIORITY_LABELS[insight.severity] || insight.severity;
	const priorityColor =
		PRIORITY_COLORS[insight.severity] || PRIORITY_COLORS.medium;

	return (
		<div
			className={`rounded-xl border transition-all animate-fade-in-up opacity-0 ${config.border} ${
				expanded ? config.bg : "hover:bg-slate-800/20"
			}`}
			style={{ animationDelay: `${index * 40}ms` }}
		>
			<button
				onClick={onToggle}
				className="w-full flex items-start gap-3 px-4 py-3 text-left"
			>
				<div
					className={`w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${config.bg}`}
				>
					<Icon size={12} className={config.color} />
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-0.5">
						<span
							className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${priorityColor}`}
						>
							{priorityLabel}
						</span>
						<span className="text-[9px] text-slate-600">{config.label}</span>
					</div>
					<p className="text-xs font-medium text-white leading-snug">
						{insight.title}
					</p>
				</div>

				<div className="mt-1 text-slate-500">
					{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
				</div>
			</button>

			{expanded && (
				<div className="px-4 pb-4 pl-14 space-y-3">
					<p className="text-[11px] text-slate-400 leading-relaxed">
						{insight.description}
					</p>

					{insight.recommendation && (
						<div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-brand-500/5 border border-brand-500/10">
							<ArrowRight
								size={10}
								className="text-brand-400 mt-0.5 shrink-0"
							/>
							<div>
								<p className="text-[10px] text-brand-500 font-semibold mb-0.5">
									What to do
								</p>
								<p className="text-[11px] text-brand-300 leading-relaxed">
									{insight.recommendation}
								</p>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
