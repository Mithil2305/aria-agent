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
	Loader2,
	Sparkles,
	CheckCircle2,
	AlertCircle,
	Menu,
	X,
} from "lucide-react";
import { needsStockManagement } from "../config/businessTypes";
import { useAnalysisJob } from "../contexts/AnalysisJobContext";

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
	const { job } = useAnalysisJob();
	const navigate = useNavigate();
	const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

	return (
		<div className="min-h-screen app-shell-bg flex">
			<div className="app-shell-grid pointer-events-none" />
			<div className="app-shell-blob app-shell-blob-a pointer-events-none" />
			<div className="app-shell-blob app-shell-blob-b pointer-events-none" />

			{/* Mobile top bar */}
			<header className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
				<div className="px-4 h-14 flex items-center justify-between">
					<button
						onClick={() => setMobileNavOpen((prev) => !prev)}
						className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-700"
						aria-label="Toggle navigation"
					>
						{mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
					</button>
					<button
						onClick={() => navigate("/dashboard")}
						className="inline-flex items-center gap-2"
					>
						<div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
							<span className="text-white font-bold text-sm leading-none">
								Y
							</span>
						</div>
						<span className="font-semibold text-sm tracking-tight text-slate-900">
							Yukti
						</span>
					</button>
					<button
						onClick={() => navigate("/profile")}
						className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-700"
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
				className={`fixed top-0 left-0 h-screen w-72 max-w-[85vw] bg-white/95 border-r border-slate-200 flex flex-col z-50 backdrop-blur-xl transition-transform duration-300 lg:w-64 lg:max-w-none ${
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
						className="flex items-center gap-2"
					>
						<div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
							<span className="text-white font-bold text-lg leading-none">
								Y
							</span>
						</div>
						<h1 className="text-base font-semibold text-surface-900 tracking-tight">
							Yukti
						</h1>
					</button>
					<p className="text-[11px] text-surface-400 mt-0.5">
						Business Intelligence
					</p>
				</div>

				<div className="divider mx-4" />

				{/* Navigation */}
				<nav className="flex-1 px-3 py-4 space-y-0.5">
					<p className="px-3 pb-2 text-[10px] font-medium text-surface-400 uppercase tracking-wider">
						Menu
					</p>
					{[
						...NAV_ITEMS,
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
										? "bg-black text-white shadow-lg shadow-black/15"
										: "text-surface-500 hover:text-surface-800 hover:bg-surface-100"
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
						className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-surface-100 transition-all group"
					>
						<div className="w-8 h-8 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center">
							<span className="text-[11px] font-semibold text-gold-600">
								{initials}
							</span>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-[13px] text-surface-800 font-medium truncate">
								{userProfile?.ownerName || user?.displayName || "User"}
							</p>
							<p className="text-[11px] text-surface-400 truncate">
								{userProfile?.businessName || ""}
							</p>
						</div>
						<Settings
							size={14}
							className="text-surface-400 group-hover:text-surface-600 transition-colors shrink-0"
							strokeWidth={1.5}
						/>
					</button>

					<button
						onClick={handleLogout}
						className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-surface-400 hover:text-red-600 hover:bg-red-50 transition-all"
					>
						<LogOut size={15} className="shrink-0" strokeWidth={1.5} />
						<span>Sign Out</span>
					</button>
				</div>
			</aside>

			{/* Main content */}
			<main className="flex-1 w-full lg:ml-64 pt-14 lg:pt-0 relative z-10">
				{job.status === "running" && (
					<div className="mx-4 md:mx-6 mt-4 px-4 py-3 rounded-xl border border-indigo-200 bg-indigo-50/90 backdrop-blur-sm flex items-start gap-3">
						<Loader2
							size={16}
							className="text-indigo-600 animate-spin mt-0.5"
						/>
						<div className="text-xs text-indigo-700">
							<p className="font-semibold">
								Analysis is running in the background
							</p>
							<p className="mt-0.5">
								Feel free to explore other pages while Yukti processes your
								data.
							</p>
							<p className="mt-0.5 text-indigo-600/90">
								{job.fileName ? `${job.fileName} · ` : ""}
								{job.rowCount
									? `${job.rowCount.toLocaleString()} rows`
									: "Preparing analysis"}
							</p>
						</div>
					</div>
				)}

				{job.status === "success" && (
					<div className="mx-4 md:mx-6 mt-4 px-4 py-3 rounded-xl border border-green-200 bg-green-50/90 backdrop-blur-sm flex items-start gap-3">
						<CheckCircle2 size={16} className="text-green-600 mt-0.5" />
						<div className="text-xs text-green-700">
							<p className="font-semibold">Analysis complete</p>
							<p className="mt-0.5">
								Your latest insights are ready in Dashboard.
							</p>
						</div>
						<button
							onClick={() => navigate("/dashboard")}
							className="ml-auto text-xs px-3 py-1.5 rounded-md border border-green-300 bg-white text-green-700 hover:bg-green-100"
						>
							<Sparkles size={12} className="inline mr-1" />
							View Results
						</button>
					</div>
				)}

				{job.status === "error" && (
					<div className="mx-4 md:mx-6 mt-4 px-4 py-3 rounded-xl border border-red-200 bg-red-50/90 backdrop-blur-sm flex items-start gap-3">
						<AlertCircle size={16} className="text-red-600 mt-0.5" />
						<div className="text-xs text-red-700">
							<p className="font-semibold">Analysis failed</p>
							<p className="mt-0.5">
								{job.error || "Please retry from Analyse page."}
							</p>
						</div>
					</div>
				)}
				<Outlet />
			</main>
		</div>
	);
}
