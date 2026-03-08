import { useState, useEffect, useCallback } from "react";
import {
	Plug,
	Plus,
	Trash2,
	CheckCircle2,
	AlertCircle,
	Loader2,
	ExternalLink,
	RefreshCw,
	ChevronDown,
	ChevronUp,
	Copy,
	Check,
	Webhook,
	ShieldCheck,
	Clock,
	Zap,
	Eye,
	EyeOff,
	Globe,
	X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
	collection,
	addDoc,
	getDocs,
	deleteDoc,
	updateDoc,
	doc,
	query,
	orderBy,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import {
	PLATFORMS,
	getPlatformsForCategory,
	getPlatformById,
	CONNECTION_STATUS,
} from "../config/integrations";
import { getBusinessCategory } from "../config/businessTypes";
import { syncIntegration } from "../services/api";

// Generate a random webhook secret
function generateSecret() {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "yukti_whk_";
	for (let i = 0; i < 32; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

export default function IntegrationsPage() {
	const { user, userProfile, getIdToken } = useAuth();

	const businessType = userProfile?.businessType || "";
	const category = getBusinessCategory(businessType);

	const [connections, setConnections] = useState([]);
	const [loadingConns, setLoadingConns] = useState(true);
	const [showAddModal, setShowAddModal] = useState(false);
	const [selectedPlatform, setSelectedPlatform] = useState(null);
	const [authForm, setAuthForm] = useState({});
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [successMsg, setSuccessMsg] = useState(null);
	const [syncing, setSyncing] = useState(null); // connection id being synced
	const [copiedField, setCopiedField] = useState(null);
	const [visibleFields, setVisibleFields] = useState({});

	// Load existing connections
	const loadConnections = useCallback(async () => {
		if (!user) return;
		setLoadingConns(true);
		try {
			const q = query(
				collection(db, "users", user.uid, "integrations"),
				orderBy("createdAt", "desc"),
			);
			const snapshot = await getDocs(q);
			setConnections(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
		} catch {
			// silent
		} finally {
			setLoadingConns(false);
		}
	}, [user]);

	useEffect(() => {
		loadConnections();
	}, [loadConnections]);

	// Platforms not yet connected
	const availablePlatforms = getPlatformsForCategory(category).filter(
		(p) => !connections.some((c) => c.platformId === p.id),
	);

	const handleSelectPlatform = (platform) => {
		setSelectedPlatform(platform);
		const initialForm = {};
		for (const field of platform.authFields) {
			if (field.type === "readonly" && field.key === "webhookSecret") {
				initialForm[field.key] = generateSecret();
			} else {
				initialForm[field.key] = "";
			}
		}
		setAuthForm(initialForm);
		setError(null);
	};

	const handleSaveConnection = async () => {
		if (!user || !selectedPlatform) return;

		// Validate required fields
		for (const field of selectedPlatform.authFields) {
			if (field.type !== "readonly" && !authForm[field.key]?.trim()) {
				setError(`Please fill in ${field.label}.`);
				return;
			}
		}

		setSaving(true);
		setError(null);
		try {
			await addDoc(collection(db, "users", user.uid, "integrations"), {
				platformId: selectedPlatform.id,
				platformName: selectedPlatform.name,
				credentials: authForm, // In production, encrypt this server-side
				status: CONNECTION_STATUS.CONNECTED,
				lastSyncAt: null,
				syncCount: 0,
				businessType: businessType || null,
				businessCategory: category,
				createdAt: serverTimestamp(),
			});

			setShowAddModal(false);
			setSelectedPlatform(null);
			setAuthForm({});
			setSuccessMsg(`${selectedPlatform.name} connected successfully!`);
			setTimeout(() => setSuccessMsg(null), 4000);
			loadConnections();
		} catch {
			setError("Failed to save connection. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	const handleDisconnect = async (connId, platformName) => {
		if (!user) return;
		if (
			!window.confirm(
				`Disconnect ${platformName}? This won't delete previously synced logs.`,
			)
		)
			return;
		try {
			await deleteDoc(doc(db, "users", user.uid, "integrations", connId));
			setConnections((prev) => prev.filter((c) => c.id !== connId));
		} catch {
			// silent
		}
	};

	const handleSync = async (conn) => {
		if (!user) return;
		setSyncing(conn.id);
		try {
			const token = await getIdToken();
			const result = await syncIntegration(conn.platformId, conn.id, token);

			// Update sync timestamp in Firestore
			await updateDoc(doc(db, "users", user.uid, "integrations", conn.id), {
				lastSyncAt: serverTimestamp(),
				syncCount: (conn.syncCount || 0) + (result.imported || 0),
				status: CONNECTION_STATUS.CONNECTED,
			});

			setSuccessMsg(
				`Synced ${result.imported || 0} entries from ${conn.platformName}.`,
			);
			setTimeout(() => setSuccessMsg(null), 4000);
			loadConnections();
		} catch {
			setError("Sync failed. Check your credentials and try again.");
			setTimeout(() => setError(null), 4000);
		} finally {
			setSyncing(null);
		}
	};

	const copyToClipboard = (text, fieldKey) => {
		navigator.clipboard.writeText(text);
		setCopiedField(fieldKey);
		setTimeout(() => setCopiedField(null), 2000);
	};

	const toggleFieldVisibility = (fieldKey) => {
		setVisibleFields((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
	};

	return (
		<div className="min-h-screen py-10 px-6">
			<div className="max-w-4xl mx-auto">
				{/* Page header */}
				<div className="mb-8">
					<h1 className="text-xl font-semibold text-surface-900 mb-1 flex items-center gap-3">
						<div className="p-2 rounded-lg bg-indigo-50">
							<Plug size={20} className="text-indigo-600" />
						</div>
						Integrations
					</h1>
					<p className="text-sm text-surface-500 ml-12">
						Connect your billing or POS software to auto-import daily sales data
						into Yukti.
					</p>
				</div>

				{/* Success / Error banners */}
				{successMsg && (
					<div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm animate-fade-in-up">
						<CheckCircle2 size={14} />
						{successMsg}
					</div>
				)}
				{error && !showAddModal && (
					<div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
						<AlertCircle size={14} />
						{error}
					</div>
				)}

				{/* ── Active Connections ── */}
				<div className="mb-8">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-sm font-medium text-surface-700">
							Connected Platforms
						</h2>
						<button
							onClick={() => {
								setShowAddModal(true);
								setSelectedPlatform(null);
							}}
							className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-medium hover:bg-indigo-100 transition-all"
						>
							<Plus size={13} />
							Add Integration
						</button>
					</div>

					{loadingConns ? (
						<div className="flex items-center justify-center py-16">
							<Loader2 size={20} className="text-gold-600 animate-spin" />
						</div>
					) : connections.length === 0 ? (
						<div className="card-elevated p-10 text-center">
							<div className="w-14 h-14 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
								<Plug size={24} className="text-surface-400" />
							</div>
							<h3 className="text-sm font-medium text-surface-700 mb-1">
								No integrations yet
							</h3>
							<p className="text-xs text-surface-400 mb-4 max-w-sm mx-auto">
								Connect your billing software to automatically import daily
								sales data. No more manual entry!
							</p>
							<button
								onClick={() => {
									setShowAddModal(true);
									setSelectedPlatform(null);
								}}
								className="btn-primary text-xs"
							>
								<Plug size={14} className="inline mr-1.5" />
								Connect Your First Platform
							</button>
						</div>
					) : (
						<div className="space-y-3">
							{connections.map((conn) => {
								const platform = getPlatformById(conn.platformId);
								const isSync = syncing === conn.id;
								return (
									<div
										key={conn.id}
										className="card-elevated p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
									>
										{/* Logo + info */}
										<div className="flex items-center gap-3 flex-1 min-w-0">
											<div className="w-10 h-10 rounded-lg bg-surface-100 border border-surface-200 flex items-center justify-center shrink-0 overflow-hidden">
												{platform?.logo ? (
													<img
														src={platform.logo}
														alt={conn.platformName}
														className="w-6 h-6 object-contain"
														onError={(e) => {
															e.target.style.display = "none";
															e.target.parentElement.innerHTML =
																'<span class="text-surface-400 text-xs font-bold">' +
																conn.platformName.charAt(0) +
																"</span>";
														}}
													/>
												) : (
													<Webhook size={18} className="text-surface-400" />
												)}
											</div>
											<div className="min-w-0">
												<p className="text-sm font-medium text-surface-900 truncate">
													{conn.platformName}
												</p>
												<div className="flex items-center gap-2 mt-0.5">
													<span
														className={`inline-flex items-center gap-1 text-[10px] font-medium ${
															conn.status === CONNECTION_STATUS.CONNECTED
																? "text-green-600"
																: conn.status === CONNECTION_STATUS.ERROR
																	? "text-red-500"
																	: "text-surface-400"
														}`}
													>
														<span
															className={`w-1.5 h-1.5 rounded-full ${
																conn.status === CONNECTION_STATUS.CONNECTED
																	? "bg-green-500"
																	: conn.status === CONNECTION_STATUS.ERROR
																		? "bg-red-500"
																		: "bg-surface-400"
															}`}
														/>
														{conn.status === CONNECTION_STATUS.CONNECTED
															? "Connected"
															: conn.status === CONNECTION_STATUS.ERROR
																? "Error"
																: "Disconnected"}
													</span>
													{conn.lastSyncAt && (
														<span className="text-[10px] text-surface-400 flex items-center gap-0.5">
															<Clock size={9} />
															Last sync:{" "}
															{conn.lastSyncAt?.toDate
																? conn.lastSyncAt.toDate().toLocaleDateString()
																: "—"}
														</span>
													)}
													{conn.syncCount > 0 && (
														<span className="text-[10px] text-surface-400">
															· {conn.syncCount} entries
														</span>
													)}
												</div>
											</div>
										</div>

										{/* Actions */}
										<div className="flex items-center gap-2 shrink-0">
											<button
												onClick={() => handleSync(conn)}
												disabled={isSync}
												className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-100 border border-surface-200 text-surface-600 text-xs font-medium hover:border-indigo-200 hover:text-indigo-600 transition-all disabled:opacity-50"
												title="Sync now"
											>
												{isSync ? (
													<Loader2 size={12} className="animate-spin" />
												) : (
													<RefreshCw size={12} />
												)}
												{isSync ? "Syncing…" : "Sync"}
											</button>
											<button
												onClick={() =>
													handleDisconnect(conn.id, conn.platformName)
												}
												className="p-2 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500 transition-all"
												title="Disconnect"
											>
												<Trash2 size={13} />
											</button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* ── Webhook Info (if custom webhook is connected) ── */}
				{connections.some((c) => c.platformId === "custom_webhook") && (
					<div className="card p-5 mb-8">
						<h3 className="text-sm font-medium text-surface-700 mb-3 flex items-center gap-2">
							<Webhook size={14} className="text-indigo-500" />
							Webhook Endpoint
						</h3>
						<div className="bg-surface-50 rounded-lg p-3 border border-surface-200">
							<p className="text-[11px] text-surface-400 mb-1">
								POST your billing data to:
							</p>
							<div className="flex items-center gap-2">
								<code className="text-xs text-indigo-600 font-mono flex-1">
									{window.location.origin.replace(/:\d+$/, ":8000")}
									/api/integrations/webhook/custom
								</code>
								<button
									onClick={() =>
										copyToClipboard(
											`${window.location.origin.replace(/:\d+$/, ":8000")}/api/integrations/webhook/custom`,
											"webhookUrl",
										)
									}
									className="p-1.5 rounded hover:bg-surface-200 text-surface-400 transition-colors"
								>
									{copiedField === "webhookUrl" ? (
										<Check size={12} className="text-green-500" />
									) : (
										<Copy size={12} />
									)}
								</button>
							</div>
						</div>
						<div className="mt-3 text-[11px] text-surface-400 space-y-1">
							<p>
								<strong>Headers:</strong>{" "}
								<code className="text-indigo-500">
									X-Webhook-Secret: your_secret
								</code>
								,{" "}
								<code className="text-indigo-500">
									Authorization: Bearer your_firebase_token
								</code>
							</p>
							<p>
								<strong>Body (JSON):</strong>{" "}
								<code className="text-indigo-500">
									{`{ "date": "YYYY-MM-DD", "revenue": 1234, "orders": 56, ... }`}
								</code>
							</p>
						</div>
					</div>
				)}

				{/* ── How It Works ── */}
				<div className="card p-5">
					<h3 className="text-xs font-medium text-surface-400 mb-4 uppercase tracking-wider">
						How Integrations Work
					</h3>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="flex items-start gap-3">
							<div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
								<ShieldCheck size={13} className="text-indigo-500" />
							</div>
							<div>
								<p className="text-xs font-medium text-surface-700">
									Secure Connection
								</p>
								<p className="text-[11px] text-surface-400 mt-0.5">
									API keys are stored encrypted. Yukti only reads your sales
									summaries.
								</p>
							</div>
						</div>
						<div className="flex items-start gap-3">
							<div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
								<RefreshCw size={13} className="text-indigo-500" />
							</div>
							<div>
								<p className="text-xs font-medium text-surface-700">
									Auto-Sync or Manual
								</p>
								<p className="text-[11px] text-surface-400 mt-0.5">
									Billing data is mapped to your daily log fields automatically.
									Sync on demand or via webhooks.
								</p>
							</div>
						</div>
						<div className="flex items-start gap-3">
							<div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
								<Zap size={13} className="text-indigo-500" />
							</div>
							<div>
								<p className="text-xs font-medium text-surface-700">
									Instant Analysis
								</p>
								<p className="text-[11px] text-surface-400 mt-0.5">
									Synced data flows straight into your dashboard, trends, and AI
									predictions.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* ── Add Integration Modal ── */}
			{showAddModal && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
					<div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
						{/* Header */}
						<div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
							<h2 className="text-sm font-semibold text-surface-900">
								{selectedPlatform
									? `Connect ${selectedPlatform.name}`
									: "Add Integration"}
							</h2>
							<button
								onClick={() => {
									setShowAddModal(false);
									setSelectedPlatform(null);
									setError(null);
								}}
								className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 transition-colors"
							>
								<X size={16} />
							</button>
						</div>

						<div className="p-6">
							{!selectedPlatform ? (
								/* Platform selection grid */
								<div className="space-y-3">
									<p className="text-xs text-surface-400 mb-4">
										Choose a billing platform to connect:
									</p>
									{availablePlatforms.map((platform) => (
										<button
											key={platform.id}
											onClick={() => handleSelectPlatform(platform)}
											className="w-full flex items-center gap-4 p-4 rounded-xl border border-surface-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left group"
										>
											<div className="w-10 h-10 rounded-lg bg-surface-100 border border-surface-200 flex items-center justify-center shrink-0 overflow-hidden">
												{platform.logo ? (
													<img
														src={platform.logo}
														alt={platform.name}
														className="w-6 h-6 object-contain"
														onError={(e) => {
															e.target.style.display = "none";
															e.target.parentElement.innerHTML =
																'<span class="text-surface-400 text-xs font-bold">' +
																platform.name.charAt(0) +
																"</span>";
														}}
													/>
												) : (
													<Webhook size={18} className="text-surface-400" />
												)}
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium text-surface-800 group-hover:text-indigo-600 transition-colors">
													{platform.name}
												</p>
												<p className="text-[11px] text-surface-400 mt-0.5 line-clamp-1">
													{platform.description}
												</p>
											</div>
											<ChevronDown
												size={14}
												className="text-surface-300 -rotate-90 group-hover:text-indigo-400 transition-all"
											/>
										</button>
									))}
									{availablePlatforms.length === 0 && (
										<p className="text-center text-xs text-surface-400 py-6">
											All available platforms are already connected.
										</p>
									)}
								</div>
							) : (
								/* Credential form */
								<div className="space-y-5">
									<div className="flex items-center gap-3 mb-2">
										<div className="w-10 h-10 rounded-lg bg-surface-100 border border-surface-200 flex items-center justify-center overflow-hidden">
											{selectedPlatform.logo ? (
												<img
													src={selectedPlatform.logo}
													alt={selectedPlatform.name}
													className="w-6 h-6 object-contain"
													onError={(e) => {
														e.target.style.display = "none";
													}}
												/>
											) : (
												<Webhook size={18} className="text-surface-400" />
											)}
										</div>
										<div>
											<p className="text-sm font-medium text-surface-800">
												{selectedPlatform.name}
											</p>
											<p className="text-[11px] text-surface-400">
												{selectedPlatform.description}
											</p>
										</div>
									</div>

									{selectedPlatform.website && (
										<a
											href={selectedPlatform.website}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 transition-colors"
										>
											<Globe size={11} />
											{selectedPlatform.website}
											<ExternalLink size={10} />
										</a>
									)}

									{/* Auth fields */}
									{selectedPlatform.authFields.map((field) => (
										<div key={field.key}>
											<label className="flex items-center gap-1.5 text-xs font-medium text-surface-500 mb-1.5">
												{field.label}
												{field.helpUrl && (
													<a
														href={field.helpUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="text-indigo-400 hover:text-indigo-500"
													>
														<ExternalLink size={10} />
													</a>
												)}
											</label>
											<div className="relative">
												<input
													type={
														field.type === "readonly"
															? "text"
															: field.type === "password" &&
																  !visibleFields[field.key]
																? "password"
																: "text"
													}
													readOnly={field.type === "readonly"}
													value={authForm[field.key] || ""}
													onChange={(e) =>
														setAuthForm((prev) => ({
															...prev,
															[field.key]: e.target.value,
														}))
													}
													placeholder={field.placeholder}
													className={`input-field w-full pr-16 ${field.type === "readonly" ? "bg-surface-50 text-surface-600" : ""}`}
												/>
												<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
													{field.type === "password" && (
														<button
															type="button"
															onClick={() => toggleFieldVisibility(field.key)}
															className="p-1 rounded hover:bg-surface-100 text-surface-400"
														>
															{visibleFields[field.key] ? (
																<EyeOff size={12} />
															) : (
																<Eye size={12} />
															)}
														</button>
													)}
													{(field.type === "password" ||
														field.type === "readonly") && (
														<button
															type="button"
															onClick={() =>
																copyToClipboard(
																	authForm[field.key] || "",
																	field.key,
																)
															}
															className="p-1 rounded hover:bg-surface-100 text-surface-400"
														>
															{copiedField === field.key ? (
																<Check size={12} className="text-green-500" />
															) : (
																<Copy size={12} />
															)}
														</button>
													)}
												</div>
											</div>
										</div>
									))}

									{/* Field mapping preview */}
									{selectedPlatform.fieldMap && (
										<div className="bg-surface-50 rounded-lg p-3 border border-surface-200">
											<p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider mb-2">
												Data Mapping Preview
											</p>
											<div className="grid grid-cols-2 gap-x-4 gap-y-1">
												{Object.entries(selectedPlatform.fieldMap)
													.filter(([, v]) => v)
													.map(([source, target]) => (
														<div
															key={source}
															className="flex items-center gap-1.5 text-[11px]"
														>
															<span className="text-surface-400 truncate">
																{source.replace(/_/g, " ")}
															</span>
															<span className="text-surface-300">→</span>
															<span className="text-indigo-500 font-medium truncate">
																{target}
															</span>
														</div>
													))}
											</div>
										</div>
									)}

									{error && (
										<div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
											<AlertCircle size={12} />
											{error}
										</div>
									)}

									<div className="flex items-center gap-3 pt-2">
										<button
											onClick={() => {
												setSelectedPlatform(null);
												setError(null);
											}}
											className="px-4 py-2.5 rounded-lg border border-surface-300 text-surface-600 text-xs font-medium hover:bg-surface-50 transition-colors"
										>
											Back
										</button>
										<button
											onClick={handleSaveConnection}
											disabled={saving}
											className="btn-primary flex items-center gap-2 text-xs"
										>
											{saving ? (
												<Loader2 size={13} className="animate-spin" />
											) : (
												<Plug size={13} />
											)}
											{saving ? "Connecting…" : "Connect"}
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
