import { useState, useEffect } from "react";
import {
	Database,
	Search,
	BarChart3,
	AlertTriangle,
	TrendingUp,
	Sparkles,
	CheckCircle2,
	Loader,
	Brain,
} from "lucide-react";

const STAGES = [
	{
		icon: Database,
		label: "Reading your data",
		desc: "Importing and cleaning your file…",
		duration: 800,
	},
	{
		icon: Search,
		label: "Understanding columns",
		desc: "Detecting dates, numbers, and categories…",
		duration: 1200,
	},
	{
		icon: BarChart3,
		label: "Calculating metrics",
		desc: "Computing KPIs, averages, and trends…",
		duration: 1400,
	},
	{
		icon: AlertTriangle,
		label: "Checking for issues",
		desc: "Looking for unusual patterns or spikes…",
		duration: 1000,
	},
	{
		icon: TrendingUp,
		label: "Building forecasts",
		desc: "Projecting where your numbers are heading…",
		duration: 1200,
	},
	{
		icon: Sparkles,
		label: "Generating insights",
		desc: "Creating recommendations for your business…",
		duration: 1000,
	},
];

export default function ProcessingView({ onComplete, fileName, rowCount }) {
	const [currentStage, setCurrentStage] = useState(0);
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		let stageTimeout;
		let progressInterval;
		let accumulated = 0;
		const totalDuration = STAGES.reduce((s, st) => s + st.duration, 0);

		const advanceStage = (idx) => {
			if (idx >= STAGES.length) {
				setProgress(100);
				setTimeout(onComplete, 400);
				return;
			}

			setCurrentStage(idx);
			const stageDuration = STAGES[idx].duration;
			const stageStart = (accumulated / totalDuration) * 100;
			const stageEnd = ((accumulated + stageDuration) / totalDuration) * 100;

			let elapsed = 0;
			const step = 50;
			progressInterval = setInterval(() => {
				elapsed += step;
				const stageProgress = Math.min(elapsed / stageDuration, 1);
				setProgress(stageStart + (stageEnd - stageStart) * stageProgress);
			}, step);

			stageTimeout = setTimeout(() => {
				clearInterval(progressInterval);
				accumulated += stageDuration;
				advanceStage(idx + 1);
			}, stageDuration);
		};

		advanceStage(0);

		return () => {
			clearTimeout(stageTimeout);
			clearInterval(progressInterval);
		};
	}, []);

	return (
		<div className="min-h-[calc(100vh-60px)] flex items-center justify-center neural-bg">
			<div className="max-w-lg w-full mx-4">
				<div className="text-center mb-10">
					<div className="relative inline-block mb-6">
						<div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 border border-brand-500/30 flex items-center justify-center">
							<Brain size={32} className="text-brand-400 animate-pulse" />
						</div>
						<div
							className="absolute inset-0 rounded-2xl bg-brand-500/10 animate-ping"
							style={{ animationDuration: "2s" }}
						/>
					</div>

					<h2 className="text-xl font-bold text-white mb-2">
						Analyzing Your Data
					</h2>
					<p className="text-slate-400 text-sm">
						{fileName && <>{fileName} · </>}
						{rowCount ? `${rowCount.toLocaleString()} records` : "Processing…"}
					</p>
				</div>

				{/* Progress Bar */}
				<div className="mb-8">
					<div className="flex justify-between items-center mb-2">
						<span className="text-xs text-slate-400">Progress</span>
						<span className="text-xs text-brand-400 font-mono">
							{Math.round(progress)}%
						</span>
					</div>
					<div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
						<div
							className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full transition-all duration-200"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>

				{/* Pipeline Stages */}
				<div className="space-y-2">
					{STAGES.map((stage, idx) => {
						const isActive = idx === currentStage;
						const isComplete = idx < currentStage;

						return (
							<div
								key={idx}
								className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
									isActive
										? "glass glow-brand"
										: isComplete
											? "bg-emerald-500/5 border border-emerald-500/10"
											: "bg-slate-900/20 border border-transparent"
								}`}
							>
								<div
									className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
										isActive
											? "bg-brand-500/20"
											: isComplete
												? "bg-emerald-500/10"
												: "bg-slate-800/50"
									}`}
								>
									{isComplete ? (
										<CheckCircle2 size={14} className="text-emerald-400" />
									) : isActive ? (
										<Loader size={14} className="text-brand-400 animate-spin" />
									) : (
										<stage.icon size={14} className="text-slate-600" />
									)}
								</div>

								<div className="flex-1 min-w-0">
									<p
										className={`text-xs font-medium ${isActive ? "text-white" : isComplete ? "text-emerald-300" : "text-slate-600"}`}
									>
										{stage.label}
									</p>
									{(isActive || isComplete) && (
										<p
											className={`text-[10px] ${isActive ? "text-slate-400" : "text-slate-600"} truncate`}
										>
											{isComplete ? "Done" : stage.desc}
										</p>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
