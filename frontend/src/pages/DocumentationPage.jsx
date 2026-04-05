import React, { useState } from "react";
import {
	BookOpen,
	Layers,
	Workflow,
	ShieldCheck,
	ArrowRight,
	Database,
	BrainCircuit,
	FileText,
	Settings,
	Search,
	ChevronRight,
	Activity,
} from "lucide-react";
import { Link } from "react-router-dom";

const DOCS_CATEGORIES = [
	{
		id: "getting-started",
		title: "Getting Started",
		icon: BookOpen,
		description:
			"Initial setup, workspace creation, and defining your industry vertical for contextual AI insights.",
		articles: [
			{ title: "Creating your Workspace", time: "3 min read" },
			{ title: "Industry Specializations (Retail vs F&B)", time: "5 min read" },
			{ title: "Inviting Team Members & Roles", time: "2 min read" },
		],
	},
	{
		id: "data-pipeline",
		title: "The 6-Layer Data Pipeline",
		icon: Layers,
		description:
			"Deep dive into how Yukti ingests, cleans, types, and normalizes messy CSV/Excel files automatically.",
		articles: [
			{
				title: "Layer 1 & 2: Ingestion & Schema Intelligence",
				time: "6 min read",
			},
			{ title: "Handling Missing Data (Imputation)", time: "4 min read" },
			{ title: "Supported File Formats & Max Limits", time: "2 min read" },
		],
	},
	{
		id: "ai-engines",
		title: "Decision & Predictive Engines",
		icon: BrainCircuit,
		description:
			"Understand the math behind the magic. Z-score anomaly detection, polynomial regression, and QLoRA.",
		articles: [
			{ title: "How Anomaly Detection Works", time: "8 min read" },
			{
				title: "Understanding Forecast Confidence Intervals",
				time: "7 min read",
			},
			{ title: "The Multi-AI Fallback System", time: "4 min read" },
		],
	},
	{
		id: "integrations",
		title: "Integrations & APIs",
		icon: Workflow,
		description:
			"Connect your POS, Shopify store, or ERP directly to Yukti to automate the flow of daily data.",
		articles: [
			{ title: "Connecting Shopify", time: "5 min read" },
			{ title: "Setting up Webhooks", time: "6 min read" },
			{ title: "API Authentication Rules", time: "3 min read" },
		],
	},
	{
		id: "reports",
		title: "Reports & Dashboards",
		icon: FileText,
		description:
			"Configuring real-time KPI cards, sparklines, and generating automated end-of-month PDF board reports.",
		articles: [
			{ title: "Customizing your Dashboard", time: "4 min read" },
			{ title: "Generating a Board-Ready PDF", time: "3 min read" },
			{ title: "Period-over-Period Analytics", time: "5 min read" },
		],
	},
	{
		id: "security",
		title: "Security & Governance",
		icon: ShieldCheck,
		description:
			"Information on AES-256 encryption, data residency, GDPR compliance, and audit logging.",
		articles: [
			{ title: "Data Privacy & Encryption Specs", time: "5 min read" },
			{ title: "Audit Trail Logs", time: "3 min read" },
			{ title: "Managing Access Tokens", time: "2 min read" },
		],
	},
];

export default function DocumentationPage() {
	const [searchQuery, setSearchQuery] = useState("");

	return (
		<div className="min-h-screen bg-slate-50 font-sans text-slate-900">
			{/* Docs Header */}
			<div className="bg-[#0f172a] text-white pt-24 pb-32 px-6 lg:px-8 border-b border-slate-800">
				<div className="mx-auto max-w-5xl text-center">
					<p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4">
						Knowledge Base
					</p>
					<h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
						Yukti Documentation
					</h1>
					<p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
						Comprehensive guides and technical documentation to help you set up,
						understand, and master the Yukti predictive analytics platform.
					</p>

					{/* Search Bar */}
					<div className="max-w-2xl mx-auto relative group">
						<div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
							<Search size={20} />
						</div>
						<input
							type="text"
							placeholder="Search for 'anomaly detection', 'API keys', 'Shopify'..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-xl"
						/>
					</div>
				</div>
			</div>

			{/* Main Content Grid */}
			<div className="mx-auto max-w-7xl px-6 lg:px-8 -mt-16 pb-24">
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{DOCS_CATEGORIES.map((category) => {
						const Icon = category.icon;
						return (
							<div
								key={category.id}
								className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
							>
								<div className="flex items-center gap-4 mb-5">
									<div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 shrink-0">
										<Icon size={24} />
									</div>
									<h2 className="text-xl font-bold text-slate-900 leading-tight">
										{category.title}
									</h2>
								</div>

								<p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">
									{category.description}
								</p>

								<div className="space-y-3 mt-auto">
									{category.articles.map((article, idx) => (
										<a
											key={idx}
											href="#"
											className="group flex items-start justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors"
										>
											<div className="flex items-center gap-2">
												<ChevronRight
													size={16}
													className="text-slate-300 group-hover:text-cyan-600 transition-colors"
												/>
												<span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
													{article.title}
												</span>
											</div>
											<span className="text-xs text-slate-400 whitespace-nowrap mt-0.5">
												{article.time}
											</span>
										</a>
									))}
								</div>

								<div className="mt-6 pt-4 border-t border-slate-100">
									<a
										href="#"
										className="text-sm font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
									>
										View all articles <ArrowRight size={14} />
									</a>
								</div>
							</div>
						);
					})}
				</div>

				{/* Quick Start / Technical Deep Dive Banner */}
				<div className="mt-16 bg-[#0f172a] rounded-[2rem] p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
					<div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
						<Activity size={300} className="text-cyan-400 -mb-20 -mr-20" />
					</div>

					<div className="relative z-10 max-w-2xl">
						<div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
							<Settings size={14} /> Advanced Implementation
						</div>
						<h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
							Self-Hosting & Enterprise Deployment
						</h3>
						<p className="text-slate-400 leading-relaxed">
							Require data to stay strictly within your VPC? Yukti offers
							enterprise deployments via Docker containers and Kubernetes
							clusters. Read our infrastructure guides to understand memory
							requirements for local TinyLlama inference.
						</p>
					</div>

					<div className="relative z-10 shrink-0 w-full lg:w-auto">
						<button className="w-full lg:w-auto px-8 py-4 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-lg">
							Read Enterprise Architecture
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
