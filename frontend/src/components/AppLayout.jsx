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
import { useAnalysisJob } from "../contexts/useAnalysisJob";
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
	const {
		user,
		userProfile,
		logout,
		resendVerificationForCurrentUser,
		refreshEmailVerification,
	} = useAuth();
	const { activity } = useAnalysisJob();
	const navigate = useNavigate();
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const [verifyBusy, setVerifyBusy] = useState(false);
	const [verifyMessage, setVerifyMessage] = useState("");
	const isAdminEmail =
		String(user?.email || "")
			.trim()
			.toLowerCase() === "admin@yukti.com";
	const isAdmin = userProfile?.role === "admin" || isAdminEmail;
	const isEmailVerified = isAdmin || !!user?.emailVerified;
	const isVerificationLocked = !isEmailVerified;

	const handleLogout = async () => {
		await logout();
		navigate("/login");
	};

	const handleResendVerification = async () => {
		setVerifyMessage("");
		setVerifyBusy(true);
		try {
			await resendVerificationForCurrentUser();
			setVerifyMessage("Verification email sent. Check your inbox.");
		} catch {
			setVerifyMessage("Could not resend email right now. Please try again.");
		} finally {
			setVerifyBusy(false);
		}
	};

	const handleRefreshVerification = async () => {
		setVerifyMessage("");
		setVerifyBusy(true);
		try {
			const verified = await refreshEmailVerification();
			setVerifyMessage(
				verified
					? "Email verified successfully. Features are now enabled."
					: "Email is still unverified. Verify from your inbox and try again.",
			);
		} catch {
			setVerifyMessage("Unable to refresh verification right now.");
		} finally {
			setVerifyBusy(false);
		}
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
					wrap: "border-slate-300 bg-slate-50",
					icon: "text-slate-800",
					text: "text-slate-800",
					subtle: "text-slate-600",
					bar: "bg-slate-800",
				}
			: activity.status === "success"
				? {
						wrap: "border-slate-300 bg-slate-50",
						icon: "text-slate-700",
						text: "text-slate-800",
						subtle: "text-slate-600",
						bar: "bg-slate-700",
					}
				: {
						wrap: "border-slate-300 bg-slate-50",
						icon: "text-slate-800",
						text: "text-slate-800",
						subtle: "text-slate-600",
						bar: "bg-slate-800",
					};

	return (
		<div className="min-h-screen app-shell-bg flex">
			<div className="app-shell-grid pointer-events-none" />
			<div className="app-shell-blob app-shell-blob-a pointer-events-none" />
			<div className="app-shell-blob app-shell-blob-b pointer-events-none" />

			{/* Mobile top bar */}
			<header className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
				<div className="px-4 h-14 flex items-center justify-between">
					<button
						onClick={() => setMobileNavOpen((prev) => !prev)}
						className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-300 bg-white text-slate-800"
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
						disabled={isVerificationLocked}
						className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[11px] font-semibold text-slate-800"
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
						className="inline-flex"
					>
						<BrandLogo
							size={32}
							showText
							subtitle="Business Intelligence"
							markClassName="text-slate-900"
							textClassName="text-base text-slate-900"
							subtitleClassName="text-slate-500"
						/>
					</button>
				</div>

				<div className="divider mx-4" />

				{/* Navigation */}
				<nav
					className={`flex-1 px-3 py-4 space-y-0.5 ${isVerificationLocked ? "opacity-55 pointer-events-none" : ""}`}
				>
					<p className="px-3 pb-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
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
										? "bg-slate-100 text-slate-900 border border-slate-300"
										: "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
						disabled={isVerificationLocked}
						className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-slate-100 transition-all group"
					>
						<div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center">
							<span className="text-[11px] font-semibold text-slate-800">
								{initials}
							</span>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-[13px] text-slate-900 font-medium truncate">
								{userProfile?.ownerName || user?.displayName || "User"}
							</p>
							<p className="text-[11px] text-slate-500 truncate">
								{userProfile?.businessName || ""}
							</p>
						</div>
						<Settings
							size={14}
							className="text-slate-500 group-hover:text-slate-800 transition-colors shrink-0"
							strokeWidth={1.5}
						/>
					</button>

					<button
						onClick={handleLogout}
						className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
					>
						<LogOut size={15} className="shrink-0" strokeWidth={1.5} />
						<span>Sign Out</span>
					</button>
				</div>
			</aside>

			{/* Main content */}
			<main className="flex-1 w-full lg:ml-64 pt-14 lg:pt-0 relative z-10">
				{isVerificationLocked && (
					<div className="mx-4 md:mx-6 mt-4 px-4 py-3 rounded-xl border border-amber-300 bg-amber-50 text-slate-900 flex flex-col gap-2">
						<div className="text-xs sm:text-sm font-semibold">
							Please verify your email to unlock all features.
						</div>
						<div className="text-xs text-slate-700">
							Signed in as {user?.email || "your account"}. Until verification,
							actions and navigation are disabled.
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={handleResendVerification}
								disabled={verifyBusy}
								className="text-xs px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-60"
							>
								Resend verification email
							</button>
							<button
								type="button"
								onClick={handleRefreshVerification}
								disabled={verifyBusy}
								className="text-xs px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-60"
							>
								I have verified
							</button>
						</div>
						{verifyMessage ? (
							<div className="text-xs text-slate-700">{verifyMessage}</div>
						) : null}
					</div>
				)}
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
									className="ml-auto text-xs px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
								>
									<Sparkles size={12} className="inline mr-1" />
									View Results
								</button>
							)}
					</div>
				)}
				<div
					className={
						isVerificationLocked ? "pointer-events-none opacity-55" : ""
					}
				>
					<Outlet />
				</div>
			</main>
		</div>
	);
}
