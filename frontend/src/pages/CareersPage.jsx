import {
	Briefcase,
	Cpu,
	Megaphone,
	Users,
	MapPin,
	Clock,
	Mail,
} from "lucide-react";

const benefits = [
	"Remote-friendly work with periodic in-person team sprints",
	"Learning budget for courses, books, and certifications",
	"High ownership and direct product impact from day one",
	"Performance-linked growth and leadership opportunities",
	"ESOP/equity participation for high-impact team members",
	"Health coverage and structured wellness support",
];

const roles = [
	{
		title: "Senior AI/ML Engineer",
		focus: "Predictive modeling, anomaly systems, and LLM fine-tuning",
		icon: Cpu,
		responsibilities: [
			"Design and improve forecasting and anomaly detection systems for retail, F&B, and e-commerce workloads.",
			"Lead experimentation for model quality, latency, and cost optimization across AI provider chains.",
			"Build and evaluate QLoRA fine-tuning workflows and guardrails for strategy generation outputs.",
			"Partner with product and customer teams to convert business pain points into measurable ML improvements.",
		],
		requirements: [
			"5+ years in applied ML with production deployment experience.",
			"Strong Python stack skills and hands-on understanding of MLOps pipelines.",
			"Practical experience in time-series forecasting and model evaluation frameworks.",
			"Comfort with ambiguous real-world datasets and business-first tradeoffs.",
		],
	},
	{
		title: "Growth Marketer",
		focus: "B2B SaaS demand generation and funnel optimization",
		icon: Megaphone,
		responsibilities: [
			"Own acquisition and activation strategy across paid, content, and partner channels.",
			"Build positioning and messaging for Indian SMB founders, operators, and functional heads.",
			"Run lifecycle campaigns to improve trial conversion, adoption, and expansion.",
			"Work with product and CS teams to turn customer outcomes into scalable growth assets.",
		],
		requirements: [
			"3+ years in B2B SaaS marketing with clear pipeline or revenue outcomes.",
			"Strong command of funnel analytics, experimentation, and growth reporting.",
			"Ability to craft conversion-focused copy for technical and non-technical audiences.",
			"Bias for execution and fast iteration with measurable accountability.",
		],
	},
	{
		title: "Customer Success Lead",
		focus: "Helping SMB teams interpret data and execute better decisions",
		icon: Users,
		responsibilities: [
			"Lead onboarding, implementation, and adoption for high-priority accounts.",
			"Translate analytics outputs into practical weekly playbooks for business teams.",
			"Build category-specific success frameworks across retail, F&B, and e-commerce.",
			"Drive renewal health, risk reduction, and expansion through proactive account management.",
		],
		requirements: [
			"4+ years in customer success, implementation consulting, or analytics advisory.",
			"Strong communication and stakeholder management in fast-paced SaaS contexts.",
			"Comfort with KPI interpretation, performance diagnostics, and operational coaching.",
			"Empathy for SMB realities and ability to simplify complex outputs into actions.",
		],
	},
];

export default function CareersPage() {
	return (
		<div className="min-h-screen bg-white px-6 py-16 lg:px-8">
			<div className="mx-auto max-w-6xl">
				<div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 md:p-12">
					<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
						Careers at Mud Media
					</p>
					<h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
						Build AI that improves real business outcomes.
					</h1>
					<p className="mt-4 max-w-4xl text-base leading-relaxed text-slate-600">
						Our culture is engineering-heavy, customer-obsessed, and deeply
						mission-driven. We are building systems that impact how local
						business owners price, stock, spend, and grow. Your work here will
						not sit in a slide deck. It will be used every week.
					</p>
					<div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-600">
						<span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 border border-slate-200">
							<MapPin size={12} /> Bengaluru / Remote (India)
						</span>
						<span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 border border-slate-200">
							<Clock size={12} /> Fast-paced, high-ownership teams
						</span>
					</div>
				</div>

				<div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
					<h2 className="text-2xl font-bold text-slate-900">
						Benefits & Perks
					</h2>
					<div className="mt-4 grid gap-3 md:grid-cols-2">
						{benefits.map((benefit) => (
							<div
								key={benefit}
								className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
							>
								{benefit}
							</div>
						))}
					</div>
				</div>

				<div className="mt-8">
					<h2 className="text-2xl font-bold text-slate-900">Open Roles</h2>
					<div className="mt-4 space-y-5">
						{roles.map((role) => {
							const Icon = role.icon;
							return (
								<div
									key={role.title}
									className="rounded-2xl border border-slate-200 bg-white p-6"
								>
									<div className="mb-4 flex items-start justify-between gap-4">
										<div>
											<div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
												<Icon size={16} />
											</div>
											<h3 className="text-xl font-bold text-slate-900">
												{role.title}
											</h3>
											<p className="mt-1 text-sm text-slate-600">
												{role.focus}
											</p>
										</div>
										<span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
											<Briefcase size={12} /> Full-time
										</span>
									</div>

									<div className="grid gap-5 md:grid-cols-2">
										<div>
											<h4 className="text-sm font-semibold text-slate-900">
												Responsibilities
											</h4>
											<ul className="mt-2 space-y-2 text-sm text-slate-600">
												{role.responsibilities.map((item) => (
													<li key={item} className="flex gap-2">
														<span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
														<span>{item}</span>
													</li>
												))}
											</ul>
										</div>
										<div>
											<h4 className="text-sm font-semibold text-slate-900">
												Requirements
											</h4>
											<ul className="mt-2 space-y-2 text-sm text-slate-600">
												{role.requirements.map((item) => (
													<li key={item} className="flex gap-2">
														<span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
														<span>{item}</span>
													</li>
												))}
											</ul>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-6 md:p-8">
					<h2 className="text-2xl font-bold text-blue-900">How to apply</h2>
					<p className="mt-3 text-sm leading-relaxed text-blue-900/90">
						Send your resume and a short note on why this role matters to you at
						careers@mudmedia.in.
					</p>
					<p className="mt-2 inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-semibold text-blue-900">
						<Mail size={14} /> Subject: Role Name | Full Name | Location
					</p>
				</div>
			</div>
		</div>
	);
}
