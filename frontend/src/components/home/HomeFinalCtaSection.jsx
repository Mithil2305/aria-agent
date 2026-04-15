import { motion as Motion } from "framer-motion";

export default function HomeFinalCtaSection({ activeVariant, onPrimaryClick }) {
	return (
		<section className="py-24 px-6 lg:px-8 mb-10 z-10 relative">
			<Motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				whileInView={{ opacity: 1, scale: 1 }}
				viewport={{ once: true, margin: "-80px" }}
				transition={{ duration: 0.8 }}
				className="max-w-6xl mx-auto bg-black text-white rounded-[3rem] p-12 md:p-20 lg:p-24 text-center relative overflow-hidden shadow-2xl shadow-black/20"
			>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-slate-700/50 via-transparent to-transparent opacity-60" />
				<div className="absolute inset-0 opacity-[0.1] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwbDQwIDQwbTAtNDBMMCA0MCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')]" />
				<div className="relative z-10">
					<Motion.h2
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.55, delay: 0.08 }}
						className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8 whitecol"
					>
						{activeVariant.finalTitle}
					</Motion.h2>
					<Motion.p
						initial={{ opacity: 0, y: 18 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.55, delay: 0.16 }}
						className="text-xl lg:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed whitecol"
					>
						{activeVariant.finalBody}
					</Motion.p>
					<Motion.div
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5, delay: 0.24 }}
						className="flex flex-col sm:flex-row gap-5 justify-center"
					>
						<button
							onClick={onPrimaryClick}
							className="px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center"
						>
							{activeVariant.finalPrimary}
						</button>
					</Motion.div>
				</div>
			</Motion.div>
		</section>
	);
}
