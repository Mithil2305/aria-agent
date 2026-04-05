import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Shield,
	Users,
	Loader2,
	RefreshCw,
	AlertCircle,
	CheckCircle2,
	Ban,
	Zap,
	Crown,
	Gauge,
	Activity,
	Sparkles,
	UserCog,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
	getAdminOverview,
	getAdminUsers,
	patchAdminUser,
	toggleAdminUserService,
	getAdminActivity,
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

export default function AdminPage() {
	const { userProfile, getIdToken } = useAuth();
	const isAdmin = userProfile?.role === "admin";

	const [overview, setOverview] = useState(null);
	const [users, setUsers] = useState([]);
	const [activity, setActivity] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [savingUid, setSavingUid] = useState("");
	const [statusMsg, setStatusMsg] = useState("");
	const [selectedUid, setSelectedUid] = useState("");

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
			const [o, u, a] = await Promise.all([
				getAdminOverview(token),
				getAdminUsers(token, 200),
				getAdminActivity(token, 80),
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
			if ((u.users || []).length > 0) {
				setSelectedUid((prev) => prev || u.users[0].uid);
			}
		} catch (err) {
			setError(
				err?.response?.data?.detail || "Failed to load admin dashboard.",
			);
		} finally {
			setLoading(false);
		}
	}, [getIdToken, isAdmin]);

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

	const formatServiceLabel = (key) => key.replaceAll("_", " ");

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
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
					<div className="lg:col-span-8 rounded-2xl border border-indigo-200/70 bg-linear-to-br from-indigo-50 via-white to-cyan-50 p-5">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 bg-indigo-100/70 px-2 py-1 rounded-full border border-indigo-200/70">
									<Sparkles size={12} />
									Platform Control
								</p>
								<h1 className="text-2xl font-semibold text-surface-900 mt-3 flex items-center gap-2">
									<Shield size={20} className="text-indigo-600" />
									Admin Dashboard
								</h1>
								<p className="text-sm text-surface-600 mt-2 max-w-2xl">
									Manage users, permissions, service access, and platform usage
									from a single control surface.
								</p>
							</div>
							<button
								onClick={loadAdminData}
								disabled={loading}
								className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-indigo-200 bg-white text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
							>
								{loading ? (
									<Loader2 size={13} className="animate-spin" />
								) : (
									<RefreshCw size={13} />
								)}
								Refresh Data
							</button>
						</div>
					</div>

					<div className="lg:col-span-4 rounded-2xl border border-surface-200 bg-white p-5">
						<p className="text-[11px] uppercase tracking-wide text-surface-500 font-semibold">
							Selected Account
						</p>
						{selectedUser ? (
							<div className="mt-3 space-y-2">
								<p className="text-sm font-semibold text-surface-900">
									{selectedUser.ownerName ||
										selectedUser.email ||
										selectedUser.uid}
								</p>
								<p className="text-xs text-surface-500">
									{selectedUser.email || selectedUser.uid}
								</p>
								<div className="pt-2 flex flex-wrap gap-1.5">
									<span className="text-[11px] px-2 py-1 rounded-lg border border-surface-200 bg-surface-50 text-surface-700">
										Role: {selectedUser.role || "paid-user"}
									</span>
									<span
										className={`text-[11px] px-2 py-1 rounded-lg border ${selectedUser.suspended ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
									>
										{selectedUser.suspended ? "Suspended" : "Active"}
									</span>
								</div>
							</div>
						) : (
							<p className="text-xs text-surface-500 mt-3">
								Select a user in the table to inspect details.
							</p>
						)}
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
					<div className="min-h-[30vh] flex items-center justify-center">
						<Loader2 size={22} className="animate-spin text-surface-400" />
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
							<MetricCard
								icon={Users}
								label="Total Users"
								value={overview?.users?.total || 0}
							/>
							<MetricCard
								icon={Ban}
								label="Suspended"
								value={overview?.users?.suspended || 0}
							/>
							<MetricCard
								icon={Crown}
								label="Admins"
								value={overview?.users?.roles?.admin || 0}
							/>
							<MetricCard
								icon={Gauge}
								label="Month"
								value={overview?.month || "-"}
							/>
						</div>

						<div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
							<div className="xl:col-span-8 bg-white rounded-2xl border border-surface-200 p-4">
								<div className="flex items-center justify-between gap-3 mb-3">
									<div className="flex items-center gap-2">
										<Users size={14} className="text-indigo-600" />
										<h2 className="text-sm font-semibold text-surface-900">
											User Management
										</h2>
									</div>
									<span className="text-[11px] text-surface-500">
										{users.length} accounts
									</span>
								</div>
								<div className="overflow-x-auto rounded-xl border border-surface-200">
									<table className="min-w-full text-xs">
										<thead className="bg-surface-50/80">
											<tr className="text-left text-surface-500 border-b border-surface-200">
												<th className="py-2 pr-3">User</th>
												<th className="py-2 pr-3">Role</th>
												<th className="py-2 pr-3">Suspended</th>
												<th className="py-2">Services</th>
											</tr>
										</thead>
										<tbody>
											{users.map((u) => (
												<tr
													key={u.uid}
													className={`border-b border-surface-100 hover:bg-surface-50/70 transition-colors ${selectedUid === u.uid ? "bg-indigo-50/50" : ""}`}
													onClick={() => setSelectedUid(u.uid)}
												>
													<td className="py-2 pr-3">
														<p className="font-medium text-surface-800">
															{u.ownerName || u.email || u.uid}
														</p>
														<p className="text-surface-400">
															{u.email || u.uid}
														</p>
													</td>
													<td className="py-2 pr-3">
														<select
															value={u.role || "paid-user"}
															onChange={(e) =>
																updateRole(u.uid, e.target.value)
															}
															disabled={savingUid === u.uid}
															className="px-2 py-1 rounded border border-surface-300 bg-white"
														>
															{ROLE_OPTIONS.map((r) => (
																<option key={r} value={r}>
																	{r}
																</option>
															))}
														</select>
													</td>
													<td className="py-2 pr-3">
														<button
															onClick={(e) => {
																e.stopPropagation();
																toggleSuspended(u.uid, !u.suspended);
															}}
															disabled={savingUid === u.uid}
															className={`px-2 py-1 rounded border ${u.suspended ? "border-red-300 bg-red-50 text-red-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}
														>
															{u.suspended ? "Suspended" : "Active"}
														</button>
													</td>
													<td className="py-2">
														<div className="flex flex-wrap gap-1">
															{SERVICE_KEYS.map((s) => {
																const disabled = (
																	u.disabledServices || []
																).includes(s);
																return (
																	<button
																		key={`${u.uid}-${s}`}
																		onClick={(e) => {
																			e.stopPropagation();
																			toggleService(u.uid, s, disabled);
																		}}
																		disabled={savingUid === u.uid}
																		className={`px-1.5 py-0.5 rounded border ${disabled ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}
																	>
																		{formatServiceLabel(s)}
																	</button>
																);
															})}
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>

							<div className="xl:col-span-4 grid grid-cols-1 gap-4">
								<div className="bg-white rounded-2xl border border-surface-200 p-4">
									<div className="flex items-center gap-2 mb-2">
										<UserCog size={14} className="text-indigo-600" />
										<h2 className="text-sm font-semibold text-surface-900">
											Service Control Snapshot
										</h2>
									</div>
									{selectedUser ? (
										<div className="space-y-2">
											<p className="text-xs text-surface-600">
												Disabled services for selected user:
											</p>
											{(selectedUser.disabledServices || []).length > 0 ? (
												<div className="flex flex-wrap gap-1.5">
													{selectedUser.disabledServices.map((service) => (
														<span
															key={`${selectedUser.uid}-${service}`}
															className="text-[11px] px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700"
														>
															{formatServiceLabel(service)}
														</span>
													))}
												</div>
											) : (
												<p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1.5">
													No service restrictions.
												</p>
											)}
										</div>
									) : (
										<p className="text-xs text-surface-500">
											Select a user from User Management to inspect controls.
										</p>
									)}
								</div>

								<div className="bg-white rounded-2xl border border-surface-200 p-4">
									<p className="text-xs font-semibold text-surface-700 mb-2 flex items-center gap-1.5">
										<Activity size={12} className="text-surface-500" />
										Recent Platform Activity
									</p>
									<div className="space-y-2 max-h-72 overflow-auto pr-1">
										{activity.slice(0, 12).map((item, idx) => (
											<div
												key={`${item.uid}-${item.section}-${idx}`}
												className="text-[11px] p-2.5 rounded-lg bg-surface-50 border border-surface-200"
											>
												<p className="font-medium text-surface-700">
													{item.section || "event"} · {item.uid}
												</p>
												<p className="text-surface-500 line-clamp-2">
													{item.summary || item.top_issue || "No summary"}
												</p>
											</div>
										))}
										{activity.length === 0 && (
											<p className="text-[11px] text-surface-500">
												No activity found.
											</p>
										)}
									</div>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-2xl border border-surface-200 p-4">
							<p className="text-sm font-semibold text-surface-900 mb-3 flex items-center gap-2">
								<Zap size={14} className="text-indigo-600" />
								Monthly Service Consumption
							</p>
							<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
								{SERVICE_KEYS.map((key) => (
									<div
										key={key}
										className="rounded-xl border border-surface-200 p-3 bg-surface-50"
									>
										<p className="text-[10px] uppercase tracking-wide text-surface-500">
											{formatServiceLabel(key)}
										</p>
										<p className="text-sm font-semibold text-surface-800 mt-1">
											{overview?.usageTotals?.[key] || 0}
										</p>
									</div>
								))}
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

function MetricCard({ icon, label, value }) {
	const IconComp = icon;
	return (
		<div className="bg-white rounded-2xl border border-surface-200 p-4">
			<p className="text-[11px] text-surface-500 uppercase tracking-wide flex items-center gap-1.5">
				<IconComp size={12} className="text-indigo-600" />
				{label}
			</p>
			<p className="text-lg font-semibold text-surface-900 mt-1">{value}</p>
		</div>
	);
}
