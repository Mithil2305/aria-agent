import { Brain, Layers } from "lucide-react";

export default function Header({ stage, fileName }) {
	return (
		<header className="glass sticky top-0 z-50">
			<div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="relative">
						<div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
							<Brain size={18} className="text-white" />
						</div>
						{stage === "dashboard" && (
							<div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
						)}
					</div>
					<div>
						<h1 className="text-sm font-bold tracking-tight text-white">
							ARIA{" "}
							<span className="font-normal text-slate-400">
								Business Intelligence
							</span>
						</h1>
						<p className="text-[10px] text-slate-500 -mt-0.5">
							Smart analytics for growing businesses
						</p>
					</div>
				</div>

				<div className="flex items-center gap-4">
					{stage === "dashboard" && fileName && (
						<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
							<Layers size={12} className="text-brand-400" />
							<span className="text-xs text-slate-400">{fileName}</span>
						</div>
					)}

					<div className="flex items-center gap-1.5">
						<StatusDot stage={stage} />
						<span className="text-[10px] text-slate-500 uppercase tracking-widest">
							{stage === "upload"
								? "Ready"
								: stage === "processing"
									? "Analyzing"
									: "Live"}
						</span>
					</div>
				</div>
			</div>
		</header>
	);
}

function StatusDot({ stage }) {
	const color =
		stage === "dashboard"
			? "bg-emerald-400"
			: stage === "processing"
				? "bg-amber-400 animate-pulse"
				: "bg-slate-500";

	return <div className={`w-1.5 h-1.5 rounded-full ${color}`} />;
}
