import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
	ArrowRight,
	BarChart3,
	Brain,
	CalendarClock,
	CloudUpload,
	FileText,
	LineChart,
	Radar,
	ShieldCheck,
	Sparkles,
	Workflow,
	Wrench,
	Store,
	Utensils,
	ShoppingCart,
	Briefcase,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { trackLandingCtaClick } from "../services/marketingAnalytics";

const SUPERPOWERS = [
	{
		title: "Smart Data Upload",
		desc: "Drop CSV or Excel files with schema detection, type inference, and quality scoring.",
		icon: CloudUpload,
	},
	{
		title: "Daily Business Logs",
		desc: "Track daily revenue, customers, orders, expenses, and stock in one place.",
		icon: CalendarClock,
	},
	{
		title: "6-Layer Analytics Pipeline",
		desc: "KPIs, trends, forecasts, anomalies, correlations, and narrative strategy outputs.",
		icon: Workflow,
	},
	{
		title: "Predictive Intelligence",
		desc: "Linear and polynomial forecasting with confidence intervals and uncertainty bands.",
		icon: LineChart,
	},
	{
		title: "Anomaly Detection",
		desc: "Detect unusual spikes and drops using z-score and IQR across numeric features.",
		icon: Radar,
	},
	{
		title: "AI Strategy Advisor",
		desc: "Business recommendations tuned for real operational decisions, not generic advice.",
		icon: Brain,
	},
	{
		title: "Premium Month-End Analysis",
		desc: "Deep monthly analysis powered by Yukti's custom fine-tuned model.",
		icon: Sparkles,
	},
	{
		title: "PDF Report Generation",
		desc: "One-click downloadable reports with charts, insights, and recommendations.",
		icon: FileText,
	},
	{
		title: "Stock Management",
		desc: "Track inventory, pending items, movements, and actionable stock alerts.",
		icon: BarChart3,
	},
	{
		title: "Integrations",
		desc: "Webhook-ready endpoints for POS, accounting systems, and external data flows.",
		icon: Wrench,
	},
];

const PIPELINE = [
	"Data Ingestion",
	"Schema Intelligence",
	"Analytics Engine",
	"Predictive Engine",
	"Decision Engine",
	"Insight Engine",
];

const TARGET_USERS = [
	{
		title: "Retail & Grocery",
		points: [
			"Daily revenue + customer tracking",
			"Weekly trends and anomaly alerts",
			"Seasonal strategy recommendations",
		],
		icon: Store,
	},
	{
		title: "Restaurant & Food",
		points: [
			"Weekend demand forecasting",
			"Staffing and ingredient planning",
			"Cost optimization insights",
		],
		icon: Utensils,
	},
	{
		title: "E-commerce & Online",
		points: [
			"Channel performance analysis",
			"Revenue driver correlation",
			"Category risk scoring",
		],
		icon: ShoppingCart,
	},
	{
		title: "Analysts & Consultants",
		points: [
			"Upload any tabular dataset",
			"Auto profiling across structures",
			"Professional reports in seconds",
		],
		icon: Briefcase,
	},
];

const CTA_VARIANTS = {
	A: {
		tag: "Conversion Focus",
		heroPrimary: "Start Free Trial",
		heroSecondary: "See Login",
		heroPunch: "Turn raw numbers into next-week decisions.",
		finalTitle: "Your competitors are guessing. You don't have to.",
		finalBody:
			"From sign-up to strategy in under five minutes: create your account, add your data, run the 6-layer engine, and download decision-ready reports.",
		finalPrimary: "Start Free Trial",
	},
	B: {
		tag: "Proof Focus",
		heroPrimary: "Launch Analysis Now",
		heroSecondary: "View Login",
		heroPunch: "Trusted by growth-focused SMB operators across categories.",
		finalTitle: "Move from intuition to measurable execution.",
		finalBody:
			"Upload your first dataset, identify what is leaking profit, and activate a clear 30-day action plan backed by AI and analytics.",
		finalPrimary: "Run First Analysis",
	},
};

export default function HomePage() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [ctaVariantKey] = useState(() => {
		const saved = localStorage.getItem("yukti_cta_variant");
		if (saved === "A" || saved === "B") return saved;
		const picked = Math.random() > 0.5 ? "B" : "A";
		localStorage.setItem("yukti_cta_variant", picked);
		return picked;
	});

	useEffect(() => {
		const revealNodes = Array.from(
			document.querySelectorAll(".reveal-on-scroll"),
		);
		if (!revealNodes.length) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add("revealed");
						observer.unobserve(entry.target);
					}
				}
			},
			{ threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
		);

		revealNodes.forEach((node) => observer.observe(node));
		return () => observer.disconnect();
	}, []);

	const activeVariant = useMemo(
		() => CTA_VARIANTS[ctaVariantKey] || CTA_VARIANTS.A,
		[ctaVariantKey],
	);

	const trackCta = (target, location, label) => {
		trackLandingCtaClick({
			variant: ctaVariantKey,
			target,
			location,
			label,
		});
	};

	return (
		<div className="landing-shell min-h-screen">
			<div className="landing-grid-bg" />
			<div className="landing-aurora landing-aurora-a" />
			<div className="landing-aurora landing-aurora-b" />

			<header className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
				<nav className="landing-nav rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
							Mud Media
						</p>
						<h1 className="text-white font-semibold text-lg tracking-tight">
							Yukti
						</h1>
					</div>
					<div className="flex items-center gap-2">
						<Link
							to="/login"
							className="landing-btn-ghost"
							onClick={() => trackCta("login", "nav", "Login")}
						>
							Login
						</Link>
						<Link
							to="/register"
							className="landing-btn-solid"
							onClick={() => trackCta("register", "nav", "Start Free Trial")}
						>
							Start Free Trial
						</Link>
					</div>
				</nav>
			</header>

			<section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 reveal-on-scroll">
				<div className="grid lg:grid-cols-2 gap-10 items-center">
					<div>
						<p className="text-cyan-100 text-[11px] uppercase tracking-[0.2em] mb-4">
							{activeVariant.tag}
						</p>
						<p className="text-cyan-200 uppercase tracking-[0.24em] text-xs mb-4">
							Introducing Yukti
						</p>
						<h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.05]">
							What if your data could think for you?
						</h2>
						<p className="text-slate-200/90 mt-5 text-base sm:text-lg leading-relaxed max-w-xl">
							Yukti replaces spreadsheets, disconnected BI tools, and expensive
							consulting with one intelligent platform designed for Indian SMBs.
						</p>
						<p className="text-cyan-100/85 mt-3 text-sm font-medium">
							{activeVariant.heroPunch}
						</p>
						<div className="mt-8 flex flex-wrap gap-3">
							<button
								onClick={() => {
									trackCta(
										user ? "dashboard" : "register",
										"hero_primary",
										user ? "Go to Dashboard" : activeVariant.heroPrimary,
									);
									navigate(user ? "/dashboard" : "/register");
								}}
								className="landing-btn-solid inline-flex items-center gap-2"
							>
								{user ? "Go to Dashboard" : activeVariant.heroPrimary}
								<ArrowRight size={16} />
							</button>
							<Link
								to="/login"
								className="landing-btn-ghost inline-flex items-center gap-2"
								onClick={() =>
									trackCta(
										"login",
										"hero_secondary",
										activeVariant.heroSecondary,
									)
								}
							>
								{activeVariant.heroSecondary}
							</Link>
						</div>
						<div className="grid grid-cols-3 gap-3 mt-8 max-w-lg">
							<div className="landing-stat-card">
								<p className="text-2xl text-white font-semibold">35,800+</p>
								<p className="text-xs text-slate-300">Training samples</p>
							</div>
							<div className="landing-stat-card">
								<p className="text-2xl text-white font-semibold">6-Layer</p>
								<p className="text-xs text-slate-300">Analytics engine</p>
							</div>
							<div className="landing-stat-card">
								<p className="text-2xl text-white font-semibold">4 AI</p>
								<p className="text-xs text-slate-300">Provider fallback</p>
							</div>
						</div>
					</div>

					<div className="landing-scene-wrap">
						<div className="landing-scene">
							<div className="landing-scene-core">
								<ShieldCheck size={24} className="text-cyan-200" />
								<p className="text-white text-sm font-medium mt-2">
									AI Reliability Chain
								</p>
								<p className="text-xs text-slate-300 mt-1">
									Gemini &rarr; Groq &rarr; Claude &rarr; Rule Engine
								</p>
							</div>
							<div className="landing-orbit landing-orbit-a">Predictive</div>
							<div className="landing-orbit landing-orbit-b">Insights</div>
							<div className="landing-orbit landing-orbit-c">Strategy</div>
							<div className="landing-orbit landing-orbit-d">Reports</div>
						</div>
					</div>
				</div>
			</section>

			<section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 reveal-on-scroll">
				<div className="text-center max-w-3xl mx-auto mb-8">
					<p className="text-cyan-200 uppercase tracking-[0.24em] text-xs">
						Capabilities
					</p>
					<h3 className="text-white text-3xl sm:text-4xl font-semibold mt-3">
						One Platform, Ten Superpowers
					</h3>
				</div>
				<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
					{SUPERPOWERS.map((item) => (
						<article key={item.title} className="landing-feature-card">
							<item.icon className="text-cyan-200" size={20} />
							<h4 className="text-white font-medium mt-3">{item.title}</h4>
							<p className="text-slate-300 text-sm mt-2 leading-relaxed">
								{item.desc}
							</p>
						</article>
					))}
				</div>
			</section>

			<section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 reveal-on-scroll">
				<div className="landing-glass rounded-3xl p-6 sm:p-8">
					<p className="text-cyan-200 uppercase tracking-[0.24em] text-xs">
						6 Processing Layers
					</p>
					<h3 className="text-white text-2xl sm:text-3xl font-semibold mt-3 max-w-2xl">
						Six layers between raw data and real decisions
					</h3>
					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
						{PIPELINE.map((layer, index) => (
							<div key={layer} className="landing-step-card">
								<p className="text-cyan-200 text-xs">0{index + 1}</p>
								<p className="text-white font-medium mt-1">{layer}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 reveal-on-scroll">
				<div className="grid lg:grid-cols-2 gap-4">
					<div className="landing-glass rounded-3xl p-6 sm:p-8">
						<p className="text-cyan-200 uppercase tracking-[0.24em] text-xs">
							Custom ML Model
						</p>
						<h3 className="text-white text-2xl font-semibold mt-3">
							TinyLlama 1.1B + QLoRA
						</h3>
						<p className="text-slate-300 text-sm mt-3 leading-relaxed">
							Yukti's custom model was fine-tuned with QLoRA (4-bit NF4, rank
							16) on 35,800+ curated samples from Indian retail, restaurant,
							finance, forecasting, and anomaly datasets.
						</p>
						<div className="grid grid-cols-2 gap-3 mt-6">
							<div className="landing-mini-stat">
								<p className="text-white font-semibold">10+</p>
								<p className="text-slate-300 text-xs">Source datasets</p>
							</div>
							<div className="landing-mini-stat">
								<p className="text-white font-semibold">4-bit NF4</p>
								<p className="text-slate-300 text-xs">Fine-tuning method</p>
							</div>
						</div>
					</div>
					<div className="landing-glass rounded-3xl p-6 sm:p-8">
						<p className="text-cyan-200 uppercase tracking-[0.24em] text-xs">
							Built For India
						</p>
						<h3 className="text-white text-2xl font-semibold mt-3">
							63 Million SMBs Need Better Decisions
						</h3>
						<ul className="text-slate-300 text-sm mt-4 space-y-2">
							<li>Cost-aware product design where every rupee matters.</li>
							<li>Festival and regional seasonality intelligence built in.</li>
							<li>
								Advice tuned for Indian business reality, not generic global
								patterns.
							</li>
							<li>
								Simple enough for single-store owners, strong enough for chains.
							</li>
						</ul>
					</div>
				</div>
			</section>

			<section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 reveal-on-scroll">
				<div className="text-center max-w-3xl mx-auto mb-8">
					<p className="text-cyan-200 uppercase tracking-[0.24em] text-xs">
						Who It's For
					</p>
					<h3 className="text-white text-3xl sm:text-4xl font-semibold mt-3">
						Real owners, real problems, real results
					</h3>
				</div>
				<div className="grid md:grid-cols-2 gap-4">
					{TARGET_USERS.map((segment) => (
						<div className="landing-feature-card" key={segment.title}>
							<segment.icon className="text-cyan-200" size={20} />
							<h4 className="text-white font-medium mt-3">{segment.title}</h4>
							<ul className="text-sm text-slate-300 mt-3 space-y-1.5">
								{segment.points.map((point) => (
									<li key={point}>• {point}</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</section>

			<section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 reveal-on-scroll">
				<div className="landing-cta rounded-3xl p-7 sm:p-10 text-center">
					<p className="text-cyan-200 uppercase tracking-[0.24em] text-xs">
						Get Started
					</p>
					<h3 className="text-3xl sm:text-4xl text-white font-semibold mt-3">
						{activeVariant.finalTitle}
					</h3>
					<p className="text-slate-200 mt-4 max-w-3xl mx-auto">
						{activeVariant.finalBody}
					</p>
					<div className="mt-8 flex flex-wrap justify-center gap-3">
						<button
							type="button"
							onClick={() => {
								trackCta(
									user ? "dashboard" : "register",
									"final_primary",
									activeVariant.finalPrimary,
								);
								navigate(user ? "/dashboard" : "/register");
							}}
							className="landing-btn-solid inline-flex items-center gap-2"
						>
							{activeVariant.finalPrimary}
							<ArrowRight size={16} />
						</button>
						<Link
							to="/login"
							className="landing-btn-ghost"
							onClick={() =>
								trackCta(
									"login",
									"final_secondary",
									"I already have an account",
								)
							}
						>
							I already have an account
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
