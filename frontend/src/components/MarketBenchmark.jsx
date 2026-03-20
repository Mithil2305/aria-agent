import { useState, useEffect } from "react";
import {
	BarChart3,
	TrendingUp,
	TrendingDown,
	Minus,
	Users,
	ShoppingCart,
	Clock,
	Award,
	Loader2,
} from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const FALLBACK_BENCHMARKS = {
	grocery: {
		avg_margin_pct: 18,
		avg_daily_revenue: 15000,
		avg_basket_size: 320,
		avg_customers_per_day: 60,
		peak_hours: "7-9 AM, 6-8 PM",
		peak_days: "Saturday, Sunday",
	},
	restaurant: {
		avg_margin_pct: 28,
		avg_daily_revenue: 18000,
		avg_basket_size: 280,
		avg_customers_per_day: 80,
		peak_hours: "12-2 PM, 7-9 PM",
		peak_days: "Friday, Saturday, Sunday",
	},
	retail: {
		avg_margin_pct: 35,
		avg_daily_revenue: 12000,
		avg_basket_size: 450,
		avg_customers_per_day: 35,
		peak_hours: "11 AM - 1 PM, 5-8 PM",
		peak_days: "Saturday, Sunday",
	},
	pharmacy: {
		avg_margin_pct: 20,
		avg_daily_revenue: 10000,
		avg_basket_size: 250,
		avg_customers_per_day: 45,
		peak_hours: "9-11 AM, 6-8 PM",
		peak_days: "Monday, Tuesday",
	},
	bakery: {
		avg_margin_pct: 45,
		avg_daily_revenue: 8000,
		avg_basket_size: 180,
		avg_customers_per_day: 50,
		peak_hours: "7-10 AM, 4-7 PM",
		peak_days: "Saturday, Sunday",
	},
	general: {
		avg_margin_pct: 25,
		avg_daily_revenue: 10000,
		avg_basket_size: 300,
		avg_customers_per_day: 40,
		peak_hours: "10 AM - 1 PM, 5-8 PM",
		peak_days: "Saturday, Sunday",
	},
};

function formatINR(value) {
	if (value == null) return "---";
	const num = Number(value);
	if (Math.abs(num) >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
	if (Math.abs(num) >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
	return `₹${num.toLocaleString("en-IN")}`;
}

function BenchmarkRow({
	label,
	yourValue,
	benchmarkValue,
	isRupee,
	higherIsBetter = true,
	icon: Icon,
}) {
	const hasData = yourValue != null && yourValue > 0;
	const ratio =
		hasData && benchmarkValue > 0 ? yourValue / benchmarkValue : null;
	const isGood =
		ratio != null ? (higherIsBetter ? ratio >= 0.9 : ratio <= 1.1) : null;
	const isWarn =
		ratio != null ? (higherIsBetter ? ratio < 0.7 : ratio > 1.3) : null;

	const statusColor = isGood
		? "text-green-600"
		: isWarn
			? "text-red-500"
			: "text-amber-500";
	const barWidth = ratio != null ? Math.min(Math.round(ratio * 100), 140) : 0;
	const barColor = isGood
		? "bg-green-500"
		: isWarn
			? "bg-red-400"
			: "bg-amber-400";

	const format = (v) =>
		isRupee ? formatINR(v) : v?.toLocaleString("en-IN") || "—";

	return (
		<div className="py-3 border-b border-surface-100 last:border-0">
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					{Icon && <Icon size={13} className="text-surface-400" />}
					<span className="text-xs font-medium text-surface-600">{label}</span>
				</div>
				<div className="flex items-center gap-3 text-xs">
					<span
						className={`font-bold ${hasData ? statusColor : "text-surface-400"}`}
					>
						{hasData ? format(yourValue) : "—"}
					</span>
					<span className="text-surface-400">vs</span>
					<span className="text-surface-500">{format(benchmarkValue)}</span>
				</div>
			</div>

			{hasData && (
				<div className="relative h-1.5 bg-surface-100 rounded-full overflow-hidden">
					{/* Benchmark marker at 100% */}
					<div className="absolute left-[71.4%] top-0 bottom-0 w-0.5 bg-surface-400 z-10" />
					<div
						className={`h-full rounded-full transition-all duration-700 ${barColor}`}
						style={{ width: `${Math.min(barWidth * 0.714, 100)}%` }}
					/>
				</div>
			)}

			{ratio != null && (
				<p className="text-[10px] mt-1.5 text-surface-400">
					{ratio >= 1.05
						? `🎉 You're ${((ratio - 1) * 100).toFixed(0)}% above market average`
						: ratio < 0.7
							? `⚠️ ${((1 - ratio) * 100).toFixed(0)}% below market average — room to grow`
							: `On track with market average`}
				</p>
			)}
		</div>
	);
}

export default function MarketBenchmark({ token, category, kpis }) {
	const [benchmarks, setBenchmarks] = useState(null);

	useEffect(() => {
		if (!category) return;

		let cancelled = false;

		axios
			.get(`${API_BASE}/api/market-benchmark?category=${category}`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			})
			.then(({ data }) => {
				if (!cancelled) {
					setBenchmarks({
						category,
						data:
							data?.benchmark ||
							data?.benchmarks ||
							FALLBACK_BENCHMARKS[category] ||
							FALLBACK_BENCHMARKS.general,
					});
				}
			})
			.catch(() => {
				if (!cancelled) {
					setBenchmarks({
						category,
						data: FALLBACK_BENCHMARKS[category] || FALLBACK_BENCHMARKS.general,
					});
				}
			});

		return () => {
			cancelled = true;
		};
	}, [category, token]);

	const loading =
		Boolean(category) && (!benchmarks || benchmarks.category !== category);

	if (loading) {
		return (
			<div className="card p-5 flex items-center gap-3">
				<Loader2 size={16} className="animate-spin text-indigo-500" />
				<span className="text-sm text-surface-500">
					Loading market benchmarks…
				</span>
			</div>
		);
	}

	const benchmarkData =
		benchmarks?.data ||
		FALLBACK_BENCHMARKS[category] ||
		FALLBACK_BENCHMARKS.general;
	if (!benchmarkData) return null;

	const findKpi = (keywords) =>
		kpis?.find((k) =>
			keywords.some((kw) =>
				(k.label + " " + (k.column || "")).toLowerCase().includes(kw),
			),
		);

	const revenueKpi = findKpi(["revenue", "sales", "income"]);
	const customerKpi = findKpi(["customer", "footfall"]);
	const basketKpi = findKpi(["basket", "avg_order", "ticket"]);
	const expenseKpi = findKpi(["expense", "cost"]);

	const yourMargin =
		revenueKpi && expenseKpi
			? ((revenueKpi.current - expenseKpi.current) / revenueKpi.current) * 100
			: null;

	const categoryName =
		{
			grocery: "Grocery Stores",
			restaurant: "Restaurants",
			retail: "Retail Shops",
			pharmacy: "Pharmacies",
			bakery: "Bakeries",
			general: "Similar Businesses",
		}[category] || "Similar Businesses";

	return (
		<div className="card p-5">
			<div className="flex items-center gap-2 mb-4">
				<Award size={16} className="text-indigo-500" />
				<h3 className="text-sm font-semibold text-surface-900">
					How You Compare — {categoryName} in Tamil Nadu
				</h3>
			</div>

			<p className="text-xs text-surface-500 mb-4">
				Market averages for {categoryName.toLowerCase()} in your region. The bar
				shows your performance vs benchmark.
			</p>

			<div>
				<BenchmarkRow
					label="Daily Revenue"
					yourValue={revenueKpi?.current}
					benchmarkValue={benchmarkData.avg_daily_revenue}
					isRupee
					icon={BarChart3}
				/>
				<BenchmarkRow
					label="Daily Customers"
					yourValue={customerKpi?.current}
					benchmarkValue={benchmarkData.avg_customers_per_day}
					icon={Users}
				/>
				<BenchmarkRow
					label="Avg Basket Size"
					yourValue={
						basketKpi?.current ||
						(revenueKpi?.current && customerKpi?.current
							? revenueKpi.current / customerKpi.current
							: null)
					}
					benchmarkValue={benchmarkData.avg_basket_size}
					isRupee
					icon={ShoppingCart}
				/>
				<BenchmarkRow
					label="Profit Margin"
					yourValue={yourMargin}
					benchmarkValue={benchmarkData.avg_margin_pct}
					icon={TrendingUp}
				/>
			</div>

			<div className="mt-4 px-3 py-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
				<p className="text-[11px] text-indigo-700 font-medium">
					🏆 Peak Performance Tip for {categoryName}
				</p>
				<p className="text-[11px] text-indigo-600 mt-0.5">
					Peak hours: <strong>{benchmarkData.peak_hours}</strong> · Best days:{" "}
					<strong>{benchmarkData.peak_days}</strong>
				</p>
			</div>
		</div>
	);
}
