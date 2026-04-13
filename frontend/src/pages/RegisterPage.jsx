import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	ArrowRight,
	Building2,
	CheckCircle2,
	DollarSign,
	Eye,
	EyeOff,
	Loader2,
	Lock,
	Mail,
	MapPin,
	Phone,
	Store,
	User,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import ToastStack from "../components/ToastStack";
import BrandLogo from "../components/BrandLogo";

const BUSINESS_TYPES = [
	"Supermarket",
	"Grocery Store",
	"Bakery",
	"Restaurant / Cafe",
	"Retail Shop",
	"Pharmacy",
	"Hardware Store",
	"Clothing Store",
	"Food Truck",
	"Other",
];

const CURRENCIES = [
	{ code: "INR", label: "Indian Rupee", symbol: "Rs" },
	{ code: "USD", label: "US Dollar", symbol: "$" },
	{ code: "EUR", label: "Euro", symbol: "EUR" },
	{ code: "GBP", label: "British Pound", symbol: "GBP" },
	{ code: "AED", label: "UAE Dirham", symbol: "AED" },
	{ code: "CAD", label: "Canadian Dollar", symbol: "CAD" },
	{ code: "AUD", label: "Australian Dollar", symbol: "AUD" },
];

const STEPS = [
	{ key: "account", label: "Account", icon: Mail },
	{ key: "business", label: "Business", icon: Store },
	{ key: "details", label: "Details", icon: MapPin },
];

const LEFT_PANEL_FEATURES = [
	{
		title: "Fast Onboarding",
		value: "2-minute setup",
		detail: "Get workspace defaults and account profile ready in one flow.",
	},
	{
		title: "Action-Ready Insights",
		value: "Weekly decisions",
		detail: "Convert data into practical next-step recommendations quickly.",
	},
	{
		title: "Built for SMBs",
		value: "Practical analytics",
		detail: "Simple workflow that teams can run without BI specialists.",
	},
];

const inputClass =
	"w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900";

const labelClass =
	"mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500";

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
		gst: "",
		address: "",
		currency: "INR",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [successState, setSuccessState] = useState("");
	const [toasts, setToasts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);

	const { register, registerWithGoogle, user } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (user) navigate("/dashboard", { replace: true });
	}, [navigate, user]);

	const selectedCurrency = useMemo(
		() => CURRENCIES.find((c) => c.code === form.currency) || CURRENCIES[0],
		[form.currency],
	);

	const isLastStep = step === STEPS.length - 1;

	const dismissToast = useCallback((id) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const pushToast = useCallback((type, title, message) => {
		const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
		setToasts((prev) => [...prev, { id, type, title, message }]);
		window.setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 4200);
	}, []);

	const update = (key) => (e) => {
		setForm((prev) => ({ ...prev, [key]: e.target.value }));
	};

	const validateStep = () => {
		setSuccessState("");

		if (step === 0) {
			if (!form.ownerName.trim()) {
				pushToast("error", "Missing name", "Please enter your full name.");
				return false;
			}
			if (!form.email.trim()) {
				pushToast(
					"error",
					"Email required",
					"Please enter a valid email address.",
				);
				return false;
			}
			if (form.password.length < 6) {
				pushToast(
					"error",
					"Password too short",
					"Use at least 6 characters for better security.",
				);
				return false;
			}
			if (form.password !== form.confirm) {
				pushToast(
					"error",
					"Passwords do not match",
					"Please make sure both password fields are identical.",
				);
				return false;
			}
		}

		if (step === 1) {
			if (!form.businessName.trim()) {
				pushToast(
					"error",
					"Business name required",
					"Tell us your business name to personalize your workspace.",
				);
				return false;
			}
			if (!form.businessType) {
				pushToast(
					"error",
					"Business type required",
					"Select the category that best describes your business.",
				);
				return false;
			}
		}

		if (step === 2) {
			const digits = form.phone.replace(/\D/g, "");
			if (!digits || digits.length < 10) {
				pushToast(
					"error",
					"Phone number required",
					"Please enter a valid phone number (minimum 10 digits).",
				);
				return false;
			}
		}

		return true;
	};

	const handleNext = () => {
		if (validateStep()) setStep((prev) => prev + 1);
	};

	const handleBack = () => {
		setSuccessState("");
		setStep((prev) => Math.max(prev - 1, 0));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateStep()) return;

		setSuccessState("");
		setLoading(true);
		try {
			await register(form.email, form.password, {
				ownerName: form.ownerName.trim(),
				businessName: form.businessName.trim(),
				businessType: form.businessType,
				phone: form.phone.trim(),
				gst: form.gst.trim(),
				address: form.address.trim(),
				currency: form.currency,
			});

			setSuccessState("Account created. Redirecting to your dashboard...");
			pushToast(
				"success",
				"Account created",
				"We sent a verification email. Please verify to unlock all features.",
			);

			window.setTimeout(() => navigate("/dashboard", { replace: true }), 420);
		} catch (err) {
			const code = err?.code || "";
			if (
				code.includes("email-already-in-use") ||
				code.includes("business-already-registered")
			) {
				pushToast(
					"error",
					"Account already exists",
					err?.message ||
						"This business already has an account. Please sign in with your existing account.",
				);
				setStep(0);
			} else if (code.includes("weak-password")) {
				pushToast(
					"error",
					"Weak password",
					"Use a stronger password with at least 6 characters.",
				);
				setStep(0);
			} else {
				pushToast(
					"error",
					"Unable to create account",
					"Please try again in a moment.",
				);
			}
		} finally {
			setLoading(false);
		}
	};

	const handleGoogle = async () => {
		setSuccessState("");
		setGoogleLoading(true);
		try {
			if (!form.businessName.trim()) {
				setStep(1);
				throw new Error(
					"Please enter your business name before continuing with Google.",
				);
			}
			if (!form.businessType) {
				setStep(1);
				throw new Error(
					"Please select your business type before continuing with Google.",
				);
			}
			const phoneDigits = form.phone.replace(/\D/g, "");
			if (!phoneDigits || phoneDigits.length < 10) {
				setStep(2);
				throw new Error(
					"Please provide a valid phone number before continuing with Google.",
				);
			}

			await registerWithGoogle({
				ownerName: form.ownerName.trim(),
				businessName: form.businessName.trim(),
				businessType: form.businessType,
				phone: form.phone.trim(),
				gst: form.gst.trim(),
				address: form.address.trim(),
				currency: form.currency,
			});
			setSuccessState("Google sign-up successful. Redirecting...");
			pushToast(
				"success",
				"Google sign-up successful",
				"Your Yukti account is ready. Taking you to your dashboard.",
			);
			window.setTimeout(() => navigate("/dashboard"), 320);
		} catch (err) {
			const code = err?.code || "";
			if (code.includes("popup-closed-by-user")) {
				pushToast(
					"info",
					"Google sign-up cancelled",
					"No account changes were made.",
				);
			} else if (code.includes("business-already-registered")) {
				pushToast(
					"error",
					"Account already exists",
					err?.message ||
						"This business already has an account. Please sign in with your existing account.",
				);
				setStep(0);
			} else {
				pushToast(
					"error",
					"Google sign-up failed",
					err?.message ||
						"Please try again, or continue with email registration.",
				);
			}
		} finally {
			setGoogleLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#f7f7f4] relative overflow-hidden px-4 py-8 sm:py-12">
			<ToastStack toasts={toasts} onDismiss={dismissToast} />

			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-24 -left-24 h-[40vw] w-[40vw] rounded-full bg-cyan-200/40 blur-[90px]" />
				<div className="absolute bottom-0 right-0 h-[34vw] w-[34vw] rounded-full bg-slate-300/50 blur-[110px]" />
			</div>

			<div className="relative z-10 mx-auto flex w-full max-w-6xl justify-center">
				<section className="w-full max-w-148 rounded-4xl border border-slate-200 bg-white/95 p-6 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-8">
					<div className="mb-5 text-center">
						<h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
							Create your account
						</h2>
						<p className="mt-1 text-sm text-slate-600">
							Build your Yukti workspace and start your free trial.
						</p>
						{successState ? (
							<p className="mt-2 text-xs font-medium text-emerald-700">
								{successState}
							</p>
						) : null}
					</div>

					<div className="mb-5 flex items-center justify-center gap-2">
						{STEPS.map((item, index) => {
							const Icon = item.icon;
							const active = index === step;
							const done = index < step;
							return (
								<div key={item.key} className="flex items-center gap-2">
									{index > 0 ? (
										<div
											className={`h-0.5 w-8 rounded-full ${done ? "bg-slate-800" : "bg-slate-300"}`}
										/>
									) : null}
									<div
										className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${active ? "border-slate-900 bg-slate-900 text-white" : done ? "border-slate-300 bg-slate-100 text-slate-800" : "border-slate-300 bg-white text-slate-500"}`}
									>
										{done ? <CheckCircle2 size={12} /> : <Icon size={12} />}
										<span className="hidden sm:inline">{item.label}</span>
									</div>
								</div>
							);
						})}
					</div>

					<button
						type="button"
						onClick={handleGoogle}
						disabled={googleLoading}
						className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
					>
						<svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
							<path
								fill="#EA4335"
								d="M24 9.5c3.6 0 6.8 1.2 9.3 3.6l6.9-6.9C36.1 2.4 30.5 0 24 0 14.6 0 6.4 5.4 2.4 13.3l8 6.2C12.3 13.4 17.7 9.5 24 9.5z"
							/>
							<path
								fill="#4285F4"
								d="M46.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.4h12.7c-.3 1.8-1.8 4.6-5.1 6.4l7.8 6c4.6-4.3 6.7-10.5 6.7-15.9z"
							/>
							<path
								fill="#FBBC05"
								d="M10.4 28.5c-.5-1.3-.8-2.8-.8-4.5s.3-3.2.8-4.5l-8-6.2C.9 16.4 0 20.1 0 24s.9 7.6 2.4 10.7l8-6.2z"
							/>
							<path
								fill="#34A853"
								d="M24 48c6.5 0 12-2.1 16-5.8l-7.8-6c-2.1 1.5-4.9 2.6-8.2 2.6-6.3 0-11.7-3.9-13.6-9.9l-8 6.2C6.4 42.6 14.6 48 24 48z"
							/>
						</svg>
						{googleLoading ? "Connecting Google..." : "Continue with Google"}
					</button>

					<form
						onSubmit={
							isLastStep
								? handleSubmit
								: (e) => {
										e.preventDefault();
										handleNext();
									}
						}
						className="space-y-4"
					>
						{step === 0 ? (
							<>
								<div>
									<label className={labelClass}>
										<User size={12} /> Full Name
									</label>
									<input
										type="text"
										value={form.ownerName}
										onChange={update("ownerName")}
										className={inputClass}
										placeholder="John Doe"
										autoFocus
										required
									/>
								</div>
								<div>
									<label className={labelClass}>
										<Mail size={12} /> Email
									</label>
									<input
										type="email"
										value={form.email}
										onChange={update("email")}
										className={inputClass}
										placeholder="you@business.com"
										required
									/>
								</div>
								<div>
									<label className={labelClass}>
										<Lock size={12} /> Password
									</label>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											value={form.password}
											onChange={update("password")}
											className={`${inputClass} pr-10`}
											placeholder="••••••••"
											required
										/>
										<button
											type="button"
											onClick={() => setShowPassword((prev) => !prev)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
											tabIndex={-1}
										>
											{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
										</button>
									</div>
								</div>
								<div>
									<label className={labelClass}>
										<Lock size={12} /> Confirm Password
									</label>
									<div className="relative">
										<input
											type={showConfirm ? "text" : "password"}
											value={form.confirm}
											onChange={update("confirm")}
											className={`${inputClass} pr-10`}
											placeholder="••••••••"
											required
										/>
										<button
											type="button"
											onClick={() => setShowConfirm((prev) => !prev)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
											tabIndex={-1}
										>
											{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
										</button>
									</div>
								</div>
							</>
						) : null}

						{step === 1 ? (
							<>
								<div>
									<label className={labelClass}>
										<Building2 size={12} /> Business Name
									</label>
									<input
										type="text"
										value={form.businessName}
										onChange={update("businessName")}
										className={inputClass}
										placeholder="My Grocery Store"
										autoFocus
										required
									/>
								</div>
								<div>
									<label className={labelClass}>
										<Store size={12} /> Business Type
									</label>
									<select
										value={form.businessType}
										onChange={update("businessType")}
										className={`${inputClass} cursor-pointer appearance-none`}
										required
									>
										<option value="" disabled>
											Select your business type
										</option>
										{BUSINESS_TYPES.map((item) => (
											<option key={item} value={item}>
												{item}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className={labelClass}>
										<DollarSign size={12} /> Currency ({selectedCurrency.symbol}
										)
									</label>
									<select
										value={form.currency}
										onChange={update("currency")}
										className={`${inputClass} cursor-pointer appearance-none`}
									>
										{CURRENCIES.map((item) => (
											<option key={item.code} value={item.code}>
												{item.label} ({item.symbol})
											</option>
										))}
									</select>
								</div>
							</>
						) : null}

						{step === 2 ? (
							<>
								<div>
									<label className={labelClass}>
										<Phone size={12} /> Phone Number
									</label>
									<input
										type="tel"
										value={form.phone}
										onChange={update("phone")}
										className={inputClass}
										placeholder="+91 98765 43210"
										autoFocus
										required
									/>
									<p className="mt-1 text-xs text-slate-500">
										Used to verify and prevent duplicate trial misuse.
									</p>
								</div>
								<div>
									<label className={labelClass}>GST Number (optional)</label>
									<input
										type="text"
										value={form.gst}
										onChange={update("gst")}
										className={inputClass}
										placeholder="22AAAAA0000A1Z5"
									/>
								</div>
								<div>
									<label className={labelClass}>
										<MapPin size={12} /> Business Address (optional)
									</label>
									<textarea
										value={form.address}
										onChange={update("address")}
										className={`${inputClass} resize-none`}
										placeholder="123 Main Street, City"
										rows={3}
									/>
								</div>
							</>
						) : null}

						<div className="mt-2 flex items-center gap-3">
							{step > 0 ? (
								<button
									type="button"
									onClick={handleBack}
									className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
								>
									<ArrowLeft size={14} /> Back
								</button>
							) : null}

							<button
								type="submit"
								disabled={loading}
								className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{loading ? (
									<Loader2 size={15} className="animate-spin" />
								) : null}
								{loading
									? "Creating account..."
									: isLastStep
										? "Create Account"
										: "Continue"}
								{!loading ? <ArrowRight size={15} /> : null}
							</button>
						</div>
					</form>

					<p className="mt-5 text-center text-sm text-slate-600">
						Already have an account?{" "}
						<Link
							to="/login"
							className="font-semibold text-slate-800 hover:text-black"
						>
							Sign in
						</Link>
					</p>
				</section>
			</div>
		</div>
	);
}
