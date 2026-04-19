export default function RecommendationCard({ recommendation }) {
	return (
		<div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
			<div className="flex items-center justify-between gap-2">
				<p className="text-sm font-semibold text-slate-900">
					{recommendation.action}
				</p>
				<span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 uppercase">
					{recommendation.urgency}
				</span>
			</div>
			<p className="text-sm text-slate-700">{recommendation.rationale}</p>
			<p className="text-xs text-slate-500">
				Category: {recommendation.category}
			</p>
		</div>
	);
}
