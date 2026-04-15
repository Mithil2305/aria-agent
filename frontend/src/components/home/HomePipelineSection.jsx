import { useRef } from "react";
import { motion as Motion, useInView } from "framer-motion";
import { CheckCircle2, Layers } from "lucide-react";
import { PIPELINE, fadeInUp, staggerContainer } from "./constants";

export default function HomePipelineSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: "-80px" });

	return (
		<section
			ref={ref}
			className="py-32 bg-[#0a0a0a] text-white relative z-10 rounded-t-[3rem]"
		>
			<div className="absolute -top-64 right-10 w-96 h-96 bg-white/5 filter blur-[90px] rounded-full pointer-events-none" />
			<div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
				<div className="grid lg:grid-cols-2 gap-20 items-center">
					<Motion.div
						initial={{ opacity: 0, x: -50 }}
						animate={isInView ? { opacity: 1, x: 0 } : {}}
						transition={{ duration: 0.8, ease: "easeOut" }}
					>
						<div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10 backdrop-blur-md">
							<Layers size={32} className="text-slate-100" />
						</div>
						<h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 whitecol">
							Six layers between raw data and real decisions
						</h2>
						<p className="text-slate-400 text-xl leading-relaxed mb-10">
							Every dataset you upload passes through six intelligent processing
							layers. By the time it reaches you, it is no longer data, it is a
							clear action plan.
						</p>
						<div className="flex flex-col gap-6">
							<div className="flex items-start gap-4 bg-white/5 border border-white/5 p-5 rounded-2xl backdrop-blur-sm">
								<CheckCircle2 className="text-slate-300 shrink-0 mt-0.5" />
								<div>
									<h4 className="font-semibold text-lg whitecol">
										Four AI Providers. Zero Downtime.
									</h4>
									<p className="text-sm text-slate-400 mt-2">
										Gemini, Groq, Claude, and our Rule-Based Engine. What
										happens when an AI provider goes down? Yukti automatically
										switches to the next one.
									</p>
								</div>
							</div>
							<div className="flex items-start gap-4 p-5">
								<CheckCircle2 className="text-slate-300 shrink-0 mt-0.5" />
								<div>
									<h4 className="font-semibold text-lg whitecol">
										This model thinks Indian
									</h4>
									<p className="text-sm text-slate-400 mt-2">
										Trained specifically on Indian retail, restaurant, and
										service business patterns. It understands festivals, local
										contexts, and SMB realities.
									</p>
								</div>
							</div>
						</div>
					</Motion.div>

					<Motion.div
						initial="hidden"
						animate={isInView ? "visible" : "hidden"}
						variants={staggerContainer}
						className="relative bg-white/2 border border-white/5 p-8 md:p-12 rounded-[2.5rem] backdrop-blur-xl"
					>
						<div className="absolute left-10 md:left-14 top-14 bottom-14 w-px bg-linear-to-b from-white/20 via-white/10 to-transparent" />
						<div className="space-y-6 relative">
							{PIPELINE.map((layer, index) => (
								<Motion.div
									key={layer.name}
									variants={fadeInUp}
									className="relative flex items-center gap-6 group cursor-default"
								>
									<div className="relative z-10 w-8 h-8 rounded-full bg-black border-2 border-slate-700 flex items-center justify-center text-xs font-bold font-mono group-hover:border-white transition-colors">
										{index + 1}
									</div>
									<div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
										<p className="text-lg font-bold text-slate-200 group-hover:text-white">
											{layer.name}
										</p>
										<p className="text-sm text-slate-400 mt-1">{layer.desc}</p>
									</div>
								</Motion.div>
							))}
						</div>
					</Motion.div>
				</div>
			</div>
		</section>
	);
}
