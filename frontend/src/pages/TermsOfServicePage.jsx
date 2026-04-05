const sections = [
	{
		title: "1. Acceptance and Eligibility",
		content:
			"By accessing Yukti, you agree to these Terms and confirm authority to bind your organization where usage is business-owned.",
	},
	{
		title: "2. Account Responsibilities",
		content:
			"You are responsible for accurate data uploads, lawful data rights, account credential security, and prompt reporting of unauthorized access.",
	},
	{
		title: "3. Service Limits and Fair Usage",
		content:
			"To protect platform stability, Yukti may enforce technical safeguards and request throttling. Standard API guidance supports up to 1000 requests per minute per account context unless otherwise agreed.",
	},
	{
		title: "4. Availability and Uptime",
		content:
			"We target 99.9% monthly uptime for core services. Some AI features depend on external model providers and may experience latency or degradation outside our direct control.",
	},
	{
		title: "5. Intellectual Property",
		content:
			"Mud Media retains rights to Yukti software, infrastructure, and model systems. You retain rights to your raw uploaded data and business records.",
	},
	{
		title: "6. Recommendations and Decision Risk",
		content:
			"Yukti provides recommendations and predictive outputs. Final business decisions and associated financial, legal, and operational risks remain solely with the user organization.",
	},
	{
		title: "7. Limitation of Liability",
		content:
			"To the maximum extent permitted by law, Mud Media is not liable for indirect or consequential losses, including lost profits, arising from service use. Aggregate liability is limited to fees paid for the prior 12-month period.",
	},
	{
		title: "8. Governing Law",
		content:
			"These Terms are governed by the laws of India. Jurisdiction lies with courts in Bengaluru, Karnataka, unless otherwise agreed in writing.",
	},
];

export default function TermsOfServicePage() {
	return (
		<div className="min-h-screen bg-white px-6 py-16 lg:px-8">
			<div className="mx-auto max-w-5xl">
				<div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 md:p-10">
					<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
						Legal
					</p>
					<h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
						Terms of Service
					</h1>
					<p className="mt-3 text-sm text-slate-600">
						Effective Date: April 5, 2026
					</p>
					<p className="mt-4 text-sm leading-relaxed text-slate-600">
						These Terms govern your use of Yukti, a B2B SaaS analytics platform
						by Mud Media Technologies Pvt. Ltd.
					</p>
				</div>

				<div className="mt-6 space-y-4">
					{sections.map((section) => (
						<section
							key={section.title}
							className="rounded-2xl border border-slate-200 bg-white p-6"
						>
							<h2 className="text-lg font-bold text-slate-900">
								{section.title}
							</h2>
							<p className="mt-2 text-sm leading-relaxed text-slate-600">
								{section.content}
							</p>
						</section>
					))}
				</div>

				<div className="mt-8 rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white">
					<h2 className="text-lg font-bold">Questions about legal terms?</h2>
					<p className="mt-2 text-sm text-slate-300">
						For contract, legal, or procurement clarifications, write to
						<a
							className="ml-1 font-semibold text-white"
							href="mailto:legal@mudmedia.in"
						>
							legal@mudmedia.in
						</a>
						.
					</p>
				</div>
			</div>
		</div>
	);
}
