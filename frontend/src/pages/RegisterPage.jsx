import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
	Mail,
	Lock,
	User,
	Building2,
	ArrowRight,
	AlertCircle,
	Loader2,
} from "lucide-react";

export default function RegisterPage() {
	const [form, setForm] = useState({
		ownerName: "",
		businessName: "",
		email: "",
		password: "",
		confirm: "",
	});
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const { register } = useAuth();
	const navigate = useNavigate();

	const update = (key) => (e) =>
		setForm((prev) => ({ ...prev, [key]: e.target.value }));

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		if (form.password.length < 6) {
			setError("Password must be at least 6 characters");
			return;
		}
		if (form.password !== form.confirm) {
			setError("Passwords do not match");
			return;
		}
		setLoading(true);
		try {
			await register(
				form.email,
				form.password,
				form.businessName,
				form.ownerName,
			);
			navigate("/");
		} catch (err) {
			const code = err.code || "";
			if (code.includes("email-already-in-use")) {
				setError("An account with this email already exists");
			} else if (code.includes("weak-password")) {
				setError("Password is too weak. Use at least 6 characters.");
			} else {
				setError("Registration failed. Please try again.");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-surface-100 flex items-center justify-center px-4 py-8">
			<div className="w-full max-w-sm">
				{/* Brand */}
				<div className="text-center mb-10 animate-fade-in-up">
					<h1 className="text-2xl font-semibold text-surface-900 tracking-tight">
						ARIA
					</h1>
					<p className="text-xs text-surface-400 mt-1 tracking-wide uppercase">
						Business Intelligence
					</p>
				</div>

				{/* Form */}
				<form
					onSubmit={handleSubmit}
					className="card-elevated p-8 space-y-4 animate-fade-in-up"
					style={{ animationDelay: "80ms" }}
				>
					<div className="text-center mb-2">
						<h2 className="text-lg font-medium text-surface-900">
							Create your account
						</h2>
						<p className="text-sm text-surface-400 mt-0.5">
							Start analyzing your business in minutes
						</p>
					</div>

					{error && (
						<div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
							<AlertCircle size={14} className="text-red-500 shrink-0" />
							<p className="text-sm text-red-600">{error}</p>
						</div>
					)}

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="flex items-center gap-1.5 text-xs font-medium text-surface-600 mb-1.5">
								<User size={12} strokeWidth={1.5} />
								Your Name
							</label>
							<input
								type="text"
								value={form.ownerName}
								onChange={update("ownerName")}
								className="input-field w-full"
								placeholder="John"
								required
							/>
						</div>
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
								placeholder="Acme Inc"
								required
							/>
						</div>
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

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="flex items-center gap-1.5 text-xs font-medium text-surface-600 mb-1.5">
								<Lock size={12} strokeWidth={1.5} />
								Password
							</label>
							<input
								type="password"
								value={form.password}
								onChange={update("password")}
								className="input-field w-full"
								placeholder="••••••••"
								required
							/>
						</div>
						<div>
							<label className="flex items-center gap-1.5 text-xs font-medium text-surface-600 mb-1.5">
								<Lock size={12} strokeWidth={1.5} />
								Confirm
							</label>
							<input
								type="password"
								value={form.confirm}
								onChange={update("confirm")}
								className="input-field w-full"
								placeholder="••••••••"
								required
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="btn-primary w-full flex items-center justify-center gap-2"
					>
						{loading ? <Loader2 size={15} className="animate-spin" /> : null}
						{loading ? "Creating account…" : "Get Started Free"}
						{!loading && <ArrowRight size={15} />}
					</button>
				</form>

				<p className="text-center text-sm text-surface-400 mt-6">
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
