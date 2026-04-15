import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
	{
		name: "Free",
		price: "Rs.0",
		subtitle: "7-day trial only",
		description: "Try Yukti for 7 days with one-time feature access.",
		features: [
			"Data Uploads: 2 total",
			"Analysis Runs: 2 total",
			"Strategy Advisor: 1 total",
			"Premium Analysis: 1 total",
			"Bill Scanner: 1 total",
			"PDF Reports: 1 total",
			"Dashboard + Smart Alerts + Ask Yukti",
			"Auto deactivation after 7 days",
		],
		cta: "Start free trial",
		ctaTo: "/register",
		cardClass: "bg-white border-slate-200",
	},
	{
		name: "Paid",
		upfrontPrice: "Rs.3499 onboarding",
		price: "Rs.999/month",
		// subtitle: "+ GST",
		description: "Full monthly access with limits that reset every month.",
		features: [
			"Data Uploads: 30/month",
			"Analysis Runs: 30/month",
			"Strategy Advisor: 15/month",
			"Premium Analysis: 2/month",
			"Bill Scanner: 20/month",
			"PDF Reports: 15/month",
			"Yukti dedicated Chat Support",
			"Pricing Tips",
			"Market Compare",
			"Weekly Digest",
			"Billing Software Integrations",
			"Includes all dashboard modules",
		],
		cta: "Get started",
		ctaTo: "/register",
		cardClass: "bg-black border-slate-900 text-white",
		recommended: true,
	},
	{
		name: "Enterprise",
		price: "Custom",
		subtitle: "Talk to sales",
		description: "For advanced deployment and organization-wide rollout.",
		features: [
			"Everything in Paid",
			"Multi-branch deployment",
			"Custom integrations",
			"Dedicated onboarding",
			"Priority support and SLA",
			"Custom service limits per feature",
			"Optional unlimited-style usage setup",
		],
		cta: "Contact sales",
		ctaHref: "/contact",
		cardClass: "bg-slate-50 border-slate-200",
	},
];

export default function PricingPage() {
	return (
		<div className="min-h-screen bg-[#fafafa] text-slate-900 selection:bg-black selection:text-white relative overflow-x-hidden">
			<div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
				<div className="absolute -top-24 -left-24 h-[40vw] w-[40vw] rounded-full bg-slate-300/40 blur-[100px]" />
				<div className="absolute bottom-0 right-0 h-[36vw] w-[36vw] rounded-full bg-slate-200/60 blur-[110px]" />
			</div>

			<div className="relative z-10 px-6 py-16 lg:px-8">
				<div className="mx-auto max-w-6xl">
					<section className="rounded-4xl  p-8 md:p-10 ">
						<div className="text-center">
							<p className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600">
								Yukti's Pricing
							</p>
							<h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-black">
								Choose the plan that fits your team
							</h1>
						</div>
					</section>

					<section className="mt-8 grid gap-6 lg:grid-cols-3 items-start">
						{plans.map((plan) => (
							<div
								key={plan.name}
								className={`rounded-3xl border p-6 relative ${plan.cardClass}`}
							>
								{plan.recommended && (
									<span className="absolute right-4 top-4 rounded-full bg-white/15 border border-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
										Most Popular
									</span>
								)}
								<p
									className={`text-sm font-bold uppercase tracking-wide ${plan.recommended ? "text-slate-200" : "text-slate-900"}`}
								>
									{plan.name}
								</p>
								<p
									className={`mt-3 text-5xl font-black ${plan.recommended ? "text-white" : "text-slate-900"}`}
								>
									{plan.upfrontPrice ? (
										<>
											<span className="block text-3xl leading-tight">
												{plan.upfrontPrice.includes("onboarding") ? (
													<>
														{plan.upfrontPrice.replace(" onboarding", "")}{" "}
														<span className="text-[16px] align-middle">
															onboarding
														</span>
													</>
												) : (
													plan.upfrontPrice
												)}
											</span>
											<span className="mt-1 block text-2xl font-semibold leading-tight">
												+{" "}
												{plan.price.includes("/month") ? (
													<>
														{plan.price.replace("/month", "")}
														<span className="text-[16px] align-middle">
															/month
														</span>
													</>
												) : (
													plan.price
												)}
											</span>
										</>
									) : plan.price.includes("/month") ? (
										<>
											{plan.price.replace("/month", "")}
											<span className="text-[18px] align-middle">/month</span>
										</>
									) : (
										plan.price
									)}
								</p>
								<p
									className={`mt-1 text-sm font-medium ${plan.recommended ? "text-slate-300" : "text-slate-600"}`}
								>
									{plan.subtitle}
								</p>
								<p
									className={`mt-3 text-sm ${plan.recommended ? "text-slate-300" : "text-slate-700"}`}
								>
									{plan.description}
								</p>

								<ul
									className={`mt-5 space-y-2.5 text-sm ${plan.recommended ? "text-slate-200" : "text-slate-700"}`}
								>
									{plan.features.map((feature) => (
										<li key={feature} className="flex items-start gap-2">
											<CheckCircle2
												size={15}
												className={`mt-0.5 ${plan.recommended ? "text-slate-400" : "text-slate-500"}`}
											/>
											<span>{feature}</span>
										</li>
									))}
								</ul>

								<div className="mt-6">
									{plan.ctaTo ? (
										<Link
											to={plan.ctaTo}
											className={`block w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${plan.recommended ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-black text-white hover:bg-slate-800"}`}
										>
											{plan.cta}
										</Link>
									) : (
										<a
											href={plan.ctaHref}
											className={`block w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${plan.recommended ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-black text-white hover:bg-slate-800"}`}
										>
											{plan.cta}
										</a>
									)}
								</div>
							</div>
						))}
					</section>
				</div>
			</div>
		</div>
	);
}
