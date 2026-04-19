import { useQuery } from "@tanstack/react-query";

import { fetchNewsFeed } from "../../api/newsApi";
import { useNewsStore } from "../../store/newsStore";
import KeywordSelector from "./KeywordSelector";
import NewsFeedCard from "./NewsFeedCard";
import PredictionCard from "./PredictionCard";
import RecommendationCard from "./RecommendationCard";
import SentimentBadge from "./SentimentBadge";

export default function NewsIntelligence() {
	const keywords = useNewsStore((state) => state.keywords);
	const setKeywords = useNewsStore((state) => state.setKeywords);

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ["newsFeed", keywords],
		queryFn: () => fetchNewsFeed(keywords),
		staleTime: 1000 * 60 * 15,
		retry: 2,
		enabled: keywords.length > 0,
	});

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">
						Market Intelligence
					</h1>
					<p className="text-sm text-slate-600 mt-1">
						News-driven predictions and actions for your business context.
					</p>
				</div>
				{data ? <SentimentBadge sentiment={data.market_sentiment} /> : null}
			</div>

			<KeywordSelector value={keywords} onChange={setKeywords} />

			{isLoading ? <LoadingState /> : null}
			{error ? <ErrorState message={error.message} onRetry={refetch} /> : null}

			{data ? (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="space-y-3 lg:col-span-1">
						<h2 className="font-semibold text-slate-700">News Sources</h2>
						{data.articles.map((article, index) => (
							<NewsFeedCard key={`${article.url}-${index}`} article={article} />
						))}
					</div>
					<div className="space-y-6 lg:col-span-2">
						<section className="space-y-3">
							<h2 className="font-semibold text-slate-700">AI Predictions</h2>
							{data.predictions.map((prediction, index) => (
								<PredictionCard
									key={`${prediction.title}-${index}`}
									prediction={prediction}
								/>
							))}
						</section>
						<section className="space-y-3">
							<h2 className="font-semibold text-slate-700">Recommendations</h2>
							{data.recommendations.map((recommendation, index) => (
								<RecommendationCard
									key={`${recommendation.action}-${index}`}
									recommendation={recommendation}
								/>
							))}
						</section>
					</div>
				</div>
			) : null}
		</div>
	);
}

function LoadingState() {
	return (
		<div className="flex items-center gap-3 text-slate-500 py-10 justify-center">
			<span className="animate-spin rounded-full h-5 w-5 border-t-2 border-sky-600" />
			<span>Fetching latest market news...</span>
		</div>
	);
}

function ErrorState({ message, onRetry }) {
	return (
		<div className="rounded-lg border border-rose-200 bg-rose-50 p-4 flex items-center justify-between gap-3">
			<span className="text-sm text-rose-700">{message}</span>
			<button
				type="button"
				onClick={onRetry}
				className="text-sm text-sky-700 underline"
			>
				Retry
			</button>
		</div>
	);
}
