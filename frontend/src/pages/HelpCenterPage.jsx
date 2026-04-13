import React, { useState } from "react";
import {
	HelpCircle,
	LifeBuoy,
	MessageCircle,
	Search,
	AlertTriangle,
	CheckCircle2,
	ChevronDown,
	FileWarning,
	Activity,
	Lock,
	Database,
} from "lucide-react";

const FAQ_CATEGORIES = [
	{
		title: "Data Sync & Integrations",
		icon: Database,
		questions: [
			{
				q: "My daily CSV upload keeps failing with a 'Schema Mismatch' error.",
				a: "Yukti uses strict schema detection. If your new CSV has changed column names (e.g., 'Total Amount' instead of 'Amount'), the pipeline will reject it to prevent data corruption. Ensure headers exactly match your initial successful upload, or use the 'Re-map Columns' tool in settings.",
			},
			{
				q: "How long does it take for Shopify/POS data to sync?",
				a: "Live API integrations sync every 15 minutes. However, the Predictive Engine runs its complex polynomial regression models on your entire dataset once every 24 hours at 02:00 AM IST. Immediate syncs will update KPIs, but new forecasts require the nightly run.",
			},
		],
	},
	{
		title: "Analytics & AI Engine",
		icon: Activity,
		questions: [
			{
				q: "Why is Yukti showing a 'Critical Anomaly' for a normal sales day?",
				a: "Our Z-score detection looks at historical patterns, day-of-week seasonality, and holidays. If you made ₹50k on a Tuesday, and normally make ₹20k, it's flagged as a positive anomaly. You can 'Dismiss' anomalies to train the model on your specific business context.",
			},
			{
				q: "What happens if an AI provider goes down?",
				a: "Yukti utilizes a multi-agent fallback chain. If our primary provider (e.g., Claude) times out, the system automatically routes the diagnostic prompt to Gemini, Groq, or our internally hosted Rule-Based Engine. You will never experience a blank insight card.",
			},
		],
	},
	{
		title: "Security & Account",
		icon: Lock,
		questions: [
			{
				q: "Who can see my uploaded financial data?",
				a: "Data is tenant-isolated using Firebase Security Rules. Only authenticated users explicitly invited to your workspace can query the data. Furthermore, sensitive values are encrypted at rest using AES-256.",
			},
			{
				q: "Can I restrict my manager from seeing profit margins?",
				a: "Yes. Navigate to Settings > Team > Roles. Assign the 'Store Manager' role instead of 'Admin'. This hides profit margins and cost data, showing them only revenue, footfall, and operational anomalies.",
			},
		],
	},
];

export default function HelpCenterPage() {
	const [activeQ, setActiveQ] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");

	const normalizedQuery = searchQuery.trim().toLowerCase();
	const filteredCategories = FAQ_CATEGORIES.map((category) => {
		if (!normalizedQuery) return category;

		const categoryMatch = category.title
			.toLowerCase()
			.includes(normalizedQuery);
		const questions = category.questions.filter((item) => {
			const q = String(item.q || "").toLowerCase();
			const a = String(item.a || "").toLowerCase();
			return q.includes(normalizedQuery) || a.includes(normalizedQuery);
		});

		if (categoryMatch) {
			return {
				...category,
				questions: category.questions,
			};
		}

		return {
			...category,
			questions,
		};
	}).filter((category) => category.questions.length > 0);

	const hasSearchResults = filteredCategories.length > 0;

	return (
		<div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 pb-24">
			{/* Header */}
			<div className="bg-white border-b border-slate-200 px-6 py-20 lg:px-8 text-center">
				<div className="mx-auto max-w-3xl">
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest mb-6">
						<LifeBuoy size={14} /> Support Center
					</div>
					<h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6">
						How can we help you?
					</h1>

					<div className="relative max-w-xl mx-auto shadow-sm">
						<div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
							<Search size={20} />
						</div>
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setActiveQ(null);
							}}
							placeholder="Describe your issue (e.g., 'sync failed', 'change password')"
							className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
						/>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-3xl px-6 lg:px-8 mt-12">
				<div>
					<h2 className="text-2xl font-bold text-slate-900 mb-8">
						Frequently Asked Questions
					</h2>

					<div className="space-y-10">
						{hasSearchResults ? (
							filteredCategories.map((category, catIdx) => {
								const Icon = category.icon;
								return (
									<div key={catIdx}>
										<h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-200">
											<Icon size={20} className="text-blue-600" />{" "}
											{category.title}
										</h3>
										<div className="space-y-4">
											{category.questions.map((item, qIdx) => {
												const id = `${catIdx}-${qIdx}`;
												const isOpen = activeQ === id;
												return (
													<div
														key={id}
														className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all"
													>
														<button
															onClick={() => setActiveQ(isOpen ? null : id)}
															className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-slate-50"
														>
															<div className="flex items-start gap-3">
																<HelpCircle
																	size={18}
																	className="text-slate-400 shrink-0 mt-0.5"
																/>
																<span className="font-semibold text-slate-900 leading-tight">
																	{item.q}
																</span>
															</div>
															<ChevronDown
																size={18}
																className={`text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
															/>
														</button>

														<div
															className={`px-5 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 pb-5 opacity-100" : "max-h-0 opacity-0"}`}
														>
															<div className="pl-7 pt-2 border-t border-slate-100">
																<p className="text-slate-600 text-sm leading-relaxed">
																	{item.a}
																</p>

																{/* Interactive "Was this helpful" mock */}
																<div className="mt-4 flex items-center gap-3 pt-3">
																	<span className="text-xs text-slate-400 font-medium">
																		Was this helpful?
																	</span>
																	<button className="px-3 py-1 rounded border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
																		Yes
																	</button>
																	<button className="px-3 py-1 rounded border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
																		No
																	</button>
																</div>
															</div>
														</div>
													</div>
												);
											})}
										</div>
									</div>
								);
							})
						) : (
							<div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
								<p className="text-sm font-semibold text-slate-900">
									No matching help topics found
								</p>
								<p className="text-xs text-slate-500 mt-1">
									Try a different keyword like sync, anomaly, password, or team
									role.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
