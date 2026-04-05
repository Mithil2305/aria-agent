import { ShieldCheck, Database, Lock, Eye } from "lucide-react";

const sections = [
	{
		title: "1. Scope",
		content:
			"This Privacy Policy applies to Yukti web applications, APIs, integrations, support channels, and analytics processing operated by Mud Media Technologies Pvt. Ltd.",
	},
	{
		title: "2. Data We Collect",
		content:
			"We collect account data (name, business email, role), operational business data (CSV uploads, POS/billing integrations, transactions, order and inventory fields), and product telemetry (usage events, diagnostics, request metadata).",
	},
	{
		title: "3. Data Processing & AI",
		content:
			"Data is used to deliver analytics, forecasting, anomaly alerts, and recommendation outputs. Model-improvement workflows prioritize aggregated or de-identified patterns. Tenant isolation controls and Firebase security boundaries are used to prevent cross-tenant data exposure. Data is protected in transit and at rest with strong encryption controls including AES-256-equivalent standards. Your identifiable sales data is not shared with competitors.",
	},
	{
		title: "4. Third-Party AI Providers",
		content:
			"Yukti may route selected inference requests through approved AI providers in a fallback chain (for example, Claude or Gemini) for continuity and reliability. Where feasible, payload minimization and anonymization controls are applied before sending context externally.",
	},
	{
		title: "5. Sharing, Retention, and Rights",
		content:
			"We do not sell personal data. Data is shared only with authorized subprocessors, at your direction, or where legally required. You can request data access, correction, export, deletion, and processing opt-outs where applicable by contacting privacy@mudmedia.in.",
	},
	{
		title: "6. Security and Incident Handling",
		content:
			"We maintain administrative, technical, and organizational safeguards including access controls, encrypted storage, and incident response procedures. While no platform can guarantee absolute security, we continuously improve our controls and monitoring posture.",
	},
];

export default function PrivacyPolicyPage() {
	return (
		<div className="min-h-screen bg-slate-50 px-6 py-16 lg:px-8">
			<div className="mx-auto max-w-5xl">
				<div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-10">
					<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
						Legal
					</p>
					<h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
						Privacy Policy
					</h1>
					<p className="mt-3 text-sm text-slate-600">
						Effective Date: April 5, 2026
					</p>
					<p className="mt-4 text-sm leading-relaxed text-slate-600">
						This policy explains how Yukti collects, processes, protects, and
						governs personal and business operational data for analytics
						services.
					</p>
				</div>

				<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
						<div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
							<ShieldCheck size={15} />
						</div>
						Tenant isolation
					</div>
					<div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
						<div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
							<Lock size={15} />
						</div>
						Encryption controls
					</div>
					<div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
						<div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
							<Database size={15} />
						</div>
						Data minimization
					</div>
					<div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
						<div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
							<Eye size={15} />
						</div>
						User rights access
					</div>
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

				<div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
					<h2 className="text-lg font-bold text-slate-900">
						Contact for privacy requests
					</h2>
					<p className="mt-2 text-sm text-slate-600">
						For access, deletion, export, or correction requests, email
						<a
							className="ml-1 font-semibold text-slate-900"
							href="mailto:privacy@mudmedia.in"
						>
							privacy@mudmedia.in
						</a>
						.
					</p>
				</div>
			</div>
		</div>
	);
}
