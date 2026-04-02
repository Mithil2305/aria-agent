import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { KeyRound, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function SetupPage() {
	const navigate = useNavigate();
	const [keys, setKeys] = useState({
		gemini_api_key: "",
		groq_api_key: "",
		anthropic_api_key: "",
	});
	const [saving, setSaving] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSaving(true);
		try {
			await axios.post("/api/setup", keys);
			navigate("/", { replace: true });
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="auth-shell min-h-screen px-4 py-8 sm:py-12">
			<div className="auth-bg-glow auth-bg-glow-a" />
			<div className="auth-bg-glow auth-bg-glow-b" />

			<div className="relative z-10 max-w-5xl mx-auto grid lg:grid-cols-2 gap-6 items-stretch">
				<section className="auth-hero-card p-7 sm:p-9 hidden lg:flex flex-col justify-between">
					<div>
						<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-200 bg-white/80 text-amber-700 text-xs tracking-wide uppercase">
							<Sparkles size={14} /> API configuration
						</div>
						<h1 className="text-slate-900 text-4xl font-semibold leading-tight mt-6">
							Finalize your
							<br />
							intelligence stack.
						</h1>
						<p className="text-slate-600 mt-4 max-w-md">
							Add your provider keys once, and Yukti will automatically route
							requests through the best available model.
						</p>
					</div>

					<div className="auth-float-card">
						<ShieldCheck size={16} className="text-amber-700" />
						<div>
							<p className="text-slate-900 text-sm font-medium">
								Stored securely server-side
							</p>
							<p className="text-slate-600 text-xs">
								You can update keys later from settings.
							</p>
						</div>
					</div>
				</section>

				<form
					onSubmit={handleSubmit}
					className="auth-form-card p-6 sm:p-8 space-y-5"
				>
					<div className="text-center">
						<div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gold-600 mb-3 shadow-sm">
							<KeyRound size={20} className="text-white" />
						</div>
						<h2 className="text-xl font-semibold text-slate-900">
							Welcome to Yukti
						</h2>
						<p className="text-slate-600 text-sm mt-1">
							Enter your API keys to activate analysis and strategy engines.
						</p>
					</div>

					{["gemini_api_key", "groq_api_key", "anthropic_api_key"].map(
						(key) => (
							<div key={key}>
								<label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
									<KeyRound size={11} />
									{key.replace(/_/g, " ")}
								</label>
								<input
									type="password"
									className="auth-input w-full"
									value={keys[key]}
									onChange={(e) => setKeys({ ...keys, [key]: e.target.value })}
									placeholder="Paste key"
									required
								/>
							</div>
						),
					)}

					<button
						type="submit"
						disabled={saving}
						className="auth-submit-btn w-full flex items-center justify-center gap-2"
					>
						{saving ? "Saving..." : "Save & Continue"}
						{!saving && <ArrowRight size={14} />}
					</button>
				</form>
			</div>
		</div>
	);
}
