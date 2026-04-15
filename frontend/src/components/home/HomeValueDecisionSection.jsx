import { motion as Motion } from "framer-motion";
import { AlertTriangle, Workflow } from "lucide-react";
import { DECISION_LOOP, VALUE_PILLARS } from "./constants";

export default function HomeValueDecisionSection() {
	return (
		<section className="py-28 lg:px-8 max-w-7xl mx-auto z-10 relative">
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				<Motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-70px" }}
					transition={{ duration: 0.65, ease: "easeOut" }}
					className="lg:col-span-7 rounded-4xl bg-white border border-slate-200 p-8"
				>
					<h3 className="text-3xl font-extrabold tracking-tight text-black mb-4">
						What value looks like in practice
					</h3>
					<p className="text-slate-500 text-lg mb-7">
						Yukti is not another dashboard. It is a weekly decision system that
						moves from signal to execution.
					</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{VALUE_PILLARS.map((pillar, idx) => (
							<Motion.div
								key={pillar.title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: idx * 0.08 }}
								className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
							>
								<div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 mb-3">
									<pillar.icon size={17} />
								</div>
								<p className="text-base font-bold text-black">{pillar.title}</p>
								<p className="text-sm text-slate-600 mt-1.5">{pillar.desc}</p>
							</Motion.div>
						))}
					</div>
				</Motion.div>
				<Motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-70px" }}
					transition={{ duration: 0.65, delay: 0.08, ease: "easeOut" }}
					className="lg:col-span-5 rounded-4xl border border-slate-200 bg-black text-white p-7"
				>
					<div className="flex items-center gap-2 mb-5">
						<Workflow size={16} className="text-slate-300" />
						<p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
							Decision Loop
						</p>
					</div>
					<div className="space-y-3">
						{DECISION_LOOP.map((step, idx) => (
							<Motion.div
								key={step.title}
								initial={{ opacity: 0, x: 16 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.45, delay: idx * 0.08 }}
								className="rounded-xl border border-white/10 bg-white/5 px-4 py-3.5"
							>
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
										<step.icon size={14} className="text-slate-200" />
									</div>
									<div>
										<p className="text-sm font-semibold text-white">
											{step.title}
										</p>
										<p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
									</div>
								</div>
							</Motion.div>
						))}
					</div>
					<Motion.div
						initial={{ opacity: 0, y: 10 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.45, delay: 0.3 }}
						className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs text-amber-100 flex items-start gap-2"
					>
						<AlertTriangle size={14} className="mt-0.5 shrink-0" />
						Without this loop, businesses review data monthly. With Yukti, they
						react weekly.
					</Motion.div>
				</Motion.div>
			</div>
		</section>
	);
}
