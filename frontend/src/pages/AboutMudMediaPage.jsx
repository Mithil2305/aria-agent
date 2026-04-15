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
		title: "Action Over Aesthetics",
		description:
			"From agency campaigns to Yukti recommendations, output must be useful in the real world, not just visually impressive.",
		icon: Rocket,
	},
	{
		title: "Built for Indian Reality",
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

const yuktiProblems = [
	{
		title: "The Problem",
		description:
			"Most SMB owners collect data daily but decide weekly or monthly. By the time patterns are visible in spreadsheets, margin loss is already locked in.",
		icon: Target,
	},
	{
		title: "The Yukti Solution",
		description:
			"Yukti converts raw sales and operations data into a weekly action plan using a 6-layer pipeline: ingestion, schema intelligence, analytics, prediction, decision scoring, and AI strategy guidance.",
		icon: Rocket,
	},
];

const storyChapters = [
	{
		step: "01",
		title: "Field Reality",
		body: "Mud Media worked with growth-stage businesses across branding, websites, and performance execution. The same issue surfaced repeatedly: teams had activity, but no decision clarity.",
	},
	{
		step: "02",
		title: "Pattern Discovery",
		body: "Across 35,800+ business failure and breakdown scenarios, we identified recurring causes: inventory mismatch, delayed diagnosis, promo burn, and pricing drift.",
	},
	{
		step: "03",
		title: "Productized Intelligence",
		body: "We turned those learnings into Yukti, a product under Mud Media, so decision intelligence could scale beyond consulting hours and reach every serious SMB operator.",
	},
];

export default function AboutMudMediaPage() {
	return (
		<div className="min-h-screen bg-white px-6 py-16 lg:px-8">
			<div className="mx-auto max-w-6xl">
				<div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
					<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
						About Yukti
					</p>
					<h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
						Yukti turns everyday business data into clear weekly decisions.
					</h1>
					<p className="mt-5 max-w-5xl text-base leading-relaxed text-slate-600 md:text-lg">
						Built for Indian SMB operators, Yukti analyzes sales, inventory, and
						operational data through a 6-layer intelligence pipeline to answer
						the only question that matters: what should I do next? From demand
						forecasting and anomaly alerts to risk scoring and action-ready
						recommendations, Yukti helps teams reduce guesswork, protect margin,
						and make faster, higher-confidence decisions every week.
					</p>
					<div className="mt-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
						<Rocket size={14} />
						Actionable intelligence, not dashboard noise
					</div>
				</div>

				<div className="mt-8 grid gap-5 md:grid-cols-2">
					{yuktiProblems.map((item) => {
						const Icon = item.icon;
						return (
							<div
								key={item.title}
								className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
							>
								<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
									<Icon size={18} />
								</div>
								<h2 className="text-2xl font-bold text-slate-950">
									{item.title}
								</h2>
								<p className="mt-3 text-sm leading-relaxed text-slate-600">
									{item.description}
								</p>
							</div>
						);
					})}
				</div>

				<div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
					<h2 className="text-2xl font-bold text-slate-950">
						The Story Behind Yukti
					</h2>
					<div className="mt-5 grid gap-4 md:grid-cols-3">
						{storyChapters.map((chapter) => (
							<div
								key={chapter.step}
								className="rounded-xl border border-slate-200 bg-slate-50 p-4"
							>
								<p className="text-xs font-bold tracking-wider text-blue-700">
									{chapter.step}
								</p>
								<h3 className="mt-2 text-base font-bold text-slate-950">
									{chapter.title}
								</h3>
								<p className="mt-2 text-sm leading-relaxed text-slate-600">
									{chapter.body}
								</p>
							</div>
						))}
					</div>
				</div>

				<div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
						About Mud Media
					</p>
					<h2 className="mt-2 text-2xl font-bold text-slate-950">
						The parent company building brands, products, and growth systems.
					</h2>
					<p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
						Mud Media is a creative and growth company based in Coimbatore. We
						work across web development, branding, digital marketing, and
						content systems to help businesses launch faster and grow with
						clarity. Yukti is one of our core products, built from our direct
						experience with operational bottlenecks in Indian SMBs.
					</p>
					<div className="mt-5 grid gap-4 sm:grid-cols-3">
						<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
							<h3 className="text-sm font-bold text-slate-950">Strategy</h3>
							<p className="mt-1 text-xs text-slate-600">
								Brand positioning, growth roadmaps, and campaign architecture.
							</p>
						</div>
						<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
							<h3 className="text-sm font-bold text-slate-950">Execution</h3>
							<p className="mt-1 text-xs text-slate-600">
								Web experiences, content systems, and conversion-led design.
							</p>
						</div>
						<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
							<h3 className="text-sm font-bold text-slate-950">Intelligence</h3>
							<p className="mt-1 text-xs text-slate-600">
								AI products like Yukti that turn data into weekly decisions.
							</p>
						</div>
					</div>
				</div>

				<div className="mt-8 grid gap-5 md:grid-cols-2">
					<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
						<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
							<Target size={18} />
						</div>
						<h2 className="text-2xl font-bold text-slate-950">Our Mission</h2>
						<p className="mt-3 text-sm leading-relaxed text-slate-600">
							Help Indian businesses move from reactive reporting to proactive,
							weekly decision execution through accessible AI and practical
							creative-growth systems.
						</p>
					</div>
					<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
						<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
							<Eye size={18} />
						</div>
						<h2 className="text-2xl font-bold text-slate-950">Our Vision</h2>
						<p className="mt-3 text-sm leading-relaxed text-slate-600">
							Build an ecosystem where every ambitious SMB can access the same
							quality of intelligence, strategy, and execution that large
							enterprises rely on.
						</p>
					</div>
				</div>

				<div className="mt-8">
					<h2 className="text-2xl font-bold text-slate-950">Core Values</h2>
					<div className="mt-4 grid gap-4 md:grid-cols-2">
						{values.map((value) => {
							const Icon = value.icon;
							return (
								<div
									key={value.title}
									className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
								>
									<div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
										<Icon size={16} />
									</div>
									<h3 className="text-base font-bold text-slate-950">
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

				<div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
					<h2 className="text-2xl font-bold text-slate-950">Build with us</h2>
					<p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
						If you believe AI should improve real business outcomes, not just
						reporting aesthetics, we'd love to connect.
					</p>
					<div className="mt-4 flex flex-wrap gap-3">
						<Link
							to="/careers"
							className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800"
						>
							View Careers
							<ArrowRight size={14} />
						</Link>
						<Link
							to="/contact-us"
							className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-all hover:bg-blue-100"
						>
							Contact Us
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
