import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
	ArrowRight,
	Eye,
	EyeOff,
	LineChart,
	Loader2,
	Lock,
	Mail,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import ToastStack from "../components/ToastStack";
import BrandLogo from "../components/BrandLogo";

const HIGHLIGHTS = [
	{
		title: "Forecast Signal",
		value: "92% confidence",
		detail: "Short-term demand window calibrated from your latest data.",
		icon: LineChart,
	},
	{
		title: "Risk Monitoring",
		value: "Always active",
		detail: "Anomaly and margin-risk alerts keep your team proactive.",
		icon: ShieldCheck,
	},
];

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [successState, setSuccessState] = useState("");
	const [toasts, setToasts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const { login, loginWithGoogle, user } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const handledStateKeyRef = useRef("");

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
		if (user) {
			navigate("/dashboard", { replace: true });
			return;
		}

		if (handledStateKeyRef.current === location.key) return;
		handledStateKeyRef.current = location.key;

		if (location.state?.verificationSent) {
			pushToast(
				"success",
				"Verification email sent",
				`Check ${location.state.verificationEmail || "your inbox"} and verify your account before signing in.`,
			);
			if (location.state.verificationEmail) {
				setEmail(location.state.verificationEmail);
			}
			setSuccessState(
				"Account created. Verify your email to unlock your dashboard.",
			);
		}

		if (location.state?.unverifiedAccessBlocked) {
			pushToast(
				"info",
				"Email verification required",
				"Please verify your email first. We have sent a fresh verification link.",
			);
			setSuccessState("Complete email verification, then sign in again.");
		}

		if (location.state?.suspendedAccessBlocked) {
			pushToast(
				"error",
				"Account suspended",
				"Your account was signed out by admin policy. Contact support to reactivate access.",
			);
			setSuccessState("");
		}
	}, [location.key, location.state, navigate, pushToast, user]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSuccessState("");
		setLoading(true);
		try {
			await login(email, password);
			setSuccessState("Sign in successful. Taking you to your dashboard...");
			pushToast("success", "Welcome back", "You are signed in successfully.");
			window.setTimeout(() => navigate("/dashboard"), 350);
		} catch (err) {
			const code = err?.code || "";
			if (code.includes("email-not-verified")) {
				pushToast(
					"error",
					"Verify your email first",
					"We sent a new verification link. Open your inbox, verify, then sign in again.",
				);
			} else if (
				code.includes("user-not-found") ||
				code.includes("wrong-password") ||
				code.includes("invalid-credential")
			) {
				pushToast(
					"error",
					"Sign in failed",
					"Email or password is incorrect. Please check and try again.",
				);
			} else if (code.includes("too-many-requests")) {
				pushToast(
					"error",
					"Too many attempts",
					"Please wait a few minutes before trying again.",
				);
			} else {
				pushToast(
					"error",
					"Unable to sign in",
					"Please retry in a moment. If this continues, use Google sign-in.",
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
			await loginWithGoogle();
			setSuccessState("Google sign-in successful. Redirecting...");
			pushToast(
				"success",
				"Google sign-in successful",
				"You are all set. Redirecting to your dashboard.",
			);
			window.setTimeout(() => navigate("/dashboard"), 320);
		} catch (err) {
			const code = err?.code || "";
			if (code.includes("popup-closed-by-user")) {
				pushToast(
					"info",
					"Google sign-in cancelled",
					"No changes were made. You can try again anytime.",
				);
			} else {
				pushToast(
					"error",
					"Google sign-in failed",
					"Please try again, or continue with email and password.",
				);
			}
		} finally {
			setGoogleLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#fafafa] text-slate-900 relative overflow-hidden px-4 py-8 sm:py-12">
			<ToastStack toasts={toasts} onDismiss={dismissToast} />

			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-24 -left-20 h-[36vw] w-[36vw] rounded-full bg-slate-300/40 blur-[90px]" />
				<div className="absolute bottom-0 right-0 h-[32vw] w-[32vw] rounded-full bg-slate-200/55 blur-[95px]" />
			</div>

			<div className="relative z-10 mx-auto max-w-6xl grid gap-6 lg:grid-cols-2 items-stretch">
				<section className="hidden lg:flex rounded-4xl border border-slate-200 bg-white/90 backdrop-blur-xl p-8 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.35)]">
					<div className="flex flex-col w-full justify-between gap-8">
						<div>
							<p className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600">
								Yukti Intelligence Platform
							</p>
							<h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-black">
								Welcome back to your
								<br />
								decision workspace.
							</h1>
							<p className="mt-4 text-slate-600 max-w-md leading-relaxed">
								Resume forecasting, risk monitoring, and strategy execution from
								one focused dashboard.
							</p>
						</div>

						<div className="grid gap-3">
							{HIGHLIGHTS.map((item) => {
								const Icon = item.icon;
								return (
									<div
										key={item.title}
										className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
									>
										<div className="flex items-center gap-2 text-slate-700">
											<Icon size={14} />
											<p className="text-xs font-semibold uppercase tracking-wide">
												{item.title}
											</p>
										</div>
										<p className="mt-1 text-base font-bold text-black">
											{item.value}
										</p>
										<p className="mt-1 text-sm text-slate-600">{item.detail}</p>
									</div>
								);
							})}
						</div>
					</div>
				</section>

				<section className="rounded-4xl border border-slate-200 bg-white/95 backdrop-blur-xl p-6 sm:p-8 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.35)]">
					<div className="text-center mb-6">
						<BrandLogo
							size={44}
							className="justify-center mb-3"
							markClassName="text-slate-900"
						/>
						<h2 className="text-2xl font-bold tracking-tight text-black">
							Sign in
						</h2>
						<p className="text-sm text-slate-600 mt-1">
							Access your Yukti dashboard and continue where you left off.
						</p>
						{successState ? (
							<p className="text-xs text-emerald-700 mt-3">{successState}</p>
						) : null}
					</div>

					<button
						type="button"
						onClick={handleGoogle}
						disabled={googleLoading}
						className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

					<div className="my-5 flex items-center gap-3 text-xs text-slate-400">
						<div className="h-px flex-1 bg-slate-200" />
						<span>or sign in with email</span>
						<div className="h-px flex-1 bg-slate-200" />
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
								Email
							</label>
							<div className="relative">
								<Mail
									size={14}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
								/>
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@business.com"
									autoFocus
									required
									className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
								/>
							</div>
						</div>

						<div>
							<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
								Password
							</label>
							<div className="relative">
								<Lock
									size={14}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
								/>
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									required
									className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900"
								/>
								<button
									type="button"
									onClick={() => setShowPassword((v) => !v)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-black"
									tabIndex={-1}
								>
									{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
								</button>
							</div>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
						>
							{loading ? <Loader2 size={15} className="animate-spin" /> : null}
							{loading ? "Signing in..." : "Sign In"}
							{!loading ? <ArrowRight size={15} /> : null}
						</button>
					</form>

					<p className="mt-5 text-center text-sm text-slate-600">
						Don't have an account?{" "}
						<Link
							to="/register"
							className="font-semibold text-slate-800 hover:text-black"
						>
							Create one
						</Link>
					</p>
				</section>
			</div>
		</div>
	);
}
