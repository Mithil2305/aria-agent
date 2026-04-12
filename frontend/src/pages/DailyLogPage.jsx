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
	Pencil,
	X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
	collection,
	doc,
	addDoc,
	getDocs,
	updateDoc,
	deleteDoc,
	query,
	orderBy,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import {
	getMetricFields,
	getBusinessCategory,
	getCategoryLabel,
} from "../config/businessTypes";
import { applyCurrencyPrefix, formatCurrency } from "../utils/currency";
import { useAnalysisJob } from "../contexts/AnalysisJobContext";

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
const QUICK_FIELD_KEYS = ["revenue", "expenses", "customers", "orders"];

function resolveIcon(iconName) {
	return ICON_MAP[iconName] || Package;
}

function todayISO() {
	return new Date().toISOString().split("T")[0];
}

function monthKey(dateStr) {
	if (!dateStr || typeof dateStr !== "string") return "";
	return dateStr.slice(0, 7);
}

function monthLabel(key) {
	if (!key || key.length !== 7) return "Unknown";
	const [y, m] = key.split("-");
	const dt = new Date(Number(y), Number(m) - 1, 1);
	if (Number.isNaN(dt.getTime())) return key;
	return dt.toLocaleDateString("en-IN", {
		month: "long",
		year: "numeric",
	});
}

export default function DailyLogPage() {
	const { user, userProfile } = useAuth();
	const { startActivity, updateActivityProgress, completeActivity } =
		useAnalysisJob();
	const [date, setDate] = useState(todayISO());
	const [formData, setFormData] = useState({});
	const [notes, setNotes] = useState("");
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState(null);
	const [logs, setLogs] = useState([]);
	const [loadingLogs, setLoadingLogs] = useState(true);
	const [csvUploading, setCsvUploading] = useState(false);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [editingLogId, setEditingLogId] = useState(null);
	const [selectedMonth, setSelectedMonth] = useState(monthKey(todayISO()));

	// Dynamic fields based on business type
	const businessType = userProfile?.businessType || "";
	const currencyCode = userProfile?.currency || "INR";
	const category = getBusinessCategory(businessType);
	const categoryLabel = getCategoryLabel(businessType);
	const metricFields = useMemo(() => {
		const fields = getMetricFields(businessType);
		return applyCurrencyPrefix(fields, currencyCode);
	}, [businessType, currencyCode]);
	const numericFields = useMemo(
		() => metricFields.filter((f) => f.type === "number"),
		[metricFields],
	);
	const quickFields = useMemo(
		() => metricFields.filter((f) => QUICK_FIELD_KEYS.includes(f.key)),
		[metricFields],
	);
	const advancedFields = useMemo(
		() => metricFields.filter((f) => !QUICK_FIELD_KEYS.includes(f.key)),
		[metricFields],
	);

	// Load recent logs from Firestore
	const loadLogs = useCallback(async () => {
		if (!user) return;
		setLoadingLogs(true);
		try {
			const q = query(
				collection(db, "users", user.uid, "dailyLogs"),
				orderBy("date", "desc"),
			);
			const snapshot = await getDocs(q);
			const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
			setLogs(data);
			if (data.length > 0) {
				setSelectedMonth((prev) => prev || monthKey(data[0].date));
			}
		} catch (err) {
			setError(
				toFirestoreErrorMessage(
					err,
					"Could not load daily logs from Firestore.",
				),
			);
		} finally {
			setLoadingLogs(false);
		}
	}, [user]);

	useEffect(() => {
		loadLogs();
	}, [loadLogs]);

	const monthOptions = useMemo(() => {
		const set = new Set();
		for (const log of logs) {
			const key = monthKey(log.date);
			if (key) set.add(key);
		}
		return Array.from(set).sort((a, b) => b.localeCompare(a));
	}, [logs]);

	const filteredLogs = useMemo(() => {
		if (!selectedMonth || selectedMonth === "all") return logs;
		return logs.filter((log) => monthKey(log.date) === selectedMonth);
	}, [logs, selectedMonth]);

	const handleFieldChange = (key, value) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
		setSaved(false);
	};

	const resetForm = () => {
		setEditingLogId(null);
		setDate(todayISO());
		setFormData({});
		setNotes("");
		setShowAdvanced(false);
	};

	const handleEdit = (log) => {
		const next = {};
		for (const field of metricFields) {
			if (log[field.key] !== undefined && log[field.key] !== null) {
				next[field.key] = String(log[field.key]);
			}
		}
		setEditingLogId(log.id);
		setDate(log.date || todayISO());
		setFormData(next);
		setNotes(log.notes || "");
		setShowAdvanced(true);
		setError(null);
		setSaved(false);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const applyLastLogTemplate = () => {
		if (logs.length === 0) return;
		const latest = logs[0];
		const next = {};
		for (const field of metricFields) {
			if (latest[field.key] !== undefined && latest[field.key] !== null) {
				next[field.key] = String(latest[field.key]);
			}
		}
		setFormData(next);
		setNotes("");
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

			const payload = {
				date,
				...cleanData,
				notes: notes.trim() || null,
				businessType: businessType || null,
				businessCategory: category,
			};

			if (editingLogId) {
				await updateDoc(doc(db, "users", user.uid, "dailyLogs", editingLogId), {
					...payload,
					updatedAt: serverTimestamp(),
				});
			} else {
				await addDoc(collection(db, "users", user.uid, "dailyLogs"), {
					...payload,
					createdAt: serverTimestamp(),
				});
			}

			setSaved(true);
			resetForm();
			setTimeout(() => setSaved(false), 3000);
			loadLogs();
		} catch (err) {
			setError(
				toFirestoreErrorMessage(
					err,
					editingLogId
						? "Failed to update entry."
						: "Failed to save. Please try again.",
				),
			);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (logId) => {
		if (!user) return;
		try {
			await deleteDoc(doc(db, "users", user.uid, "dailyLogs", logId));
			setLogs((prev) => prev.filter((l) => l.id !== logId));
		} catch (err) {
			setError(toFirestoreErrorMessage(err, "Failed to delete this entry."));
		}
	};

	const handleCSVUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file || !user) return;

		setCsvUploading(true);
		setError(null);
		const importActivityId = startActivity({
			type: "upload",
			label: "CSV Import",
			message: "Importing daily log CSV in background",
			fileName: file.name,
			durationMs: 45000,
			progressCap: 90,
		});

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
				if (imported % 2 === 0 || i === lines.length - 1) {
					const ratio = i / Math.max(lines.length - 1, 1);
					const progress = Math.min(95, 10 + ratio * 85);
					updateActivityProgress(
						importActivityId,
						progress,
						`Imported ${imported} of ${lines.length - 1} rows`,
					);
				}
			}

			if (imported === 0) {
				completeActivity(importActivityId, {
					status: "error",
					message: "CSV import failed",
					error: "No valid rows found in CSV.",
					forceProgress: 100,
				});
				setError("No valid rows found in CSV.");
			} else {
				completeActivity(importActivityId, {
					status: "success",
					message: "CSV imported successfully",
					forceProgress: 100,
				});
				setSaved(true);
				setTimeout(() => setSaved(false), 3000);
				loadLogs();
			}
		} catch (err) {
			completeActivity(importActivityId, {
				status: "error",
				message: "CSV import failed",
				error: toFirestoreErrorMessage(
					err,
					"Failed to parse or import CSV file.",
				),
				forceProgress: 100,
			});
			setError(
				toFirestoreErrorMessage(err, "Failed to parse or import CSV file."),
			);
		} finally {
			setCsvUploading(false);
			e.target.value = "";
		}
	};

	return (
		<div className="app-page">
			<div className="app-page-inner max-w-5xl mx-auto">
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

				<div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
					<div className="xl:col-span-5 space-y-5">
						{/* Rapid Entry Form */}
						<div className="card-elevated p-5 sm:p-6">
							<div className="flex items-start justify-between gap-4 mb-5">
								<div>
									<h2 className="text-sm font-semibold text-surface-900">
										{editingLogId ? "Edit Log Entry" : "Quick Daily Entry"}
									</h2>
									<p className="text-xs text-surface-500 mt-0.5">
										Fast fields first so you can log in under a minute.
									</p>
								</div>
								<div className="flex items-center gap-2">
									{logs.length > 0 && !editingLogId && (
										<button
											onClick={applyLastLogTemplate}
											className="px-3 py-1.5 rounded-lg border border-surface-300 bg-surface-50 text-surface-600 text-xs font-medium hover:bg-surface-100"
										>
											Use Last Entry
										</button>
									)}
									{editingLogId && (
										<button
											onClick={resetForm}
											className="px-3 py-1.5 rounded-lg border border-surface-300 bg-white text-surface-600 text-xs font-medium hover:bg-surface-50"
										>
											Cancel Edit
										</button>
									)}
								</div>
							</div>

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

							{/* Quick metrics */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
								{quickFields.map((field) => {
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
												{field.required && (
													<span className="text-red-500">*</span>
												)}
											</label>
											<div className="relative">
												{field.prefix && (
													<span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">
														{field.prefix}
													</span>
												)}
												<input
													type="number"
													inputMode="decimal"
													min="0"
													step="any"
													placeholder={field.placeholder}
													value={formData[field.key] ?? ""}
													onChange={(e) =>
														handleFieldChange(field.key, e.target.value)
													}
													className={`input-field w-full ${field.prefix ? "pl-7" : ""}`}
												/>
											</div>
										</div>
									);
								})}
							</div>

							{advancedFields.length > 0 && (
								<div className="mb-5">
									<button
										type="button"
										onClick={() => setShowAdvanced((s) => !s)}
										className="text-xs font-medium text-indigo-600 hover:underline"
									>
										{showAdvanced
											? "Hide extra fields"
											: "Add more details (optional)"}
									</button>
								</div>
							)}

							{showAdvanced && advancedFields.length > 0 && (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
									{advancedFields.map((field) => {
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
															inputMode="decimal"
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
							)}

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
									{saving
										? editingLogId
											? "Updating…"
											: "Saving…"
										: editingLogId
											? "Update Entry"
											: "Save Log Entry"}
								</button>
								{editingLogId && (
									<button
										onClick={resetForm}
										className="btn-secondary flex items-center gap-1.5"
									>
										<X size={14} /> Cancel
									</button>
								)}
								{saved && (
									<span className="flex items-center gap-1.5 text-green-600 text-sm font-medium animate-fade-in-up">
										<CheckCircle2 size={15} /> Saved successfully!
									</span>
								)}
							</div>
						</div>

						{/* CSV format hint */}
						<div className="card p-4">
							<h3 className="text-xs font-medium text-surface-400 mb-2">
								CSV Import Format
							</h3>
							<p className="text-[11px] text-surface-500 font-mono leading-relaxed">
								date, {numericFields.map((f) => f.key).join(", ")}
								, notes
								<br />
								2025-01-15, {numericFields.map(() => "0").join(", ")},
								&quot;Notes here&quot;
							</p>
						</div>
					</div>

					{/* Month-wise complete logs with edit */}
					<div className="xl:col-span-7 card p-5">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
							<div>
								<h2 className="text-sm font-semibold text-surface-900">
									Monthly Log History
								</h2>
								<p className="text-xs text-surface-500 mt-0.5">
									Filter by month and edit any entry quickly.
								</p>
							</div>
							<div className="flex items-center gap-2">
								<label className="text-xs text-surface-500">Month</label>
								<select
									value={selectedMonth || "all"}
									onChange={(e) => setSelectedMonth(e.target.value)}
									className="input-field text-sm py-2"
								>
									<option value="all">All months</option>
									{monthOptions.map((key) => (
										<option key={key} value={key}>
											{monthLabel(key)}
										</option>
									))}
								</select>
							</div>
						</div>

						{loadingLogs ? (
							<div className="flex items-center justify-center py-10">
								<Loader2 size={20} className="text-gold-600 animate-spin" />
							</div>
						) : filteredLogs.length === 0 ? (
							<div className="text-center py-10">
								<Plus size={24} className="text-surface-600 mx-auto mb-2" />
								<p className="text-sm text-surface-500">
									No logs for this month.
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{filteredLogs.map((log) => (
									<div
										key={log.id}
										className="rounded-xl border border-surface-300 bg-white p-4"
									>
										<div className="flex flex-wrap items-center justify-between gap-2 mb-3">
											<div className="flex items-center gap-2">
												<span className="text-sm font-semibold text-surface-900">
													{log.date}
												</span>
												{log.source && (
													<span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-500 text-[10px] font-semibold uppercase tracking-wide">
														via {log.source}
													</span>
												)}
											</div>
											<div className="flex items-center gap-1">
												<button
													onClick={() => handleEdit(log)}
													className="p-2 rounded-lg hover:bg-indigo-50 text-surface-500 hover:text-indigo-600 transition-colors"
													title="Edit entry"
												>
													<Pencil size={14} />
												</button>
												<button
													onClick={() => handleDelete(log.id)}
													className="p-2 rounded-lg hover:bg-red-50 text-surface-500 hover:text-red-500 transition-colors"
													title="Delete entry"
												>
													<Trash2 size={14} />
												</button>
											</div>
										</div>

										<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
											{metricFields.map((field) => {
												const value = log[field.key];
												if (
													value === undefined ||
													value === null ||
													value === ""
												) {
													return null;
												}
												return (
													<div
														key={field.key}
														className="px-2.5 py-2 rounded-lg bg-surface-50 border border-surface-200"
													>
														<p className="text-[10px] text-surface-400 font-medium truncate">
															{field.label}
														</p>
														<p className="text-xs text-surface-700 font-semibold mt-0.5 truncate">
															{field.prefix
																? formatCurrency(value, currencyCode)
																: typeof value === "number"
																	? value.toLocaleString("en-IN")
																	: String(value)}
														</p>
													</div>
												);
											})}
										</div>

										{log.notes && (
											<p className="mt-3 text-xs text-surface-600 leading-relaxed">
												<span className="font-medium text-surface-500">
													Notes:
												</span>{" "}
												{log.notes}
											</p>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
