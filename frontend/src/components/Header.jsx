import { Activity, Layers } from "lucide-react";

export default function Header({ stage, fileName }) {
	return (
		<header className="card sticky top-0 z-50 rounded-none border-x-0 border-t-0">
			<div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="relative">
						<div className="w-9 h-9 rounded-lg bg-surface-100 border border-surface-300 flex items-center justify-center">
							<Activity size={18} className="text-gold-600" />
						</div>
						{stage === "dashboard" && (
							<div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
						)}
					</div>
					<div>
						<h1 className="text-sm font-bold tracking-tight text-surface-900">
							Yukti{" "}
							<span className="font-normal text-surface-500">
								Business Intelligence
							</span>
						</h1>
						<p className="text-[10px] text-surface-500 -mt-0.5">
							Smart analytics for growing businesses
						</p>
					</div>
				</div>

				<div className="flex items-center gap-4">
					{stage === "dashboard" && fileName && (
						<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-100 border border-surface-300">
							<Layers size={12} className="text-gold-600" />
							<span className="text-xs text-surface-500">{fileName}</span>
						</div>
					)}

					<div className="flex items-center gap-1.5">
						<StatusDot stage={stage} />
						<span className="text-[10px] text-surface-500 uppercase tracking-widest">
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
			? "bg-green-400"
			: stage === "processing"
				? "bg-amber-400 animate-pulse"
				: "bg-surface-500";

	return <div className={`w-1.5 h-1.5 rounded-full ${color}`} />;
}
