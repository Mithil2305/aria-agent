import { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
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
	CheckCircle2,
	PieChart,
	TrendingUp,
	TrendingDown,
	Zap,
	Blocks,
	Database,
	Cpu,
	BookOpen,
	Layers,
	Share2,
	Package,
	Timer,
	Target,
	AlertTriangle,
} from "lucide-react";

const trackLandingCtaClick = (data) => console.log("Analytics Event:", data);

// Complex Background Node Component
const AnimatedOrb = ({
	delay,
	duration,
	color,
	size,
	start,
	end,
	shouldAnimate,
}) => {
	const baseClass = `absolute rounded-full mix-blend-multiply filter blur-[80px] opacity-35 pointer-events-none ${color} ${size}`;

	if (!shouldAnimate) {
		return (
			<div
				className={baseClass}
				style={{ transform: `translate3d(${start.x}, ${start.y}, 0)` }}
			/>
		);
	}

	return (
		<motion.div
			className={baseClass}
			animate={{
				x: [start.x, end.x, start.x],
				y: [start.y, end.y, start.y],
				scale: [1, 1.12, 1],
			}}
			transition={{
				duration: duration,
				repeat: Infinity,
				ease: "linear",
				delay: delay,
			}}
		/>
	);
};

// Mini sparkline for the large Predictive Intelligence card
const MiniSparkline = () => {
	const values = [42, 55, 48, 70, 63, 80, 72, 88, 82, 95, 90, 100];
	const w = 340,
		h = 80,
		pad = 8;
	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min;
	const stepX = (w - pad * 2) / (values.length - 1);
	const points = values.map((v, i) => {
		const x = pad + i * stepX;
		const y = h - pad - ((v - min) / range) * (h - pad * 2);
		return `${x},${y}`;
	});
	const linePath = points
		.map((p, i) => `${i === 0 ? "M" : "L"} ${p}`)
		.join(" ");
	const areaPath = `${linePath} L ${pad + (values.length - 1) * stepX},${h - pad} L ${pad},${h - pad} Z`;

	return (
		<svg
			viewBox={`0 0 ${w} ${h}`}
			className="w-full h-20"
			preserveAspectRatio="none"
		>
			<defs>
				<linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#1e293b" stopOpacity="0.15" />
					<stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
				</linearGradient>
			</defs>
			<path d={areaPath} fill="url(#sparkGrad)" />
			<path
				d={linePath}
				fill="none"
				stroke="#334155"
				strokeWidth="2.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			{values.map((v, i) => {
				const x = pad + i * stepX;
				const y = h - pad - ((v - min) / range) * (h - pad * 2);
				return i === values.length - 1 ? (
					<circle key={i} cx={x} cy={y} r="4" fill="#0f172a" />
				) : null;
			})}
		</svg>
	);
};

// ── Ten Superpowers ─────────────────────────────────────────────────────────
// Using all imported icons: LineChart, CloudUpload, Radar, Brain, Sparkles,
// BookOpen, BarChart3, FileText, ShieldCheck, Wrench
const SUPERPOWERS = [
	{
		title: "Predictive Intelligence",
		desc: "Linear and polynomial regression forecasting with uncertainty bands and confidence intervals.",
		icon: LineChart,
		// Large hero card: 6 cols × 2 rows on desktop
		layout: "lg:col-span-6 lg:row-span-2",
		isLarge: true,
	},
	{
		title: "Smart Data Upload",
		desc: "Drag-and-drop CSV/Excel files with auto schema detection, type inference, and data quality scoring.",
		icon: CloudUpload,
		layout: "lg:col-span-3 lg:row-span-1",
		isLarge: false,
	},
	{
		title: "Anomaly Detection",
		desc: "Z-score and IQR-based anomaly detection across all numeric features to catch problems early.",
		icon: Radar,
		layout: "lg:col-span-3 lg:row-span-1",
		isLarge: false,
	},
	{
		title: "AI Strategy Advisor",
		desc: "Personalised business recommendations powered by a multi-provider AI fallback chain for maximum reliability.",
		icon: Brain,
		// Spans the right 6 cols on the second row of the large card
		layout: "lg:col-span-6 lg:row-span-1",
		isLarge: false,
	},
	{
		title: "Premium Month-End Analysis",
		desc: "Deep analysis powered by Yukti's custom QLoRA fine-tuned TinyLlama model, once per month per user.",
		icon: Sparkles,
		layout: "lg:col-span-4 lg:row-span-1",
		isLarge: false,
	},
	{
		title: "Daily Business Logs",
		desc: "Simple form to log daily revenue, customers, orders, expenses, and stock, stored securely.",
		icon: BookOpen,
		layout: "lg:col-span-4 lg:row-span-1",
		isLarge: false,
	},
	{
		title: "KPI Dashboard",
		desc: "Real-time key performance indicators with trend indicators, period-over-period deltas, and sparkline cards.",
		icon: BarChart3,
		layout: "lg:col-span-4 lg:row-span-1",
		isLarge: false,
	},
	{
		title: "Instant PDF Reports",
		desc: "Generate branded, chart-rich PDF reports in seconds — ready to share with your team or investors.",
		icon: FileText,
		layout: "lg:col-span-6 lg:row-span-1",
		isLarge: false,
	},
	{
		title: "Data Security",
		desc: "Enterprise-grade AES-256 encryption and role-based access keep every record private and audit-ready.",
		icon: ShieldCheck,
		layout: "lg:col-span-6 lg:row-span-1",
		isLarge: false,
	},
	{
		title: "Custom Integrations",
		desc: "Connect POS systems, e-commerce platforms, and ERPs via our open API and pre-built connectors.",
		icon: Wrench,
		layout: "lg:col-span-12 lg:row-span-1",
		isLarge: false,
		isWide: true,
	},
];

// ── useInView usage — animate pipeline steps in on scroll ─────────────────
function PipelineSection({ staggerContainer, fadeInUp, PIPELINE }) {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: "-80px" });

	return (
		<section
			ref={ref}
			className="py-32 bg-[#0a0a0a] text-white relative z-10 rounded-t-[3rem]"
		>
			<div className="absolute -top-64 right-10 w-96 h-96 bg-white/5 filter blur-[90px] rounded-full pointer-events-none" />
			<div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
				<div className="grid lg:grid-cols-2 gap-20 items-center">
					<motion.div
						initial={{ opacity: 0, x: -50 }}
						animate={isInView ? { opacity: 1, x: 0 } : {}}
						transition={{ duration: 0.8, ease: "easeOut" }}
					>
						<div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10 backdrop-blur-md">
							<Layers size={32} className="text-slate-100" />
						</div>
						<h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 whitecol">
							Six layers between raw data and real decisions
						</h2>
						<p className="text-slate-400 text-xl leading-relaxed mb-10">
							Every dataset you upload passes through six intelligent processing
							layers. By the time it reaches you, it is no longer data, it is a
							clear action plan.
						</p>
						<div className="flex flex-col gap-6">
							<div className="flex items-start gap-4 bg-white/5 border border-white/5 p-5 rounded-2xl backdrop-blur-sm">
								<CheckCircle2 className="text-slate-300 shrink-0 mt-0.5" />
								<div>
									<h4 className="font-semibold text-lg whitecol">
										Four AI Providers. Zero Downtime.
									</h4>
									<p className="text-sm text-slate-400 mt-2">
										Gemini, Groq, Claude, and our Rule-Based Engine. What
										happens when an AI provider goes down? Yukti automatically
										switches to the next one.
									</p>
								</div>
							</div>
							<div className="flex items-start gap-4 p-5">
								<CheckCircle2 className="text-slate-300 shrink-0 mt-0.5" />
								<div>
									<h4 className="font-semibold text-lg whitecol">
										This model thinks Indian
									</h4>
									<p className="text-sm text-slate-400 mt-2">
										Trained specifically on Indian retail, restaurant, and
										service business patterns. It understands festivals, local
										contexts, and SMB realities.
									</p>
								</div>
							</div>
						</div>
					</motion.div>

					<motion.div
						initial="hidden"
						animate={isInView ? "visible" : "hidden"}
						variants={staggerContainer}
						className="relative bg-white/[0.02] border border-white/[0.05] p-8 md:p-12 rounded-[2.5rem] backdrop-blur-xl"
					>
						<div className="absolute left-10 md:left-14 top-14 bottom-14 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent" />
						<div className="space-y-6 relative">
							{PIPELINE.map((layer, index) => (
								<motion.div
									key={layer.name}
									variants={fadeInUp}
									className="relative flex items-center gap-6 group cursor-default"
								>
									<div className="relative z-10 w-8 h-8 rounded-full bg-black border-2 border-slate-700 flex items-center justify-center text-xs font-bold font-mono group-hover:border-white transition-colors">
										{index + 1}
									</div>
									<div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
										<p className="text-lg font-bold text-slate-200 group-hover:text-white">
											{layer.name}
										</p>
										<p className="text-sm text-slate-400 mt-1">{layer.desc}</p>
									</div>
								</motion.div>
							))}
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}

const PIPELINE = [
	{
		name: "Data Ingestion",
		desc: "CSV/Excel parsing, cleaning, and normalisation",
	},
	{
		name: "Schema Intelligence",
		desc: "Auto type detection, profiling, and quality scoring",
	},
	{
		name: "Analytics Engine",
		desc: "KPIs, trends, and seasonality decomposition",
	},
	{
		name: "Predictive Engine",
		desc: "Forecasting, anomaly detection, and uncertainty bands",
	},
	{
		name: "Decision Engine",
		desc: "Correlations, feature importance, and risk scoring",
	},
	{
		name: "Insight Engine",
		desc: "AI reasoning, narrative generation, and strategy recommendations",
	},
];

const TARGET_USERS = [
	{
		title: "Retail & Grocery",
		quote:
			"I log my daily sales, and Yukti tells me which products to stock more, when to run offers, and warns me if sales are dropping.",
		points: [
			"Daily revenue and customer tracking",
			"Weekly trend analysis and anomaly alerts",
			"Seasonal strategy suggestions",
			"Stock management with delivery tracking",
		],
		icon: Store,
	},
	{
		title: "Restaurant & Food",
		quote:
			"My restaurant's weekend sales are 3x weekdays. Yukti helps me plan staff, ingredients, and marketing accordingly.",
		points: [
			"Upload POS sales data (CSV or Excel)",
			"Forecast busy periods with confidence intervals",
			"Local event and social media marketing tips",
			"Monthly cost optimisation insights",
		],
		icon: Utensils,
	},
	{
		title: "E-commerce & Online",
		quote:
			"Yukti analyses my combined multi-platform data and finds which products and channels are underperforming.",
		points: [
			"Multi-platform sales CSV analysis",
			"Product-channel correlation engine",
			"Feature importance for revenue drivers",
			"Risk scoring for declining categories",
		],
		icon: ShoppingCart,
	},
	{
		title: "Analysts & Consultants",
		quote:
			"I upload client datasets and generate professional PDF reports in seconds, what used to take hours of Excel work.",
		points: [
			"Upload any CSV or Excel dataset",
			"Auto schema detection for any structure",
			"Full analysis pipeline in seconds",
			"Branded PDF reports with charts",
		],
		icon: Briefcase,
	},
];

const PROBLEM_SIGNALS = [
	{
		title: "Revenue Volatility",
		problem: "Owner sees unpredictable sales swings but cannot identify why.",
		solution:
			"Yukti maps trend breaks to likely causes and flags early anomalies.",
		icon: TrendingDown,
		severity: "High",
	},
	{
		title: "Inventory Leakage",
		problem:
			"Fast-selling products stock out while slow SKUs block working capital.",
		solution:
			"Daily stock velocity and reorder intelligence keep shelves balanced.",
		icon: Package,
		severity: "Critical",
	},
	{
		title: "Late Decisions",
		problem: "Insights arrive after the week is over and losses are locked in.",
		solution:
			"Near real-time insight cards suggest actions before damage compounds.",
		icon: Timer,
		severity: "High",
	},
];

const TREND_SERIES = {
	before: [68, 54, 62, 48, 58, 43, 52, 46, 50, 42, 45, 40],
	after: [42, 46, 49, 52, 54, 56, 59, 62, 64, 66, 69, 72],
};

const VALUE_PILLARS = [
	{
		title: "Find Root Cause Fast",
		desc: "Not just charts, but plain-language cause and effect for every drop or spike.",
		icon: Target,
	},
	{
		title: "Act With Weekly Precision",
		desc: "Every report ends with concrete actions mapped to this week and next week.",
		icon: CalendarClock,
	},
	{
		title: "Protect Margin Continuously",
		desc: "Track margin pressure from pricing, discounting, and cost drift in one place.",
		icon: PieChart,
	},
	{
		title: "Scale Decisions Across Teams",
		desc: "Ops, owner, and marketing align on one source of truth and one action queue.",
		icon: Share2,
	},
];

const DECISION_LOOP = [
	{
		title: "Capture",
		desc: "Daily logs, POS exports, stock movement",
		icon: Database,
	},
	{ title: "Diagnose", desc: "Trend, anomaly, and risk scoring", icon: Radar },
	{ title: "Decide", desc: "AI recommendations ranked by impact", icon: Brain },
	{
		title: "Execute",
		desc: "Weekly playbook with measurable goals",
		icon: Zap,
	},
];

const CTA_VARIANTS = {
	A: {
		tag: "Conversion Focus",
		heroPrimary: "Try Yukti Live",
		heroSecondary: "Talk to Us",
		heroPunch: "Your competitors are guessing. You don't have to.",
		finalTitle: "Your competitors are guessing. You don't have to.",
		finalBody:
			"Yukti is live and free to try. Upload your first dataset, see the 6-layer analysis in action, and get AI-driven strategy tailored to your business, in minutes, not months.",
		finalPrimary: "Launch Yukti",
	},
	B: {
		tag: "Proof Focus",
		heroPrimary: "Try Yukti Live",
		heroSecondary: "Talk to Us",
		heroPunch: "From signup to strategy in under five minutes.",
		finalTitle: "What if your data could think for you?",
		finalBody:
			"Yukti is live and free to try. Upload your first dataset, see the 6-layer analysis in action, and get AI-driven strategy tailored to your business, in minutes, not months.",
		finalPrimary: "Launch Yukti",
	},
};

const fadeInUp = {
	hidden: { opacity: 0, y: 40 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
	},
};

const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.15, delayChildren: 0.1 },
	},
};

function buildPath(values, width = 420, height = 210, padding = 22) {
	if (!values?.length) return "";
	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = Math.max(1, max - min);
	const stepX = (width - padding * 2) / Math.max(1, values.length - 1);
	return values
		.map((value, index) => {
			const x = padding + index * stepX;
			const normalized = (value - min) / range;
			const y = height - padding - normalized * (height - padding * 2);
			return `${index === 0 ? "M" : "L"} ${x} ${y}`;
		})
		.join(" ");
}

export default function HomePage() {
	const navigate = useNavigate();
	const prefersReducedMotion = useReducedMotion();

	const [ctaVariantKey] = useState(() => {
		const saved = localStorage.getItem("yukti_cta_variant");
		if (saved === "A" || saved === "B") return saved;
		const picked = Math.random() > 0.5 ? "B" : "A";
		localStorage.setItem("yukti_cta_variant", picked);
		return picked;
	});

	const activeVariant = useMemo(
		() => CTA_VARIANTS[ctaVariantKey] || CTA_VARIANTS.A,
		[ctaVariantKey],
	);

	const trackCta = (target, location, label) => {
		trackLandingCtaClick({ variant: ctaVariantKey, target, location, label });
	};

	const beforePath = useMemo(() => buildPath(TREND_SERIES.before), []);
	const afterPath = useMemo(() => buildPath(TREND_SERIES.after), []);

	return (
		<div className="min-h-screen bg-[#fafafa] text-slate-900 selection:bg-black selection:text-white font-sans relative overflow-x-hidden">
			{/* Ambient Background */}
			<div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
				<AnimatedOrb
					color="bg-slate-200"
					size="w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw]"
					start={{ x: "-10vw", y: "-10vh" }}
					end={{ x: "20vw", y: "20vh" }}
					duration={25}
					delay={0}
					shouldAnimate={!prefersReducedMotion}
				/>
				<AnimatedOrb
					color="bg-gray-200"
					size="w-[60vw] h-[60vw] md:w-[35vw] md:h-[35vw]"
					start={{ x: "50vw", y: "40vh" }}
					end={{ x: "20vw", y: "10vh" }}
					duration={30}
					delay={5}
					shouldAnimate={!prefersReducedMotion}
				/>
				<AnimatedOrb
					color="bg-slate-300"
					size="w-[90vw] h-[90vw] md:w-[50vw] md:h-[50vw]"
					start={{ x: "10vw", y: "70vh" }}
					end={{ x: "60vw", y: "40vh" }}
					duration={35}
					delay={2}
					shouldAnimate={!prefersReducedMotion}
				/>
				<div
					className="absolute inset-0 opacity-[0.03]"
					style={{
						backgroundImage:
							"url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22 x=%220%22 y=%220%22 width=%22100%25%22 height=%22100%25%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.5%22/%3E%3C/svg%3E')",
					}}
				/>
			</div>

			{/* Hero Section */}
			<section className="relative pt-28 pb-20 lg:pt-24 lg:pb-32 px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
				<motion.div
					initial="hidden"
					animate="visible"
					variants={staggerContainer}
					className="max-w-4xl flex flex-col items-center"
				>
					<motion.div
						variants={fadeInUp}
						className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 mb-8 whitespace-nowrap hover:shadow-md transition-shadow cursor-default"
					>
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
							<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
						</span>
						<span>Introducing Yukti</span>
					</motion.div>

					<motion.h1
						variants={fadeInUp}
						className="text-5xl sm:text-7xl lg:text-[4rem] font-extrabold tracking-tighter text-black leading-[1.05] mb-8"
					>
						What if your data could <br className="hidden md:block" />
						<span className="relative inline-block mt-2">
							<span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-900">
								think for you?
							</span>
							<motion.span
								initial={{ scaleX: 0 }}
								animate={{ scaleX: 1 }}
								transition={{ delay: 1, duration: 0.8, ease: "easeInOut" }}
								className="absolute bottom-1 left-0 right-0 h-3 bg-slate-200/50 -z-10 origin-left rounded-full"
							/>
						</span>
					</motion.h1>

					<motion.p
						variants={fadeInUp}
						className="text-[1rem] sm:text-xl text-slate-500 mb-12 max-w-2xl leading-relaxed"
					>
						We fed 35,800+ Indian business disasters to an AI so you don't have
						to live through them. Yukti takes your sales data and gives you the
						cheat codes for what to do next. No guessing, just winning.
					</motion.p>

					<motion.div
						variants={fadeInUp}
						className="flex flex-wrap justify-center gap-4 mb-12 opacity-80"
					>
						<div className="flex flex-col items-center px-6 border-r border-slate-200">
							<span className="text-2xl font-bold text-black">35,800+</span>
							<span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
								Training Samples
							</span>
						</div>
						<div className="flex flex-col items-center px-6 border-r border-slate-200">
							<span className="text-2xl font-bold text-black">6-Layer</span>
							<span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
								Analytics Engine
							</span>
						</div>
						<div className="flex flex-col items-center px-6">
							<span className="text-2xl font-bold text-black">4 AI</span>
							<span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
								Provider Fallback
							</span>
						</div>
					</motion.div>

					<motion.div
						variants={fadeInUp}
						className="flex flex-col sm:flex-row gap-4 w-full justify-center"
					>
						<button
							onClick={() => {
								trackCta("live", "hero_primary", activeVariant.heroPrimary);
								window.location.href = "https://mudmedia-yukti.vercel.app/";
							}}
							className="px-8 py-4 bg-black text-white rounded-full font-semibold text-lg hover:bg-slate-800 transition-all hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 flex items-center justify-center gap-3 group"
						>
							{activeVariant.heroPrimary}
							<ArrowRight
								size={20}
								className="group-hover:translate-x-1.5 transition-transform duration-300"
							/>
						</button>
						<button
							onClick={() => {
								trackCta("demo", "hero_secondary", activeVariant.heroSecondary);
								navigate("/contact-us");
							}}
							className="px-8 py-4 bg-white/50 backdrop-blur-md text-black border border-slate-200 rounded-full font-semibold text-lg hover:bg-white transition-all hover:-translate-y-1 hover:shadow-xl shadow-sm"
						>
							{activeVariant.heroSecondary}
						</button>
					</motion.div>
				</motion.div>

				{/* 3D Transformed UI Mockup */}
				<div className="mt-24 w-full relative perspective-1000 z-20">
					<div className="absolute inset-0 bg-gradient-to-t from-[#fafafa] via-transparent to-transparent z-30 pointer-events-none" />
					<div className="aspect-[16/9] md:aspect-[21/9] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col relative transform-style-3d">
						<div className="h-12 border-b border-slate-100 bg-slate-50/80 flex items-center px-5 gap-3">
							<div className="flex gap-2">
								<div className="w-3 h-3 rounded-full bg-slate-300" />
								<div className="w-3 h-3 rounded-full bg-slate-300" />
								<div className="w-3 h-3 rounded-full bg-slate-300" />
							</div>
							<div className="mx-auto w-1/3 h-5 bg-white rounded-md border border-slate-200/60 shadow-inner" />
						</div>
						<div className="flex-1 p-4 md:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-4 gap-5 opacity-85">
							<div className="md:col-span-1 hidden md:flex flex-col border-r border-slate-100 pr-5">
								<div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 mb-4">
									<p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
										Workspace
									</p>
									<p className="text-xs font-bold text-slate-800 mt-1">
										Yukti Board
									</p>
								</div>
								<div className="space-y-2.5">
									{[
										"Overview",
										"Next Month Plan",
										"Restock Signals",
										"Playbooks",
									].map((item) => (
										<div
											key={item}
											className="flex items-center gap-2 text-[11px] text-slate-600"
										>
											<span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
											<span>{item}</span>
										</div>
									))}
								</div>
								<div className="mt-5 rounded-xl border border-slate-200 bg-white p-3">
									<p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
										Next Month Outlook
									</p>
									<p className="text-xl font-bold text-slate-900 mt-1">
										+16.2%
									</p>
									<p className="text-[11px] text-emerald-700 mt-1">
										Expected demand uplift
									</p>
								</div>
								<div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
									<div className="h-2 rounded-full bg-slate-200 w-full" />
									<div className="h-2 rounded-full bg-slate-200 w-5/6" />
									<div className="h-2 rounded-full bg-slate-200 w-2/3" />
								</div>
							</div>
							<div className="md:col-span-3 space-y-5">
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									{[
										{
											label: "Next Month Revenue",
											value: "INR 3.8L",
											trend: "+16.2%",
										},
										{
											label: "Expected Orders",
											value: "1,410",
											trend: "+13.0%",
										},
										{
											label: "Restock Priority",
											value: "7 SKUs",
											trend: "Act this week",
										},
									].map((stat) => (
										<div
											key={stat.label}
											className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
										>
											<p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
												{stat.label}
											</p>
											<p className="text-lg font-bold text-slate-900 mt-1">
												{stat.value}
											</p>
											<p className="text-[11px] text-emerald-700 mt-1 font-semibold">
												{stat.trend}
											</p>
										</div>
									))}
								</div>
								<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
									<div className="lg:col-span-2 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 p-4 relative overflow-hidden">
										<p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
											Next 30 days forecast
										</p>
										<svg viewBox="0 0 320 130" className="w-full h-32">
											{[0, 1, 2, 3].map((line) => (
												<line
													key={line}
													x1="0"
													x2="320"
													y1={16 + line * 28}
													y2={16 + line * 28}
													stroke="#dbe2ea"
													strokeDasharray="4 6"
												/>
											))}
											<path
												d="M 8 114 C 45 92 68 98 96 80 C 130 58 160 68 188 48 C 220 28 252 34 312 18"
												fill="none"
												stroke="#0f172a"
												strokeWidth="3"
												strokeLinecap="round"
											/>
											<path
												d="M 8 114 C 45 92 68 98 96 80 C 130 58 160 68 188 48 C 220 28 252 34 312 18 L 312 130 L 8 130 Z"
												fill="url(#sparkGrad)"
												opacity="0.5"
											/>
										</svg>
										<div className="absolute right-4 top-4 text-[10px] px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold">
											Confidence 91%
										</div>
									</div>
									<div className="rounded-2xl border border-slate-200 bg-white p-3">
										<p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
											Yukti says do this next month
										</p>
										<div className="space-y-2">
											<div className="rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-2 text-[11px] text-emerald-800">
												Restock cooking oil and atta by week 1
											</div>
											<div className="rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-2 text-[11px] text-amber-800">
												Do not restock slow sauces this cycle
											</div>
											<div className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2 text-[11px] text-slate-700">
												Push combos on weekends for higher margin
											</div>
										</div>
									</div>
								</div>
								<div className="rounded-2xl border border-slate-200 bg-white p-3">
									<div className="grid grid-cols-12 text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-2 mb-1.5">
										<span className="col-span-5">Stock item</span>
										<span className="col-span-3">Days left</span>
										<span className="col-span-4">Action</span>
									</div>
									<div className="space-y-1.5">
										{[
											{ c: "Cooking Oil", o: "5", s: "Restock now" },
											{ c: "Atta 10kg", o: "7", s: "Restock this week" },
											{ c: "Premium Sauces", o: "28", s: "Do not restock" },
										].map((row) => (
											<div
												key={row.c}
												className="grid grid-cols-12 items-center rounded-lg bg-slate-50 border border-slate-200 px-2 py-1.5 text-[11px]"
											>
												<span className="col-span-5 font-medium text-slate-700">
													{row.c}
												</span>
												<span className="col-span-3 text-slate-800 font-semibold">
													{row.o}
												</span>
												<span className="col-span-4 text-emerald-700 font-semibold">
													{row.s}
												</span>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Ticker */}
			<section className="py-12 border-y border-slate-200 bg-white z-10 relative overflow-hidden">
				<motion.div
					animate={prefersReducedMotion ? undefined : { x: [0, -1000] }}
					transition={
						prefersReducedMotion
							? undefined
							: { duration: 40, repeat: Infinity, ease: "linear" }
					}
					className="flex items-center gap-10 opacity-60 grayscale whitespace-nowrap min-w-max px-6 will-change-transform"
				>
					{[...Array(3)].map((_, j) => (
						<div
							key={j}
							className="flex items-center gap-10 text-slate-800 font-bold text-lg tracking-tight"
						>
							{[
								{ label: "TinyLlama fine-tuning", icon: Cpu },
								{ label: "Predictive Intelligence", icon: LineChart },
								{ label: "Anomaly Detection", icon: Radar },
								{ label: "Multi-provider fallback", icon: Blocks },
								{ label: "Instant Analytics", icon: Zap },
							].map((s, i) => (
								<div key={i} className="flex items-center gap-3">
									<s.icon size={24} />
									<span>{s.label}</span>
								</div>
							))}
						</div>
					))}
				</motion.div>
			</section>

			{/* Problem vs Solution */}
			<section className="py-28 px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
				<div className="mb-14 text-center">
					<h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-black mb-5">
						The real problem is not data. It is decision delay.
					</h2>
					<p className="text-xl text-slate-500 max-w-3xl mx-auto">
						Most SMBs collect numbers every day but still react too late. Yukti
						turns those numbers into immediate, prioritized actions.
					</p>
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
					<div className="lg:col-span-7 rounded-[2rem] bg-white border border-slate-200 p-8 shadow-sm">
						<div className="flex items-center justify-between mb-6">
							<div>
								<p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
									Trend Story
								</p>
								<h3 className="text-2xl font-bold text-black mt-2">
									Before Yukti vs After Yukti
								</h3>
							</div>
							<div className="text-right">
								<p className="text-xs text-slate-500">12-week signal</p>
								<p className="text-sm font-semibold text-slate-800">
									Stability + direction
								</p>
							</div>
						</div>
						<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 relative overflow-hidden">
							<svg viewBox="0 0 420 210" className="w-full h-56">
								<defs>
									<linearGradient id="beforeStroke" x1="0" y1="0" x2="1" y2="0">
										<stop offset="0%" stopColor="#ef4444" />
										<stop offset="100%" stopColor="#f59e0b" />
									</linearGradient>
									<linearGradient id="afterStroke" x1="0" y1="0" x2="1" y2="0">
										<stop offset="0%" stopColor="#0f766e" />
										<stop offset="100%" stopColor="#14b8a6" />
									</linearGradient>
								</defs>
								{[0, 1, 2, 3].map((line) => (
									<line
										key={line}
										x1="0"
										x2="420"
										y1={30 + line * 45}
										y2={30 + line * 45}
										stroke="#e2e8f0"
										strokeDasharray="4 6"
									/>
								))}
								<motion.path
									d={beforePath}
									fill="none"
									stroke="url(#beforeStroke)"
									strokeWidth="4"
									strokeLinecap="round"
									initial={{ pathLength: 0 }}
									whileInView={{ pathLength: 1 }}
									viewport={{ once: true }}
									transition={{ duration: 1.2, ease: "easeOut" }}
								/>
								<motion.path
									d={afterPath}
									fill="none"
									stroke="url(#afterStroke)"
									strokeWidth="4"
									strokeLinecap="round"
									initial={{ pathLength: 0 }}
									whileInView={{ pathLength: 1 }}
									viewport={{ once: true }}
									transition={{ duration: 1.2, ease: "easeOut", delay: 0.25 }}
								/>
							</svg>
							<div className="absolute left-4 top-4 flex flex-wrap gap-2 text-[11px]">
								<span className="px-2 py-1 rounded-full bg-red-100 text-red-700 font-semibold">
									Before: reactive decisions
								</span>
								<span className="px-2 py-1 rounded-full bg-teal-100 text-teal-700 font-semibold">
									After: guided execution
								</span>
							</div>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
							{[
								{
									label: "Reaction Time",
									value: "-57%",
									tone: "text-emerald-700",
								},
								{
									label: "Planning Accuracy",
									value: "+41%",
									tone: "text-emerald-700",
								},
								{
									label: "Missed Signals",
									value: "-63%",
									tone: "text-emerald-700",
								},
							].map((metric) => (
								<div
									key={metric.label}
									className="rounded-xl border border-slate-200 bg-white p-3"
								>
									<p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
										{metric.label}
									</p>
									<p className={`text-lg font-bold mt-1 ${metric.tone}`}>
										{metric.value}
									</p>
								</div>
							))}
						</div>
					</div>
					<div className="lg:col-span-5 grid grid-cols-1 gap-4">
						{PROBLEM_SIGNALS.map((signal, idx) => (
							<motion.div
								key={signal.title}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.55, delay: idx * 0.1 }}
								className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
							>
								<div className="flex items-start justify-between gap-3 mb-3">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
											<signal.icon size={18} />
										</div>
										<h4 className="text-lg font-bold text-black">
											{signal.title}
										</h4>
									</div>
									<span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
										{signal.severity}
									</span>
								</div>
								<p className="text-sm text-slate-600 leading-relaxed mb-2">
									<span className="font-semibold text-slate-800">
										Problem:{" "}
									</span>
									{signal.problem}
								</p>
								<p className="text-sm text-teal-700 leading-relaxed">
									<span className="font-semibold">Solution: </span>
									{signal.solution}
								</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* ── Bento Grid: Ten Superpowers ───────────────────────────────────── */}
			<section className="py-32 px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-100px" }}
					variants={fadeInUp}
					className="mb-14"
				>
					<div className="max-w-3xl">
						<h2 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-black mb-4 leading-[0.95]">
							One platform, <br />
							ten superpowers
						</h2>
						<p className="text-xl text-slate-500 max-w-2xl">
							Most business owners juggle spreadsheets, BI dashboards, and
							consultants. Yukti replaces all of that with a single intelligent
							platform, purpose-built for the Indian market.
						</p>
					</div>
				</motion.div>

				<motion.div
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-100px" }}
					variants={staggerContainer}
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:auto-rows-[minmax(220px,1fr)]"
				>
					{SUPERPOWERS.map((feature, i) => (
						<motion.div
							key={i}
							variants={fadeInUp}
							whileHover={{ y: -4 }}
							className={[
								"relative group bg-white border border-slate-200 rounded-3xl",
								"shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)]",
								"hover:shadow-[0_24px_44px_-26px_rgba(15,23,42,0.35)]",
								"hover:border-slate-300 transition-all duration-300 overflow-hidden",
								// On mobile every card is full width; sm: two columns; lg: bento layout
								"sm:col-span-1",
								feature.isLarge
									? "lg:col-span-6 lg:row-span-2"
									: feature.isWide
										? "sm:col-span-2 lg:col-span-12 lg:row-span-1"
										: feature.layout,
							].join(" ")}
						>
							{/* ── Large card — split layout ─────────────────────────── */}
							{feature.isLarge ? (
								<div className="flex flex-col h-full p-6 md:p-8">
									{/* Top: icon + title */}
									<div className="flex-none">
										<div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 mb-5 group-hover:bg-black group-hover:text-white transition-colors duration-300 text-black">
											<feature.icon size={20} />
										</div>
										<h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black leading-tight mb-3">
											{feature.title}
										</h3>
										<p className="text-slate-500 text-base md:text-lg leading-relaxed max-w-sm">
											{feature.desc}
										</p>
									</div>
									{/* Bottom: decorative sparkline that fills remaining height */}
									<div className="flex-1 mt-6 min-h-0 flex flex-col justify-end">
										<div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 pt-4 pb-2 overflow-hidden">
											<p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
												Revenue forecast · next 12 weeks
											</p>
											<MiniSparkline />
											<div className="flex items-center justify-between mt-2">
												<span className="text-[11px] text-slate-400">
													Week 1
												</span>
												<span className="text-xs font-bold text-emerald-600">
													+38% projected ↑
												</span>
												<span className="text-[11px] text-slate-400">
													Week 12
												</span>
											</div>
										</div>
									</div>
								</div>
							) : feature.isWide ? (
								/* ── Wide full-span card ─────────────────────────────── */
								<div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 h-full p-6 md:p-8">
									<div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 shrink-0 group-hover:bg-black group-hover:text-white transition-colors duration-300 text-black">
										<feature.icon size={20} />
									</div>
									<div className="flex-1 min-w-0">
										<h3 className="text-2xl md:text-3xl font-extrabold text-black leading-tight">
											{feature.title}
										</h3>
										<p className="text-slate-500 text-base leading-relaxed mt-1">
											{feature.desc}
										</p>
									</div>
									{/* decorative connector dots */}
									<div className="hidden lg:flex items-center gap-2 shrink-0">
										{["POS", "Shopify", "Tally", "WooCommerce", "Zoho"].map(
											(tag) => (
												<span
													key={tag}
													className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 whitespace-nowrap"
												>
													{tag}
												</span>
											),
										)}
										<span className="px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold whitespace-nowrap">
											+ more
										</span>
									</div>
								</div>
							) : (
								/* ── Regular small / medium card ─────────────────────── */
								<div className="flex flex-col h-full p-6 md:p-7">
									<div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 mb-4 group-hover:bg-black group-hover:text-white transition-colors duration-300 text-black shrink-0">
										<feature.icon size={18} />
									</div>
									<h3 className="text-xl sm:text-2xl font-extrabold text-black leading-tight mb-2">
										{feature.title}
									</h3>
									<p className="text-slate-500 text-sm leading-relaxed flex-1">
										{feature.desc}
									</p>
								</div>
							)}

							{/* hover overlay */}
							<div className="absolute inset-0 bg-gradient-to-br from-slate-50/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl" />
						</motion.div>
					))}
				</motion.div>
			</section>

			{/* Pipeline Section — uses useInView via PipelineSection component */}
			<PipelineSection
				staggerContainer={staggerContainer}
				fadeInUp={fadeInUp}
				PIPELINE={PIPELINE}
			/>

			{/* Target Users */}
			<section className="py-32 px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
				<div className="text-center mb-20">
					<h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-black mb-6">
						Real owners, real problems, real results
					</h2>
					<p className="text-xl text-slate-500 max-w-2xl mx-auto">
						Most data platforms are built for engineers. Yukti is built for the
						63 million Indian SMB owners who need answers, not dashboards.
					</p>
				</div>
				<div className="grid sm:grid-cols-2 gap-8">
					{TARGET_USERS.map((userType, i) => (
						<motion.div
							key={i}
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
							transition={{ delay: i * 0.1, duration: 0.7 }}
							whileHover={{ scale: 1.02 }}
							className="flex flex-col p-8 rounded-[2rem] bg-white border border-slate-200 hover:shadow-2xl hover:shadow-black/5 transition-all"
						>
							<div className="flex items-center gap-4 mb-6">
								<div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
									<userType.icon className="text-black" size={28} />
								</div>
								<h3 className="text-2xl font-bold text-black">
									{userType.title}
								</h3>
							</div>
							<blockquote className="text-slate-600 italic border-l-4 border-slate-200 pl-4 py-1 mb-8">
								"{userType.quote}"
							</blockquote>
							<div className="space-y-3">
								{userType.points.map((point, idx) => (
									<div key={idx} className="flex items-start gap-3">
										<div className="mt-1 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
											<CheckCircle2 size={12} className="text-slate-600" />
										</div>
										<span className="text-slate-700 font-medium">{point}</span>
									</div>
								))}
							</div>
						</motion.div>
					))}
				</div>
			</section>

			{/* Value System + Decision Loop */}
			<section className="pb-28 px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
					<div className="lg:col-span-7 rounded-[2rem] bg-white border border-slate-200 p-8">
						<h3 className="text-3xl font-extrabold tracking-tight text-black mb-4">
							What value looks like in practice
						</h3>
						<p className="text-slate-500 text-lg mb-7">
							Yukti is not another dashboard. It is a weekly decision system
							that moves from signal to execution.
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{VALUE_PILLARS.map((pillar, idx) => (
								<motion.div
									key={pillar.title}
									initial={{ opacity: 0, y: 16 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ duration: 0.5, delay: idx * 0.08 }}
									className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
								>
									<div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 mb-3">
										<pillar.icon size={17} />
									</div>
									<p className="text-base font-bold text-black">
										{pillar.title}
									</p>
									<p className="text-sm text-slate-600 mt-1.5">{pillar.desc}</p>
								</motion.div>
							))}
						</div>
					</div>
					<div className="lg:col-span-5 rounded-[2rem] border border-slate-200 bg-black text-white p-7">
						<div className="flex items-center gap-2 mb-5">
							<Workflow size={16} className="text-slate-300" />
							<p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
								Decision Loop
							</p>
						</div>
						<div className="space-y-3">
							{DECISION_LOOP.map((step, idx) => (
								<motion.div
									key={step.title}
									initial={{ opacity: 0, x: 16 }}
									whileInView={{ opacity: 1, x: 0 }}
									viewport={{ once: true }}
									transition={{ duration: 0.45, delay: idx * 0.08 }}
									className="rounded-xl border border-white/10 bg-white/5 px-4 py-3.5"
								>
									<div className="flex items-start gap-3">
										<div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
											<step.icon size={14} className="text-slate-200" />
										</div>
										<div>
											<p className="text-sm font-semibold text-white">
												{step.title}
											</p>
											<p className="text-xs text-slate-400 mt-0.5">
												{step.desc}
											</p>
										</div>
									</div>
								</motion.div>
							))}
						</div>
						<div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs text-amber-100 flex items-start gap-2">
							<AlertTriangle size={14} className="mt-0.5 shrink-0" />
							Without this loop, businesses review data monthly. With Yukti,
							they react weekly.
						</div>
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="py-24 px-6 lg:px-8 mb-10 z-10 relative">
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					whileInView={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.8 }}
					className="max-w-6xl mx-auto bg-black text-white rounded-[3rem] p-12 md:p-20 lg:p-24 text-center relative overflow-hidden shadow-2xl shadow-black/20"
				>
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-700/50 via-transparent to-transparent opacity-60" />
					<div className="absolute inset-0 opacity-[0.1] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwbDQwIDQwbTAtNDBMMCA0MCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')]" />
					<div className="relative z-10">
						<h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8 whitecol">
							{activeVariant.finalTitle}
						</h2>
						<p className="text-xl lg:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed whitecol">
							{activeVariant.finalBody}
						</p>
						<div className="flex flex-col sm:flex-row gap-5 justify-center">
							<button
								onClick={() => {
									trackCta("live", "final_primary", activeVariant.finalPrimary);
									window.location.href = "https://mudmedia-yukti.vercel.app/";
								}}
								className="px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center"
							>
								{activeVariant.finalPrimary}
							</button>
							<button
								onClick={() => {
									trackCta(
										"consultation",
										"final_secondary",
										"Book a Consultation",
									);
									window.location.href = "https://mudmedia.vercel.app/book";
								}}
								className="px-10 py-5 bg-white/10 text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center backdrop-blur-md"
							>
								Book a Consultation
							</button>
						</div>
					</div>
				</motion.div>
			</section>
		</div>
	);
}
