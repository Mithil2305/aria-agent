import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
	Brain,
	Mail,
	Lock,
	User,
	Building2,
	ArrowRight,
	AlertCircle,
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
		<div className="min-h-screen bg-slate-950 flex items-center justify-center neural-bg px-4 py-8">
			<div className="w-full max-w-md">
				{/* Brand */}
				<div className="text-center mb-8 animate-fade-in-up">
					<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
						<Brain size={28} className="text-white" />
					</div>
					<h1 className="text-2xl font-bold text-white">Create your account</h1>
					<p className="text-sm text-slate-400 mt-1">
						Start analyzing your business data in minutes
					</p>
				</div>

				{/* Form */}
				<form
					onSubmit={handleSubmit}
					className="glass rounded-2xl p-8 space-y-4 animate-fade-in-up"
					style={{ animationDelay: "100ms" }}
				>
					{error && (
						<div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
							<AlertCircle size={14} className="text-rose-400 shrink-0" />
							<p className="text-sm text-rose-400">{error}</p>
						</div>
					)}

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-xs font-medium text-slate-400 mb-1.5">
								Your Name
							</label>
							<div className="relative">
								<User
									size={16}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
								/>
								<input
									type="text"
									value={form.ownerName}
									onChange={update("ownerName")}
									className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
									placeholder="John"
									required
								/>
							</div>
						</div>
						<div>
							<label className="block text-xs font-medium text-slate-400 mb-1.5">
								Business Name
							</label>
							<div className="relative">
								<Building2
									size={16}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
								/>
								<input
									type="text"
									value={form.businessName}
									onChange={update("businessName")}
									className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
									placeholder="Acme Inc"
									required
								/>
							</div>
						</div>
					</div>

					<div>
						<label className="block text-xs font-medium text-slate-400 mb-1.5">
							Email
						</label>
						<div className="relative">
							<Mail
								size={16}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
							/>
							<input
								type="email"
								value={form.email}
								onChange={update("email")}
								className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
								placeholder="you@business.com"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-xs font-medium text-slate-400 mb-1.5">
								Password
							</label>
							<div className="relative">
								<Lock
									size={16}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
								/>
								<input
									type="password"
									value={form.password}
									onChange={update("password")}
									className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
									placeholder="••••••••"
									required
								/>
							</div>
						</div>
						<div>
							<label className="block text-xs font-medium text-slate-400 mb-1.5">
								Confirm
							</label>
							<div className="relative">
								<Lock
									size={16}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
								/>
								<input
									type="password"
									value={form.confirm}
									onChange={update("confirm")}
									className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
									placeholder="••••••••"
									required
								/>
							</div>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-lg shadow-brand-600/20"
					>
						{loading ? "Creating account…" : "Get Started Free"}
						{!loading && <ArrowRight size={16} />}
					</button>
				</form>

				<p className="text-center text-sm text-slate-500 mt-6">
					Already have an account?{" "}
					<Link
						to="/login"
						className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
					>
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
}
