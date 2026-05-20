import React from "react";
import {
	TrendingUp,
	Store,
	UtensilsCrossed,
	Pill,
	ArrowRight,
	BarChart3,
	AlertCircle,
	Clock,
	Zap,
	Target,
	DollarSign,
	ShoppingCart,
} from "lucide-react";
import { Link } from "react-router-dom";

const CASE_STUDIES = [
	{
		id: "retail-chain",
		icon: Store,
		industry: "Retail & Grocery",
		business: "MetroMart Supermarkets",
		profile: "4 Outlets | ₹1.2Cr Monthly GMV | 45 Employees",
		problem:
			"High inventory leakage and working capital trapped in dead stock. Store managers relied on gut-feeling to order perishables, resulting in high wastage rates on weekends.",
		solution:
			"Yukti ingested 2 years of daily POS data. The Predictive Engine built a baseline forecast with a 92% confidence interval, while the Decision Engine flagged 85 SKUs that were overstocked. Automated reorder reports were sent to managers every Thursday.",
		metrics: [
			{
				label: "Wastage Reduction",
				value: "34%",
				impact: "High",
				subtext: "On perishable goods",
			},
			{
				label: "Stock-out Rate",
				value: "Down to 2%",
				impact: "Critical",
				subtext: "From 18% previous quarter",
			},
			{
				label: "Cash Flow Freed",
				value: "₹4.5L",
				impact: "High",
				subtext: "Within 60 days",
			},
		],
		quote: {
			text: "We used to throw away thousands of rupees in expired dairy and produce every week. Yukti’s weekly forecast tells us exactly what to buy and when.",
			author: "Ramesh Sharma, Operations Head",
		},
	},
	{
		id: "restaurant-group",
		icon: UtensilsCrossed,
		industry: "F&B / Cloud Kitchen",
		business: "Spice Route Kitchens",
		profile: "3 Locations | Swiggy/Zomato Dependent | High Volatility",
		problem:
			"Aggressive discounting on food delivery apps was destroying profit margins. Unpredictable weekend rushes caused understaffing and high order cancellation rates.",
		solution:
			"Yukti’s Anomaly Detection identified that 40% of discounts were applied during peak hours when organic demand was already high. The AI Strategy Advisor recommended a dynamic pricing structure and optimized shift scheduling based on footfall predictions.",
		metrics: [
			{
				label: "EBITDA Margin",
				value: "+22%",
				impact: "Critical",
				subtext: "Improvement over 3 months",
			},
			{
				label: "Promo Burn",
				value: "-45%",
				impact: "High",
				subtext: "Saved on unnecessary discounts",
			},
			{
				label: "Order Cancellations",
				value: "Dropped 60%",
				impact: "Medium",
				subtext: "Due to better staffing",
			},
		],
		quote: {
			text: "Yukti showed us we were paying for customers who were going to order anyway. Stopping peak-hour discounts alone paid for the software 100x over.",
			author: "Priya Desai, Founder",
		},
	},
	{
		id: "pharmacy-distributor",
		icon: Pill,
		industry: "B2B Distribution",
		business: "LifeCare Pharma",
		profile: "B2B Wholesale | 1,200+ SKUs | 90-Day Cash Cycle",
		problem:
			"Irregular hospital purchasing cycles made forecasting impossible. Near-expiry inventory was being written off quarterly, drastically reducing net profits.",
		solution:
			"Utilised Yukti's schema intelligence to ingest unstructured Excel sheets from legacy ERPs. The AI modeled seasonality for chronic vs. acute medicines and sent early-warning alerts for batches 6 months prior to expiry.",
		metrics: [
			{
				label: "Expiry Write-offs",
				value: "-82%",
				impact: "Critical",
				subtext: "Saving ₹12L annually",
			},
			{
				label: "Forecast Accuracy",
				value: "94%",
				impact: "High",
				subtext: "Up from 65% manual tracking",
			},
			{
				label: "Inventory Turnover",
				value: "4.5x to 6.2x",
				impact: "High",
				subtext: "Faster capital rotation",
			},
		],
		quote: {
			text: "The anomaly detection caught a massive drop in orders from a key client before my sales team even noticed. It’s like having a data scientist on staff.",
			author: "Dr. Arvind Iyer, Managing Director",
		},
	},
	{
		id: "d2c-ecommerce",
		icon: ShoppingCart,
		industry: "D2C E-commerce",
		business: "Aura Skincare",
		profile: "Shopify + Amazon | ₹80L MRR | High Customer Acquisition Cost",
		problem:
			"Customer Acquisition Cost (CAC) was rising, but Lifetime Value (LTV) was dropping. The team couldn't identify which marketing channels were bringing in high-retention users.",
		solution:
			"Integrated Shopify and Meta Ads data via Yukti APIs. The Decision Engine performed cohort analysis and correlation mapping, proving that Instagram influencers yielded high initial sales but 0% retention compared to Google Search intent.",
		metrics: [
			{
				label: "CAC Reduction",
				value: "28%",
				impact: "High",
				subtext: "Reallocated to high-intent channels",
			},
			{
				label: "90-Day Retention",
				value: "+15%",
				impact: "High",
				subtext: "Cohort improvement",
			},
			{
				label: "ROAS",
				value: "3.2x to 4.8x",
				impact: "Critical",
				subtext: "Return on Ad Spend",
			},
		],
		quote: {
			text: "We were flying blind, looking at vanity metrics. Yukti connected the dots between ad spend and actual repeat purchases.",
			author: "Neha Kapoor, CMO",
		},
	},
];

export default function CaseStudiesPage() {
	return (
		<div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 pb-20">
			{/* Hero Section */}
			<div className="bg-white border-b border-slate-200 px-6 py-20 lg:px-8 text-center">
				<div className="mx-auto max-w-4xl">
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-6">
						<TrendingUp size={14} /> Proven Outcomes
					</div>
					<h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-6">
						From raw data to <br />
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
							measurable ROI.
						</span>
					</h1>
					<p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
						Discover how Indian SMBs use Yukti’s predictive intelligence to
						eliminate guesswork, stop revenue leakage, and scale operations
						profitably.
					</p>
				</div>
			</div>

			{/* Case Studies Container */}
			<div className="mx-auto max-w-7xl px-6 lg:px-8 mt-16 space-y-16">
				{CASE_STUDIES.map((study) => {
					const Icon = study.icon;
					return (
						<div
							key={study.id}
							className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
						>
							<div className="grid lg:grid-cols-12">
								{/* Left Content Area */}
								<div className="lg:col-span-7 p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-200">
									<div className="flex items-center gap-3 mb-6">
										<div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700">
											<Icon size={24} />
										</div>
										<div>
											<h2 className="text-2xl font-bold text-slate-900">
												{study.business}
											</h2>
											<p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
												{study.industry}
											</p>
										</div>
									</div>

									<div className="mb-8 inline-block px-3 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
										{study.profile}
									</div>

									<div className="space-y-6">
										<div>
											<h3 className="flex items-center gap-2 font-bold text-slate-900 mb-2">
												<AlertCircle size={18} className="text-red-500" /> The
												Challenge
											</h3>
											<p className="text-slate-600 leading-relaxed">
												{study.problem}
											</p>
										</div>
										<div>
											<h3 className="flex items-center gap-2 font-bold text-slate-900 mb-2">
												<Zap size={18} className="text-amber-500" /> The Yukti
												Solution
											</h3>
											<p className="text-slate-600 leading-relaxed">
												{study.solution}
											</p>
										</div>
									</div>

									<blockquote className="mt-10 border-l-4 border-emerald-500 pl-6 italic text-slate-700">
										"{study.quote.text}"
										<footer className="mt-3 text-sm font-bold text-slate-900">
											— {study.quote.author}
										</footer>
									</blockquote>
								</div>

								{/* Right Metrics Area */}
								<div className="lg:col-span-5 bg-slate-50 p-8 lg:p-12 flex flex-col justify-center">
									<h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
										<BarChart3 size={16} /> Business Impact
									</h3>

									<div className="space-y-6">
										{study.metrics.map((metric, mIdx) => (
											<div
												key={mIdx}
												className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden"
											>
												<div
													className={`absolute top-0 left-0 w-1.5 h-full ${metric.impact === "Critical" ? "bg-emerald-500" : "bg-teal-400"}`}
												></div>
												<div className="pl-3">
													<p className="text-sm font-semibold text-slate-500 mb-1">
														{metric.label}
													</p>
													<p className="text-3xl font-black text-slate-900 tracking-tight">
														{metric.value}
													</p>
													<p className="text-xs font-medium text-slate-400 mt-2">
														{metric.subtext}
													</p>
												</div>
											</div>
										))}
									</div>

									<div className="mt-10 bg-white border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
										<Target
											size={20}
											className="text-emerald-600 shrink-0 mt-0.5"
										/>
										<p className="text-sm text-emerald-800 font-medium">
											Analyzed using Yukti's Predictive Engine and 6-Layer
											verification.
										</p>
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* CTA */}
			<div className="mx-auto max-w-5xl px-6 mt-24">
				<div className="bg-black rounded-[3rem] p-12 text-center relative overflow-hidden">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-transparent to-transparent opacity-50" />
					<div className="relative z-10">
						<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
							Ready for your own success story?
						</h2>
						<p className="text-slate-400 max-w-2xl mx-auto mb-8 text-lg">
							Stop analyzing the past. Start predicting the future. Run your
							business data through Yukti today.
						</p>
						<button
							onClick={() =>
								(window.location.href = "https://mudmedia-yukti.vercel.app/")
							}
							className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-slate-200 transition-all inline-flex items-center gap-2"
						>
							Start Free Trial <ArrowRight size={20} />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
