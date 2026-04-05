import {
	Target,
	Eye,
	Building2,
	BarChart3,
	ShieldCheck,
	Rocket,
	ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const values = [
	{
		title: "Democratizing Data",
		description:
			"Enterprise-grade decision intelligence should be accessible to every serious SMB, not only companies with large BI budgets.",
		icon: BarChart3,
	},
	{
		title: "Action Over Dashboards",
		description:
			"We care less about vanity charts and more about recommendations owners can execute this week.",
		icon: Rocket,
	},
	{
		title: "Built for Bharat",
		description:
			"Yukti is tuned for Indian business realities: tight margins, local seasonality, and high operational complexity.",
		icon: Building2,
	},
	{
		title: "Trust by Design",
		description:
			"Data privacy, tenant isolation, and secure model operations are default foundations, not afterthoughts.",
		icon: ShieldCheck,
	},
];

export default function AboutMudMediaPage() {
	return (
		<div className="min-h-screen bg-slate-50 px-6 py-16 lg:px-8">
			<div className="mx-auto max-w-6xl">
				<div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-sm">
					<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
						About Mud Media
					</p>
					<h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
						We built Yukti so Indian SMB owners can decide with confidence.
					</h1>
					<p className="mt-5 max-w-4xl text-base leading-relaxed text-slate-600 md:text-lg">
						Indian retail, F&B, and e-commerce businesses generate data every
						day, but most still rely on delayed reports and intuition for
						critical business decisions. Hiring analysts is expensive.
						Enterprise BI tools are overbuilt for SMB realities. Yukti exists to
						close that gap with fast, affordable, and practical decision
						intelligence.
					</p>
				</div>

				<div className="mt-8 grid gap-5 md:grid-cols-2">
					<div className="rounded-2xl border border-slate-200 bg-white p-6">
						<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
							<Target size={18} />
						</div>
						<h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
						<p className="mt-3 text-sm leading-relaxed text-slate-600">
							To make high-quality, AI-driven decision support accessible to
							every Indian SMB team, regardless of analytics maturity.
						</p>
					</div>
					<div className="rounded-2xl border border-slate-200 bg-white p-6">
						<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
							<Eye size={18} />
						</div>
						<h2 className="text-2xl font-bold text-slate-900">Our Vision</h2>
						<p className="mt-3 text-sm leading-relaxed text-slate-600">
							A future where weekly, data-backed business decisions become the
							default operating model for SMBs across India.
						</p>
					</div>
				</div>

				<div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 md:p-8">
					<h2 className="text-2xl font-bold text-amber-900">
						The Problem We Studied
					</h2>
					<p className="mt-3 text-sm leading-relaxed text-amber-900/90">
						Before productizing Yukti, we studied patterns across 35,800+ Indian
						business disasters and operational breakdowns. We repeatedly saw the
						same root causes: stock mismatch, delayed diagnostics, pricing
						drift, promo burn, and missed demand signals. This research directly
						shaped Yukti's predictive pipeline and anomaly intelligence.
					</p>
				</div>

				<div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
					<h2 className="text-2xl font-bold text-slate-900">Our Story</h2>
					<div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600">
						<p>
							Mud Media started as a data-led growth and operations agency
							working directly with Indian SMB operators. We built custom
							analyses, recovery playbooks, and tactical recommendation systems
							for every client. The outcomes were strong, but the model was too
							manual to scale.
						</p>
						<p>
							We realized the core challenge was not data availability. It was
							actionability at speed. So we transformed years of field learnings
							into Yukti, a SaaS platform built on a 6-layer data pipeline,
							forecasting and anomaly models, and an AI strategy layer that
							prioritizes practical weekly execution.
						</p>
						<p>
							Today, Yukti helps business owners and operators spend less time
							interpreting spreadsheets and more time improving margin,
							inventory, and growth outcomes.
						</p>
					</div>
				</div>

				<div className="mt-8">
					<h2 className="text-2xl font-bold text-slate-900">Core Values</h2>
					<div className="mt-4 grid gap-4 md:grid-cols-2">
						{values.map((value) => {
							const Icon = value.icon;
							return (
								<div
									key={value.title}
									className="rounded-2xl border border-slate-200 bg-white p-5"
								>
									<div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
										<Icon size={16} />
									</div>
									<h3 className="text-base font-bold text-slate-900">
										{value.title}
									</h3>
									<p className="mt-2 text-sm leading-relaxed text-slate-600">
										{value.description}
									</p>
								</div>
							);
						})}
					</div>
				</div>

				<div className="mt-10 rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white md:p-8">
					<h2 className="text-2xl font-bold">Build with us</h2>
					<p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
						If you believe AI should improve real business outcomes, not just
						reporting aesthetics, we'd love to connect.
					</p>
					<div className="mt-4 flex flex-wrap gap-3">
						<Link
							to="/careers"
							className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
						>
							View Careers
							<ArrowRight size={14} />
						</Link>
						<Link
							to="/contact-us"
							className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
						>
							Contact Us
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
