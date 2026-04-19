export default function PredictionCard({ prediction }) {
	return (
		<div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
			<div className="flex items-center justify-between gap-2">
				<h3 className="text-sm font-semibold text-slate-900">
					{prediction.title}
				</h3>
				<span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
					{prediction.probability}
				</span>
			</div>
			<p className="text-sm text-slate-700">{prediction.detail}</p>
			<p className="text-xs text-slate-500">
				Impact: {prediction.impact_area} | Horizon: {prediction.timeframe}
			</p>
		</div>
	);
}
