import { useState } from "react";
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

	return (
		<div className="min-h-screen py-10 px-6">
			<div className="max-w-2xl mx-auto">
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
								{userProfile?.plan || "Free"} Plan
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
						<div>
							<label className="flex items-center gap-1.5 text-xs font-medium text-surface-500 mb-1.5">
								<Store size={12} strokeWidth={1.5} />
								Business Type
							</label>
							<select
								value={form.businessType}
								onChange={update("businessType")}
								className="input-field w-full appearance-none"
							>
								<option value="">Select type…</option>
								{BUSINESS_TYPES.map((t) => (
									<option key={t} value={t}>
										{t}
									</option>
								))}
							</select>
						</div>

						{/* Currency */}
						<div>
							<label className="flex items-center gap-1.5 text-xs font-medium text-surface-500 mb-1.5">
								<DollarSign size={12} strokeWidth={1.5} />
								Currency
							</label>
							<select
								value={form.currency}
								onChange={update("currency")}
								className="input-field w-full appearance-none"
							>
								{CURRENCIES.map((c) => (
									<option key={c.code} value={c.code}>
										{c.label}
									</option>
								))}
							</select>
						</div>

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
