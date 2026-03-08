import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
	Mail,
	Lock,
	ArrowRight,
	AlertCircle,
	Loader2,
	Eye,
	EyeOff,
	Sparkles,
} from "lucide-react";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			await login(email, password);
			navigate("/");
		} catch (err) {
			const code = err.code || "";
			if (
				code.includes("user-not-found") ||
				code.includes("wrong-password") ||
				code.includes("invalid-credential")
			) {
				setError("Invalid email or password");
			} else if (code.includes("too-many-requests")) {
				setError("Too many attempts. Please try again later.");
			} else {
				setError("Login failed. Please try again.");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-surface-100 flex items-center justify-center px-4">
			<div className="w-full max-w-sm">
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

				{/* Form */}
				<form
					onSubmit={handleSubmit}
					className="card-elevated p-8 space-y-5 animate-fade-in-up"
					style={{ animationDelay: "80ms" }}
				>
					<div className="text-center mb-2">
						<h2 className="text-lg font-medium text-surface-900">
							Welcome back
						</h2>
						<p className="text-sm text-surface-400 mt-0.5">
							Sign in to your account
						</p>
					</div>

					{error && (
						<div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
							<AlertCircle size={14} className="text-red-500 shrink-0" />
							<p className="text-sm text-red-600">{error}</p>
						</div>
					)}

					<div>
						<label className="flex items-center gap-1.5 text-xs font-medium text-surface-600 mb-1.5">
							<Mail size={12} strokeWidth={1.5} />
							Email
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="input-field w-full"
							placeholder="you@business.com"
							autoFocus
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
								value={password}
								onChange={(e) => setPassword(e.target.value)}
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

					<button
						type="submit"
						disabled={loading}
						className="btn-primary w-full flex items-center justify-center gap-2"
					>
						{loading ? <Loader2 size={15} className="animate-spin" /> : null}
						{loading ? "Signing in…" : "Sign In"}
						{!loading && <ArrowRight size={15} />}
					</button>
				</form>

				<p className="text-center text-sm text-surface-400 mt-6">
					Don&apos;t have an account?{" "}
					<Link
						to="/register"
						className="text-gold-600 hover:text-gold-700 font-medium transition-colors"
					>
						Start free trial
					</Link>
				</p>
			</div>
		</div>
	);
}
