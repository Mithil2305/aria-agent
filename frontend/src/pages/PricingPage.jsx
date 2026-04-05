import {
	CheckCircle2,
	BadgeIndianRupee,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

const includedItems = [
	"Initial onboarding and business profile setup",
	"Data pipeline activation and schema alignment",
	"Dashboard, analysis, strategy advisor, and report modules",
	"Integration setup support for supported billing/POS connectors",
	"Role-based access controls and account security defaults",
	"Ongoing product updates and platform improvements",
];

const faqs = [
	{
		q: "Is GST included in the monthly fee?",
		a: "No. Monthly pricing is Rs.999 plus applicable GST.",
	},
	{
		q: "Is setup charged one-time or recurring?",
		a: "Setup (Rs.3499) is a one-time initial implementation fee.",
	},
	{
		q: "Do I need to pay setup again if I continue monthly?",
		a: "No. After setup is completed, only the monthly subscription applies.",
	},
	{
		q: "Can I request enterprise pricing?",
		a: "Yes. For multi-location deployments or custom onboarding, contact sales@mudmedia.in.",
	},
];

export default function PricingPage() {
	return (
		<div className="min-h-screen bg-slate-50 px-6 py-16 lg:px-8">
			<div className="mx-auto max-w-6xl">
				<div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
						Pricing
					</p>
					<h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
						Simple pricing for serious business decisions
					</h1>
					<p className="mt-4 max-w-4xl text-base leading-relaxed text-slate-600">
						Yukti is priced to be practical for Indian SMB teams that need
						actionable intelligence without enterprise BI complexity.
					</p>
				</div>

				<div className="mt-8 grid gap-6 lg:grid-cols-3">
					<div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-1">
						<div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
							<BadgeIndianRupee size={18} />
						</div>
						<p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
							Initial Setup
						</p>
						<p className="mt-2 text-4xl font-black text-slate-900">Rs.3499</p>
						<p className="mt-2 text-sm text-slate-600">
							One-time onboarding and implementation fee.
						</p>
					</div>

					<div className="rounded-2xl border-2 border-slate-900 bg-slate-900 p-6 text-white lg:col-span-2">
						<div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
							<Sparkles size={18} />
						</div>
						<p className="text-sm font-semibold uppercase tracking-wide text-slate-300">
							Monthly Subscription
						</p>
						<p className="mt-2 text-5xl font-black">Rs.999</p>
						<p className="mt-1 text-sm font-medium text-slate-300">
							+ GST / month
						</p>
						<p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
							Includes analytics workflows, forecasting, anomaly detection,
							recommendation engine, and ongoing support for product usage.
						</p>
						<div className="mt-5 flex flex-wrap gap-3">
							<Link
								to="/register"
								className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
							>
								Start with Yukti
							</Link>
							<a
								href="mailto:sales@mudmedia.in"
								className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
							>
								Talk to Sales
							</a>
						</div>
					</div>
				</div>

				<div className="mt-8 grid gap-6 lg:grid-cols-2">
					<div className="rounded-2xl border border-slate-200 bg-white p-6">
						<h2 className="text-2xl font-bold text-slate-900">What you get</h2>
						<ul className="mt-4 space-y-3 text-sm text-slate-700">
							{includedItems.map((item) => (
								<li key={item} className="flex items-start gap-2">
									<CheckCircle2 size={16} className="mt-0.5 text-emerald-600" />
									<span>{item}</span>
								</li>
							))}
						</ul>
					</div>

					<div className="rounded-2xl border border-slate-200 bg-white p-6">
						<div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
							<ShieldCheck size={18} />
						</div>
						<h2 className="text-2xl font-bold text-slate-900">Pricing FAQ</h2>
						<div className="mt-4 space-y-4">
							{faqs.map((faq) => (
								<div
									key={faq.q}
									className="rounded-xl border border-slate-200 bg-slate-50 p-4"
								>
									<p className="text-sm font-semibold text-slate-900">
										{faq.q}
									</p>
									<p className="mt-1 text-sm text-slate-600">{faq.a}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
