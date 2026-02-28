import { useState } from "react";
import {
	Upload,
	FileSpreadsheet,
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
		<div className="min-h-[calc(100vh-60px)] flex items-center justify-center">
			<div className="max-w-md w-full mx-4">
				{/* Hero */}
				<div className="text-center mb-10 animate-fade-in-up">
					<h2 className="text-2xl font-semibold text-surface-900 mb-3 tracking-tight">
						Import Your Business Data
					</h2>
					<p className="text-surface-500 text-sm max-w-sm mx-auto leading-relaxed">
						Upload your sales, expenses, or inventory data and get clear
						insights, forecasts, and recommendations.
					</p>
				</div>

				{/* Upload Zone */}
				<div
					className={`relative rounded-xl border-2 border-dashed transition-all duration-300 p-10 text-center cursor-pointer group ${
						isDragging
							? "border-gold-500 bg-gold-50 scale-[1.02]"
							: "border-surface-300 hover:border-surface-400 bg-surface-100 hover:bg-surface-50"
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
						className={`w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center transition-all ${
							isDragging
								? "bg-gold-100 scale-110"
								: "bg-surface-200 group-hover:bg-surface-300"
						}`}
					>
						<Upload
							size={20}
							strokeWidth={1.5}
							className={`transition-colors ${isDragging ? "text-gold-600" : "text-surface-500 group-hover:text-surface-600"}`}
						/>
					</div>

					<p className="text-surface-700 font-medium mb-1 text-sm">
						{isDragging ? "Release to upload" : "Drop your file here"}
					</p>
					<p className="text-surface-500 text-xs">or click to browse</p>
					<p className="text-surface-400 text-[11px] mt-2">
						Supports CSV and Excel files · Up to 50MB
					</p>

					{error && (
						<div className="mt-4 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
							{error}
						</div>
					)}
				</div>

				{/* Demo Dataset */}
				<div className="mt-6 text-center">
					<button
						onClick={onDemoLoad}
						className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-100 hover:bg-surface-200 border border-surface-300 hover:border-surface-400 text-sm text-surface-600 hover:text-surface-900 transition-all group"
					>
						<FileSpreadsheet size={14} className="text-gold-600" />
						Try with sample data
						<ArrowRight
							size={14}
							className="text-surface-400 group-hover:text-gold-600 group-hover:translate-x-0.5 transition-all"
						/>
					</button>
					<p className="text-[10px] text-surface-400 mt-2">
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
							label: "Performance",
							desc: "KPIs & trend analysis",
						},
						{
							icon: TrendingUp,
							label: "Forecasts",
							desc: "Where numbers are heading",
						},
						{
							icon: ShieldCheck,
							label: "Actions",
							desc: "What to do next",
						},
					].map((item, i) => (
						<div key={i} className="card p-3 text-center">
							<div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center mx-auto mb-2">
								<item.icon
									size={14}
									className="text-surface-500"
									strokeWidth={1.5}
								/>
							</div>
							<p className="text-xs font-medium text-surface-700 mb-0.5">
								{item.label}
							</p>
							<p className="text-[10px] text-surface-500">{item.desc}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
