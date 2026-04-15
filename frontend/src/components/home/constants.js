import {
	BarChart3,
	Brain,
	CalendarClock,
	CloudUpload,
	Cpu,
	Database,
	FileText,
	LineChart,
	PieChart,
	Radar,
	ShieldCheck,
	Sparkles,
	Store,
	Utensils,
	ShoppingCart,
	Briefcase,
	BookOpen,
	Layers,
	Share2,
	Wrench,
	Package,
	Timer,
	Target,
	TrendingDown,
	Workflow,
	Zap,
	Blocks,
	AlertTriangle,
} from "lucide-react";

export const SUPERPOWERS = [
	{
		title: "Predictive Intelligence",
		desc: "Linear and polynomial regression forecasting with uncertainty bands and confidence intervals.",
		icon: LineChart,
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
		desc: "Generate branded, chart-rich PDF reports in seconds - ready to share with your team or investors.",
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

export const PIPELINE = [
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

export const TARGET_USERS = [
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

export const PROBLEM_SIGNALS = [
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

export const TREND_SERIES = {
	before: [68, 54, 62, 48, 58, 43, 52, 46, 50, 42, 45, 40],
	after: [42, 46, 49, 52, 54, 56, 59, 62, 64, 66, 69, 72],
};

export const VALUE_PILLARS = [
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

export const DECISION_LOOP = [
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

export const CTA_VARIANTS = {
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

export const TICKER_ITEMS = [
	{ label: "TinyLlama fine-tuning", icon: Cpu },
	{ label: "Predictive Intelligence", icon: LineChart },
	{ label: "Anomaly Detection", icon: Radar },
	{ label: "Multi-provider fallback", icon: Blocks },
	{ label: "Instant Analytics", icon: Zap },
];

export const fadeInUp = {
	hidden: { opacity: 0, y: 40 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
	},
};

export const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.15, delayChildren: 0.1 },
	},
};

export function buildPath(values, width = 420, height = 210, padding = 22) {
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
