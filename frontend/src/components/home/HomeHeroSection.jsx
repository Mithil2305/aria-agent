import { ArrowRight } from "lucide-react";
import { motion as Motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "./constants";

export default function HomeHeroSection({
	activeVariant,
	onPrimaryClick,
	onSecondaryClick,
}) {
	return (
		<section className="relative pt-28 pb-20 lg:pt-24 lg:pb-32 px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
			<Motion.div
				initial="hidden"
				animate="visible"
				variants={staggerContainer}
				className="max-w-4xl flex flex-col items-center"
			>
				<Motion.div
					variants={fadeInUp}
					className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 mb-8 whitespace-nowrap hover:shadow-md transition-shadow cursor-default"
				>
					<span className="relative flex h-2 w-2">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
						<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
					</span>
					<span>Introducing Yukti</span>
				</Motion.div>

				<Motion.h1
					variants={fadeInUp}
					className="text-5xl sm:text-7xl lg:text-[4rem] font-extrabold tracking-tighter text-black leading-[1.05] mb-8"
				>
					What if your data could <br className="hidden md:block" />
					<span className="relative inline-block mt-2">
						<span className="relative z-10 text-transparent bg-clip-text bg-linear-to-r from-slate-400 to-slate-900">
							think for you?
						</span>
						<Motion.span
							initial={{ scaleX: 0 }}
							animate={{ scaleX: 1 }}
							transition={{ delay: 1, duration: 0.8, ease: "easeInOut" }}
							className="absolute bottom-1 left-0 right-0 h-3 bg-slate-200/50 -z-10 origin-left rounded-full"
						/>
					</span>
				</Motion.h1>

				<Motion.p
					variants={fadeInUp}
					className="text-[1rem] sm:text-xl text-slate-500 mb-12 max-w-2xl leading-relaxed"
				>
					We fed 35,800+ Indian business disasters to an AI so you don't have to
					live through them. Yukti takes your sales data and gives you the cheat
					codes for what to do next. No guessing, just winning.
				</Motion.p>

				<Motion.div
					variants={fadeInUp}
					className="flex flex-wrap justify-center gap-4 mb-12 opacity-80"
				>
					<div className="flex flex-col items-center px-6 border-r border-slate-200">
						<span className="text-2xl font-bold text-black">35,800+</span>
						<span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
							Training Samples
						</span>
					</div>
					<div className="flex flex-col items-center px-6 border-r border-slate-200">
						<span className="text-2xl font-bold text-black">6-Layer</span>
						<span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
							Analytics Engine
						</span>
					</div>
					<div className="flex flex-col items-center px-6">
						<span className="text-2xl font-bold text-black">4 AI</span>
						<span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
							Provider Fallback
						</span>
					</div>
				</Motion.div>

				<Motion.div
					variants={fadeInUp}
					className="flex flex-col sm:flex-row gap-4 w-full justify-center"
				>
					<button
						onClick={onPrimaryClick}
						className="px-8 py-4 bg-black text-white rounded-full font-semibold text-lg hover:bg-slate-800 transition-all hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 flex items-center justify-center gap-3 group"
					>
						{activeVariant.heroPrimary}
						<ArrowRight
							size={20}
							className="group-hover:translate-x-1.5 transition-transform duration-300"
						/>
					</button>
					<button
						onClick={onSecondaryClick}
						className="px-8 py-4 bg-white/50 backdrop-blur-md text-black border border-slate-200 rounded-full font-semibold text-lg hover:bg-white transition-all hover:-translate-y-1 hover:shadow-xl shadow-sm"
					>
						{activeVariant.heroSecondary}
					</button>
				</Motion.div>
			</Motion.div>

			<div className="mt-24 w-full relative perspective-1000 z-20">
				<div className="absolute inset-0 bg-linear-to-t from-[#fafafa] via-transparent to-transparent z-30 pointer-events-none" />
				<div className="aspect-video md:aspect-21/9 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col relative transform-style-3d">
					<div className="h-12 border-b border-slate-100 bg-slate-50/80 flex items-center px-5 gap-3">
						<div className="flex gap-2">
							<div className="w-3 h-3 rounded-full bg-slate-300" />
							<div className="w-3 h-3 rounded-full bg-slate-300" />
							<div className="w-3 h-3 rounded-full bg-slate-300" />
						</div>
						<div className="mx-auto w-1/3 h-5 bg-white rounded-md border border-slate-200/60 shadow-inner" />
					</div>
					<div className="flex-1 p-4 md:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-4 gap-5 opacity-85">
						<div className="md:col-span-1 hidden md:flex flex-col border-r border-slate-100 pr-5">
							<div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 mb-4">
								<p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
									Workspace
								</p>
								<p className="text-xs font-bold text-slate-800 mt-1">
									Yukti Board
								</p>
							</div>
							<div className="space-y-2.5">
								{[
									"Overview",
									"Next Month Plan",
									"Restock Signals",
									"Playbooks",
								].map((item) => (
									<div
										key={item}
										className="flex items-center gap-2 text-[11px] text-slate-600"
									>
										<span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
										<span>{item}</span>
									</div>
								))}
							</div>
							<div className="mt-5 rounded-xl border border-slate-200 bg-white p-3">
								<p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
									Next Month Outlook
								</p>
								<p className="text-xl font-bold text-slate-900 mt-1">+16.2%</p>
								<p className="text-[11px] text-emerald-700 mt-1">
									Expected demand uplift
								</p>
							</div>
							<div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
								<div className="h-2 rounded-full bg-slate-200 w-full" />
								<div className="h-2 rounded-full bg-slate-200 w-5/6" />
								<div className="h-2 rounded-full bg-slate-200 w-2/3" />
							</div>
						</div>
						<div className="md:col-span-3 space-y-5">
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								{[
									{
										label: "Next Month Revenue",
										value: "INR 3.8L",
										trend: "+16.2%",
									},
									{ label: "Expected Orders", value: "1,410", trend: "+13.0%" },
									{
										label: "Restock Priority",
										value: "7 SKUs",
										trend: "Act this week",
									},
								].map((stat) => (
									<div
										key={stat.label}
										className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
									>
										<p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
											{stat.label}
										</p>
										<p className="text-lg font-bold text-slate-900 mt-1">
											{stat.value}
										</p>
										<p className="text-[11px] text-emerald-700 mt-1 font-semibold">
											{stat.trend}
										</p>
									</div>
								))}
							</div>
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
								<div className="lg:col-span-2 rounded-2xl bg-linear-to-b from-slate-50 to-slate-100 border border-slate-200 p-4 relative overflow-hidden">
									<p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
										Next 30 days forecast
									</p>
									<svg viewBox="0 0 320 130" className="w-full h-32">
										<defs>
											<linearGradient
												id="heroForecastGrad"
												x1="0"
												y1="0"
												x2="0"
												y2="1"
											>
												<stop
													offset="0%"
													stopColor="#1e293b"
													stopOpacity="0.2"
												/>
												<stop
													offset="100%"
													stopColor="#1e293b"
													stopOpacity="0"
												/>
											</linearGradient>
										</defs>
										{[0, 1, 2, 3].map((line) => (
											<line
												key={line}
												x1="0"
												x2="320"
												y1={16 + line * 28}
												y2={16 + line * 28}
												stroke="#dbe2ea"
												strokeDasharray="4 6"
											/>
										))}
										<path
											d="M 8 114 C 45 92 68 98 96 80 C 130 58 160 68 188 48 C 220 28 252 34 312 18"
											fill="none"
											stroke="#0f172a"
											strokeWidth="3"
											strokeLinecap="round"
										/>
										<path
											d="M 8 114 C 45 92 68 98 96 80 C 130 58 160 68 188 48 C 220 28 252 34 312 18 L 312 130 L 8 130 Z"
											fill="url(#heroForecastGrad)"
											opacity="0.5"
										/>
									</svg>
									<div className="absolute right-4 top-4 text-[10px] px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold">
										Confidence 91%
									</div>
								</div>
								<div className="rounded-2xl border border-slate-200 bg-white p-3">
									<p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
										Yukti says do this next month
									</p>
									<div className="space-y-2">
										<div className="rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-2 text-[11px] text-emerald-800">
											Restock cooking oil and atta by week 1
										</div>
										<div className="rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-2 text-[11px] text-amber-800">
											Do not restock slow sauces this cycle
										</div>
										<div className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2 text-[11px] text-slate-700">
											Push combos on weekends for higher margin
										</div>
									</div>
								</div>
							</div>
							<div className="rounded-2xl border border-slate-200 bg-white p-3">
								<div className="grid grid-cols-12 text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-2 mb-1.5">
									<span className="col-span-5">Stock item</span>
									<span className="col-span-3">Days left</span>
									<span className="col-span-4">Action</span>
								</div>
								<div className="space-y-1.5">
									{[
										{ c: "Cooking Oil", o: "5", s: "Restock now" },
										{ c: "Atta 10kg", o: "7", s: "Restock this week" },
										{ c: "Premium Sauces", o: "28", s: "Do not restock" },
									].map((row) => (
										<div
											key={row.c}
											className="grid grid-cols-12 items-center rounded-lg bg-slate-50 border border-slate-200 px-2 py-1.5 text-[11px]"
										>
											<span className="col-span-5 font-medium text-slate-700">
												{row.c}
											</span>
											<span className="col-span-3 text-slate-800 font-semibold">
												{row.o}
											</span>
											<span className="col-span-4 text-emerald-700 font-semibold">
												{row.s}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
