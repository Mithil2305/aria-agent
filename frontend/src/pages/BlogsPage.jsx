import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, Tag } from "lucide-react";
import { getPublicBlogs } from "../services/api";

function formatDate(value) {
	if (!value) return "";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString("en-IN", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export default function BlogsPage() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [blogs, setBlogs] = useState([]);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			setLoading(true);
			setError("");
			try {
				const data = await getPublicBlogs(40);
				if (!cancelled) {
					setBlogs(data?.blogs || []);
				}
			} catch (err) {
				if (!cancelled) {
					setError(err?.response?.data?.detail || "Failed to load blogs.");
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		load();
		return () => {
			cancelled = true;
		};
	}, []);

	const hasBlogs = useMemo(() => blogs.length > 0, [blogs]);

	return (
		<div className="min-h-screen bg-[#fafafa] pb-20">
			<div className="bg-white border-b border-slate-200 px-6 py-18 lg:px-8">
				<div className="mx-auto max-w-4xl">
					<p className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
						Insights & Updates
					</p>
					<h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">
						Yukti Blog
					</h1>
					<p className="mt-2 text-slate-600">
						Product updates, practical playbooks, and analytics stories for
						small businesses.
					</p>
				</div>
			</div>

			<div className="mx-auto max-w-4xl px-6 lg:px-8 mt-10">
				{loading ? (
					<div className="min-h-[30vh] flex items-center justify-center">
						<Loader2 size={24} className="animate-spin text-slate-400" />
					</div>
				) : error ? (
					<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{error}
					</div>
				) : !hasBlogs ? (
					<div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600">
						No blog posts published yet. Please check back soon.
					</div>
				) : (
					<div className="space-y-4">
						{blogs.map((blog) => (
							<article
								key={blog.id}
								className="rounded-2xl border border-slate-200 bg-white p-5"
							>
								<h2 className="text-xl font-bold text-slate-900">
									{blog.title}
								</h2>
								<div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
									<span className="inline-flex items-center gap-1">
										<CalendarDays size={12} />
										{formatDate(blog.publishedAt || blog.createdAt) ||
											"Recently"}
									</span>
									{(blog.tags || []).slice(0, 4).map((tag) => (
										<span
											key={`${blog.id}-${tag}`}
											className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5"
										>
											<Tag size={10} />
											{tag}
										</span>
									))}
								</div>
								{blog.excerpt ? (
									<p className="mt-3 text-sm text-slate-700 leading-relaxed">
										{blog.excerpt}
									</p>
								) : null}
								<div className="mt-4 prose prose-sm max-w-none text-slate-700">
									<p className="whitespace-pre-wrap">{blog.content}</p>
								</div>
							</article>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
