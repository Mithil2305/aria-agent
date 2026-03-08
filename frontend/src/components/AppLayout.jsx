import { NavLink, Outlet, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { needsStockManagement } from "../config/businessTypes";

const NAV_ITEMS = [
	{ to: "/daily-log", icon: ClipboardEdit, label: "Daily Log" },
	{ to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
	{ to: "/analyse", icon: BarChart3, label: "Analyse" },
	{ to: "/strategy", icon: Lightbulb, label: "Strategy Advisor" },
	{ to: "/premium", icon: Crown, label: "Premium Analysis" },
	{ to: "/limits", icon: Gauge, label: "Usage & Limits" },
	{ to: "/integrations", icon: Plug, label: "Integrations" },
];

export default function AppLayout() {
	const { user, userProfile, logout } = useAuth();
	const navigate = useNavigate();

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
		<div className="min-h-screen bg-surface-100 flex">
			{/* Sidebar */}
			<aside className="fixed top-0 left-0 h-screen w-60 bg-white border-r border-surface-300 flex flex-col z-50">
				{/* Brand */}
				<div className="px-6 py-6">
					<h1 className="text-base font-semibold text-surface-900 tracking-tight">
						Yukti
					</h1>
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
							end={item.end || false}
							className={({ isActive }) =>
								`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
									isActive
										? "bg-gold-50 text-gold-600"
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
						onClick={() => navigate("/profile")}
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
			<main className="flex-1 ml-60">
				<Outlet />
			</main>
		</div>
	);
}
