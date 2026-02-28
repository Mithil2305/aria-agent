import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
	LayoutDashboard,
	Upload,
	ClipboardEdit,
	LogOut,
	User,
	Settings,
} from "lucide-react";

const NAV_ITEMS = [
	{ to: "/daily-log", icon: ClipboardEdit, label: "Daily Log" },
	{ to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
	{ to: "/upload", icon: Upload, label: "Import Data" },
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
		<div className="min-h-screen bg-surface-950 flex">
			{/* Sidebar */}
			<aside className="fixed top-0 left-0 h-screen w-60 bg-surface-900 border-r border-surface-800/60 flex flex-col z-50">
				{/* Brand */}
				<div className="px-6 py-6">
					<h1 className="text-base font-semibold text-surface-200 tracking-tight">
						ARIA
					</h1>
					<p className="text-[11px] text-surface-500 mt-0.5">
						Business Intelligence
					</p>
				</div>

				<div className="divider mx-4" />

				{/* Navigation */}
				<nav className="flex-1 px-3 py-4 space-y-0.5">
					<p className="px-3 pb-2 text-[10px] font-medium text-surface-500 uppercase tracking-wider">
						Menu
					</p>
					{NAV_ITEMS.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.end || false}
							className={({ isActive }) =>
								`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
									isActive
										? "bg-gold-500/8 text-gold-400"
										: "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50"
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
						className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-surface-800/50 transition-all group"
					>
						<div className="w-8 h-8 rounded-full bg-surface-800 border border-surface-700/50 flex items-center justify-center">
							<span className="text-[11px] font-semibold text-surface-400">
								{initials}
							</span>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-[13px] text-surface-200 font-medium truncate">
								{userProfile?.ownerName || user?.displayName || "User"}
							</p>
							<p className="text-[11px] text-surface-500 truncate">
								{userProfile?.businessName || ""}
							</p>
						</div>
						<Settings
							size={14}
							className="text-surface-600 group-hover:text-surface-400 transition-colors shrink-0"
							strokeWidth={1.5}
						/>
					</button>

					<button
						onClick={handleLogout}
						className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-surface-500 hover:text-red-400/80 hover:bg-red-500/5 transition-all"
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
