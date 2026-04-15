import {
	CheckCircle2,
	Zap,
	Sparkles,
	ShieldCheck,
	LockKeyholeOpenIcon,
} from "lucide-react";
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
		accentClass: "bg-slate-100 text-slate-700 border-slate-200",
		cardClass: "bg-white border-slate-200 shadow-sm",
	},
	{
		name: "Paid",
		upfrontPrice: "Rs.3499 onboarding",
		price: "Rs.999/month",
		subtitle: "Most chosen by SMB teams",
		description: "Full monthly access with limits that reset every month.",
		features: [
			"7 Day Free Trial with full feature access",
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
		accentClass: "bg-amber-100 text-amber-700 border-amber-200",
		cardClass:
			"bg-gradient-to-b from-white to-amber-50 border-amber-200 shadow-[0_20px_50px_-24px_rgba(245,158,11,0.45)]",
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
		ctaHref: "/contact-us",
		accentClass: "bg-sky-100 text-sky-700 border-sky-200",
		cardClass: "bg-slate-50 border-slate-200 shadow-sm",
	},
];

export default function PricingPage() {
	return (
		<div className="min-h-screen bg-[#fafafa] text-slate-900 selection:bg-black selection:text-white relative overflow-x-hidden">
			<div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
				<div className="absolute -top-36 -left-20 h-[42vw] w-[42vw] rounded-full bg-amber-200/55 blur-[120px]" />
				<div className="absolute top-1/4 right-0 h-[30vw] w-[30vw] rounded-full bg-sky-200/50 blur-[110px]" />
				<div className="absolute bottom-0 left-1/2 h-[24vw] w-[24vw] -translate-x-1/2 rounded-full bg-yellow-100/70 blur-[90px]" />
			</div>

			<div className="relative z-10 px-6 pt-5 pb-15 lg:px-8">
				<div className="mx-auto max-w-6xl">
					<section className="rounded-4xl border border-slate-200/80 bg-white/90 p-8 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] backdrop-blur-sm md:p-10">
						<div className="text-center">
							<p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
								<Zap size={13} />
								Yukti's Pricing
							</p>
							<h1 className="mt-4 text-2xl md:text-4xl font-extrabold tracking-tight text-black">
								Get ready to see you business in a whole new light.
							</h1>

							<div className="mt-6 flex flex-wrap items-center justify-center gap-3">
								<div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
									<LockKeyholeOpenIcon size={13} />
									No hidden setup fees after onboarding
								</div>
								<div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
									<ShieldCheck size={13} />
									Secure infrastructure and monthly resets
								</div>
							</div>
						</div>
					</section>

					<section className="mt-8 grid gap-6 lg:grid-cols-3 items-start">
						{plans.map((plan) => (
							<div
								key={plan.name}
								className={`rounded-3xl border p-6 relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-30px_rgba(15,23,42,0.35)] ${plan.cardClass}`}
							>
								{plan.recommended && (
									<span className="absolute right-4 top-4 rounded-full bg-black/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
										Most Popular
									</span>
								)}
								<div
									className={`mb-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${plan.accentClass}`}
								>
									<Zap size={12} />
									{plan.name} Plan
								</div>
								<p className="text-sm font-bold uppercase tracking-wide text-slate-900">
									{plan.name}
								</p>
								<p className="mt-3 text-5xl font-black text-slate-900">
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
											<span className="font-bold mt-1 block text-2xl  leading-tight text-slate-800">
												+{" "}
												{plan.price.includes("/month") ? (
													<>
														{plan.price.replace("/month", "")}
														<span className="text-[16px] align-middle ">
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
								<p className="mt-1 text-sm font-medium text-slate-600">
									{plan.subtitle}
								</p>
								<p className="mt-3 text-sm text-slate-700">
									{plan.description}
								</p>

								<ul className="mt-5 space-y-2.5 text-sm text-slate-700">
									{plan.features.map((feature) => (
										<li key={feature} className="flex items-start gap-2">
											<CheckCircle2
												size={15}
												className={`mt-0.5 ${plan.recommended ? "text-amber-600" : "text-slate-500"}`}
											/>
											<span>{feature}</span>
										</li>
									))}
								</ul>

								<div className="mt-6">
									{plan.ctaTo ? (
										<Link
											to={plan.ctaTo}
											className={`block w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-all ${plan.recommended ? "bg-black text-white hover:bg-black/80" : "bg-black text-white hover:bg-black/80"}`}
										>
											{plan.cta}
										</Link>
									) : (
										<a
											href={plan.ctaHref}
											className={`block w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-all ${plan.recommended ? "bg-amber-600 text-white hover:bg-black/80" : "bg-black text-white hover:bg-slate-800"}`}
										>
											{plan.cta}
										</a>
									)}
								</div>
							</div>
						))}
					</section>

					<section className="mt-8 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm md:p-8">
						<div className="grid gap-4 md:grid-cols-3">
							<div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
									Activation
								</p>
								<p className="mt-2 text-sm text-slate-700">
									Onboarding starts with setup, data mapping, and team
									enablement.
								</p>
							</div>
							<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
									Monthly Cycle
								</p>
								<p className="mt-2 text-sm text-slate-700">
									Paid plan limits reset every month, so your team runs with a
									predictable usage rhythm.
								</p>
							</div>
							<div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
									Scale Path
								</p>
								<p className="mt-2 text-sm text-slate-700">
									Need custom limits, multi-branch rollout, or integrations?
									Move to Enterprise anytime.
								</p>
							</div>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
