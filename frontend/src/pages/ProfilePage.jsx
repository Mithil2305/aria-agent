import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
	User,
	Building2,
	Mail,
	Phone,
	MapPin,
	Save,
	CheckCircle2,
	AlertCircle,
	Loader2,
	Store,
	DollarSign,
	ChevronDown,
	Check,
} from "lucide-react";

const BUSINESS_TYPES = [
	"Supermarket",
	"Grocery Store",
	"Bakery",
	"Restaurant / Café",
	"Retail Shop",
	"Pharmacy",
	"Hardware Store",
	"Clothing Store",
	"Food Truck",
	"Other",
];

const CURRENCIES = [
	{ code: "USD", label: "US Dollar ($)" },
	{ code: "EUR", label: "Euro (€)" },
	{ code: "GBP", label: "British Pound (£)" },
	{ code: "INR", label: "Indian Rupee (₹)" },
	{ code: "AED", label: "UAE Dirham (د.إ)" },
	{ code: "CAD", label: "Canadian Dollar (C$)" },
	{ code: "AUD", label: "Australian Dollar (A$)" },
];

function StyledSelect({
	label,
	icon: Icon,
	value,
	placeholder,
	options,
	onChange,
	getOptionLabel,
}) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef(null);

	useEffect(() => {
		const handleOutsideClick = (event) => {
			if (!containerRef.current?.contains(event.target)) {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleOutsideClick);
		return () => document.removeEventListener("mousedown", handleOutsideClick);
	}, []);

	useEffect(() => {
		const handleEscape = (event) => {
			if (event.key === "Escape") setOpen(false);
		};

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, []);

	const selectedOption = options.find((option) => option.value === value);
	const selectedLabel = selectedOption
		? getOptionLabel(selectedOption)
		: placeholder;

	return (
		<div className="relative" ref={containerRef}>
			<label className="flex items-center gap-1.5 text-xs font-medium text-surface-500 mb-1.5">
				<Icon size={12} strokeWidth={1.5} />
				{label}
			</label>
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				className="input-field w-full text-left"
				aria-haspopup="listbox"
				aria-expanded={open}
			>
				<div className="flex items-center justify-between gap-2">
					<span className={value ? "text-surface-900" : "text-surface-400"}>
						{selectedLabel}
					</span>
					<ChevronDown
						size={16}
						className={`shrink-0 text-surface-500 transition-transform ${open ? "rotate-180" : ""}`}
					/>
				</div>
			</button>

			{open ? (
				<div
					className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-surface-200 bg-white p-1 shadow-lg"
					role="listbox"
				>
					{placeholder ? (
						<button
							type="button"
							onClick={() => {
								onChange("");
								setOpen(false);
							}}
							className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
								value === ""
									? "bg-surface-900 text-white"
									: "text-surface-500 hover:bg-surface-100"
							}`}
						>
							<span>{placeholder}</span>
							{value === "" ? <Check size={14} className="shrink-0" /> : null}
						</button>
					) : null}
					{options.map((option) => {
						const selected = value === option.value;
						return (
							<button
								type="button"
								key={option.value}
								onClick={() => {
									onChange(option.value);
									setOpen(false);
								}}
								className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
									selected
										? "bg-surface-900 text-white"
										: "text-surface-700 hover:bg-surface-100"
								}`}
							>
								<span>{getOptionLabel(option)}</span>
								{selected ? <Check size={14} className="shrink-0" /> : null}
							</button>
						);
					})}
				</div>
			) : null}
		</div>
	);
}

export default function ProfilePage() {
	const { user, userProfile, updateUserProfile } = useAuth();
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState("");

	const [form, setForm] = useState({
		ownerName: userProfile?.ownerName || user?.displayName || "",
		businessName: userProfile?.businessName || "",
		businessType: userProfile?.businessType || "",
		phone: userProfile?.phone || "",
		address: userProfile?.address || "",
		currency: userProfile?.currency || "USD",
	});

	const update = (key) => (e) => {
		setForm((prev) => ({ ...prev, [key]: e.target.value }));
		setSaved(false);
	};

	const updateSelect = (key) => (value) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		setSaved(false);
	};

	const handleSave = async () => {
		if (!form.ownerName.trim() || !form.businessName.trim()) {
			setError("Name and business name are required.");
			return;
		}
		setSaving(true);
		setError("");
		try {
			await updateUserProfile(form);
			setSaved(true);
			setTimeout(() => setSaved(false), 3000);
		} catch {
			setError("Failed to save profile. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	const initials = (form.ownerName || "U")
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const roleLabel =
		userProfile?.role === "admin"
			? "Admin"
			: userProfile?.role === "free-tier"
				? "Free Tier"
				: "Paid User";

	return (
		<div className="app-page">
			<div className="app-page-inner max-w-2xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-xl font-semibold text-surface-900 mb-1">
						Profile Settings
					</h1>
					<p className="text-sm text-surface-500">
						Manage your account and business information
					</p>
				</div>

				{/* Avatar + email */}
				<div className="card-elevated p-6 mb-6">
					<div className="flex items-center gap-4">
						<div className="w-16 h-16 rounded-full bg-surface-100 border border-surface-300 flex items-center justify-center">
							<span className="text-lg font-semibold text-surface-500">
								{initials}
							</span>
						</div>
						<div>
							<p className="text-base font-medium text-surface-900">
								{form.ownerName || "Your Name"}
							</p>
							<p className="text-sm text-surface-500">{user?.email}</p>
							<span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-gold-50 text-gold-600 uppercase tracking-wider">
								{roleLabel}
							</span>
						</div>
					</div>
				</div>

				{/* Form */}
				<div className="card-elevated p-6 space-y-5">
					<h2 className="text-sm font-medium text-surface-600 mb-4">
						Business Details
					</h2>

					{error && (
						<div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
							<AlertCircle size={14} className="text-red-600 shrink-0" />
							<p className="text-sm text-red-600">{error}</p>
						</div>
					)}

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{/* Owner Name */}
						<div>
							<label className="flex items-center gap-1.5 text-xs font-medium text-surface-500 mb-1.5">
								<User size={12} strokeWidth={1.5} />
								Owner Name
							</label>
							<input
								type="text"
								value={form.ownerName}
								onChange={update("ownerName")}
								className="input-field w-full"
								placeholder="John Smith"
							/>
						</div>

						{/* Business Name */}
						<div>
							<label className="flex items-center gap-1.5 text-xs font-medium text-surface-500 mb-1.5">
								<Building2 size={12} strokeWidth={1.5} />
								Business Name
							</label>
							<input
								type="text"
								value={form.businessName}
								onChange={update("businessName")}
								className="input-field w-full"
								placeholder="My Grocery Store"
							/>
						</div>

						{/* Business Type */}
						<StyledSelect
							label="Business Type"
							icon={Store}
							value={form.businessType}
							placeholder="Select type..."
							options={BUSINESS_TYPES.map((t) => ({ value: t, label: t }))}
							onChange={updateSelect("businessType")}
							getOptionLabel={(option) => option.label}
						/>

						{/* Currency */}
						<StyledSelect
							label="Currency"
							icon={DollarSign}
							value={form.currency}
							options={CURRENCIES.map((c) => ({
								value: c.code,
								label: c.label,
							}))}
							onChange={updateSelect("currency")}
							getOptionLabel={(option) => option.label}
						/>

						{/* Phone */}
						<div>
							<label className="flex items-center gap-1.5 text-xs font-medium text-surface-500 mb-1.5">
								<Phone size={12} strokeWidth={1.5} />
								Phone
							</label>
							<input
								type="tel"
								value={form.phone}
								onChange={update("phone")}
								className="input-field w-full"
								placeholder="+1 (555) 000-0000"
							/>
						</div>

						{/* Address */}
						<div>
							<label className="flex items-center gap-1.5 text-xs font-medium text-surface-500 mb-1.5">
								<MapPin size={12} strokeWidth={1.5} />
								Location
							</label>
							<input
								type="text"
								value={form.address}
								onChange={update("address")}
								className="input-field w-full"
								placeholder="123 Main St, City"
							/>
						</div>
					</div>

					<div className="divider" />

					{/* Save */}
					<div className="flex items-center gap-3 pt-1">
						<button
							onClick={handleSave}
							disabled={saving}
							className="btn-primary flex items-center gap-2"
						>
							{saving ? (
								<Loader2 size={14} className="animate-spin" />
							) : (
								<Save size={14} />
							)}
							{saving ? "Saving…" : "Save Changes"}
						</button>
						{saved && (
							<span className="flex items-center gap-1.5 text-sm font-medium status-positive animate-fade-in-up">
								<CheckCircle2 size={14} /> Saved
							</span>
						)}
					</div>
				</div>

				{/* Account info */}
				<div className="card p-5 mt-6">
					<h3 className="text-xs font-medium text-surface-500 mb-3">Account</h3>
					<div className="flex items-center gap-2 text-sm text-surface-500">
						<Mail size={14} strokeWidth={1.5} />
						<span>{user?.email}</span>
					</div>
					<p className="text-[11px] text-surface-400 mt-2">
						Member since{" "}
						{userProfile?.createdAt?.toDate
							? userProfile.createdAt.toDate().toLocaleDateString()
							: "—"}
					</p>
				</div>
			</div>
		</div>
	);
}
