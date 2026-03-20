import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
	Mail,
	Lock,
	ArrowRight,
	AlertCircle,
	Loader2,
	Eye,
	EyeOff,
	Sparkles,
	Orbit,
	ShieldCheck,
} from "lucide-react";
import ToastStack from "../components/ToastStack";

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
	}, [location.state, navigate, pushToast, user]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSuccessState("");
		setLoading(true);
		try {
			await login(email, password);
			setSuccessState("Sign in successful. Taking you to your dashboard...");
			pushToast("success", "Welcome back", "You are signed in successfully.");
			window.setTimeout(() => navigate("/dashboard"), 380);
		} catch (err) {
			const code = err.code || "";
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
		<div className="auth-shell min-h-screen px-4 py-6 sm:py-10">
			<ToastStack toasts={toasts} onDismiss={dismissToast} />
			<div className="auth-bg-glow auth-bg-glow-a" />
			<div className="auth-bg-glow auth-bg-glow-b" />

			<div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-6 items-stretch">
				<section className="auth-hero-card p-7 sm:p-9 hidden lg:flex flex-col justify-between">
					<div>
						<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-300/30 bg-white/5 text-cyan-100 text-xs tracking-wide uppercase">
							<Sparkles size={14} /> Yukti Intelligence
						</div>
						<h1 className="text-white text-4xl font-semibold leading-tight mt-6">
							Predict smarter.
							<br />
							Grow faster.
						</h1>
						<p className="text-slate-200 mt-4 max-w-md">
							A 6-layer analytics pipeline with resilient AI fallback and
							strategy outputs designed for Indian businesses.
						</p>
					</div>

					<div className="auth-hero-stack">
						<div className="auth-float-card">
							<Orbit size={16} className="text-cyan-300" />
							<div>
								<p className="text-white text-sm font-medium">4 AI Providers</p>
								<p className="text-slate-300 text-xs">
									Auto-fallback reliability chain
								</p>
							</div>
						</div>
						<div className="auth-float-card auth-float-card-offset">
							<ShieldCheck size={16} className="text-cyan-300" />
							<div>
								<p className="text-white text-sm font-medium">
									Secure by Firebase Auth
								</p>
								<p className="text-slate-300 text-xs">
									Built-in account protection
								</p>
							</div>
						</div>
					</div>
				</section>

				<section className="auth-form-card p-6 sm:p-8">
					<div className="text-center mb-6">
						<div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gold-600 mb-3">
							<Sparkles size={22} className="text-white" />
						</div>
						<h2 className="text-xl font-semibold text-white">Welcome Back</h2>
						<p className="text-slate-300 text-sm mt-1">
							Sign in to continue with Yukti
						</p>
						{successState ? (
							<p className="text-emerald-200 text-xs mt-3">{successState}</p>
						) : null}
					</div>

					<button
						type="button"
						onClick={handleGoogle}
						disabled={googleLoading}
						className="auth-google-btn w-full flex items-center justify-center gap-2"
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

					<div className="auth-divider my-5">
						<span>or</span>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
								<Mail size={12} strokeWidth={1.5} />
								Email
							</label>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="auth-input w-full"
								placeholder="you@business.com"
								autoFocus
								required
							/>
						</div>

						<div>
							<label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
								<Lock size={12} strokeWidth={1.5} />
								Password
							</label>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
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

						<button
							type="submit"
							disabled={loading}
							className="auth-submit-btn w-full flex items-center justify-center gap-2"
						>
							{loading ? <Loader2 size={15} className="animate-spin" /> : null}
							{loading ? "Signing in..." : "Sign In"}
							{!loading && <ArrowRight size={15} />}
						</button>
					</form>

					<p className="text-center text-sm text-slate-300 mt-5">
						Don't have an account?{" "}
						<Link
							to="/register"
							className="text-cyan-200 hover:text-cyan-100 font-medium transition-colors"
						>
							Create one
						</Link>
					</p>
				</section>
			</div>
		</div>
	);
}
