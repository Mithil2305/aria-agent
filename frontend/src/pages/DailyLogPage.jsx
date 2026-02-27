import { useState, useEffect, useCallback } from "react";
import {
	Calendar,
	DollarSign,
	Users,
	ShoppingCart,
	TrendingUp,
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
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
	collection,
	doc,
	setDoc,
	getDocs,
	deleteDoc,
	query,
	orderBy,
	limit,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const METRIC_FIELDS = [
	{
		key: "revenue",
		label: "Revenue",
		icon: DollarSign,
		placeholder: "e.g. 4500",
		prefix: "$",
		type: "number",
		color: "text-emerald-400",
		bg: "bg-emerald-500/10",
		required: true,
	},
	{
		key: "customers",
		label: "Customers Served",
		icon: Users,
		placeholder: "e.g. 120",
		type: "number",
		color: "text-brand-400",
		bg: "bg-brand-500/10",
		required: false,
	},
	{
		key: "orders",
		label: "Orders / Transactions",
		icon: ShoppingCart,
		placeholder: "e.g. 85",
		type: "number",
		color: "text-violet-400",
		bg: "bg-violet-500/10",
		required: false,
	},
	{
		key: "expenses",
		label: "Total Expenses",
		icon: TrendingUp,
		placeholder: "e.g. 2200",
		prefix: "$",
		type: "number",
		color: "text-rose-400",
		bg: "bg-rose-500/10",
		required: false,
	},
	{
		key: "marketingSpend",
		label: "Marketing Spend",
		icon: Megaphone,
		placeholder: "e.g. 500",
		prefix: "$",
		type: "number",
		color: "text-amber-400",
		bg: "bg-amber-500/10",
		required: false,
	},
	{
		key: "inventory",
		label: "Inventory Count",
		icon: Package,
		placeholder: "e.g. 340",
		type: "number",
		color: "text-cyan-400",
		bg: "bg-cyan-500/10",
		required: false,
	},
];

function todayISO() {
	return new Date().toISOString().split("T")[0];
}

export default function DailyLogPage() {
	const { user } = useAuth();
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
			// Numeric values
			const cleanData = {};
			for (const field of METRIC_FIELDS) {
				const val = formData[field.key];
				if (val !== undefined && val !== "") {
					cleanData[field.key] = Number(val);
				}
			}

			await setDoc(doc(db, "users", user.uid, "dailyLogs", date), {
				date,
				...cleanData,
				notes: notes.trim() || null,
				updatedAt: serverTimestamp(),
			});

			setSaved(true);
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

				const entry = { date: rowDate, updatedAt: serverTimestamp() };
				for (const field of METRIC_FIELDS) {
					const idx = headers.findIndex(
						(h) =>
							h === field.key.toLowerCase() ||
							h === field.label.toLowerCase() ||
							h.replace(/[\s_]/g, "") === field.key.toLowerCase(),
					);
					if (idx !== -1 && cols[idx]) {
						const val = Number(cols[idx].replace(/[^0-9.-]/g, ""));
						if (!isNaN(val)) entry[field.key] = val;
					}
				}

				const notesIdx = headers.findIndex(
					(h) => h === "notes" || h === "note",
				);
				if (notesIdx !== -1 && cols[notesIdx]) {
					entry.notes = cols[notesIdx];
				}

				await setDoc(doc(db, "users", user.uid, "dailyLogs", rowDate), entry);
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
		<div className="min-h-screen py-8 px-4">
			<div className="max-w-4xl mx-auto">
				{/* Page header */}
				<div className="mb-8">
					<h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
						<div className="p-2 rounded-xl bg-emerald-500/10">
							<Calendar size={22} className="text-emerald-400" />
						</div>
						Daily Business Log
					</h1>
					<p className="text-sm text-slate-400 ml-12">
						Track your daily metrics to build powerful trend insights over time.
					</p>
				</div>

				{/* ── Entry Form ── */}
				<div className="glass rounded-2xl p-6 mb-6">
					{/* Date picker */}
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
						<div className="flex-1">
							<label className="block text-xs font-medium text-slate-400 mb-1.5">
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
								className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
							/>
						</div>
						{/* CSV Upload */}
						<div>
							<label className="block text-xs font-medium text-slate-400 mb-1.5">
								Or Import CSV
							</label>
							<label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs font-medium cursor-pointer hover:border-brand-500/30 transition-all">
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

					{/* Metric fields */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
						{METRIC_FIELDS.map((field) => {
							const Icon = field.icon;
							return (
								<div key={field.key}>
									<label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
										<Icon size={12} className={field.color} />
										{field.label}
										{field.required && <span className="text-rose-400">*</span>}
									</label>
									<div className="relative">
										{field.prefix && (
											<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
												{field.prefix}
											</span>
										)}
										<input
											type="number"
											min="0"
											step="any"
											placeholder={field.placeholder}
											value={formData[field.key] ?? ""}
											onChange={(e) =>
												handleFieldChange(field.key, e.target.value)
											}
											className={`w-full ${field.prefix ? "pl-7" : "pl-3"} pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all`}
										/>
									</div>
								</div>
							);
						})}
					</div>

					{/* Notes */}
					<div className="mb-6">
						<label className="block text-xs font-medium text-slate-400 mb-1.5">
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
							className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all resize-none"
						/>
					</div>

					{/* Error */}
					{error && (
						<div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm mb-4">
							<AlertCircle size={14} />
							{error}
						</div>
					)}

					{/* Save button */}
					<div className="flex items-center gap-3">
						<button
							onClick={handleSave}
							disabled={saving}
							className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-lg shadow-brand-600/20"
						>
							{saving ? (
								<Loader2 size={16} className="animate-spin" />
							) : (
								<Save size={16} />
							)}
							{saving ? "Saving…" : "Save Log Entry"}
						</button>
						{saved && (
							<span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium animate-fade-in-up">
								<CheckCircle2 size={16} /> Saved successfully!
							</span>
						)}
					</div>
				</div>

				{/* ── Log History ── */}
				<div className="glass rounded-2xl overflow-hidden">
					<button
						onClick={() => setShowHistory(!showHistory)}
						className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/20 transition-colors"
					>
						<div className="flex items-center gap-2">
							<h2 className="text-sm font-semibold text-white">
								Recent Entries
							</h2>
							<span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 text-[10px] font-bold">
								{logs.length}
							</span>
						</div>
						{showHistory ? (
							<ChevronUp size={16} className="text-slate-500" />
						) : (
							<ChevronDown size={16} className="text-slate-500" />
						)}
					</button>

					{showHistory && (
						<div className="border-t border-slate-800/50">
							{loadingLogs ? (
								<div className="flex items-center justify-center py-12">
									<Loader2 size={20} className="text-brand-400 animate-spin" />
								</div>
							) : logs.length === 0 ? (
								<div className="text-center py-12">
									<Plus size={24} className="text-slate-600 mx-auto mb-2" />
									<p className="text-sm text-slate-500">
										No entries yet. Start logging today!
									</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-slate-800/50">
												<th className="text-left px-6 py-3 text-xs font-medium text-slate-500">
													Date
												</th>
												<th className="text-right px-4 py-3 text-xs font-medium text-slate-500">
													Revenue
												</th>
												<th className="text-right px-4 py-3 text-xs font-medium text-slate-500 hidden sm:table-cell">
													Customers
												</th>
												<th className="text-right px-4 py-3 text-xs font-medium text-slate-500 hidden md:table-cell">
													Orders
												</th>
												<th className="text-right px-4 py-3 text-xs font-medium text-slate-500 hidden lg:table-cell">
													Expenses
												</th>
												<th className="text-right px-4 py-3 text-xs font-medium text-slate-500 hidden lg:table-cell">
													Marketing
												</th>
												<th className="px-4 py-3 text-xs font-medium text-slate-500">
													Notes
												</th>
												<th className="px-4 py-3"></th>
											</tr>
										</thead>
										<tbody>
											{logs.map((log) => (
												<tr
													key={log.id}
													className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors"
												>
													<td className="px-6 py-3 text-white font-medium whitespace-nowrap">
														{log.date}
													</td>
													<td className="text-right px-4 py-3 text-emerald-400 font-medium">
														{log.revenue != null
															? `$${Number(log.revenue).toLocaleString()}`
															: "—"}
													</td>
													<td className="text-right px-4 py-3 text-slate-300 hidden sm:table-cell">
														{log.customers ?? "—"}
													</td>
													<td className="text-right px-4 py-3 text-slate-300 hidden md:table-cell">
														{log.orders ?? "—"}
													</td>
													<td className="text-right px-4 py-3 text-rose-400 hidden lg:table-cell">
														{log.expenses != null
															? `$${Number(log.expenses).toLocaleString()}`
															: "—"}
													</td>
													<td className="text-right px-4 py-3 text-amber-400 hidden lg:table-cell">
														{log.marketingSpend != null
															? `$${Number(log.marketingSpend).toLocaleString()}`
															: "—"}
													</td>
													<td className="px-4 py-3 text-slate-500 text-xs max-w-[120px] truncate">
														{log.notes || "—"}
													</td>
													<td className="px-4 py-3">
														<button
															onClick={() => handleDelete(log.id)}
															className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-600 hover:text-rose-400 transition-all"
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
				<div className="mt-6 glass rounded-xl p-4">
					<h3 className="text-xs font-semibold text-slate-400 mb-2">
						CSV Import Format
					</h3>
					<p className="text-[11px] text-slate-500 font-mono leading-relaxed">
						date, revenue, customers, orders, expenses, marketingSpend,
						inventory, notes
						<br />
						2025-01-15, 4500, 120, 85, 2200, 500, 340, "Big sale day"
					</p>
				</div>
			</div>
		</div>
	);
}
