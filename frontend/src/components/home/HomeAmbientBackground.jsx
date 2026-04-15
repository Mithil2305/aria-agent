import { motion as Motion } from "framer-motion";

function AnimatedOrb({
	delay,
	duration,
	color,
	size,
	start,
	end,
	shouldAnimate,
}) {
	const baseClass = `absolute rounded-full blur-3xl opacity-30 pointer-events-none will-change-transform ${color} ${size}`;

	if (!shouldAnimate) {
		return (
			<div
				className={baseClass}
				style={{ transform: `translate3d(${start.x}, ${start.y}, 0)` }}
			/>
		);
	}

	return (
		<Motion.div
			className={baseClass}
			animate={{
				x: [start.x, end.x, start.x],
				y: [start.y, end.y, start.y],
				scale: [1, 1.12, 1],
			}}
			transition={{
				duration,
				repeat: Infinity,
				ease: "linear",
				delay,
			}}
		/>
	);
}

export default function HomeAmbientBackground({
	prefersReducedMotion,
	enableMotionEffects,
}) {
	const shouldAnimate = !prefersReducedMotion && enableMotionEffects;

	return (
		<div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
			<AnimatedOrb
				color="bg-slate-200"
				size="w-[70vw] h-[70vw] md:w-[36vw] md:h-[36vw]"
				start={{ x: "-10vw", y: "-10vh" }}
				end={{ x: "20vw", y: "20vh" }}
				duration={25}
				delay={0}
				shouldAnimate={shouldAnimate}
			/>
			<AnimatedOrb
				color="bg-gray-200"
				size="w-[55vw] h-[55vw] md:w-[30vw] md:h-[30vw]"
				start={{ x: "50vw", y: "40vh" }}
				end={{ x: "20vw", y: "10vh" }}
				duration={30}
				delay={5}
				shouldAnimate={shouldAnimate}
			/>
			<AnimatedOrb
				color="bg-slate-300"
				size="w-[80vw] h-[80vw] md:w-[44vw] md:h-[44vw]"
				start={{ x: "10vw", y: "70vh" }}
				end={{ x: "60vw", y: "40vh" }}
				duration={35}
				delay={2}
				shouldAnimate={shouldAnimate}
			/>
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(148,163,184,0.12),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(100,116,139,0.12),transparent_45%)]" />
		</div>
	);
}
