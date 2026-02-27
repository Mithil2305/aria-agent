import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
	Brain,
	LayoutDashboard,
	Upload,
	ClipboardEdit,
	LogOut,
	ChevronLeft,
	ChevronRight,
	User,
	Building2,
} from "lucide-react";

const NAV_ITEMS = [
	{ to: "/", icon: LayoutDashboard, label: "Dashboard" },
	{ to: "/upload", icon: Upload, label: "Upload Data" },
	{ to: "/daily-log", icon: ClipboardEdit, label: "Daily Log" },
];

export default function AppLayout() {
	const [collapsed, setCollapsed] = useState(false);
	const { user, userProfile, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = async () => {
		await logout();
		navigate("/login");
	};

	return (
		<div className="min-h-screen bg-slate-950 flex">
			{/* Sidebar */}
			<aside
				className={`fixed top-0 left-0 h-screen glass flex flex-col z-50 transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}
			>
				{/* Brand */}
				<div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800/50">
					<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shrink-0">
						<Brain size={16} className="text-white" />
					</div>
					{!collapsed && (
						<div className="overflow-hidden">
							<h1 className="text-sm font-bold text-white leading-tight">
								ARIA
							</h1>
							<p className="text-[10px] text-slate-500">
								Business Intelligence
							</p>
						</div>
					)}
				</div>

				{/* Navigation */}
				<nav className="flex-1 px-2 py-4 space-y-1">
					{NAV_ITEMS.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.to === "/"}
							className={({ isActive }) =>
								`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
									isActive
										? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
										: "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"
								} ${collapsed ? "justify-center" : ""}`
							}
						>
							<item.icon size={18} className="shrink-0" />
							{!collapsed && <span>{item.label}</span>}
						</NavLink>
					))}
				</nav>

				{/* User section */}
				<div className="px-2 pb-3 space-y-2">
					{!collapsed && (
						<div className="px-3 py-3 rounded-xl bg-slate-800/30 border border-slate-700/20">
							<div className="flex items-center gap-2 mb-1">
								<User size={12} className="text-slate-500" />
								<p className="text-xs text-white font-medium truncate">
									{user?.displayName || userProfile?.ownerName || "User"}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<Building2 size={12} className="text-slate-600" />
								<p className="text-[10px] text-slate-500 truncate">
									{userProfile?.businessName || user?.email}
								</p>
							</div>
						</div>
					)}
					<button
						onClick={handleLogout}
						className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all ${collapsed ? "justify-center" : ""}`}
					>
						<LogOut size={18} className="shrink-0" />
						{!collapsed && <span>Sign Out</span>}
					</button>
				</div>

				{/* Collapse toggle */}
				<button
					onClick={() => setCollapsed((c) => !c)}
					className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
				>
					{collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
				</button>
			</aside>

			{/* Main content */}
			<main
				className={`flex-1 transition-all duration-300 ${collapsed ? "ml-16" : "ml-56"}`}
			>
				<Outlet />
			</main>
		</div>
	);
}
