import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
	LayoutDashboard,
	BarChart3,
	ClipboardEdit,
	LogOut,
	User,
	Settings,
	Package,
	Plug,
	Lightbulb,
	Crown,
	Gauge,
	Shield,
	Loader2,
	Sparkles,
	CheckCircle2,
	AlertCircle,
	Menu,
	X,
} from "lucide-react";
import { needsStockManagement } from "../config/businessTypes";
import { useAnalysisJob } from "../contexts/AnalysisJobContext";
import BrandLogo from "./BrandLogo";

const NAV_ITEMS = [
	{ to: "/daily-log", icon: ClipboardEdit, label: "Daily Log" },
	{ to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
	{ to: "/analyse", icon: BarChart3, label: "Analyse" },
	{ to: "/strategy", icon: Lightbulb, label: "Strategy Advisor" },
	{ to: "/premium", icon: Crown, label: "Premium Analysis" },
	{ to: "/limits", icon: Gauge, label: "Usage & Limits" },
	{ to: "/integrations", icon: Plug, label: "Integrations" },
];

export default function AppLayout() {
	const { user, userProfile, logout } = useAuth();
	const { activity } = useAnalysisJob();
	const navigate = useNavigate();
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const isAdminEmail =
		String(user?.email || "")
			.trim()
			.toLowerCase() === "admin@yukti.com";
	const isAdmin = userProfile?.role === "admin" || isAdminEmail;

	const handleLogout = async () => {
		await logout();
		navigate("/login");
	};

	const initials = (userProfile?.ownerName || user?.displayName || "U")
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const activityTone =
		activity.status === "running"
			? {
					wrap: "border-[#6CC4CC] bg-[#E8F7F7]/70",
					icon: "text-[#2A4466]",
					text: "text-[#2A4466]",
					subtle: "text-[#2A4466]/80",
					bar: "bg-[#3D5EA1]",
				}
			: activity.status === "success"
				? {
						wrap: "border-[#6CC4CC] bg-[#E8F7F7]/70",
						icon: "text-[#3D5EA1]",
						text: "text-[#2A4466]",
						subtle: "text-[#2A4466]/80",
						bar: "bg-[#3D5EA1]",
					}
				: {
						wrap: "border-[#6CC4CC] bg-[#E8F7F7]/70",
						icon: "text-[#2A4466]",
						text: "text-[#2A4466]",
						subtle: "text-[#2A4466]/80",
						bar: "bg-[#2A4466]",
					};

	return (
		<div className="min-h-screen app-shell-bg flex">
			<div className="app-shell-grid pointer-events-none" />
			<div className="app-shell-blob app-shell-blob-a pointer-events-none" />
			<div className="app-shell-blob app-shell-blob-b pointer-events-none" />

			{/* Mobile top bar */}
			<header className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-[#C7EBEE] bg-[#F7FFFA]/95 backdrop-blur-xl">
				<div className="px-4 h-14 flex items-center justify-between">
					<button
						onClick={() => setMobileNavOpen((prev) => !prev)}
						className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#C7EBEE] bg-[#F7FFFA] text-[#2A4466]"
						aria-label="Toggle navigation"
					>
						{mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
					</button>
					<button
						onClick={() => navigate("/dashboard")}
						className="inline-flex items-center gap-2"
					>
						<BrandLogo
							size={28}
							showText
							markClassName="text-slate-900"
							textClassName="text-sm text-slate-900"
						/>
					</button>
					<button
						onClick={() => navigate("/profile")}
						className="w-9 h-9 rounded-full bg-[#E8F7F7] border border-[#C7EBEE] flex items-center justify-center text-[11px] font-semibold text-[#2A4466]"
					>
						{initials}
					</button>
				</div>
			</header>

			{mobileNavOpen && (
				<button
					type="button"
					className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden"
					onClick={() => setMobileNavOpen(false)}
					aria-label="Close navigation"
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`fixed top-0 left-0 h-screen w-72 max-w-[85vw] bg-[#F7FFFA]/95 border-r border-[#C7EBEE] flex flex-col z-50 backdrop-blur-xl transition-transform duration-300 lg:w-64 lg:max-w-none ${
					mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
				}`}
			>
				{/* Brand */}
				<div className="px-6 py-6 pt-7 lg:pt-6">
					<button
						onClick={() => {
							navigate("/dashboard");
							setMobileNavOpen(false);
						}}
						className="inline-flex"
					>
						<BrandLogo
							size={32}
							showText
							subtitle="Business Intelligence"
							markClassName="text-[#2A4466]"
							textClassName="text-base text-[#2A4466]"
							subtitleClassName="text-[#2A4466]/55"
						/>
					</button>
				</div>

				<div className="divider mx-4" />

				{/* Navigation */}
				<nav className="flex-1 px-3 py-4 space-y-0.5">
					<p className="px-3 pb-2 text-[10px] font-medium text-[#2A4466]/55 uppercase tracking-wider">
						Menu
					</p>
					{[
						...NAV_ITEMS,
						...(isAdmin
							? [{ to: "/admin", icon: Shield, label: "Admin" }]
							: []),
						...(needsStockManagement(userProfile?.businessType)
							? [{ to: "/stock", icon: Package, label: "Stock" }]
							: []),
					].map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							onClick={() => setMobileNavOpen(false)}
							end={item.end || false}
							className={({ isActive }) =>
								`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
									isActive
										? "bg-[#E8F7F7] text-[#2A4466] border border-[#6CC4CC]"
										: "text-[#3D5EA1] hover:text-[#2A4466] hover:bg-[#E8F7F7]/80"
								}`
							}
						>
							<item.icon size={16} className="shrink-0" strokeWidth={1.5} />
							<span>{item.label}</span>
						</NavLink>
					))}
				</nav>

				{/* User section */}
				<div className="px-3 pb-4 space-y-1">
					<div className="divider mb-3" />

					<button
						onClick={() => {
							navigate("/profile");
							setMobileNavOpen(false);
						}}
						className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-[#E8F7F7]/80 transition-all group"
					>
						<div className="w-8 h-8 rounded-full bg-[#E8F7F7] border border-[#6CC4CC] flex items-center justify-center">
							<span className="text-[11px] font-semibold text-[#2A4466]">
								{initials}
							</span>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-[13px] text-[#2A4466] font-medium truncate">
								{userProfile?.ownerName || user?.displayName || "User"}
							</p>
							<p className="text-[11px] text-[#2A4466]/55 truncate">
								{userProfile?.businessName || ""}
							</p>
						</div>
						<Settings
							size={14}
							className="text-[#4394BF] group-hover:text-[#2A4466] transition-colors shrink-0"
							strokeWidth={1.5}
						/>
					</button>

					<button
						onClick={handleLogout}
						className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-[#2A4466]/65 hover:text-[#2A4466] hover:bg-[#E8F7F7]/80 transition-all"
					>
						<LogOut size={15} className="shrink-0" strokeWidth={1.5} />
						<span>Sign Out</span>
					</button>
				</div>
			</aside>

			{/* Main content */}
			<main className="flex-1 w-full lg:ml-64 pt-14 lg:pt-0 relative z-10">
				{activity.status !== "idle" && (
					<div
						className={`mx-4 md:mx-6 mt-4 px-4 py-3 rounded-xl border backdrop-blur-sm flex items-start gap-3 ${activityTone.wrap}`}
					>
						{activity.status === "running" ? (
							<Loader2
								size={16}
								className={`${activityTone.icon} animate-spin mt-0.5`}
							/>
						) : activity.status === "success" ? (
							<CheckCircle2
								size={16}
								className={`${activityTone.icon} mt-0.5`}
							/>
						) : (
							<AlertCircle
								size={16}
								className={`${activityTone.icon} mt-0.5`}
							/>
						)}

						<div className={`text-xs min-w-0 flex-1 ${activityTone.text}`}>
							<p className="font-semibold">
								{activity.status === "running"
									? `${activity.label || "Task"} is running in the background`
									: activity.status === "success"
										? `${activity.label || "Task"} completed`
										: `${activity.label || "Task"} failed`}
							</p>
							<p className="mt-0.5">
								{activity.status === "error"
									? activity.error ||
										activity.message ||
										"Please retry from the original page."
									: activity.message ||
										"Feel free to explore other pages while it runs."}
							</p>
							<p className={`mt-0.5 ${activityTone.subtle}`}>
								{activity.fileName ? `${activity.fileName} · ` : ""}
								{activity.rowCount
									? `${activity.rowCount.toLocaleString()} rows`
									: activity.type === "prediction"
										? "Prediction pipeline active"
										: "Upload pipeline active"}
							</p>

							<div className="mt-2">
								<div className="flex items-center justify-between mb-1">
									<span className={activityTone.subtle}>Progress</span>
									<span className="font-mono">
										{Math.round(activity.progress)}%
									</span>
								</div>
								<div className="h-1.5 rounded-full bg-white/70 overflow-hidden">
									<div
										className={`h-full rounded-full transition-all duration-300 ${activityTone.bar}`}
										style={{
											width: `${Math.max(0, Math.min(100, activity.progress))}%`,
										}}
									/>
								</div>
							</div>

							{activity.status !== "running" && (
								<p className={`mt-1 ${activityTone.subtle}`}>
									This update will auto-hide in about 1 minute.
								</p>
							)}
						</div>

						{activity.status === "success" &&
							activity.type === "prediction" && (
								<button
									onClick={() => navigate("/dashboard")}
									className="ml-auto text-xs px-3 py-1.5 rounded-md border border-[#6CC4CC] bg-[#F7FFFA] text-[#2A4466] hover:bg-[#E8F7F7]"
								>
									<Sparkles size={12} className="inline mr-1" />
									View Results
								</button>
							)}
					</div>
				)}
				<Outlet />
			</main>
		</div>
	);
}
