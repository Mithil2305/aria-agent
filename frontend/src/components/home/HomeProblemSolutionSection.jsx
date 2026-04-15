import { motion as Motion } from "framer-motion";
import { PROBLEM_SIGNALS } from "./constants";

export default function HomeProblemSolutionSection({ beforePath, afterPath }) {
	return (
		<section className="py-28 px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
			<Motion.div
				initial={{ opacity: 0, y: 24 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true, margin: "-60px" }}
				transition={{ duration: 0.65, ease: "easeOut" }}
				className="mb-14 text-center"
			>
				<h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-black mb-5">
					The real problem is not data. It is decision delay.
				</h2>
				<p className="text-xl text-slate-500 max-w-3xl mx-auto">
					Most SMBs collect numbers every day but still react too late. Yukti
					turns those numbers into immediate, prioritized actions.
				</p>
			</Motion.div>
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				<Motion.div
					initial={{ opacity: 0, x: -24 }}
					whileInView={{ opacity: 1, x: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.7, ease: "easeOut" }}
					className="lg:col-span-7 rounded-4xl bg-white border border-slate-200 p-8 shadow-sm"
				>
					<div className="flex items-center justify-between mb-6">
						<div>
							<p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
								Trend Story
							</p>
							<h3 className="text-2xl font-bold text-black mt-2">
								Before Yukti vs After Yukti
							</h3>
						</div>
						<div className="text-right">
							<p className="text-xs text-slate-500">12-week signal</p>
							<p className="text-sm font-semibold text-slate-800">
								Stability + direction
							</p>
						</div>
					</div>
					<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 relative overflow-hidden">
						<svg viewBox="0 0 420 210" className="w-full h-56">
							<defs>
								<linearGradient id="beforeStroke" x1="0" y1="0" x2="1" y2="0">
									<stop offset="0%" stopColor="#ef4444" />
									<stop offset="100%" stopColor="#f59e0b" />
								</linearGradient>
								<linearGradient id="afterStroke" x1="0" y1="0" x2="1" y2="0">
									<stop offset="0%" stopColor="#0f766e" />
									<stop offset="100%" stopColor="#14b8a6" />
								</linearGradient>
							</defs>
							{[0, 1, 2, 3].map((line) => (
								<line
									key={line}
									x1="0"
									x2="420"
									y1={30 + line * 45}
									y2={30 + line * 45}
									stroke="#e2e8f0"
									strokeDasharray="4 6"
								/>
							))}
							<Motion.path
								d={beforePath}
								fill="none"
								stroke="url(#beforeStroke)"
								strokeWidth="4"
								strokeLinecap="round"
								initial={{ pathLength: 0 }}
								whileInView={{ pathLength: 1 }}
								viewport={{ once: true }}
								transition={{ duration: 1.2, ease: "easeOut" }}
							/>
							<Motion.path
								d={afterPath}
								fill="none"
								stroke="url(#afterStroke)"
								strokeWidth="4"
								strokeLinecap="round"
								initial={{ pathLength: 0 }}
								whileInView={{ pathLength: 1 }}
								viewport={{ once: true }}
								transition={{ duration: 1.2, ease: "easeOut", delay: 0.25 }}
							/>
						</svg>
						<div className="absolute left-4 top-4 flex flex-wrap gap-2 text-[11px]">
							<span className="px-2 py-1 rounded-full bg-red-100 text-red-700 font-semibold">
								Before: reactive decisions
							</span>
							<span className="px-2 py-1 rounded-full bg-teal-100 text-teal-700 font-semibold">
								After: guided execution
							</span>
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
						{[
							{
								label: "Reaction Time",
								value: "-57%",
								tone: "text-emerald-700",
							},
							{
								label: "Planning Accuracy",
								value: "+41%",
								tone: "text-emerald-700",
							},
							{
								label: "Missed Signals",
								value: "-63%",
								tone: "text-emerald-700",
							},
						].map((metric, metricIdx) => (
							<Motion.div
								key={metric.label}
								initial={{ opacity: 0, y: 14 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.45, delay: metricIdx * 0.08 }}
								className="rounded-xl border border-slate-200 bg-white p-3"
							>
								<p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
									{metric.label}
								</p>
								<p className={`text-lg font-bold mt-1 ${metric.tone}`}>
									{metric.value}
								</p>
							</Motion.div>
						))}
					</div>
				</Motion.div>
				<div className="lg:col-span-5 grid grid-cols-1 gap-4">
					{PROBLEM_SIGNALS.map((signal, idx) => (
						<Motion.div
							key={signal.title}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.55, delay: idx * 0.1 }}
							className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
						>
							<div className="flex items-start justify-between gap-3 mb-3">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
										<signal.icon size={18} />
									</div>
									<h4 className="text-lg font-bold text-black">
										{signal.title}
									</h4>
								</div>
								<span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
									{signal.severity}
								</span>
							</div>
							<p className="text-sm text-slate-600 leading-relaxed mb-2">
								<span className="font-semibold text-slate-800">Problem: </span>
								{signal.problem}
							</p>
							<p className="text-sm text-teal-700 leading-relaxed">
								<span className="font-semibold">Solution: </span>
								{signal.solution}
							</p>
						</Motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
