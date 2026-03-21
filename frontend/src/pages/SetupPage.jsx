import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
		<div className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-4">
			<form
				onSubmit={handleSubmit}
				className="w-full max-w-md p-8 rounded-2xl bg-gray-900 space-y-6"
			>
				<h1 className="text-2xl font-bold">Welcome to Yukti</h1>
				<p className="text-gray-400 text-sm">
					Enter your API keys to get started.
				</p>

				{["gemini_api_key", "groq_api_key", "anthropic_api_key"].map((key) => (
					<div key={key}>
						<label className="text-xs uppercase tracking-widest text-gray-500 mb-1 block">
							{key.replace(/_/g, " ")}
						</label>
						<input
							type="password"
							className="w-full bg-gray-800 rounded-lg px-4 py-2 text-sm outline-none"
							value={keys[key]}
							onChange={(e) => setKeys({ ...keys, [key]: e.target.value })}
						/>
					</div>
				))}

				<button
					type="submit"
					disabled={saving}
					className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-lg py-2 font-medium transition disabled:opacity-60"
				>
					{saving ? "Saving..." : "Save & Continue"}
				</button>
			</form>
		</div>
	);
}
