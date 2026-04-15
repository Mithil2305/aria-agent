import { motion as Motion } from "framer-motion";
import { TICKER_ITEMS } from "./constants";

export default function HomeTickerSection({
	prefersReducedMotion,
	enableMotionEffects,
}) {
	const shouldAnimate = !prefersReducedMotion && enableMotionEffects;

	return (
		<section className="py-12 border-y border-slate-200 bg-white z-10 relative overflow-hidden">
			<Motion.div
				animate={shouldAnimate ? { x: [0, -1000] } : undefined}
				transition={
					shouldAnimate
						? { duration: 40, repeat: Infinity, ease: "linear" }
						: undefined
				}
				className={`flex items-center gap-10 opacity-60 grayscale whitespace-nowrap min-w-max px-6 ${shouldAnimate ? "will-change-transform" : ""}`}
			>
				{[...Array(3)].map((_, j) => (
					<div
						key={j}
						className="flex items-center gap-10 text-slate-800 font-bold text-lg tracking-tight"
					>
						{TICKER_ITEMS.map((item, i) => (
							<div key={i} className="flex items-center gap-3">
								<item.icon size={24} />
								<span>{item.label}</span>
							</div>
						))}
					</div>
				))}
			</Motion.div>
		</section>
	);
}
