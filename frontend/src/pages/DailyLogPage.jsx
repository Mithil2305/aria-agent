import { useState, useEffect, useCallback, useMemo } from "react";
import {
	Calendar,
	DollarSign,
	Users,
	ShoppingCart,
	TrendingUp,
	TrendingDown,
	Megaphone,
	Package,
	Save,
	CheckCircle2,
	AlertCircle,
	Trash2,
	Upload,
	ChevronDown,
	ChevronUp,
	Loader2,
	FileSpreadsheet,
	Plus,
	Star,
	Truck,
	Globe,
	RotateCcw,
	ClipboardEdit,
	Armchair,
	Store,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
	collection,
	doc,
	addDoc,
	getDocs,
	deleteDoc,
	query,
	orderBy,
	limit,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import {
	getMetricFields,
	getBusinessCategory,
	getCategoryLabel,
} from "../config/businessTypes";

// Icon name string → Lucide component map
const ICON_MAP = {
	DollarSign,
	Users,
	ShoppingCart,
	TrendingUp,
	TrendingDown,
	Megaphone,
	Package,
	Save,
	Star,
	Truck,
	Globe,
	RotateCcw,
	ClipboardEdit,
	Armchair,
	AlertCircle,
	Trash2,
	Store,
};
function resolveIcon(iconName) {
	return ICON_MAP[iconName] || Package;
}

function todayISO() {
	return new Date().toISOString().split("T")[0];
}

export default function DailyLogPage() {
	const { user, userProfile } = useAuth();
	const [date, setDate] = useState(todayISO());
	const [formData, setFormData] = useState({});
	const [notes, setNotes] = useState("");
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState(null);
	const [logs, setLogs] = useState([]);
	const [loadingLogs, setLoadingLogs] = useState(true);
	const [showHistory, setShowHistory] = useState(true);
	const [csvUploading, setCsvUploading] = useState(false);

	// Dynamic fields based on business type
	const businessType = userProfile?.businessType || "";
	const category = getBusinessCategory(businessType);
	const categoryLabel = getCategoryLabel(businessType);
	const metricFields = useMemo(
		() => getMetricFields(businessType),
		[businessType],
	);

	// Load recent logs from Firestore
	const loadLogs = useCallback(async () => {
		if (!user) return;
		setLoadingLogs(true);
		try {
			const q = query(
				collection(db, "users", user.uid, "dailyLogs"),
				orderBy("date", "desc"),
				limit(30),
			);
			const snapshot = await getDocs(q);
			const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
			setLogs(data);
		} catch {
			// Silent fail
		} finally {
			setLoadingLogs(false);
		}
	}, [user]);

	useEffect(() => {
		loadLogs();
	}, [loadLogs]);

	const handleFieldChange = (key, value) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
		setSaved(false);
	};

	const handleSave = async () => {
		if (!user || !date) return;
		if (!formData.revenue && formData.revenue !== 0) {
			setError("Please enter at least your revenue for the day.");
			return;
		}

		setSaving(true);
		setError(null);
		try {
			// Clean values per field type
			const cleanData = {};
			for (const field of metricFields) {
				const val = formData[field.key];
				if (val !== undefined && val !== "") {
					if (field.type === "number") {
						cleanData[field.key] = Number(val);
					} else {
						cleanData[field.key] = val;
					}
				}
			}

			await addDoc(collection(db, "users", user.uid, "dailyLogs"), {
				date,
				...cleanData,
				notes: notes.trim() || null,
				businessType: businessType || null,
				businessCategory: category,
				createdAt: serverTimestamp(),
			});

			setSaved(true);
			setFormData({});
			setNotes("");
			setTimeout(() => setSaved(false), 3000);
			loadLogs();
		} catch {
			setError("Failed to save. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (logId) => {
		if (!user) return;
		try {
			await deleteDoc(doc(db, "users", user.uid, "dailyLogs", logId));
			setLogs((prev) => prev.filter((l) => l.id !== logId));
		} catch {
			// Silent fail
		}
	};

	const handleCSVUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file || !user) return;

		setCsvUploading(true);
		setError(null);

		try {
			const text = await file.text();
			const lines = text
				.split("\n")
				.map((l) => l.trim())
				.filter(Boolean);
			if (lines.length < 2) {
				setError("CSV file must have a header row and at least one data row.");
				return;
			}

			const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
			const dateIdx = headers.findIndex(
				(h) => h === "date" || h === "day" || h === "log_date",
			);
			if (dateIdx === -1) {
				setError('CSV must contain a "date" column (formats: YYYY-MM-DD).');
				return;
			}

			let imported = 0;
			for (let i = 1; i < lines.length; i++) {
				const cols = lines[i].split(",").map((c) => c.trim());
				const rowDate = cols[dateIdx];
				if (!rowDate) continue;

				const entry = {
					date: rowDate,
					businessType: businessType || null,
					businessCategory: category,
					createdAt: serverTimestamp(),
				};
				for (const field of metricFields) {
					const idx = headers.findIndex(
						(h) =>
							h === field.key.toLowerCase() ||
							h === field.label.toLowerCase() ||
							h.replace(/[\s_]/g, "") === field.key.toLowerCase(),
					);
					if (idx !== -1 && cols[idx]) {
						if (field.type === "number") {
							const val = Number(cols[idx].replace(/[^0-9.-]/g, ""));
							if (!isNaN(val)) entry[field.key] = val;
						} else {
							entry[field.key] = cols[idx];
						}
					}
				}

				const notesIdx = headers.findIndex(
					(h) => h === "notes" || h === "note",
				);
				if (notesIdx !== -1 && cols[notesIdx]) {
					entry.notes = cols[notesIdx];
				}

				await addDoc(collection(db, "users", user.uid, "dailyLogs"), entry);
				imported++;
			}

			if (imported === 0) {
				setError("No valid rows found in CSV.");
			} else {
				setSaved(true);
				setTimeout(() => setSaved(false), 3000);
				loadLogs();
			}
		} catch {
			setError("Failed to parse CSV file.");
		} finally {
			setCsvUploading(false);
			e.target.value = "";
		}
	};

	return (
		<div className="min-h-screen py-10 px-6">
			<div className="max-w-4xl mx-auto">
				{/* Page header */}
				<div className="mb-8">
					<h1 className="text-xl font-semibold text-surface-900 mb-1 flex items-center gap-3">
						<div className="p-2 rounded-lg bg-gold-50">
							<Calendar size={20} className="text-gold-600" />
						</div>
						Daily Business Log
					</h1>
					<p className="text-sm text-surface-500 ml-12">
						Track your daily metrics to build powerful trend insights over time.
					</p>
				</div>

				{/* Business type badge */}
				{businessType && (
					<div className="mb-4 flex items-center gap-2">
						<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-medium">
							<Store size={12} />
							{categoryLabel}
						</span>
						<span className="text-[11px] text-surface-400">
							Fields customized for your business type
						</span>
					</div>
				)}

				{/* No business type warning */}
				{!businessType && (
					<div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
						<AlertCircle size={14} className="text-amber-600 shrink-0" />
						<p className="text-sm text-amber-700">
							Set your business type in{" "}
							<a href="/profile" className="underline font-medium">
								Profile Settings
							</a>{" "}
							to get customized log fields for your industry.
						</p>
					</div>
				)}

				{/* ── Entry Form ── */}
				<div className="card-elevated p-6 mb-6">
					{/* Date picker */}
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
						<div className="flex-1">
							<label className="block text-xs font-medium text-surface-400 mb-1.5">
								Log Date
							</label>
							<input
								type="date"
								value={date}
								onChange={(e) => {
									setDate(e.target.value);
									setSaved(false);
								}}
								max={todayISO()}
								className="input-field w-full sm:w-auto"
							/>
						</div>
						{/* CSV Upload */}
						<div>
							<label className="block text-xs font-medium text-surface-400 mb-1.5">
								Or Import CSV
							</label>
							<label className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-100 border border-surface-300 text-surface-600 text-xs font-medium cursor-pointer hover:border-gold-200 transition-all">
								{csvUploading ? (
									<Loader2 size={14} className="animate-spin" />
								) : (
									<FileSpreadsheet size={14} />
								)}
								{csvUploading ? "Importing…" : "Upload CSV"}
								<input
									type="file"
									accept=".csv"
									onChange={handleCSVUpload}
									className="hidden"
								/>
							</label>
						</div>
					</div>

					{/* Metric fields — dynamic per business type */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
						{metricFields.map((field) => {
							const Icon = resolveIcon(field.icon);
							return (
								<div key={field.key}>
									<label className="flex items-center gap-1.5 text-xs font-medium text-surface-400 mb-1.5">
										<Icon
											size={12}
											strokeWidth={1.5}
											className="text-surface-500"
										/>
										{field.label}
										{field.required && <span className="text-red-500">*</span>}
									</label>
									<div className="relative">
										{field.prefix && (
											<span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">
												{field.prefix}
											</span>
										)}
										{field.type === "text" ? (
											<input
												type="text"
												placeholder={field.placeholder}
												value={formData[field.key] ?? ""}
												onChange={(e) =>
													handleFieldChange(field.key, e.target.value)
												}
												className="input-field w-full"
											/>
										) : (
											<input
												type="number"
												min="0"
												step="any"
												placeholder={field.placeholder}
												value={formData[field.key] ?? ""}
												onChange={(e) =>
													handleFieldChange(field.key, e.target.value)
												}
												className={`input-field w-full ${field.prefix ? "pl-7" : ""}`}
											/>
										)}
									</div>
								</div>
							);
						})}
					</div>

					{/* Notes */}
					<div className="mb-6">
						<label className="block text-xs font-medium text-surface-400 mb-1.5">
							Notes (optional)
						</label>
						<textarea
							rows={2}
							placeholder="Anything notable today? Promotions, events, weather…"
							value={notes}
							onChange={(e) => {
								setNotes(e.target.value);
								setSaved(false);
							}}
							className="input-field w-full resize-none"
						/>
					</div>

					{/* Error */}
					{error && (
						<div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm mb-4">
							<AlertCircle size={14} />
							{error}
						</div>
					)}

					{/* Save button */}
					<div className="flex items-center gap-3">
						<button
							onClick={handleSave}
							disabled={saving}
							className="btn-primary flex items-center gap-2"
						>
							{saving ? (
								<Loader2 size={15} className="animate-spin" />
							) : (
								<Save size={15} />
							)}
							{saving ? "Saving…" : "Save Log Entry"}
						</button>
						{saved && (
							<span className="flex items-center gap-1.5 text-green-600 text-sm font-medium animate-fade-in-up">
								<CheckCircle2 size={15} /> Saved successfully!
							</span>
						)}
					</div>
				</div>

				{/* ── Log History ── */}
				<div className="card overflow-hidden">
					<button
						onClick={() => setShowHistory(!showHistory)}
						className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-50 transition-colors"
					>
						<div className="flex items-center gap-2">
							<h2 className="text-sm font-medium text-surface-900">
								Recent Entries
							</h2>
							<span className="px-2 py-0.5 rounded-full bg-surface-100 text-surface-500 text-[10px] font-bold">
								{logs.length}
							</span>
						</div>
						{showHistory ? (
							<ChevronUp size={16} className="text-surface-500" />
						) : (
							<ChevronDown size={16} className="text-surface-500" />
						)}
					</button>

					{showHistory && (
						<div className="border-t border-surface-300">
							{loadingLogs ? (
								<div className="flex items-center justify-center py-12">
									<Loader2 size={20} className="text-gold-600 animate-spin" />
								</div>
							) : logs.length === 0 ? (
								<div className="text-center py-12">
									<Plus size={24} className="text-surface-600 mx-auto mb-2" />
									<p className="text-sm text-surface-500">
										No entries yet. Start logging today!
									</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-surface-300">
												<th className="text-left px-6 py-3 text-xs font-medium text-surface-500">
													Date
												</th>
												{metricFields
													.filter((f) => f.type === "number")
													.slice(0, 5)
													.map((col) => (
														<th
															key={col.key}
															className="text-right px-4 py-3 text-xs font-medium text-surface-500 hidden sm:table-cell"
														>
															{col.label}
														</th>
													))}
												<th className="px-4 py-3 text-xs font-medium text-surface-500">
													Notes
												</th>
												<th className="px-4 py-3"></th>
											</tr>
										</thead>
										<tbody>
											{logs.map((log) => (
												<tr
													key={log.id}
													className="border-b border-surface-200 hover:bg-surface-50 transition-colors"
												>
													<td className="px-6 py-3 text-surface-900 font-medium whitespace-nowrap">
														{log.date}
													</td>
													{metricFields
														.filter((f) => f.type === "number")
														.slice(0, 5)
														.map((col) => (
															<td
																key={col.key}
																className="text-right px-4 py-3 text-surface-600 hidden sm:table-cell"
															>
																{log[col.key] != null
																	? col.prefix
																		? `${col.prefix}${Number(log[col.key]).toLocaleString()}`
																		: Number(log[col.key]).toLocaleString()
																	: "—"}
															</td>
														))}
													<td className="px-4 py-3 text-surface-500 text-xs max-w-30 truncate">
														{log.notes || "—"}
													</td>
													<td className="px-4 py-3">
														<button
															onClick={() => handleDelete(log.id)}
															className="p-1.5 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500 transition-all"
															title="Delete entry"
														>
															<Trash2 size={13} />
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					)}
				</div>

				{/* CSV format hint */}
				<div className="mt-6 card p-4">
					<h3 className="text-xs font-medium text-surface-400 mb-2">
						CSV Import Format
					</h3>
					<p className="text-[11px] text-surface-500 font-mono leading-relaxed">
						date,{" "}
						{metricFields
							.filter((f) => f.type === "number")
							.map((f) => f.key)
							.join(", ")}
						, notes
						<br />
						2025-01-15,{" "}
						{metricFields
							.filter((f) => f.type === "number")
							.map(() => "0")
							.join(", ")}
						, &quot;Notes here&quot;
					</p>
				</div>
			</div>
		</div>
	);
}
