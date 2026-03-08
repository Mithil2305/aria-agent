import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
	Mail,
	Lock,
	User,
	Building2,
	ArrowRight,
	ArrowLeft,
	AlertCircle,
	Loader2,
	Eye,
	EyeOff,
	Phone,
	MapPin,
	DollarSign,
	Store,
	CheckCircle2,
	Sparkles,
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
	{ code: "INR", label: "Indian Rupee (₹)" },
	{ code: "USD", label: "US Dollar ($)" },
	{ code: "EUR", label: "Euro (€)" },
	{ code: "GBP", label: "British Pound (£)" },
	{ code: "AED", label: "UAE Dirham (د.إ)" },
	{ code: "CAD", label: "Canadian Dollar (C$)" },
	{ code: "AUD", label: "Australian Dollar (A$)" },
];

const STEPS = [
	{ label: "Account", icon: Mail },
	{ label: "Business", icon: Store },
	{ label: "Details", icon: MapPin },
];

export default function RegisterPage() {
	const [step, setStep] = useState(0);
	const [form, setForm] = useState({
		ownerName: "",
		email: "",
		password: "",
		confirm: "",
		businessName: "",
		businessType: "",
		phone: "",
		address: "",
		currency: "INR",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const { register } = useAuth();
	const navigate = useNavigate();

	const update = (key) => (e) =>
		setForm((prev) => ({ ...prev, [key]: e.target.value }));

	/* ── Step validation ── */
	const validateStep = () => {
		setError("");
		if (step === 0) {
			if (!form.ownerName.trim()) {
				setError("Please enter your name");
				return false;
			}
			if (!form.email.trim()) {
				setError("Please enter your email");
				return false;
			}
			if (form.password.length < 6) {
				setError("Password must be at least 6 characters");
				return false;
			}
			if (form.password !== form.confirm) {
				setError("Passwords do not match");
				return false;
			}
		}
		if (step === 1) {
			if (!form.businessName.trim()) {
				setError("Please enter your business name");
				return false;
			}
			if (!form.businessType) {
				setError("Please select a business type");
				return false;
			}
		}
		return true;
	};

	const handleNext = () => {
		if (validateStep()) setStep((s) => s + 1);
	};

	const handleBack = () => {
		setError("");
		setStep((s) => s - 1);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateStep()) return;
		setError("");
		setLoading(true);
		try {
			await register(form.email, form.password, {
				ownerName: form.ownerName.trim(),
				businessName: form.businessName.trim(),
				businessType: form.businessType,
				phone: form.phone.trim(),
				address: form.address.trim(),
				currency: form.currency,
			});
			navigate("/");
		} catch (err) {
			const code = err.code || "";
			if (code.includes("email-already-in-use")) {
				setError("An account with this email already exists");
				setStep(0);
			} else if (code.includes("weak-password")) {
				setError("Password is too weak. Use at least 6 characters.");
				setStep(0);
			} else {
				setError("Registration failed. Please try again.");
			}
		} finally {
			setLoading(false);
		}
	};

	const isLastStep = step === STEPS.length - 1;

	return (
		<div className="min-h-screen bg-surface-100 flex items-center justify-center px-4 py-8">
			<div className="w-full max-w-md">
				{/* Brand */}
				<div className="text-center mb-8 animate-fade-in-up">
					<div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gold-600 mb-3">
						<Sparkles size={22} className="text-white" />
					</div>
					<h1 className="text-2xl font-semibold text-surface-900 tracking-tight">
						Yukti
					</h1>
					<p className="text-xs text-surface-400 mt-1 tracking-wide uppercase">
						Business Intelligence
					</p>
				</div>

				{/* Step indicator */}
				<div
					className="flex items-center justify-center gap-2 mb-6 animate-fade-in-up"
					style={{ animationDelay: "40ms" }}
				>
					{STEPS.map((s, i) => {
						const Icon = s.icon;
						const done = i < step;
						const active = i === step;
						return (
							<div key={s.label} className="flex items-center gap-2">
								{i > 0 && (
									<div
										className={`w-8 h-0.5 rounded-full transition-colors duration-300 ${
											done ? "bg-gold-500" : "bg-surface-200"
										}`}
									/>
								)}
								<div
									className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
										active
											? "bg-gold-600 text-white shadow-sm"
											: done
												? "bg-gold-50 text-gold-700 border border-gold-200"
												: "bg-surface-200 text-surface-400"
									}`}
								>
									{done ? (
										<CheckCircle2 size={12} />
									) : (
										<Icon size={12} strokeWidth={1.8} />
									)}
									<span className="hidden sm:inline">{s.label}</span>
								</div>
							</div>
						);
					})}
				</div>

				{/* Form card */}
				<form
					onSubmit={
						isLastStep
							? handleSubmit
							: (e) => {
									e.preventDefault();
									handleNext();
								}
					}
					className="card-elevated p-8 animate-fade-in-up"
					style={{ animationDelay: "80ms" }}
				>
					{/* Step title */}
					<div className="text-center mb-6">
						<h2 className="text-lg font-medium text-surface-900">
							{step === 0
								? "Create your account"
								: step === 1
									? "About your business"
									: "Almost there!"}
						</h2>
						<p className="text-sm text-surface-400 mt-0.5">
							{step === 0
								? "Enter your personal details"
								: step === 1
									? "Help us personalize your experience"
									: "Add optional details to get started"}
						</p>
					</div>

					{error && (
						<div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 mb-5">
							<AlertCircle size={14} className="text-red-500 shrink-0" />
							<p className="text-sm text-red-600">{error}</p>
						</div>
					)}

					{/* ── Step 0: Account ── */}
					{step === 0 && (
						<div className="space-y-4">
							<div>
								<label className="flex items-center gap-1.5 text-xs font-medium text-surface-600 mb-1.5">
									<User size={12} strokeWidth={1.5} />
									Full Name
								</label>
								<input
									type="text"
									value={form.ownerName}
									onChange={update("ownerName")}
									className="input-field w-full"
									placeholder="John Doe"
									autoFocus
									required
								/>
							</div>

							<div>
								<label className="flex items-center gap-1.5 text-xs font-medium text-surface-600 mb-1.5">
									<Mail size={12} strokeWidth={1.5} />
									Email
								</label>
								<input
									type="email"
									value={form.email}
									onChange={update("email")}
									className="input-field w-full"
									placeholder="you@business.com"
									required
								/>
							</div>

							<div>
								<label className="flex items-center gap-1.5 text-xs font-medium text-surface-600 mb-1.5">
									<Lock size={12} strokeWidth={1.5} />
									Password
								</label>
								<div className="relative">
									<input
										type={showPassword ? "text" : "password"}
										value={form.password}
										onChange={update("password")}
										className="input-field w-full pr-10"
										placeholder="••••••••"
										required
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
										tabIndex={-1}
									>
										{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
									</button>
								</div>
							</div>

							<div>
								<label className="flex items-center gap-1.5 text-xs font-medium text-surface-600 mb-1.5">
									<Lock size={12} strokeWidth={1.5} />
									Confirm Password
								</label>
								<div className="relative">
									<input
										type={showConfirm ? "text" : "password"}
										value={form.confirm}
										onChange={update("confirm")}
										className="input-field w-full pr-10"
										placeholder="••••••••"
										required
									/>
									<button
										type="button"
										onClick={() => setShowConfirm(!showConfirm)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
										tabIndex={-1}
									>
										{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
									</button>
								</div>
								{form.password &&
									form.confirm &&
									form.password !== form.confirm && (
										<p className="text-xs text-red-500 mt-1">
											Passwords don&apos;t match
										</p>
									)}
							</div>
						</div>
					)}

					{/* ── Step 1: Business ── */}
					{step === 1 && (
						<div className="space-y-4">
							<div>
								<label className="flex items-center gap-1.5 text-xs font-medium text-surface-600 mb-1.5">
									<Building2 size={12} strokeWidth={1.5} />
									Business Name
								</label>
								<input
									type="text"
									value={form.businessName}
									onChange={update("businessName")}
									className="input-field w-full"
									placeholder="My Grocery Store"
									autoFocus
									required
								/>
							</div>

							<div>
								<label className="flex items-center gap-1.5 text-xs font-medium text-surface-600 mb-1.5">
									<Store size={12} strokeWidth={1.5} />
									Business Type
								</label>
								<select
									value={form.businessType}
									onChange={update("businessType")}
									className="input-field w-full appearance-none cursor-pointer"
									required
								>
									<option value="" disabled>
										Select your business type
									</option>
									{BUSINESS_TYPES.map((t) => (
										<option key={t} value={t}>
											{t}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="flex items-center gap-1.5 text-xs font-medium text-surface-600 mb-1.5">
									<DollarSign size={12} strokeWidth={1.5} />
									Currency
								</label>
								<select
									value={form.currency}
									onChange={update("currency")}
									className="input-field w-full appearance-none cursor-pointer"
								>
									{CURRENCIES.map((c) => (
										<option key={c.code} value={c.code}>
											{c.label}
										</option>
									))}
								</select>
							</div>
						</div>
					)}

					{/* ── Step 2: Details (optional) ── */}
					{step === 2 && (
						<div className="space-y-4">
							<div>
								<label className="flex items-center gap-1.5 text-xs font-medium text-surface-600 mb-1.5">
									<Phone size={12} strokeWidth={1.5} />
									Phone Number
									<span className="text-surface-300 font-normal ml-1">
										(optional)
									</span>
								</label>
								<input
									type="tel"
									value={form.phone}
									onChange={update("phone")}
									className="input-field w-full"
									placeholder="+91 98765 43210"
									autoFocus
								/>
							</div>

							<div>
								<label className="flex items-center gap-1.5 text-xs font-medium text-surface-600 mb-1.5">
									<MapPin size={12} strokeWidth={1.5} />
									Business Address
									<span className="text-surface-300 font-normal ml-1">
										(optional)
									</span>
								</label>
								<textarea
									value={form.address}
									onChange={update("address")}
									className="input-field w-full resize-none"
									placeholder="123 Main Street, City"
									rows={3}
								/>
							</div>

							{/* Summary preview */}
							<div className="bg-surface-100 rounded-xl p-4 space-y-2">
								<p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">
									Account Summary
								</p>
								<div className="flex items-center gap-2 text-sm text-surface-700">
									<User size={13} className="text-surface-400" />
									<span>{form.ownerName}</span>
								</div>
								<div className="flex items-center gap-2 text-sm text-surface-700">
									<Mail size={13} className="text-surface-400" />
									<span>{form.email}</span>
								</div>
								<div className="flex items-center gap-2 text-sm text-surface-700">
									<Building2 size={13} className="text-surface-400" />
									<span>
										{form.businessName} — {form.businessType}
									</span>
								</div>
								<div className="flex items-center gap-2 text-sm text-surface-700">
									<DollarSign size={13} className="text-surface-400" />
									<span>
										{CURRENCIES.find((c) => c.code === form.currency)?.label}
									</span>
								</div>
							</div>
						</div>
					)}

					{/* ── Navigation buttons ── */}
					<div className="flex items-center gap-3 mt-6">
						{step > 0 && (
							<button
								type="button"
								onClick={handleBack}
								className="btn-secondary flex items-center gap-1.5 px-4"
							>
								<ArrowLeft size={14} />
								Back
							</button>
						)}

						<button
							type="submit"
							disabled={loading}
							className="btn-primary flex-1 flex items-center justify-center gap-2"
						>
							{loading ? <Loader2 size={15} className="animate-spin" /> : null}
							{loading
								? "Creating account…"
								: isLastStep
									? "Create Account"
									: "Continue"}
							{!loading && <ArrowRight size={15} />}
						</button>
					</div>
				</form>

				{/* Trial notice */}
				<div
					className="text-center mt-4 animate-fade-in-up"
					style={{ animationDelay: "120ms" }}
				>
					<p className="text-xs text-surface-400">
						✨ 7-day free trial · All features · No credit card needed
					</p>
				</div>

				<p className="text-center text-sm text-surface-400 mt-4">
					Already have an account?{" "}
					<Link
						to="/login"
						className="text-gold-600 hover:text-gold-700 font-medium transition-colors"
					>
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
}
