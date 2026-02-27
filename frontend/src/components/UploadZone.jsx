import { useState } from "react";
import {
	Upload,
	FileSpreadsheet,
	Sparkles,
	ArrowRight,
	BarChart3,
	TrendingUp,
	ShieldCheck,
} from "lucide-react";

export default function UploadZone({ onFileSelect, onDemoLoad }) {
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState(null);

	const validateAndSelect = (file) => {
		setError(null);
		const ext = file.name.split(".").pop().toLowerCase();
		if (!["csv", "xlsx", "xls"].includes(ext)) {
			setError("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
			return;
		}
		if (file.size > 50 * 1024 * 1024) {
			setError("File is too large. Maximum size is 50MB.");
			return;
		}
		onFileSelect(file);
	};

	const handleDrag = (e) => {
		e.preventDefault();
		e.stopPropagation();
	};
	const handleDragIn = (e) => {
		e.preventDefault();
		setIsDragging(true);
	};
	const handleDragOut = (e) => {
		e.preventDefault();
		setIsDragging(false);
	};
	const handleDrop = (e) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (file) validateAndSelect(file);
	};
	const handleFileInput = (e) => {
		const file = e.target.files[0];
		if (file) validateAndSelect(file);
	};

	return (
		<div className="min-h-[calc(100vh-60px)] flex items-center justify-center neural-bg">
			<div className="max-w-xl w-full mx-4">
				{/* Hero */}
				<div className="text-center mb-10 animate-fade-in-up">
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-6">
						<Sparkles size={12} className="text-brand-400" />
						<span className="text-xs text-brand-300 font-medium">
							Smart Business Analytics
						</span>
					</div>
					<h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
						Understand Your Business
						<span className="bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">
							{" "}
							Better
						</span>
					</h2>
					<p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
						Upload your business data and get clear insights, forecasts, and
						recommendations — no technical skills needed.
					</p>
				</div>

				{/* Upload Zone */}
				<div
					className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 p-10 text-center cursor-pointer group ${
						isDragging
							? "border-brand-400 bg-brand-500/10 scale-[1.02]"
							: "border-slate-700 hover:border-slate-500 bg-slate-900/30 hover:bg-slate-800/30"
					}`}
					onDragEnter={handleDragIn}
					onDragLeave={handleDragOut}
					onDragOver={handleDrag}
					onDrop={handleDrop}
					onClick={() => document.getElementById("file-input").click()}
				>
					<input
						id="file-input"
						type="file"
						accept=".csv,.xlsx,.xls"
						className="hidden"
						onChange={handleFileInput}
					/>

					<div
						className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all ${
							isDragging
								? "bg-brand-500/20 scale-110"
								: "bg-slate-800 group-hover:bg-slate-700"
						}`}
					>
						<Upload
							size={22}
							className={`transition-colors ${isDragging ? "text-brand-400" : "text-slate-400 group-hover:text-slate-300"}`}
						/>
					</div>

					<p className="text-white font-medium mb-1">
						{isDragging ? "Release to upload" : "Drop your file here"}
					</p>
					<p className="text-slate-500 text-sm">or click to browse</p>
					<p className="text-slate-600 text-[11px] mt-2">
						Supports CSV and Excel files · Up to 50MB
					</p>

					{error && (
						<div className="mt-4 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
							{error}
						</div>
					)}
				</div>

				{/* Demo Dataset */}
				<div className="mt-6 text-center">
					<button
						onClick={onDemoLoad}
						className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-700/70 border border-slate-700/50 hover:border-slate-600/50 text-sm text-slate-300 hover:text-white transition-all group"
					>
						<FileSpreadsheet size={14} className="text-brand-400" />
						Try with sample data
						<ArrowRight
							size={14}
							className="text-slate-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all"
						/>
					</button>
					<p className="text-[10px] text-slate-600 mt-2">
						36 months of business metrics — revenue, customers, marketing &amp;
						more
					</p>
				</div>

				{/* What you get */}
				<div
					className="mt-12 grid grid-cols-3 gap-3 animate-fade-in-up opacity-0"
					style={{ animationDelay: "300ms" }}
				>
					{[
						{
							icon: BarChart3,
							label: "Performance Metrics",
							desc: "KPIs, trends & patterns",
						},
						{
							icon: TrendingUp,
							label: "Forecasts",
							desc: "Where your numbers are heading",
						},
						{
							icon: ShieldCheck,
							label: "Recommendations",
							desc: "What to do next",
						},
					].map((item, i) => (
						<div key={i} className="glass-light rounded-xl p-3 text-center">
							<div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center mx-auto mb-2">
								<item.icon size={14} className="text-brand-400" />
							</div>
							<p className="text-xs font-medium text-slate-300 mb-0.5">
								{item.label}
							</p>
							<p className="text-[10px] text-slate-500">{item.desc}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
