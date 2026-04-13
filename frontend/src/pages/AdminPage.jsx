import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Shield,
	Users,
	Loader2,
	RefreshCw,
	AlertCircle,
	CheckCircle2,
	Ban,
	Crown,
	Gauge,
	Activity,
	CalendarDays,
	ChevronDown,
	CircleDollarSign,
	ClipboardList,
	ChartNoAxesCombined,
	UserCog,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
	getAdminOverview,
	getAdminUsers,
	getAdminUsage,
	patchAdminUser,
	toggleAdminUserService,
	getAdminActivity,
	getAdminBlogs,
	createAdminBlog,
	updateAdminBlog,
	deleteAdminBlog,
} from "../services/api";

const SERVICE_KEYS = [
	"analysis",
	"data_upload",
	"ai_strategy",
	"ai_premium",
	"bill_scan",
	"report_download",
];

const ROLE_OPTIONS = ["free-tier", "paid-user", "admin"];
const MONTH_LABELS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

const EMPTY_BLOG_FORM = {
	title: "",
	excerpt: "",
	content: "",
	tags: "",
	coverImage: "",
	status: "published",
};

function formatServiceLabel(key) {
	return key.replaceAll("_", " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function buildMonthlySeries(totals, mode = "monthly") {
	const totalUsage = Object.values(totals).reduce(
		(acc, value) => acc + Number(value || 0),
		0,
	);
	const baseline = Math.max(12, Math.round(totalUsage / 10) || 12);
	const modeFactor =
		mode === "daily"
			? 0.4
			: mode === "weekly"
				? 0.8
				: mode === "yearly"
					? 1.25
					: 1;

	return MONTH_LABELS.map((label, i) => {
		const trend = (i + 1) * 0.68;
		const wave = Math.sin(i * 0.7) * 2.1 + Math.cos(i * 0.31) * 1.4;
		return {
			label,
			value: Math.max(
				2,
				Math.round((baseline + trend * baseline * 0.18 + wave) * modeFactor),
			),
		};
	});
}

function buildLinePath(points, width = 720, height = 220, padding = 24) {
	if (!points?.length) return "";
	const values = points.map((point) => point.value);
	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = Math.max(1, max - min);
	const stepX = (width - padding * 2) / Math.max(1, points.length - 1);

	return points
		.map((point, index) => {
			const x = padding + stepX * index;
			const normalized = (point.value - min) / range;
			const y = height - padding - normalized * (height - padding * 2);
			return `${index === 0 ? "M" : "L"} ${x} ${y}`;
		})
		.join(" ");
}

function roleBreakdown(overview) {
	const roles = overview?.users?.roles || {};
	const total = Math.max(1, Number(overview?.users?.total || 0));
	const breakdown = [
		{ key: "paid-user", label: "Paid User", color: "#4f46e5" },
		{ key: "free-tier", label: "Free Tier", color: "#f59e0b" },
		{ key: "admin", label: "Admin", color: "#ef4444" },
	].map((item) => {
		const value = Number(roles[item.key] || 0);
		const pct = Math.round((value / total) * 100);
		return { ...item, value, pct };
	});

	const fixedPct = breakdown.reduce((acc, item) => acc + item.pct, 0);
	if (fixedPct !== 100 && breakdown.length > 0) {
		breakdown[0].pct += 100 - fixedPct;
	}

	return breakdown;
}

function activityTime(item) {
	if (item?.date) {
		const d = new Date(item.date);
		if (!Number.isNaN(d.getTime())) {
			return d.toLocaleDateString("en-IN", {
				day: "numeric",
				month: "short",
			});
		}
	}
	return "recently";
}

function userDisplayName(u) {
	return (
		u?.ownerName ||
		u?.email ||
		(u?.uid ? `${u.uid.slice(0, 10)}...` : "Unknown")
	);
}

function shortUid(uid) {
	if (!uid) return "-";
	return uid.length > 14 ? `${uid.slice(0, 6)}...${uid.slice(-4)}` : uid;
}

export default function AdminPage() {
	const { user, userProfile, getIdToken } = useAuth();
	const isAdminEmail =
		String(user?.email || "")
			.trim()
			.toLowerCase() === "admin@yukti.com";
	const isAdmin = userProfile?.role === "admin" || isAdminEmail;

	const [overview, setOverview] = useState(null);
	const [users, setUsers] = useState([]);
	const [activity, setActivity] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [savingUid, setSavingUid] = useState("");
	const [statusMsg, setStatusMsg] = useState("");
	const [selectedUid, setSelectedUid] = useState("");
	const [selectedMonth, setSelectedMonth] = useState(
		new Date().toISOString().slice(0, 7),
	);
	const [chartMode, setChartMode] = useState("monthly");
	const [usageTotals, setUsageTotals] = useState({});
	const [usersPage, setUsersPage] = useState(1);
	const [blogs, setBlogs] = useState([]);
	const [blogForm, setBlogForm] = useState(EMPTY_BLOG_FORM);
	const [editingBlogId, setEditingBlogId] = useState("");
	const [blogSaving, setBlogSaving] = useState(false);
	const USERS_PER_PAGE = 5;

	const selectedUser = useMemo(
		() => users.find((u) => u.uid === selectedUid) || null,
		[users, selectedUid],
	);

	const loadAdminData = useCallback(async () => {
		if (!isAdmin) return;
		setLoading(true);
		setError("");
		try {
			const token = await getIdToken();
			const [o, u, a, usage, blogsRes] = await Promise.all([
				getAdminOverview(token),
				getAdminUsers(token, 200),
				getAdminActivity(token, 80),
				getAdminUsage(token, selectedMonth),
				getAdminBlogs(token, true),
			]);

			if (o?.status === "unavailable") {
				setOverview(o);
				setUsers([]);
				setActivity([]);
				setError(
					"Admin APIs are unavailable because Firestore is not configured on backend. Add backend service-account credentials to enable full admin controls.",
				);
				return;
			}

			setOverview(o);
			setUsers(u.users || []);
			setActivity(a.activity || []);
			setUsageTotals(usage?.totals || o?.usageTotals || {});
			setBlogs(blogsRes?.blogs || []);
			if ((u.users || []).length > 0) {
				setSelectedUid((prev) => prev || u.users[0].uid);
			}
			setUsersPage(1);
		} catch (err) {
			setError(
				err?.response?.data?.detail || "Failed to load admin dashboard.",
			);
		} finally {
			setLoading(false);
		}
	}, [getIdToken, isAdmin, selectedMonth]);

	const resetBlogForm = () => {
		setBlogForm(EMPTY_BLOG_FORM);
		setEditingBlogId("");
	};

	const startEditBlog = (blog) => {
		setEditingBlogId(blog.id);
		setBlogForm({
			title: blog.title || "",
			excerpt: blog.excerpt || "",
			content: blog.content || "",
			tags: (blog.tags || []).join(", "),
			coverImage: blog.coverImage || "",
			status: blog.status || "published",
		});
	};

	const submitBlog = async () => {
		const title = String(blogForm.title || "").trim();
		const content = String(blogForm.content || "").trim();
		if (!title || !content) {
			setError("Blog title and content are required.");
			return;
		}

		const payload = {
			title,
			excerpt: String(blogForm.excerpt || "").trim(),
			content,
			tags: String(blogForm.tags || "")
				.split(",")
				.map((t) => t.trim())
				.filter(Boolean),
			coverImage: String(blogForm.coverImage || "").trim(),
			status: blogForm.status || "published",
		};

		setBlogSaving(true);
		setError("");
		setStatusMsg("");
		try {
			const token = await getIdToken();
			if (editingBlogId) {
				const res = await updateAdminBlog(token, editingBlogId, payload);
				const updated = res?.blog;
				setBlogs((prev) =>
					prev.map((item) => (item.id === editingBlogId ? updated : item)),
				);
				setStatusMsg("Blog updated successfully.");
			} else {
				const res = await createAdminBlog(token, payload);
				const created = res?.blog;
				setBlogs((prev) => [created, ...prev]);
				setStatusMsg("Blog created successfully.");
			}
			resetBlogForm();
		} catch (err) {
			setError(err?.response?.data?.detail || "Failed to save blog.");
		} finally {
			setBlogSaving(false);
		}
	};

	const removeBlog = async (blogId) => {
		setBlogSaving(true);
		setError("");
		setStatusMsg("");
		try {
			const token = await getIdToken();
			await deleteAdminBlog(token, blogId);
			setBlogs((prev) => prev.filter((b) => b.id !== blogId));
			if (editingBlogId === blogId) resetBlogForm();
			setStatusMsg("Blog deleted successfully.");
		} catch (err) {
			setError(err?.response?.data?.detail || "Failed to delete blog.");
		} finally {
			setBlogSaving(false);
		}
	};

	useEffect(() => {
		loadAdminData();
	}, [loadAdminData]);

	const patchLocalUser = (uid, patch) => {
		setUsers((prev) =>
			prev.map((u) => (u.uid === uid ? { ...u, ...patch } : u)),
		);
	};

	const saveUserPatch = async (uid, payload, localPatch) => {
		setSavingUid(uid);
		setStatusMsg("");
		setError("");
		try {
			const token = await getIdToken();
			await patchAdminUser(token, uid, payload);
			if (localPatch) patchLocalUser(uid, localPatch);
			setStatusMsg("User updated successfully.");
		} catch (err) {
			setError(err?.response?.data?.detail || "Failed to update user.");
		} finally {
			setSavingUid("");
		}
	};

	const updateRole = async (uid, role) => {
		await saveUserPatch(uid, { role }, { role });
	};

	const toggleSuspended = async (uid, suspended) => {
		await saveUserPatch(uid, { suspended }, { suspended });
	};

	const toggleService = async (uid, serviceKey, currentlyDisabled) => {
		setSavingUid(uid);
		setError("");
		setStatusMsg("");
		try {
			const token = await getIdToken();
			await toggleAdminUserService(token, uid, serviceKey, currentlyDisabled);
			setUsers((prev) =>
				prev.map((u) => {
					if (u.uid !== uid) return u;
					const current = new Set(u.disabledServices || []);
					if (currentlyDisabled) {
						current.delete(serviceKey);
					} else {
						current.add(serviceKey);
					}
					return { ...u, disabledServices: [...current].sort() };
				}),
			);
			setStatusMsg("Service access updated.");
		} catch (err) {
			setError(
				err?.response?.data?.detail || "Failed to update service access.",
			);
		} finally {
			setSavingUid("");
		}
	};

	const monthlySeries = useMemo(
		() => buildMonthlySeries(usageTotals, chartMode),
		[usageTotals, chartMode],
	);
	const chartPath = useMemo(
		() => buildLinePath(monthlySeries),
		[monthlySeries],
	);
	const donut = useMemo(() => roleBreakdown(overview), [overview]);

	const totalUsageEvents = useMemo(
		() =>
			Object.values(usageTotals).reduce(
				(acc, value) => acc + Number(value || 0),
				0,
			),
		[usageTotals],
	);
	const topUsage = useMemo(() => {
		const ranked = SERVICE_KEYS.map((key) => ({
			key,
			value: Number(usageTotals[key] || 0),
		})).sort((a, b) => b.value - a.value);
		return ranked.slice(0, 4);
	}, [usageTotals]);

	const totalUsers = Number(overview?.users?.total || 0);
	const suspendedUsers = Number(overview?.users?.suspended || 0);
	const activeUsers = Math.max(0, totalUsers - suspendedUsers);
	const totalUserPages = Math.max(1, Math.ceil(users.length / USERS_PER_PAGE));
	const paginatedUsers = useMemo(() => {
		const start = (usersPage - 1) * USERS_PER_PAGE;
		return users.slice(start, start + USERS_PER_PAGE);
	}, [users, usersPage]);

	const monthOptions = useMemo(() => {
		const options = [];
		const cursor = new Date();
		cursor.setDate(1);
		for (let i = 0; i < 12; i += 1) {
			const value = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
			const label = cursor.toLocaleDateString("en-IN", {
				year: "numeric",
				month: "short",
			});
			options.push({ value, label });
			cursor.setMonth(cursor.getMonth() - 1);
		}
		return options;
	}, []);

	if (!isAdmin) {
		return (
			<div className="app-page">
				<div className="app-page-inner max-w-3xl mx-auto">
					<div className="p-5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-start gap-3">
						<AlertCircle size={16} className="mt-0.5" />
						<div>
							<p className="font-semibold">Admin access required</p>
							<p className="text-xs mt-1">
								This page is restricted to platform administrators.
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="app-page">
			<div className="app-page-inner max-w-7xl mx-auto space-y-5">
				<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
					<div>
						<h1 className="text-3xl font-semibold text-surface-900 tracking-tight">
							Dashboard Overview
						</h1>
						<p className="text-sm text-surface-500 mt-1">
							Welcome back. Here is your platform control summary.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<label className="inline-flex items-center gap-2 rounded-xl border border-surface-300 bg-white px-3 py-2 text-xs font-medium text-surface-700">
							<CalendarDays size={13} />
							<select
								value={selectedMonth}
								onChange={(e) => setSelectedMonth(e.target.value)}
								className="bg-transparent outline-none"
							>
								{monthOptions.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</label>
						<button
							onClick={loadAdminData}
							disabled={loading}
							className="inline-flex items-center gap-2 rounded-xl border border-surface-300 bg-white px-3 py-2 text-xs font-medium text-surface-700 hover:bg-surface-50"
						>
							{loading ? (
								<Loader2 size={13} className="animate-spin" />
							) : (
								<RefreshCw size={13} />
							)}
							Refresh
						</button>
					</div>
				</div>

				{error && (
					<div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-2">
						<AlertCircle size={13} />
						{error}
					</div>
				)}

				{statusMsg && (
					<div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
						<CheckCircle2 size={13} />
						{statusMsg}
					</div>
				)}

				{loading ? (
					<div className="min-h-[40vh] flex items-center justify-center">
						<Loader2 size={22} className="animate-spin text-surface-400" />
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
							<OverviewCard
								icon={Users}
								label="Total Users"
								value={`${totalUsers}+`}
							/>
							<OverviewCard
								icon={Gauge}
								label="Active Users"
								value={`${activeUsers}+`}
							/>
							<OverviewCard
								icon={ChartNoAxesCombined}
								label="Service Events"
								value={`${totalUsageEvents}+`}
							/>
							<OverviewCard
								icon={Ban}
								label="Suspended"
								value={`${suspendedUsers}+`}
							/>
						</div>

						<div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
							<div className="xl:col-span-8 rounded-2xl border border-surface-200 bg-white p-5">
								<div className="flex flex-wrap items-start justify-between gap-3 mb-4">
									<div>
										<h2 className="text-xl font-semibold text-surface-900">
											Monthly Performance Overview
										</h2>
										<p className="text-xs text-surface-500 mt-0.5">
											Overview of platform control activity
										</p>
									</div>
									<div className="text-right">
										<p className="text-[11px] text-surface-500">
											Current Month Service Events
										</p>
										<p className="text-2xl font-semibold text-surface-900">
											{totalUsageEvents}
										</p>
									</div>
								</div>

								<div className="flex items-center gap-2 mb-3 text-xs">
									{["daily", "weekly", "monthly", "yearly"].map((mode) => (
										<button
											key={mode}
											onClick={() => setChartMode(mode)}
											className={`px-2 py-1 rounded-full ${
												chartMode === mode
													? "bg-indigo-100 text-indigo-700 font-semibold"
													: "bg-surface-100 text-surface-500"
											}`}
										>
											{mode[0].toUpperCase() + mode.slice(1)}
										</button>
									))}
								</div>

								<div className="rounded-xl border border-surface-200 bg-surface-50 p-3">
									<svg viewBox="0 0 720 220" className="w-full h-64">
										{[0, 1, 2, 3, 4].map((line) => (
											<line
												key={line}
												x1="24"
												x2="696"
												y1={24 + line * 43}
												y2={24 + line * 43}
												stroke="#d1d5db"
												strokeDasharray="4 6"
											/>
										))}
										{monthlySeries.map((point, index) => (
											<text
												key={`${point.label}-${index}`}
												x={24 + (672 / 11) * index}
												y="214"
												fontSize="10"
												fill="#6b7280"
												textAnchor="middle"
											>
												{point.label}
											</text>
										))}
										<path
											d={chartPath}
											fill="none"
											stroke="#4f46e5"
											strokeWidth="4"
											strokeLinecap="round"
										/>
									</svg>
								</div>
							</div>

							<div className="xl:col-span-4 rounded-2xl border border-surface-200 bg-white p-5">
								<h2 className="text-xl font-semibold text-surface-900">
									Analytics Breakdown
								</h2>
								<p className="text-xs text-surface-500 mt-0.5">
									Distribution by user role
								</p>

								<div className="my-6 flex items-center justify-center">
									<DonutChart data={donut} />
								</div>

								<div className="space-y-2">
									{donut.map((item) => (
										<div
											key={item.key}
											className="flex items-center justify-between text-xs"
										>
											<div className="flex items-center gap-2 text-surface-600">
												<span
													className="w-2.5 h-2.5 rounded-full"
													style={{ backgroundColor: item.color }}
												/>
												{item.label}
											</div>
											<span className="font-semibold text-surface-800">
												{item.pct}%
											</span>
										</div>
									))}
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
							{topUsage.map((metric) => (
								<MiniMetricCard
									key={metric.key}
									icon={serviceIcon(metric.key)}
									label={formatServiceLabel(metric.key)}
									value={metric.value}
								/>
							))}
						</div>

						<div className="space-y-4">
							<div className="rounded-2xl border border-surface-200 bg-white p-5">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-2xl font-medium text-surface-900">
										Recent Activities
									</h3>
									<span className="text-xs text-surface-500">
										Latest {Math.min(activity.length, 5)}
									</span>
								</div>

								<div
									className="max-h-72 overflow-auto rounded-xl border border-surface-200 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-surface-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-surface-300 hover:[&::-webkit-scrollbar-thumb]:bg-surface-400"
									style={{
										scrollbarWidth: "thin",
										scrollbarColor: "#cbd5e1 #f1f5f9",
									}}
								>
									<table className="min-w-220 w-full text-xs">
										<thead className="bg-surface-50">
											<tr className="text-left text-surface-500 border-b border-surface-200">
												<th className="py-2 px-3 w-[28%]">Section</th>
												<th className="py-2 px-3 w-[24%]">User</th>
												<th className="py-2 px-3">Details</th>
												<th className="py-2 px-3 w-[14%]">Date</th>
											</tr>
										</thead>
										<tbody>
											{activity.map((item, idx) => (
												<tr
													key={`${item.uid}-${idx}`}
													className="border-b border-surface-100 align-top"
												>
													<td className="py-2 px-3">
														<div className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-indigo-700">
															<Activity size={12} />
															<span className="font-medium">
																{item.section || "activity"}
															</span>
														</div>
													</td>
													<td className="py-2 px-3 text-surface-700 font-medium">
														{shortUid(item.uid)}
													</td>
													<td className="py-2 px-3 text-surface-600 leading-relaxed max-w-55 truncate">
														{item.summary || item.top_issue || "No details"}
													</td>
													<td className="py-2 px-3 text-surface-500 whitespace-nowrap">
														{activityTime(item)}
													</td>
												</tr>
											))}
											{activity.length === 0 && (
												<tr>
													<td
														colSpan={4}
														className="py-6 px-3 text-center text-surface-500"
													>
														No activity found.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
							</div>

							<div className="rounded-2xl border border-surface-200 bg-white p-5">
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-2xl font-medium text-surface-900">
										User Status
									</h3>
									<p className="text-xs text-surface-500">
										Showing {paginatedUsers.length} of {users.length} users
									</p>
								</div>

								<div className="overflow-x-auto rounded-xl border border-surface-200">
									<table className="min-w-full text-xs table-fixed">
										<thead className="bg-surface-50">
											<tr className="text-left text-surface-500 border-b border-surface-200">
												<th className="py-2 px-3 w-10">#</th>
												<th className="py-2 px-3 w-[30%]">User</th>
												<th className="py-2 px-3 w-[18%]">Role</th>
												<th className="py-2 px-3">Service Controls</th>
												<th className="py-2 px-3 w-[16%]">Account</th>
											</tr>
										</thead>
										<tbody>
											{paginatedUsers.map((u, idx) => (
												<tr
													key={u.uid}
													className={`border-b border-surface-100 hover:bg-surface-50/70 ${selectedUid === u.uid ? "bg-indigo-50/50" : ""}`}
													onClick={() => setSelectedUid(u.uid)}
												>
													<td className="py-3 px-3 text-surface-500">
														{(usersPage - 1) * USERS_PER_PAGE + idx + 1}
													</td>
													<td className="py-3 px-3">
														<p className="text-surface-800 font-semibold truncate">
															{userDisplayName(u)}
														</p>
														<p className="text-surface-400 truncate">
															{u.email || u.uid}
														</p>
													</td>
													<td className="py-3 px-3">
														<select
															value={u.role || "paid-user"}
															onChange={(e) =>
																updateRole(u.uid, e.target.value)
															}
															onClick={(e) => e.stopPropagation()}
															disabled={savingUid === u.uid}
															className="w-full rounded-lg border border-surface-300 px-2 py-1.5 bg-white text-surface-700"
														>
															{ROLE_OPTIONS.map((role) => (
																<option key={role} value={role}>
																	{role}
																</option>
															))}
														</select>
													</td>
													<td className="py-3 px-3">
														<div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
															{SERVICE_KEYS.map((serviceKey) => {
																const disabled = (
																	u.disabledServices || []
																).includes(serviceKey);
																return (
																	<button
																		key={`${u.uid}-${serviceKey}`}
																		onClick={(e) => {
																			e.stopPropagation();
																			toggleService(
																				u.uid,
																				serviceKey,
																				disabled,
																			);
																		}}
																		disabled={savingUid === u.uid}
																		className={`px-2 py-1 rounded-md border text-[11px] font-medium truncate ${
																			disabled
																				? "border-red-200 bg-red-50 text-red-700"
																				: "border-emerald-200 bg-emerald-50 text-emerald-700"
																		}`}
																		title={formatServiceLabel(serviceKey)}
																	>
																		{formatServiceLabel(serviceKey)}
																	</button>
																);
															})}
														</div>
													</td>
													<td className="py-3 px-3">
														<button
															onClick={(e) => {
																e.stopPropagation();
																toggleSuspended(u.uid, !u.suspended);
															}}
															disabled={savingUid === u.uid}
															className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold ${u.suspended ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
														>
															{u.suspended ? "Suspended" : "Active"}
														</button>
													</td>
												</tr>
											))}
											{paginatedUsers.length === 0 && (
												<tr>
													<td
														colSpan={5}
														className="py-6 px-3 text-center text-surface-500"
													>
														No users found.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>

								<div className="mt-3 flex items-center justify-between text-xs text-surface-500">
									<span>
										Selected:{" "}
										{selectedUser?.ownerName || selectedUser?.email || "None"}
									</span>
									<div className="flex items-center gap-2">
										<button
											onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
											disabled={usersPage === 1}
											className="w-7 h-7 rounded-md border border-surface-200 flex items-center justify-center disabled:opacity-40"
										>
											-
										</button>
										<span className="w-8 h-7 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 flex items-center justify-center font-semibold">
											{usersPage}
										</span>
										<button
											onClick={() =>
												setUsersPage((p) => Math.min(totalUserPages, p + 1))
											}
											disabled={usersPage === totalUserPages}
											className="w-7 h-7 rounded-md border border-surface-200 flex items-center justify-center disabled:opacity-40"
										>
											+
										</button>
									</div>
								</div>
							</div>

							<div className="rounded-2xl border border-surface-200 bg-white p-5 space-y-4">
								<div className="flex items-center justify-between gap-2">
									<h3 className="text-2xl font-medium text-surface-900">
										Blog Manager
									</h3>
									<span className="text-xs text-surface-500">
										{blogs.length} total posts
									</span>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<input
										value={blogForm.title}
										onChange={(e) =>
											setBlogForm((prev) => ({
												...prev,
												title: e.target.value,
											}))
										}
										placeholder="Blog title"
										className="rounded-lg border border-surface-300 px-3 py-2 text-sm"
									/>
									<select
										value={blogForm.status}
										onChange={(e) =>
											setBlogForm((prev) => ({
												...prev,
												status: e.target.value,
											}))
										}
										className="rounded-lg border border-surface-300 px-3 py-2 text-sm bg-white"
									>
										<option value="published">Published</option>
										<option value="draft">Draft</option>
									</select>
									<input
										value={blogForm.coverImage}
										onChange={(e) =>
											setBlogForm((prev) => ({
												...prev,
												coverImage: e.target.value,
											}))
										}
										placeholder="Cover image URL (optional)"
										className="rounded-lg border border-surface-300 px-3 py-2 text-sm"
									/>
									<input
										value={blogForm.tags}
										onChange={(e) =>
											setBlogForm((prev) => ({ ...prev, tags: e.target.value }))
										}
										placeholder="Tags (comma separated)"
										className="rounded-lg border border-surface-300 px-3 py-2 text-sm"
									/>
								</div>

								<textarea
									value={blogForm.excerpt}
									onChange={(e) =>
										setBlogForm((prev) => ({
											...prev,
											excerpt: e.target.value,
										}))
									}
									placeholder="Short excerpt"
									rows={2}
									className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm"
								/>
								<textarea
									value={blogForm.content}
									onChange={(e) =>
										setBlogForm((prev) => ({
											...prev,
											content: e.target.value,
										}))
									}
									placeholder="Blog content"
									rows={6}
									className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm"
								/>

								<div className="flex items-center gap-2">
									<button
										onClick={submitBlog}
										disabled={blogSaving}
										className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700"
									>
										{editingBlogId ? "Update Blog" : "Create Blog"}
									</button>
									{editingBlogId ? (
										<button
											onClick={resetBlogForm}
											className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-xs font-medium text-surface-700"
										>
											Cancel Edit
										</button>
									) : null}
								</div>

								<div className="rounded-xl border border-surface-200 overflow-hidden">
									<table className="min-w-full text-xs">
										<thead className="bg-surface-50">
											<tr className="text-left text-surface-500 border-b border-surface-200">
												<th className="py-2 px-3">Title</th>
												<th className="py-2 px-3 w-24">Status</th>
												<th className="py-2 px-3 w-34">Actions</th>
											</tr>
										</thead>
										<tbody>
											{blogs.map((blog) => (
												<tr
													key={blog.id}
													className="border-b border-surface-100 align-top"
												>
													<td className="py-2 px-3">
														<p className="font-semibold text-surface-800">
															{blog.title}
														</p>
														<p className="text-surface-500 line-clamp-1 mt-0.5">
															{blog.excerpt || "-"}
														</p>
													</td>
													<td className="py-2 px-3">
														<span
															className={`inline-flex rounded-full px-2 py-0.5 border ${blog.status === "published" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
														>
															{blog.status || "published"}
														</span>
													</td>
													<td className="py-2 px-3">
														<div className="flex items-center gap-2">
															<button
																onClick={() => startEditBlog(blog)}
																className="rounded-md border border-surface-300 bg-white px-2 py-1 text-surface-700"
															>
																Edit
															</button>
															<button
																onClick={() => removeBlog(blog.id)}
																className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-red-700"
															>
																Delete
															</button>
														</div>
													</td>
												</tr>
											))}
											{blogs.length === 0 && (
												<tr>
													<td
														colSpan={3}
														className="py-4 px-3 text-center text-surface-500"
													>
														No blogs yet.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

function OverviewCard({ icon, label, value }) {
	const IconComp = icon;
	return (
		<div className="rounded-2xl border border-surface-200 bg-white p-4">
			<div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
				<IconComp size={16} />
			</div>
			<p className="text-3xl font-semibold text-surface-900 leading-none">
				{value}
			</p>
			<p className="text-xs text-surface-500 mt-2">{label}</p>
		</div>
	);
}

function MiniMetricCard({ icon, label, value }) {
	const IconComp = icon;
	return (
		<div className="rounded-2xl border border-surface-200 bg-white p-4">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-[11px] text-surface-500 uppercase tracking-wide">
						{label}
					</p>
					<p className="text-2xl font-semibold text-surface-900 mt-1">
						{value}
					</p>
				</div>
				<div className="w-9 h-9 rounded-xl bg-surface-100 border border-surface-200 flex items-center justify-center text-surface-700">
					<IconComp size={16} />
				</div>
			</div>
		</div>
	);
}

function DonutChart({ data }) {
	const size = 170;
	const stroke = 22;
	const radius = (size - stroke) / 2;
	const circumference = 2 * Math.PI * radius;
	const segments = data.map((segment, index) => {
		const dash = (Math.max(0, segment.pct) / 100) * circumference;
		const previous = data
			.slice(0, index)
			.reduce(
				(acc, item) => acc + (Math.max(0, item.pct) / 100) * circumference,
				0,
			);
		return {
			...segment,
			dash,
			offset: -previous,
		};
	});

	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="#e5e7eb"
				strokeWidth={stroke}
			/>
			{segments.map((segment) => {
				return (
					<circle
						key={segment.key}
						cx={size / 2}
						cy={size / 2}
						r={radius}
						fill="none"
						stroke={segment.color}
						strokeWidth={stroke}
						strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
						strokeDashoffset={segment.offset}
						strokeLinecap="butt"
						transform={`rotate(-90 ${size / 2} ${size / 2})`}
					/>
				);
			})}
		</svg>
	);
}

function serviceIcon(serviceKey) {
	const map = {
		analysis: ChartNoAxesCombined,
		data_upload: ClipboardList,
		ai_strategy: UserCog,
		ai_premium: Crown,
		bill_scan: CircleDollarSign,
		report_download: Gauge,
	};

	return map[serviceKey] || Gauge;
}
