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
	const baseClass = `absolute rounded-full mix-blend-multiply filter blur-[80px] opacity-35 pointer-events-none ${color} ${size}`;

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

export default function HomeAmbientBackground({ prefersReducedMotion }) {
	return (
		<div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
			<AnimatedOrb
				color="bg-slate-200"
				size="w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw]"
				start={{ x: "-10vw", y: "-10vh" }}
				end={{ x: "20vw", y: "20vh" }}
				duration={25}
				delay={0}
				shouldAnimate={!prefersReducedMotion}
			/>
			<AnimatedOrb
				color="bg-gray-200"
				size="w-[60vw] h-[60vw] md:w-[35vw] md:h-[35vw]"
				start={{ x: "50vw", y: "40vh" }}
				end={{ x: "20vw", y: "10vh" }}
				duration={30}
				delay={5}
				shouldAnimate={!prefersReducedMotion}
			/>
			<AnimatedOrb
				color="bg-slate-300"
				size="w-[90vw] h-[90vw] md:w-[50vw] md:h-[50vw]"
				start={{ x: "10vw", y: "70vh" }}
				end={{ x: "60vw", y: "40vh" }}
				duration={35}
				delay={2}
				shouldAnimate={!prefersReducedMotion}
			/>
			<div
				className="absolute inset-0 opacity-[0.03]"
				style={{
					backgroundImage:
						"url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22 x=%220%22 y=%220%22 width=%22100%25%22 height=%22100%25%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.5%22/%3E%3C/svg%3E')",
				}}
			/>
		</div>
	);
}
