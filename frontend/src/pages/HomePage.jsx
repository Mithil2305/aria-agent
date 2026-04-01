import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
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
	Zap,
	Blocks,
    Database,
    Cpu,
    BookOpen,
    Layers,
    Share2,
    Package
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { trackLandingCtaClick } from "../services/marketingAnalytics";

// Complex Background Node Component
const AnimatedOrb = ({ delay, duration, color, size, start, end }) => {
	return (
		<motion.div
			className={`absolute rounded-full mix-blend-multiply filter blur-[80px] opacity-40 pointer-events-none ${color} ${size}`}
			animate={{
				x: [start.x, end.x, start.x],
				y: [start.y, end.y, start.y],
				scale: [1, 1.2, 1],
				rotate: [0, 90, 0]
			}}
			transition={{
				duration: duration,
				repeat: Infinity,
				ease: "linear",
				delay: delay
			}}
		/>
	);
};

const SUPERPOWERS = [
	{
		title: "Predictive Intelligence",
		desc: "Linear and polynomial regression forecasting with uncertainty bands and confidence intervals.",
		icon: LineChart,
		colSpan: "md:col-span-2 lg:col-span-2",
		rowSpan: "md:row-span-2",
		visual: (
			<div className="absolute right-[-20%] bottom-[-20%] w-64 h-64 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
				<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M0 100L20 80L40 90L70 40L100 0V100H0Z" fill="currentColor" />
					<path d="M0 100L20 80L40 90L70 40L100 0" stroke="currentColor" strokeWidth="2" />
				</svg>
			</div>
		)
	},
	{
		title: "Smart Data Upload",
		desc: "Drag-and-drop CSV/Excel files with auto schema detection, type inference, and data quality scoring.",
		icon: CloudUpload,
		colSpan: "md:col-span-1 lg:col-span-1",
		rowSpan: "md:row-span-1",
		visual: null
	},
	{
		title: "Anomaly Detection",
		desc: "Z-score and IQR-based anomaly detection across all numeric features to catch problems early.",
		icon: Radar,
		colSpan: "md:col-span-1 lg:col-span-1",
		rowSpan: "md:row-span-1",
		visual: null
	},
	{
		title: "AI Strategy Advisor",
		desc: "Personalised business recommendations powered by a multi-provider AI fallback chain for maximum reliability.",
		icon: Brain,
		colSpan: "md:col-span-2 lg:col-span-2",
		rowSpan: "md:row-span-1",
		visual: (
			<div className="absolute right-4 bottom-4 flex gap-2 opacity-20 group-hover:opacity-100 transition-opacity duration-500">
				<div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center animate-pulse"><Brain size={16} /></div>
			</div>
		)
	},
	{
		title: "Premium Month-End Analysis",
		desc: "Deep analysis powered by Yukti's custom QLoRA fine-tuned TinyLlama model, once per month per user.",
		icon: Sparkles,
		colSpan: "md:col-span-1 lg:col-span-1",
		rowSpan: "md:row-span-1",
		visual: null
	},
    {
		title: "Daily Business Logs",
		desc: "Simple form to log daily revenue, customers, orders, expenses, and stock, stored securely.",
		icon: BookOpen,
		colSpan: "md:col-span-1 lg:col-span-1",
		rowSpan: "md:row-span-1",
		visual: null
	},
];

const PIPELINE = [
	{ name: "Data Ingestion", desc: "CSV/Excel parsing, cleaning, and normalisation" },
	{ name: "Schema Intelligence", desc: "Auto type detection, profiling, and quality scoring" },
	{ name: "Analytics Engine", desc: "KPIs, trends, and seasonality decomposition" },
	{ name: "Predictive Engine", desc: "Forecasting, anomaly detection, and uncertainty bands" },
	{ name: "Decision Engine", desc: "Correlations, feature importance, and risk scoring" },
	{ name: "Insight Engine", desc: "AI reasoning, narrative generation, and strategy recommendations" },
];

const TARGET_USERS = [
	{
		title: "Retail & Grocery",
        quote: "I log my daily sales, and Yukti tells me which products to stock more, when to run offers, and warns me if sales are dropping.",
		points: ["Daily revenue and customer tracking", "Weekly trend analysis and anomaly alerts", "Seasonal strategy suggestions", "Stock management with delivery tracking"],
		icon: Store,
	},
	{
		title: "Restaurant & Food",
        quote: "My restaurant's weekend sales are 3x weekdays. Yukti helps me plan staff, ingredients, and marketing accordingly.",
		points: ["Upload POS sales data (CSV or Excel)", "Forecast busy periods with confidence intervals", "Local event and social media marketing tips", "Monthly cost optimisation insights"],
		icon: Utensils,
	},
	{
		title: "E-commerce & Online",
        quote: "Yukti analyses my combined multi-platform data and finds which products and channels are underperforming.",
		points: ["Multi-platform sales CSV analysis", "Product-channel correlation engine", "Feature importance for revenue drivers", "Risk scoring for declining categories"],
		icon: ShoppingCart,
	},
	{
		title: "Analysts & Consultants",
        quote: "I upload client datasets and generate professional PDF reports in seconds, what used to take hours of Excel work.",
		points: ["Upload any CSV or Excel dataset", "Auto schema detection for any structure", "Full analysis pipeline in seconds", "Branded PDF reports with charts"],
		icon: Briefcase,
	},
];

const CTA_VARIANTS = {
	A: {
		tag: "Conversion Focus",
		heroPrimary: "Try Yukti Live",
		heroSecondary: "Talk to Us",
		heroPunch: "Your competitors are guessing. You don't have to.",
		finalTitle: "Your competitors are guessing. You don't have to.",
		finalBody: "Yukti is live and free to try. Upload your first dataset, see the 6-layer analysis in action, and get AI-driven strategy tailored to your business, in minutes, not months.",
		finalPrimary: "Launch Yukti",
	},
	B: {
		tag: "Proof Focus",
		heroPrimary: "Try Yukti Live",
		heroSecondary: "Talk to Us",
		heroPunch: "From signup to strategy in under five minutes.",
		finalTitle: "What if your data could think for you?",
		finalBody: "Yukti is live and free to try. Upload your first dataset, see the 6-layer analysis in action, and get AI-driven strategy tailored to your business, in minutes, not months.",
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

export default function HomePage() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const { scrollYProgress } = useScroll();
	
	const smoothProgress = useSpring(scrollYProgress, {
		stiffness: 100, damping: 30, restDelta: 0.001
	});

	const yNavBg = useTransform(scrollYProgress, [0, 0.05], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.85)"]);
	const navBorder = useTransform(scrollYProgress, [0, 0.05], ["rgba(229, 231, 235, 0)", "rgba(229, 231, 235, 1)"]);
	const navBackdrop = useTransform(scrollYProgress, [0, 0.05], ["blur(0px)", "blur(16px)"]);

	const yParallaxFast = useTransform(smoothProgress, [0, 1], [0, -300]);
	const yParallaxSlow = useTransform(smoothProgress, [0, 1], [0, -150]);
	const rotateHeroCard = useTransform(smoothProgress, [0, 0.2], [0, 5]);
	const scaleHeroCard = useTransform(smoothProgress, [0, 0.2], [1, 0.95]);

	const [ctaVariantKey] = useState(() => {
		const saved = localStorage.getItem("yukti_cta_variant");
		if (saved === "A" || saved === "B") return saved;
		const picked = Math.random() > 0.5 ? "B" : "A";
		localStorage.setItem("yukti_cta_variant", picked);
		return picked;
	});

	const activeVariant = useMemo(() => CTA_VARIANTS[ctaVariantKey] || CTA_VARIANTS.A, [ctaVariantKey]);

	const trackCta = (target, location, label) => {
		trackLandingCtaClick({ variant: ctaVariantKey, target, location, label });
	};

	return (
		<div className="min-h-screen bg-[#fafafa] text-slate-900 selection:bg-black selection:text-white font-sans relative overflow-x-hidden">
			{/* Complex Ambient Animated Background */}
			<div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
				<AnimatedOrb color="bg-slate-200" size="w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw]" start={{x: "-10vw", y: "-10vh"}} end={{x: "20vw", y: "20vh"}} duration={25} delay={0} />
				<AnimatedOrb color="bg-gray-200" size="w-[60vw] h-[60vw] md:w-[35vw] md:h-[35vw]" start={{x: "50vw", y: "40vh"}} end={{x: "20vw", y: "10vh"}} duration={30} delay={5} />
				<AnimatedOrb color="bg-slate-300" size="w-[90vw] h-[90vw] md:w-[50vw] md:h-[50vw]" start={{x: "10vw", y: "70vh"}} end={{x: "60vw", y: "40vh"}} duration={35} delay={2} />
				<div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22 x=%220%22 y=%220%22 width=%22100%25%22 height=%22100%25%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.5%22/%3E%3C/svg%3E')" }}></div>
			</div>

			{/* Sticky Nav */}
			<motion.header style={{ backgroundColor: yNavBg, borderColor: navBorder, backdropFilter: navBackdrop, WebkitBackdropFilter: navBackdrop }} className="fixed top-0 left-0 right-0 z-50 border-b border-transparent transition-colors duration-300">
				<nav className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
					<div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate("/")}>
						<div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center group-hover:scale-95 transition-transform">
							<span className="text-white font-bold text-lg leading-none">Y</span>
						</div>
						<span className="font-semibold text-lg tracking-tight">Yukti</span>
					</div>
					<div className="flex items-center gap-6">
						<Link to="/login" className="text-sm font-medium text-slate-600 hover:text-black transition-colors hidden sm:block" onClick={() => trackCta("login", "nav", "Login")}>
							Log in
						</Link>
						<button onClick={() => { trackCta("register", "nav", "Try Yukti Live"); window.location.href = "https://mudmedia-yukti.vercel.app/"; }} className="text-sm font-medium bg-black text-white px-5 py-2.5 rounded-full hover:bg-slate-800 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-300">
							Try Yukti Live
						</button>
					</div>
				</nav>
			</motion.header>

			{/* Hero Section */}
			<section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
				<motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl flex flex-col items-center">
					<motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 mb-8 whitespace-nowrap hover:shadow-md transition-shadow cursor-default">
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
						</span>
						<span>Introducing Yukti</span>
					</motion.div>

					<motion.h1 variants={fadeInUp} className="text-6xl sm:text-7xl lg:text-[5.5rem] font-extrabold tracking-tighter text-black leading-[1.05] mb-8">
						What if your data could <br className="hidden md:block"/>
						<span className="relative inline-block mt-2">
							<span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-900">
								think for you?
							</span>
							<motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 0.8, ease: "easeInOut" }} className="absolute bottom-1 left-0 right-0 h-3 bg-slate-200/50 -z-10 origin-left rounded-full" />
						</span>
					</motion.h1>

					<motion.p variants={fadeInUp} className="text-xl sm:text-2xl text-slate-500 mb-12 max-w-2xl leading-relaxed">
						We fed 35,800+ Indian business disasters to an AI so you don't have to live through them. 
                        Yukti takes your sales data and gives you the cheat codes for what to do next. No guessing, just winning.
					</motion.p>

                    <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4 mb-12 opacity-80">
                        <div className="flex flex-col items-center px-6 border-r border-slate-200">
                            <span className="text-2xl font-bold text-black">35,800+</span>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Training Samples</span>
                        </div>
                        <div className="flex flex-col items-center px-6 border-r border-slate-200">
                            <span className="text-2xl font-bold text-black">6-Layer</span>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Analytics Engine</span>
                        </div>
                        <div className="flex flex-col items-center px-6">
                            <span className="text-2xl font-bold text-black">4 AI</span>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Provider Fallback</span>
                        </div>
                    </motion.div>

					<motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 w-full justify-center">
						<button onClick={() => { trackCta("live", "hero_primary", activeVariant.heroPrimary); window.location.href = "https://mudmedia-yukti.vercel.app/"; }} className="px-8 py-4 bg-black text-white rounded-full font-semibold text-lg hover:bg-slate-800 transition-all hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 flex items-center justify-center gap-3 group">
							{activeVariant.heroPrimary}
							<ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-300" />
						</button>
						<button onClick={() => { trackCta("demo", "hero_secondary", activeVariant.heroSecondary); window.location.href = "https://mudmedia.vercel.app/book"; }} className="px-8 py-4 bg-white/50 backdrop-blur-md text-black border border-slate-200 rounded-full font-semibold text-lg hover:bg-white transition-all hover:-translate-y-1 hover:shadow-xl shadow-sm">
							{activeVariant.heroSecondary}
						</button>
					</motion.div>
				</motion.div>

				{/* 3D Transformed UI Mockup */}
				<motion.div style={{ y: yParallaxSlow, rotateX: rotateHeroCard, scale: scaleHeroCard }} className="mt-24 w-full relative perspective-1000 z-20">
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
						<div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-4 gap-6 opacity-60">
							<div className="md:col-span-1 space-y-5 hidden md:block border-r border-slate-100 pr-6">
								<div className="h-8 bg-slate-100 rounded-xl w-2/3" />
								<div className="h-5 bg-slate-50 rounded-lg w-full mt-8" />
								<div className="h-5 bg-slate-50 rounded-lg w-5/6" />
								<div className="h-5 bg-slate-50 rounded-lg w-3/4" />
								<div className="h-40 bg-slate-100 rounded-2xl mt-12" />
							</div>
							<div className="md:col-span-3 space-y-6">
								<div className="flex gap-4">
									<div className="h-28 bg-slate-100 rounded-2xl flex-1 border border-slate-50 relative overflow-hidden">
										<div className="absolute right-0 bottom-0 w-16 h-16 bg-slate-200 rounded-tl-full opacity-50" />
									</div>
									<div className="h-28 bg-slate-100 rounded-2xl flex-1 border border-slate-50" />
									<div className="h-28 bg-slate-100 rounded-2xl flex-1 border border-slate-50" />
								</div>
								<div className="h-72 bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl w-full border border-slate-100 relative">
									<div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-20">
										<svg preserveAspectRatio="none" viewBox="0 0 100 100" className="w-[100%] h-[100%]">
											<path d="M0,100 C20,80 40,90 60,40 C80,-10 100,30 100,30 L100,100 Z" fill="black" />
										</svg>
									</div>
								</div>
							</div>
						</div>
					</div>
				</motion.div>
			</section>

			{/* Live Ticker / Proof */}
			<section className="py-12 border-y border-slate-200 bg-white z-10 relative overflow-hidden">
				<motion.div 
					animate={{ x: [0, -1000] }} 
					transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
					className="flex items-center gap-10 opacity-60 grayscale whitespace-nowrap min-w-max px-6"
				>
					{[...Array(3)].map((_, j) => (
						<div key={j} className="flex items-center gap-10 text-slate-800 font-bold text-lg tracking-tight">
							{[
								{ label: "TinyLlama fine-tuning ", icon: Cpu },
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

			{/* Bento Grid: Redesigned Superpowers */}
			<section className="py-32 px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
				<motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp} className="mb-20 text-center md:text-left md:flex justify-between items-end">
					<div className="max-w-2xl">
						<h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-black mb-6">
							One platform, <br/>ten superpowers
						</h2>
						<p className="text-xl text-slate-500">
							Most business owners juggle spreadsheets, BI dashboards, and consultants. Yukti replaces all of that with a single intelligent platform, purpose-built for the Indian market.
						</p>
					</div>
				</motion.div>

				<motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6 auto-rows-[minmax(240px,auto)]">
					{SUPERPOWERS.map((feature, i) => (
						<motion.div key={i} variants={fadeInUp} whileHover={{ y: -5 }} className={`relative group bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-slate-300 transition-all overflow-hidden ${feature.colSpan} ${feature.rowSpan}`}>
							<div className="relative z-10 flex flex-col h-full">
								<div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 mb-8 group-hover:bg-black group-hover:text-white transition-colors duration-300 text-black shadow-inner">
									<feature.icon size={26} />
								</div>
								<h3 className={`font-bold text-black mb-3 ${feature.rowSpan === 'md:row-span-2' ? 'text-3xl' : 'text-2xl'}`}>
									{feature.title}
								</h3>
								<p className="text-slate-500 text-base leading-relaxed mt-auto pr-4">
									{feature.desc}
								</p>
							</div>
							{feature.visual && feature.visual}
							<div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
						</motion.div>
					))}
				</motion.div>
			</section>

			{/* Pipeline Steps View */}
			<section className="py-32 bg-[#0a0a0a] text-white relative z-10 rounded-t-[3rem]">
				<motion.div style={{ y: yParallaxFast }} className="absolute -top-64 right-10 w-96 h-96 bg-white/5 filter blur-[100px] rounded-full pointer-events-none" />
				
				<div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
					<div className="grid lg:grid-cols-2 gap-20 items-center">
						<motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: "easeOut" }}>
							<div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10 backdrop-blur-md">
								<Layers size={32} className="text-slate-100" />
							</div>
							<h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6">
								Six layers between raw data and real decisions
							</h2>
							<p className="text-slate-400 text-xl leading-relaxed mb-10">
								Every dataset you upload passes through six intelligent processing layers. By the time it reaches you, it is no longer data, it is a clear action plan.
							</p>

							<div className="flex flex-col gap-6">
								<div className="flex items-start gap-4 bg-white/5 border border-white/5 p-5 rounded-2xl backdrop-blur-sm">
									<CheckCircle2 className="text-slate-300 shrink-0 mt-0.5" />
									<div>
										<h4 className="font-semibold text-lg">Four AI Providers. Zero Downtime.</h4>
										<p className="text-sm text-slate-400 mt-2">
											Gemini, Groq, Claude, and our Rule-Based Engine. What happens when an AI provider goes down? Yukti automatically switches to the next one.
										</p>
									</div>
								</div>
								<div className="flex items-start gap-4 p-5">
									<CheckCircle2 className="text-slate-300 shrink-0 mt-0.5" />
									<div>
										<h4 className="font-semibold text-lg">This model thinks Indian</h4>
										<p className="text-sm text-slate-400 mt-2">
											Trained specifically on Indian retail, restaurant, and service business patterns. It understands festivals, local contexts, and SMB realities.
										</p>
									</div>
								</div>
							</div>
						</motion.div>

						<motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="relative bg-white/[0.02] border border-white/[0.05] p-8 md:p-12 rounded-[2.5rem] backdrop-blur-xl">
							<div className="absolute left-10 md:left-14 top-14 bottom-14 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent" />
							<div className="space-y-6 relative">
								{PIPELINE.map((layer, index) => (
									<motion.div key={layer.name} variants={fadeInUp} className="relative flex items-center gap-6 group cursor-default">
										<div className="relative z-10 w-8 h-8 rounded-full bg-black border-2 border-slate-700 flex items-center justify-center text-xs font-bold font-mono group-hover:border-white transition-colors">
											{index + 1}
										</div>
										<div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
											<p className="text-lg font-bold text-slate-200 group-hover:text-white">{layer.name}</p>
                                            <p className="text-sm text-slate-400 mt-1">{layer.desc}</p>
										</div>
									</motion.div>
								))}
							</div>
						</motion.div>
					</div>
				</div>
			</section>

			{/* Target Users / Segments Grid */}
			<section className="py-32 px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
				<div className="text-center mb-20">
					<h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-black mb-6">Real owners, real problems, real results</h2>
					<p className="text-xl text-slate-500 max-w-2xl mx-auto">Most data platforms are built for engineers. Yukti is built for the 63 million Indian SMB owners who need answers, not dashboards.</p>
				</div>
				<div className="grid lg:grid-cols-2 gap-8">
					{TARGET_USERS.map((userType, i) => (
						<motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: i * 0.1, duration: 0.7 }} whileHover={{ scale: 1.02 }} className="flex flex-col p-8 rounded-[2rem] bg-white border border-slate-200 hover:shadow-2xl hover:shadow-black/5 transition-all">
							<div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                                    <userType.icon className="text-black" size={28} />
                                </div>
                                <h3 className="text-2xl font-bold text-black">{userType.title}</h3>
                            </div>
                            
                            <blockquote className="text-slate-600 italic border-l-4 border-slate-200 pl-4 py-1 mb-8">
                                "{userType.quote}"
                            </blockquote>

							<div className="space-y-3">
								{userType.points.map((point, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><CheckCircle2 size={12} className="text-slate-600" /></div>
                                        <span className="text-slate-700 font-medium">
                                            {point}
                                        </span>
                                    </div>
								))}
							</div>
						</motion.div>
					))}
				</div>
			</section>

			{/* Huge CTA Bottom */}
			<section className="py-24 px-6 lg:px-8 mb-10 z-10 relative">
				<motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="max-w-6xl mx-auto bg-black text-white rounded-[3rem] p-12 md:p-20 lg:p-24 text-center relative overflow-hidden shadow-2xl shadow-black/20">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-700/50 via-transparent to-transparent opacity-60" />
					<div className="absolute inset-0 opacity-[0.1] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwbDQwIDQwbTAtNDBMMCA0MCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')]" />
					
					<div className="relative z-10">
						<h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8">
							{activeVariant.finalTitle}
						</h2>
						<p className="text-slate-400 text-xl lg:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed">
							{activeVariant.finalBody}
						</p>
						<div className="flex flex-col sm:flex-row gap-5 justify-center">
							<button onClick={() => { trackCta("live", "final_primary", activeVariant.finalPrimary); window.location.href = "https://mudmedia-yukti.vercel.app/"; }} className="px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center">
								{activeVariant.finalPrimary}
							</button>
							<button onClick={() => { trackCta("consultation", "final_secondary", "Book a Consultation"); window.location.href = "https://mudmedia.vercel.app/book"; }} className="px-10 py-5 bg-white/10 text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center backdrop-blur-md">
								Book a Consultation
							</button>
						</div>
					</div>
				</motion.div>
			</section>

			<footer className="border-t border-slate-200 py-12 px-6 lg:px-8 text-center bg-white z-10 relative">
				<div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mx-auto mb-6">
					<span className="text-white font-bold text-xl leading-none">Y</span>
				</div>
				<p className="text-slate-400 font-medium">© {new Date().getFullYear()} Mud Media. All rights reserved.</p>
			</footer>
		</div>
	);
}
