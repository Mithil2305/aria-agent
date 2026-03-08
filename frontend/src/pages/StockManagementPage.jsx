import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
	Package,
	Plus,
	Trash2,
	Save,
	CheckCircle2,
	AlertCircle,
	Loader2,
	ChevronDown,
	ChevronUp,
	TrendingUp,
	TrendingDown,
	ArrowUpDown,
	Calendar,
	Camera,
	Upload,
	ScanLine,
	ImageIcon,
	X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
	collection,
	addDoc,
	getDocs,
	deleteDoc,
	doc,
	query,
	orderBy,
	limit,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import {
	STOCK_CATEGORIES,
	getBusinessCategory,
	getCategoryLabel,
	needsStockManagement,
} from "../config/businessTypes";
import { useNavigate } from "react-router-dom";
import { scanBillImage } from "../services/api";

function getCurrentMonth() {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function StockManagementPage() {
	const { user, userProfile } = useAuth();
	const navigate = useNavigate();

	const businessType = userProfile?.businessType || "";
	const category = getBusinessCategory(businessType);
	const categoryLabel = getCategoryLabel(businessType);
	const categories = STOCK_CATEGORIES[category] || [];

	const [month, setMonth] = useState(getCurrentMonth());
	const [entries, setEntries] = useState([]);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState(null);
	const [history, setHistory] = useState([]);
	const [loadingHistory, setLoadingHistory] = useState(true);
	const [showHistory, setShowHistory] = useState(true);

	// Bill scanner state
	const [billFile, setBillFile] = useState(null);
	const [billPreview, setBillPreview] = useState(null);
	const [scanning, setScanning] = useState(false);
	const [scanResult, setScanResult] = useState(null);
	const [showScanner, setShowScanner] = useState(true);
	const fileInputRef = useRef(null);
	const dropZoneRef = useRef(null);

	// Redirect if business type doesn't need stock management
	useEffect(() => {
		if (userProfile && !needsStockManagement(businessType)) {
			navigate("/daily-log");
		}
	}, [userProfile, businessType, navigate]);

	// New blank entry row
	const addEntry = () => {
		setEntries((prev) => [
			...prev,
			{
				id: Date.now(),
				productName: "",
				category: categories[0] || "",
				stockIn: "",
				stockOut: "",
				unitCost: "",
				unit: "units",
			},
		]);
		setSaved(false);
	};

	// ── Bill Scanner Functions ──
	const handleBillFileSelect = (file) => {
		if (!file) return;
		const allowed = [
			"image/jpeg",
			"image/png",
			"image/webp",
			"image/gif",
			"image/bmp",
		];
		if (!allowed.includes(file.type)) {
			setError("Please upload a JPG, PNG, or WEBP image.");
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			setError("Image too large. Maximum 10 MB.");
			return;
		}
		setBillFile(file);
		setBillPreview(URL.createObjectURL(file));
		setScanResult(null);
		setError(null);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		dropZoneRef.current?.classList.remove("border-indigo-400", "bg-indigo-50");
		const file = e.dataTransfer?.files?.[0];
		if (file) handleBillFileSelect(file);
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		e.stopPropagation();
		dropZoneRef.current?.classList.add("border-indigo-400", "bg-indigo-50");
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		e.stopPropagation();
		dropZoneRef.current?.classList.remove("border-indigo-400", "bg-indigo-50");
	};

	const clearBillFile = () => {
		if (billPreview) URL.revokeObjectURL(billPreview);
		setBillFile(null);
		setBillPreview(null);
		setScanResult(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleScanBill = async () => {
		if (!billFile || !user) return;
		setScanning(true);
		setError(null);
		setScanResult(null);

		try {
			const token = await user.getIdToken();
			const result = await scanBillImage(billFile, token, user?.uid);

			setScanResult(result);

			if (result.items && result.items.length > 0) {
				// Auto-populate entries from scanned items
				const scannedEntries = result.items.map((item, idx) => ({
					id: Date.now() + idx,
					productName: item.productName || "",
					category: categories.includes(item.category)
						? item.category
						: categories[0] || "",
					stockIn: item.quantity || "",
					stockOut: "",
					unitCost: item.unitCost || "",
					unit: item.unit || "units",
				}));
				setEntries((prev) => [...prev, ...scannedEntries]);
				setSaved(false);
			}
		} catch (err) {
			const msg =
				err?.response?.data?.detail || "Failed to scan bill. Please try again.";
			setError(msg);
		} finally {
			setScanning(false);
		}
	};

	const updateEntry = (id, field, value) => {
		setEntries((prev) =>
			prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
		);
		setSaved(false);
	};

	const removeEntry = (id) => {
		setEntries((prev) => prev.filter((e) => e.id !== id));
	};

	// Load history from Firestore
	const loadHistory = useCallback(async () => {
		if (!user) return;
		setLoadingHistory(true);
		try {
			const q = query(
				collection(db, "users", user.uid, "stockEntries"),
				orderBy("month", "desc"),
				limit(50),
			);
			const snapshot = await getDocs(q);
			const data = snapshot.docs.map((d) => ({ docId: d.id, ...d.data() }));
			setHistory(data);
		} catch {
			// Silent fail
		} finally {
			setLoadingHistory(false);
		}
	}, [user]);

	useEffect(() => {
		loadHistory();
	}, [loadHistory]);

	// Save all entries for the selected month
	const handleSave = async () => {
		if (!user || entries.length === 0) {
			setError("Add at least one product entry.");
			return;
		}

		const valid = entries.filter((e) => e.productName.trim());
		if (valid.length === 0) {
			setError("Please name at least one product.");
			return;
		}

		setSaving(true);
		setError(null);

		try {
			for (const entry of valid) {
				await addDoc(collection(db, "users", user.uid, "stockEntries"), {
					month,
					productName: entry.productName.trim(),
					category: entry.category,
					stockIn: entry.stockIn ? Number(entry.stockIn) : 0,
					stockOut: entry.stockOut ? Number(entry.stockOut) : 0,
					unitCost: entry.unitCost ? Number(entry.unitCost) : 0,
					unit: entry.unit,
					businessType: businessType || null,
					businessCategory: category,
					createdAt: serverTimestamp(),
				});
			}

			setSaved(true);
			setEntries([]);
			setTimeout(() => setSaved(false), 3000);
			loadHistory();
		} catch {
			setError("Failed to save stock entries. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteEntry = async (docId) => {
		if (!user) return;
		try {
			await deleteDoc(doc(db, "users", user.uid, "stockEntries", docId));
			setHistory((prev) => prev.filter((h) => h.docId !== docId));
		} catch {
			// Silent fail
		}
	};

	// Summary stats from history for the selected month
	const monthSummary = useMemo(() => {
		const monthEntries = history.filter((h) => h.month === month);
		const totalIn = monthEntries.reduce((s, e) => s + (e.stockIn || 0), 0);
		const totalOut = monthEntries.reduce((s, e) => s + (e.stockOut || 0), 0);
		const totalCostIn = monthEntries.reduce(
			(s, e) => s + (e.stockIn || 0) * (e.unitCost || 0),
			0,
		);
		const totalCostOut = monthEntries.reduce(
			(s, e) => s + (e.stockOut || 0) * (e.unitCost || 0),
			0,
		);
		return {
			totalIn,
			totalOut,
			netMovement: totalIn - totalOut,
			totalCostIn,
			totalCostOut,
			count: monthEntries.length,
		};
	}, [history, month]);

	if (userProfile && !needsStockManagement(businessType)) {
		return null;
	}

	return (
		<div className="min-h-screen py-10 px-6">
			<div className="max-w-5xl mx-auto">
				{/* Page header */}
				<div className="mb-8">
					<h1 className="text-xl font-semibold text-surface-900 mb-1 flex items-center gap-3">
						<div className="p-2 rounded-lg bg-indigo-50">
							<Package size={20} className="text-indigo-600" />
						</div>
						Stock Management
					</h1>
					<p className="text-sm text-surface-500 ml-12">
						Track monthly stock-in and stock-out for your{" "}
						{categoryLabel.toLowerCase()} products.
					</p>
				</div>

				{/* Month summary cards */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
					<div className="card p-4">
						<div className="flex items-center gap-2 mb-1">
							<TrendingUp size={14} className="text-green-500" />
							<span className="text-[11px] font-medium text-surface-400">
								Stock In
							</span>
						</div>
						<p className="text-lg font-semibold text-surface-900">
							{monthSummary.totalIn.toLocaleString()}
						</p>
						<p className="text-[10px] text-surface-400">
							${monthSummary.totalCostIn.toLocaleString()} value
						</p>
					</div>
					<div className="card p-4">
						<div className="flex items-center gap-2 mb-1">
							<TrendingDown size={14} className="text-red-500" />
							<span className="text-[11px] font-medium text-surface-400">
								Stock Out
							</span>
						</div>
						<p className="text-lg font-semibold text-surface-900">
							{monthSummary.totalOut.toLocaleString()}
						</p>
						<p className="text-[10px] text-surface-400">
							${monthSummary.totalCostOut.toLocaleString()} value
						</p>
					</div>
					<div className="card p-4">
						<div className="flex items-center gap-2 mb-1">
							<ArrowUpDown size={14} className="text-indigo-500" />
							<span className="text-[11px] font-medium text-surface-400">
								Net Movement
							</span>
						</div>
						<p
							className={`text-lg font-semibold ${monthSummary.netMovement >= 0 ? "text-green-600" : "text-red-600"}`}
						>
							{monthSummary.netMovement >= 0 ? "+" : ""}
							{monthSummary.netMovement.toLocaleString()}
						</p>
					</div>
					<div className="card p-4">
						<div className="flex items-center gap-2 mb-1">
							<Package size={14} className="text-gold-600" />
							<span className="text-[11px] font-medium text-surface-400">
								Products Logged
							</span>
						</div>
						<p className="text-lg font-semibold text-surface-900">
							{monthSummary.count}
						</p>
					</div>
				</div>

				{/* ── Bill Scanner ── */}
				<div className="card-elevated p-6 mb-6">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-amber-50">
								<ScanLine size={18} className="text-amber-600" />
							</div>
							<div>
								<h2 className="text-sm font-semibold text-surface-900">
									Bill Scanner
								</h2>
								<p className="text-[11px] text-surface-400">
									Upload a bill image to auto-add products to inventory
								</p>
							</div>
						</div>
						<button
							onClick={() => setShowScanner(!showScanner)}
							className="text-surface-400 hover:text-surface-600 transition-colors"
						>
							{showScanner ? (
								<ChevronUp size={16} />
							) : (
								<ChevronDown size={16} />
							)}
						</button>
					</div>

					{showScanner && (
						<div className="space-y-4">
							{/* Drop zone */}
							{!billFile ? (
								<div
									ref={dropZoneRef}
									onDrop={handleDrop}
									onDragOver={handleDragOver}
									onDragLeave={handleDragLeave}
									onClick={() => fileInputRef.current?.click()}
									className="border-2 border-dashed border-surface-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
								>
									<input
										ref={fileInputRef}
										type="file"
										accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
										onChange={(e) => handleBillFileSelect(e.target.files?.[0])}
										className="hidden"
									/>
									<div className="flex flex-col items-center gap-3">
										<div className="p-3 rounded-full bg-surface-100">
											<Camera size={24} className="text-surface-400" />
										</div>
										<div>
											<p className="text-sm font-medium text-surface-700">
												Drop your bill image here or{" "}
												<span className="text-indigo-600">browse</span>
											</p>
											<p className="text-[11px] text-surface-400 mt-1">
												JPG, PNG, WEBP up to 10 MB
											</p>
										</div>
									</div>
								</div>
							) : (
								<div className="flex flex-col sm:flex-row gap-4">
									{/* Image preview */}
									<div className="relative w-full sm:w-48 h-48 rounded-lg overflow-hidden border border-surface-200 shrink-0">
										<img
											src={billPreview}
											alt="Bill preview"
											className="w-full h-full object-cover"
										/>
										<button
											onClick={clearBillFile}
											className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
											title="Remove image"
										>
											<X size={14} />
										</button>
									</div>

									{/* File info + scan button */}
									<div className="flex-1 flex flex-col justify-between">
										<div>
											<p className="text-sm font-medium text-surface-800 truncate">
												{billFile.name}
											</p>
											<p className="text-[11px] text-surface-400 mt-0.5">
												{(billFile.size / 1024).toFixed(1)} KB · {billFile.type}
											</p>
										</div>

										<div className="flex items-center gap-3 mt-4">
											<button
												onClick={handleScanBill}
												disabled={scanning}
												className="btn-primary flex items-center gap-2 text-sm"
											>
												{scanning ? (
													<Loader2 size={15} className="animate-spin" />
												) : (
													<ScanLine size={15} />
												)}
												{scanning ? "Scanning…" : "Scan Bill"}
											</button>
											<button
												onClick={clearBillFile}
												className="px-4 py-2 rounded-lg border border-surface-200 text-surface-500 text-sm hover:bg-surface-50 transition-all"
											>
												Clear
											</button>
										</div>

										{/* Scan result summary */}
										{scanResult && (
											<div className={`mt-3 flex flex-col gap-1`}>
												<div
													className={`flex items-center gap-2 text-sm ${scanResult.itemCount > 0 ? "text-green-600" : "text-amber-600"}`}
												>
													{scanResult.itemCount > 0 ? (
														<>
															<CheckCircle2 size={14} />
															<span>
																Found {scanResult.itemCount} product
																{scanResult.itemCount !== 1 ? "s" : ""}
																{scanResult.storeName &&
																	` from ${scanResult.storeName}`}
																{scanResult.billTotal &&
																	` · Total: ₹${scanResult.billTotal.toLocaleString()}`}
															</span>
														</>
													) : (
														<>
															<AlertCircle size={14} />
															<span>
																{scanResult.message ||
																	"No products found. Try a clearer image."}
															</span>
														</>
													)}
												</div>
												{scanResult.ocrMethod && scanResult.itemCount > 0 && (
													<span className="text-xs text-gray-400 ml-5">
														via {scanResult.ocrMethod}
													</span>
												)}
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				{/* ── Entry Form ── */}
				<div className="card-elevated p-6 mb-6">
					{/* Month picker */}
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
						<div>
							<label className="block text-xs font-medium text-surface-400 mb-1.5">
								Month
							</label>
							<input
								type="month"
								value={month}
								onChange={(e) => {
									setMonth(e.target.value);
									setSaved(false);
								}}
								className="input-field"
							/>
						</div>
						<div className="sm:ml-auto">
							<button
								onClick={addEntry}
								className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-medium hover:bg-indigo-100 transition-all"
							>
								<Plus size={14} />
								Add Product
							</button>
						</div>
					</div>

					{/* Entry rows */}
					{entries.length === 0 ? (
						<div className="text-center py-10 border border-dashed border-surface-300 rounded-lg">
							<Package size={28} className="text-surface-400 mx-auto mb-2" />
							<p className="text-sm text-surface-500 mb-3">
								No products added yet
							</p>
							<button
								onClick={addEntry}
								className="btn-primary text-xs px-4 py-2"
							>
								<Plus size={14} className="inline mr-1" />
								Add Your First Product
							</button>
						</div>
					) : (
						<div className="space-y-3">
							{/* Column headers */}
							<div className="hidden md:grid md:grid-cols-12 gap-3 px-2 text-[10px] font-medium text-surface-400 uppercase tracking-wider">
								<span className="col-span-3">Product Name</span>
								<span className="col-span-2">Category</span>
								<span className="col-span-1">Unit</span>
								<span className="col-span-2">Stock In</span>
								<span className="col-span-2">Stock Out</span>
								<span className="col-span-1">Unit Cost</span>
								<span className="col-span-1"></span>
							</div>

							{entries.map((entry) => (
								<div
									key={entry.id}
									className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-lg bg-surface-50 border border-surface-200"
								>
									{/* Product name */}
									<div className="md:col-span-3">
										<label className="block md:hidden text-[10px] font-medium text-surface-400 mb-1">
											Product Name
										</label>
										<input
											type="text"
											placeholder="e.g. Whole Milk 1L"
											value={entry.productName}
											onChange={(e) =>
												updateEntry(entry.id, "productName", e.target.value)
											}
											className="input-field w-full text-sm"
										/>
									</div>

									{/* Category */}
									<div className="md:col-span-2">
										<label className="block md:hidden text-[10px] font-medium text-surface-400 mb-1">
											Category
										</label>
										<select
											value={entry.category}
											onChange={(e) =>
												updateEntry(entry.id, "category", e.target.value)
											}
											className="input-field w-full text-sm"
										>
											{categories.map((cat) => (
												<option key={cat} value={cat}>
													{cat}
												</option>
											))}
										</select>
									</div>

									{/* Unit */}
									<div className="md:col-span-1">
										<label className="block md:hidden text-[10px] font-medium text-surface-400 mb-1">
											Unit
										</label>
										<select
											value={entry.unit}
											onChange={(e) =>
												updateEntry(entry.id, "unit", e.target.value)
											}
											className="input-field w-full text-sm"
										>
											<option value="units">units</option>
											<option value="kg">kg</option>
											<option value="lbs">lbs</option>
											<option value="liters">liters</option>
											<option value="packs">packs</option>
											<option value="boxes">boxes</option>
											<option value="bottles">bottles</option>
											<option value="dozens">dozens</option>
										</select>
									</div>

									{/* Stock In */}
									<div className="md:col-span-2">
										<label className="block md:hidden text-[10px] font-medium text-surface-400 mb-1">
											Stock In
										</label>
										<input
											type="number"
											min="0"
											placeholder="Qty received"
											value={entry.stockIn}
											onChange={(e) =>
												updateEntry(entry.id, "stockIn", e.target.value)
											}
											className="input-field w-full text-sm"
										/>
									</div>

									{/* Stock Out */}
									<div className="md:col-span-2">
										<label className="block md:hidden text-[10px] font-medium text-surface-400 mb-1">
											Stock Out (Sold)
										</label>
										<input
											type="number"
											min="0"
											placeholder="Qty sold/used"
											value={entry.stockOut}
											onChange={(e) =>
												updateEntry(entry.id, "stockOut", e.target.value)
											}
											className="input-field w-full text-sm"
										/>
									</div>

									{/* Unit Cost */}
									<div className="md:col-span-1">
										<label className="block md:hidden text-[10px] font-medium text-surface-400 mb-1">
											Unit Cost ($)
										</label>
										<input
											type="number"
											min="0"
											step="0.01"
											placeholder="$"
											value={entry.unitCost}
											onChange={(e) =>
												updateEntry(entry.id, "unitCost", e.target.value)
											}
											className="input-field w-full text-sm"
										/>
									</div>

									{/* Delete */}
									<div className="md:col-span-1 flex items-end md:items-center justify-end md:justify-center">
										<button
											onClick={() => removeEntry(entry.id)}
											className="p-2 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500 transition-all"
											title="Remove"
										>
											<Trash2 size={14} />
										</button>
									</div>
								</div>
							))}

							{/* Add more button */}
							<button
								onClick={addEntry}
								className="w-full py-2.5 border border-dashed border-surface-300 rounded-lg text-surface-500 text-xs font-medium hover:border-indigo-300 hover:text-indigo-500 transition-all"
							>
								<Plus size={13} className="inline mr-1" />
								Add Another Product
							</button>
						</div>
					)}

					{/* Error */}
					{error && (
						<div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm mt-4">
							<AlertCircle size={14} />
							{error}
						</div>
					)}

					{/* Save button */}
					{entries.length > 0 && (
						<div className="flex items-center gap-3 mt-6">
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
									? "Saving…"
									: `Save ${entries.filter((e) => e.productName.trim()).length} Product(s)`}
							</button>
							{saved && (
								<span className="flex items-center gap-1.5 text-green-600 text-sm font-medium animate-fade-in-up">
									<CheckCircle2 size={15} /> Saved successfully!
								</span>
							)}
						</div>
					)}
				</div>

				{/* ── Stock History ── */}
				<div className="card overflow-hidden">
					<button
						onClick={() => setShowHistory(!showHistory)}
						className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-50 transition-colors"
					>
						<div className="flex items-center gap-2">
							<h2 className="text-sm font-medium text-surface-900">
								Stock History
							</h2>
							<span className="px-2 py-0.5 rounded-full bg-surface-100 text-surface-500 text-[10px] font-bold">
								{history.length}
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
							{loadingHistory ? (
								<div className="flex items-center justify-center py-12">
									<Loader2 size={20} className="text-gold-600 animate-spin" />
								</div>
							) : history.length === 0 ? (
								<div className="text-center py-12">
									<Package
										size={24}
										className="text-surface-600 mx-auto mb-2"
									/>
									<p className="text-sm text-surface-500">
										No stock entries yet. Start tracking above!
									</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-surface-300">
												<th className="text-left px-6 py-3 text-xs font-medium text-surface-500">
													Month
												</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-surface-500">
													Product
												</th>
												<th className="text-left px-4 py-3 text-xs font-medium text-surface-500 hidden sm:table-cell">
													Category
												</th>
												<th className="text-right px-4 py-3 text-xs font-medium text-surface-500">
													In
												</th>
												<th className="text-right px-4 py-3 text-xs font-medium text-surface-500">
													Out
												</th>
												<th className="text-right px-4 py-3 text-xs font-medium text-surface-500 hidden md:table-cell">
													Net
												</th>
												<th className="text-right px-4 py-3 text-xs font-medium text-surface-500 hidden md:table-cell">
													Cost
												</th>
												<th className="px-4 py-3"></th>
											</tr>
										</thead>
										<tbody>
											{history.map((h) => {
												const net = (h.stockIn || 0) - (h.stockOut || 0);
												return (
													<tr
														key={h.docId}
														className="border-b border-surface-200 hover:bg-surface-50 transition-colors"
													>
														<td className="px-6 py-3 text-surface-900 font-medium whitespace-nowrap">
															{h.month}
														</td>
														<td className="px-4 py-3 text-surface-700">
															{h.productName}
														</td>
														<td className="px-4 py-3 text-surface-500 text-xs hidden sm:table-cell">
															{h.category}
														</td>
														<td className="text-right px-4 py-3 text-green-600">
															+{(h.stockIn || 0).toLocaleString()}
														</td>
														<td className="text-right px-4 py-3 text-red-500">
															-{(h.stockOut || 0).toLocaleString()}
														</td>
														<td
															className={`text-right px-4 py-3 font-medium hidden md:table-cell ${net >= 0 ? "text-green-600" : "text-red-600"}`}
														>
															{net >= 0 ? "+" : ""}
															{net.toLocaleString()}
														</td>
														<td className="text-right px-4 py-3 text-surface-500 hidden md:table-cell">
															$
															{(
																(h.unitCost || 0) * (h.stockIn || 0)
															).toLocaleString()}
														</td>
														<td className="px-4 py-3">
															<button
																onClick={() => handleDeleteEntry(h.docId)}
																className="p-1.5 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500 transition-all"
																title="Delete"
															>
																<Trash2 size={13} />
															</button>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
