import { motion as Motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { TARGET_USERS } from "./constants";

export default function HomeTargetUsersSection() {
	return (
		<section className=" lg:px-8 max-w-7xl mx-auto z-10 relative">
			<Motion.div
				initial={{ opacity: 0, y: 24 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true, margin: "-60px" }}
				transition={{ duration: 0.6, ease: "easeOut" }}
				className="text-center mb-20"
			>
				<h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-black mb-6">
					Real owners, real problems, real results
				</h2>
				<p className="text-xl text-slate-500 max-w-2xl mx-auto">
					Most data platforms are built for engineers. Yukti is built for the 63
					million Indian SMB owners who need answers, not dashboards.
				</p>
			</Motion.div>
			<div className="grid sm:grid-cols-2 gap-8">
				{TARGET_USERS.map((userType, i) => (
					<Motion.div
						key={i}
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-50px" }}
						transition={{ delay: i * 0.1, duration: 0.7 }}
						whileHover={{ scale: 1.02 }}
						className="flex flex-col p-8 rounded-4xl bg-white border border-slate-200 hover:shadow-2xl hover:shadow-black/5 transition-all"
					>
						<div className="flex items-center gap-4 mb-6">
							<div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
								<userType.icon className="text-black" size={28} />
							</div>
							<h3 className="text-2xl font-bold text-black">
								{userType.title}
							</h3>
						</div>
						<blockquote className="text-slate-600 italic border-l-4 border-slate-200 pl-4 py-1 mb-8">
							"{userType.quote}"
						</blockquote>
						<div className="space-y-3">
							{userType.points.map((point, idx) => (
								<Motion.div
									key={idx}
									initial={{ opacity: 0, x: -12 }}
									whileInView={{ opacity: 1, x: 0 }}
									viewport={{ once: true }}
									transition={{ duration: 0.35, delay: idx * 0.05 }}
									className="flex items-start gap-3"
								>
									<div className="mt-1 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
										<CheckCircle2 size={12} className="text-slate-600" />
									</div>
									<span className="text-slate-700 font-medium">{point}</span>
								</Motion.div>
							))}
						</div>
					</Motion.div>
				))}
			</div>
		</section>
	);
}
