import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
	Mail,
	Lock,
	User,
	Building2,
	ArrowRight,
	ArrowLeft,
	Loader2,
	Eye,
	EyeOff,
	Phone,
	MapPin,
	DollarSign,
	Store,
	CheckCircle2,
	Sparkles,
	Workflow,
	BadgeCheck,
} from "lucide-react";
import ToastStack from "../components/ToastStack";

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
	const [successState, setSuccessState] = useState("");
	const [toasts, setToasts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const { register, registerWithGoogle, user } = useAuth();
	const navigate = useNavigate();

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

	useEffect(() => {
		if (user) navigate("/dashboard", { replace: true });
	}, [navigate, user]);

	const selectedCurrency =
		CURRENCIES.find((c) => c.code === form.currency) || CURRENCIES[0];

	const update = (key) => (e) =>
		setForm((prev) => ({ ...prev, [key]: e.target.value }));

	const validateStep = () => {
		setSuccessState("");
		if (step === 0) {
			if (!form.ownerName.trim()) {
				pushToast(
					"error",
					"Missing name",
					"Please enter your full name to continue.",
				);
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
		return true;
	};

	const handleNext = () => {
		if (validateStep()) setStep((s) => s + 1);
	};

	const handleBack = () => {
		setSuccessState("");
		setStep((s) => s - 1);
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
				address: form.address.trim(),
				currency: form.currency,
			});
			setSuccessState("Account created. Redirecting you to sign in...");
			pushToast(
				"success",
				"Account created",
				"We sent a verification email. Verify it before your first sign in.",
			);
			window.setTimeout(
				() =>
					navigate("/login", {
						replace: true,
						state: {
							verificationEmail: form.email.trim(),
							verificationSent: true,
						},
					}),
				420,
			);
		} catch (err) {
			const code = err.code || "";
			if (code.includes("email-already-in-use")) {
				pushToast(
					"error",
					"Email already registered",
					"An account with this email already exists. Try signing in instead.",
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
			await registerWithGoogle({
				ownerName: form.ownerName.trim(),
				businessName: form.businessName.trim(),
				businessType: form.businessType,
				phone: form.phone.trim(),
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
			} else {
				pushToast(
					"error",
					"Google sign-up failed",
					"Please try again, or continue with email registration.",
				);
			}
		} finally {
			setGoogleLoading(false);
		}
	};

	const isLastStep = step === STEPS.length - 1;

	return (
		<div className="auth-shell min-h-screen px-4 py-6 sm:py-10">
			<ToastStack toasts={toasts} onDismiss={dismissToast} />
			<div className="auth-bg-glow auth-bg-glow-a" />
			<div className="auth-bg-glow auth-bg-glow-b" />

			<div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-6 items-stretch">
				<section className="auth-hero-card p-7 sm:p-9 hidden lg:flex flex-col justify-between">
					<div>
						<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-200 bg-white/80 text-amber-700 text-xs tracking-wide uppercase">
							<Workflow size={14} /> Guided onboarding
						</div>
						<h1 className="text-slate-900 text-4xl font-semibold leading-tight mt-6">
							Build your data engine.
							<br />
							From day one.
						</h1>
						<p className="text-slate-600 mt-4 max-w-md">
							Create your Yukti workspace, upload data, and receive
							strategy-ready insights in minutes.
						</p>
					</div>

					<div className="auth-hero-stack">
						<div className="auth-float-card">
							<BadgeCheck size={16} className="text-amber-700" />
							<div>
								<p className="text-slate-900 text-sm font-medium">
									7-day free trial
								</p>
								<p className="text-slate-600 text-xs">
									No credit card required
								</p>
							</div>
						</div>
						<div className="auth-float-card auth-float-card-offset">
							<Sparkles size={16} className="text-amber-700" />
							<div>
								<p className="text-slate-900 text-sm font-medium">
									Custom Indian ML model
								</p>
								<p className="text-slate-600 text-xs">
									35,800+ curated training samples
								</p>
							</div>
						</div>
					</div>
				</section>

				<section className="auth-form-card p-6 sm:p-8">
					<div className="text-center mb-5">
						<div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gold-600 mb-3 shadow-sm">
							<Sparkles size={22} className="text-white" />
						</div>
						<h2 className="text-xl font-semibold text-slate-900">
							Start Your Free Trial
						</h2>
						<p className="text-slate-600 text-sm mt-1">
							Set up your account in under 2 minutes
						</p>
						{successState ? (
							<p className="text-emerald-200 text-xs mt-3">{successState}</p>
						) : null}
					</div>

					<div className="flex items-center justify-center gap-2 mb-5">
						{STEPS.map((s, i) => {
							const Icon = s.icon;
							const done = i < step;
							const active = i === step;
							return (
								<div key={s.label} className="flex items-center gap-2">
									{i > 0 && (
										<div
											className={`w-8 h-0.5 rounded-full transition-colors duration-300 ${
												done ? "bg-amber-400" : "bg-slate-300"
											}`}
										/>
									)}
									<div
										className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
											active
												? "bg-amber-300 text-amber-950"
												: done
													? "bg-amber-100 text-amber-800 border border-amber-200"
													: "bg-white text-slate-500 border border-slate-300"
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

					<button
						type="button"
						onClick={handleGoogle}
						disabled={googleLoading}
						className="auth-google-btn w-full flex items-center justify-center gap-2 mb-5"
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
						{step === 0 && (
							<div className="space-y-4">
								<div>
									<label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
										<User size={12} strokeWidth={1.5} /> Full Name
									</label>
									<input
										type="text"
										value={form.ownerName}
										onChange={update("ownerName")}
										className="auth-input w-full"
										placeholder="John Doe"
										autoFocus
										required
									/>
								</div>

								<div>
									<label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
										<Mail size={12} strokeWidth={1.5} /> Email
									</label>
									<input
										type="email"
										value={form.email}
										onChange={update("email")}
										className="auth-input w-full"
										placeholder="you@business.com"
										required
									/>
								</div>

								<div>
									<label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
										<Lock size={12} strokeWidth={1.5} /> Password
									</label>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											value={form.password}
											onChange={update("password")}
											className="auth-input w-full pr-10"
											placeholder="••••••••"
											required
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
											tabIndex={-1}
										>
											{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
										</button>
									</div>
								</div>

								<div>
									<label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
										<Lock size={12} strokeWidth={1.5} /> Confirm Password
									</label>
									<div className="relative">
										<input
											type={showConfirm ? "text" : "password"}
											value={form.confirm}
											onChange={update("confirm")}
											className="auth-input w-full pr-10"
											placeholder="••••••••"
											required
										/>
										<button
											type="button"
											onClick={() => setShowConfirm(!showConfirm)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
											tabIndex={-1}
										>
											{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
										</button>
									</div>
								</div>
							</div>
						)}

						{step === 1 && (
							<div className="space-y-4">
								<div>
									<label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
										<Building2 size={12} strokeWidth={1.5} /> Business Name
									</label>
									<input
										type="text"
										value={form.businessName}
										onChange={update("businessName")}
										className="auth-input w-full"
										placeholder="My Grocery Store"
										autoFocus
										required
									/>
								</div>

								<div>
									<label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
										<Store size={12} strokeWidth={1.5} /> Business Type
									</label>
									<select
										value={form.businessType}
										onChange={update("businessType")}
										className="auth-input w-full appearance-none cursor-pointer"
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
									<label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
										<DollarSign size={12} strokeWidth={1.5} /> Currency (
										{selectedCurrency.symbol})
									</label>
									<select
										value={form.currency}
										onChange={update("currency")}
										className="auth-input w-full appearance-none cursor-pointer"
									>
										{CURRENCIES.map((c) => (
											<option key={c.code} value={c.code}>
												{c.label} ({c.symbol})
											</option>
										))}
									</select>
								</div>
							</div>
						)}

						{step === 2 && (
							<div className="space-y-4">
								<div>
									<label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
										<Phone size={12} strokeWidth={1.5} /> Phone Number
										(optional)
									</label>
									<input
										type="tel"
										value={form.phone}
										onChange={update("phone")}
										className="auth-input w-full"
										placeholder="+91 98765 43210"
										autoFocus
									/>
								</div>

								<div>
									<label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
										<MapPin size={12} strokeWidth={1.5} /> Business Address
										(optional)
									</label>
									<textarea
										value={form.address}
										onChange={update("address")}
										className="auth-input w-full resize-none"
										placeholder="123 Main Street, City"
										rows={3}
									/>
								</div>
							</div>
						)}

						<div className="flex items-center gap-3 mt-2">
							{step > 0 && (
								<button
									type="button"
									onClick={handleBack}
									className="auth-back-btn flex items-center gap-1.5 px-4"
								>
									<ArrowLeft size={14} /> Back
								</button>
							)}

							<button
								type="submit"
								disabled={loading}
								className="auth-submit-btn flex-1 flex items-center justify-center gap-2"
							>
								{loading ? (
									<Loader2 size={15} className="animate-spin" />
								) : null}
								{loading
									? "Creating account..."
									: isLastStep
										? "Create Account"
										: "Continue"}
								{!loading && <ArrowRight size={15} />}
							</button>
						</div>
					</form>

					<p className="text-center text-sm text-slate-600 mt-5">
						Already have an account?{" "}
						<Link
							to="/login"
							className="text-amber-700 hover:text-amber-800 font-medium transition-colors"
						>
							Sign in
						</Link>
					</p>
				</section>
			</div>
		</div>
	);
}
