const TONE = {
	bullish: "bg-emerald-100 text-emerald-700 border-emerald-200",
	bearish: "bg-rose-100 text-rose-700 border-rose-200",
	neutral: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function SentimentBadge({ sentiment = "neutral" }) {
	const key = String(sentiment || "neutral").toLowerCase();
	const tone = TONE[key] || TONE.neutral;

	return (
		<span
			className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${tone}`}
		>
			Market: {key}
		</span>
	);
}
