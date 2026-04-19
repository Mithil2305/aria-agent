export default function NewsFeedCard({ article }) {
	return (
		<article className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
			<h3 className="text-sm font-semibold text-slate-900 leading-5">
				{article.title}
			</h3>
			<p className="text-xs text-slate-500">{article.source}</p>
			<p className="text-xs text-slate-600 line-clamp-4">{article.summary}</p>
			<a
				href={article.url}
				target="_blank"
				rel="noreferrer"
				className="inline-flex text-xs text-sky-700 hover:underline"
			>
				Open source
			</a>
		</article>
	);
}
