import { motion as Motion } from "framer-motion";
import { SUPERPOWERS, fadeInUp, staggerContainer } from "./constants";

function MiniSparkline() {
	const values = [42, 55, 48, 70, 63, 80, 72, 88, 82, 95, 90, 100];
	const w = 340;
	const h = 80;
	const pad = 8;
	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min;
	const stepX = (w - pad * 2) / (values.length - 1);
	const points = values.map((v, i) => {
		const x = pad + i * stepX;
		const y = h - pad - ((v - min) / range) * (h - pad * 2);
		return `${x},${y}`;
	});
	const linePath = points
		.map((p, i) => `${i === 0 ? "M" : "L"} ${p}`)
		.join(" ");
	const areaPath = `${linePath} L ${pad + (values.length - 1) * stepX},${h - pad} L ${pad},${h - pad} Z`;

	return (
		<svg
			viewBox={`0 0 ${w} ${h}`}
			className="w-full h-20"
			preserveAspectRatio="none"
		>
			<defs>
				<linearGradient id="sparkGradMini" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#1e293b" stopOpacity="0.15" />
					<stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
				</linearGradient>
			</defs>
			<path d={areaPath} fill="url(#sparkGradMini)" />
			<path
				d={linePath}
				fill="none"
				stroke="#334155"
				strokeWidth="2.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			{values.map((v, i) => {
				const x = pad + i * stepX;
				const y = h - pad - ((v - min) / range) * (h - pad * 2);
				return i === values.length - 1 ? (
					<circle key={i} cx={x} cy={y} r="4" fill="#0f172a" />
				) : null;
			})}
		</svg>
	);
}

export default function HomeSuperpowersSection() {
	return (
		<section className="py-32 px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
			<Motion.div
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, margin: "-100px" }}
				variants={fadeInUp}
				className="mb-14"
			>
				<div className="max-w-3xl">
					<h2 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-black mb-4 leading-[0.95]">
						One platform, <br />
						ten superpowers
					</h2>
					<p className="text-xl text-slate-500 max-w-2xl">
						Most business owners juggle spreadsheets, BI dashboards, and
						consultants. Yukti replaces all of that with a single intelligent
						platform, purpose-built for the Indian market.
					</p>
				</div>
			</Motion.div>

			<Motion.div
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, margin: "-100px" }}
				variants={staggerContainer}
				className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 lg:auto-rows-[minmax(220px,1fr)]"
			>
				{SUPERPOWERS.map((feature, i) => (
					<Motion.div
						key={i}
						variants={fadeInUp}
						whileHover={{ y: -4 }}
						className={[
							"relative group bg-white border border-slate-200 rounded-3xl",
							"shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)]",
							"hover:shadow-[0_24px_44px_-26px_rgba(15,23,42,0.35)]",
							"hover:border-slate-300 transition-all duration-300 overflow-hidden",
							"sm:col-span-1",
							feature.isLarge
								? "lg:col-span-6 lg:row-span-2"
								: feature.isWide
									? "sm:col-span-2 lg:col-span-12 lg:row-span-1"
									: feature.layout,
						].join(" ")}
					>
						{feature.isLarge ? (
							<div className="flex flex-col h-full p-6 md:p-8">
								<div className="flex-none">
									<div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 mb-5 group-hover:bg-black group-hover:text-white transition-colors duration-300 text-black">
										<feature.icon size={20} />
									</div>
									<h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black leading-tight mb-3">
										{feature.title}
									</h3>
									<p className="text-slate-500 text-base md:text-lg leading-relaxed max-w-sm">
										{feature.desc}
									</p>
								</div>
								<div className="flex-1 mt-6 min-h-0 flex flex-col justify-end">
									<div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 pt-4 pb-2 overflow-hidden">
										<p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
											Revenue forecast - next 12 weeks
										</p>
										<MiniSparkline />
										<div className="flex items-center justify-between mt-2">
											<span className="text-[11px] text-slate-400">Week 1</span>
											<span className="text-xs font-bold text-emerald-600">
												+38% projected ↑
											</span>
											<span className="text-[11px] text-slate-400">
												Week 12
											</span>
										</div>
									</div>
								</div>
							</div>
						) : feature.isWide ? (
							<div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 h-full p-6 md:p-8">
								<div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 shrink-0 group-hover:bg-black group-hover:text-white transition-colors duration-300 text-black">
									<feature.icon size={20} />
								</div>
								<div className="flex-1 min-w-0">
									<h3 className="text-2xl md:text-3xl font-extrabold text-black leading-tight">
										{feature.title}
									</h3>
									<p className="text-slate-500 text-base leading-relaxed mt-1">
										{feature.desc}
									</p>
								</div>
								<div className="hidden lg:flex items-center gap-2 shrink-0">
									{["POS", "Shopify", "Tally", "WooCommerce", "Zoho"].map(
										(tag) => (
											<span
												key={tag}
												className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 whitespace-nowrap"
											>
												{tag}
											</span>
										),
									)}
									<span className="px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold whitespace-nowrap">
										+ more
									</span>
								</div>
							</div>
						) : (
							<div className="flex flex-col h-full p-6 md:p-7">
								<div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 mb-4 group-hover:bg-black group-hover:text-white transition-colors duration-300 text-black shrink-0">
									<feature.icon size={18} />
								</div>
								<h3 className="text-xl sm:text-2xl font-extrabold text-black leading-tight mb-2">
									{feature.title}
								</h3>
								<p className="text-slate-500 text-sm leading-relaxed flex-1">
									{feature.desc}
								</p>
							</div>
						)}

						<div className="absolute inset-0 bg-linear-to-br from-slate-50/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl" />
					</Motion.div>
				))}
			</Motion.div>
		</section>
	);
}
