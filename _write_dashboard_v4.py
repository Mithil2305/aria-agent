#!/usr/bin/env python3
"""Write Dashboard.jsx v4 — with Quick Stats, AI Provider badge, Strategy tab."""

content = r'''import { useState, useCallback } from "react";
import {
  BarChart3,
  Brain,
  Download,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Target,
  Lightbulb,
  IndianRupee,
  Users,
  Package,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Minus,
  CheckCircle2,
  CalendarDays,
  ShoppingCart,
  Megaphone,
  TrendingUp,
  TrendingDown,
  Wallet,
  Footprints,
  Warehouse,
  UserCheck,
  BrainCircuit,
  LineChart,
  Bell,
  Star,
  BarChart2,
  Link2,
  Award,
  Loader2,
  Calendar,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  MapPin,
  Database,
} from "lucide-react";
import TrendCharts from "./TrendCharts";
import ForecastPanel from "./ForecastPanel";
import { downloadReport, getStrategyAdvice } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import {
  getBusinessCategory,
  getCategoryLabel,
  needsStockManagement,
} from "../config/businessTypes";

/* ================================================================
   Yukti Dashboard v4 — Professional Indian SMB Edition
   8 tabs: Khata, Footfall, Godown, Customer, Advisor, Predictions, Alerts, Strategy
   Quick Stats Bar + AI Provider Badge + Strategy Advisor
   ================================================================ */

const PRIORITY_STYLES = {
  high: "bg-red-50 text-red-600 border-red-200",
  medium: "bg-amber-50 text-amber-600 border-amber-200",
  low: "bg-green-50 text-green-600 border-green-200",
};

export default function Dashboard({ analysis, rowCount, onReset }) {
  const [activeTab, setActiveTab] = useState("khata");
  const [expandedInsight, setExpandedInsight] = useState(null);
  const { user, userProfile, getIdToken } = useAuth();

  const {
    schema,
    kpis = [],
    trends,
    forecasts = [],
    anomalies = [],
    correlations = [],
    insights = [],
    trend_lock: trendLock = {},
    data_sufficiency: dataSufficiency = "full",
    ai_provider: aiProvider = "rule_based",
  } = analysis;

  const healthScore = computeHealthScore(kpis, anomalies, insights, schema);
  const criticalCount = anomalies.filter((a) => a.severity === "critical").length;
  const highCount = anomalies.filter((a) => a.severity === "high").length;
  const alertTotal = criticalCount + highCount;

  const handleExportPDF = async () => {
    try {
      const role = userProfile?.role || "paid-user";
      const token = await getIdToken();
      await downloadReport(token, user?.uid, role);
    } catch (err) {
      console.error("Report download failed:", err);
      alert("Report download failed. Please run an analysis first, then try again.");
    }
  };

  const insightsByCategory = {};
  for (const ins of insights) {
    const cat = ins.category || "other";
    if (!insightsByCategory[cat]) insightsByCategory[cat] = [];
    insightsByCategory[cat].push(ins);
  }

  // Compute quick stats from KPIs
  const findKpi = (keywords) =>
    kpis.find((k) => {
      const name = (k.label + " " + (k.column || "")).toLowerCase();
      return keywords.some((kw) => name.includes(kw));
    });

  const revenueKpi = findKpi(["revenue", "sales", "income", "total"]);
  const customerKpi = findKpi(["customer", "footfall", "visitor"]);
  const orderKpi = findKpi(["order", "transaction", "bill"]);

  const TABS = [
    { id: "khata", label: "Daily Khata", icon: Wallet },
    { id: "footfall", label: "Footfall & Orders", icon: Footprints },
    { id: "godown", label: "Smart Godown", icon: Warehouse },
    { id: "customer", label: "Customers", icon: UserCheck },
    { id: "advisor", label: "Yukti Advisor", icon: BrainCircuit },
    { id: "predictions", label: "Predictions", icon: LineChart },
    { id: "alerts", label: "Alerts", icon: Bell, badge: alertTotal },
    { id: "strategy", label: "Strategy", icon: Target },
  ];

  return (
    <div className="min-h-[calc(100vh-60px)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
        {/* Hero Summary */}
        <div className="mb-6 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <HealthBadge score={healthScore} />
                <TrendBadge trendLock={trendLock} />
                {alertTotal > 0 && (
                  <button
                    onClick={() => setActiveTab("alerts")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                  >
                    <AlertTriangle size={13} className="text-red-500" />
                    <span className="text-xs text-red-600 font-medium">
                      {alertTotal} alert{alertTotal !== 1 ? "s" : ""}
                    </span>
                  </button>
                )}
              </div>
              <p className="text-sm text-surface-600 leading-relaxed max-w-2xl">
                {analysis.narrative}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportPDF}
                className="btn-primary flex items-center gap-2 text-xs"
              >
                <Download size={14} /> Download Report
              </button>
              <button
                onClick={onReset}
                className="btn-secondary flex items-center gap-2 text-xs"
              >
                <RefreshCcw size={14} /> New Analysis
              </button>
            </div>
          </div>

          {dataSufficiency !== "full" && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
              <CalendarDays size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-700">
                  Yukti is still learning your business
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {dataSufficiency === "partial"
                    ? "Log a few more days of data to unlock full predictions and trends."
                    : "You need at least 3 days of data for basic analysis."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Bar */}
        <QuickStatsBar
          avgRevenue={revenueKpi?.current}
          avgCustomers={customerKpi?.current}
          avgOrders={orderKpi?.current}
          dataPoints={rowCount}
        />

        {/* AI Provider Badge */}
        <AIProviderBadge provider={aiProvider} />

        {/* Scoreboard */}
        <Scoreboard kpis={kpis} />

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 p-1 bg-surface-100 rounded-xl border border-surface-300 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white text-surface-900 shadow-sm border border-surface-300"
                    : "text-surface-500 hover:text-surface-700 hover:bg-white/60"
                }`}
              >
                <TabIcon size={14} className={isActive ? "text-indigo-500" : "text-surface-400"} />
                {tab.label}
                {tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 text-[10px] font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in-up">
          {activeTab === "khata" && (
            <KhataSection kpis={kpis} insights={insightsByCategory} trends={trends} />
          )}
          {activeTab === "footfall" && (
            <FootfallSection kpis={kpis} insights={insightsByCategory} />
          )}
          {activeTab === "godown" && (
            <GodownSection kpis={kpis} insights={insightsByCategory} />
          )}
          {activeTab === "customer" && (
            <CustomerSection kpis={kpis} insights={insightsByCategory} correlations={correlations} />
          )}
          {activeTab === "advisor" && (
            <AdvisorSection
              insights={insightsByCategory}
              allInsights={insights}
              trendLock={trendLock}
              expandedInsight={expandedInsight}
              setExpandedInsight={setExpandedInsight}
            />
          )}
          {activeTab === "predictions" && (
            <PredictionsSection forecasts={forecasts} dataSufficiency={dataSufficiency} insights={insightsByCategory} />
          )}
          {activeTab === "alerts" && (
            <AlertsSection anomalies={anomalies} insights={insightsByCategory} />
          )}
          {activeTab === "strategy" && (
            <StrategySection />
          )}
        </div>

        <footer className="mt-12 pb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-12 bg-surface-300" />
            <Activity size={10} className="text-surface-400" />
            <div className="h-px w-12 bg-surface-300" />
          </div>
          <p className="text-[10px] text-surface-400">
            Yukti &mdash; Your Business Intelligence Partner &mdash; v4.0
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ================================================================
   QUICK STATS BAR
   ================================================================ */

function QuickStatsBar({ avgRevenue, avgCustomers, avgOrders, dataPoints }) {
  const stats = [
    { label: "Avg Daily Revenue", value: avgRevenue != null ? `''' + "\u20B9" + r'''${Number(avgRevenue).toLocaleString("en-IN")}` : "---", icon: IndianRupee },
    { label: "Avg Customers/Day", value: avgCustomers != null ? String(Math.round(Number(avgCustomers))) : "0", icon: Users },
    { label: "Avg Orders/Day", value: avgOrders != null ? String(Math.round(Number(avgOrders))) : "0", icon: ShoppingCart },
    { label: "Data Points", value: dataPoints != null ? String(dataPoints) : "0", icon: Database },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 animate-fade-in-up">
      {stats.map((s, i) => {
        const SIcon = s.icon;
        return (
          <div key={i} className="card p-4">
            <p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider mb-1.5">{s.label}</p>
            <div className="flex items-center gap-2">
              <SIcon size={14} className="text-indigo-400" />
              <p className="text-lg font-bold text-surface-900">{s.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================
   AI PROVIDER BADGE
   ================================================================ */

function AIProviderBadge({ provider }) {
  if (!provider || provider === "rule_based") return null;

  const providerLabel =
    provider === "gemini" ? "Gemini AI" :
    provider === "groq" ? "Groq AI" :
    provider === "claude" ? "Claude AI" :
    "AI";

  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-600 text-[10px] font-semibold uppercase tracking-wider">
        <Sparkles size={10} />
        Powered by {providerLabel}
      </span>
    </div>
  );
}

/* ================================================================
   REUSABLE COMPONENTS
   ================================================================ */

function HealthBadge({ score }) {
  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs Attention" : "Critical";
  const color =
    score >= 80 ? "text-green-600" : score >= 60 ? "text-indigo-600" : score >= 40 ? "text-amber-600" : "text-red-600";
  const bg =
    score >= 80
      ? "bg-green-50 border-green-200"
      : score >= 60
        ? "bg-indigo-50 border-indigo-200"
        : score >= 40
          ? "bg-amber-50 border-amber-200"
          : "bg-red-50 border-red-200";
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${bg}`}>
      <ShieldCheck size={14} className={color} />
      <span className={`text-sm font-bold ${color}`}>{score}</span>
      <span className={`text-xs ${color}`}>{label}</span>
    </div>
  );
}

function TrendBadge({ trendLock }) {
  if (!trendLock?.direction || trendLock.direction === "stable") {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 border border-surface-300">
        <Minus size={13} className="text-surface-500" />
        <span className="text-xs text-surface-600 font-medium">Steady</span>
      </div>
    );
  }
  const isUp = trendLock.direction === "up";
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${isUp ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
      {isUp ? <TrendingUp size={13} className="text-green-600" /> : <TrendingDown size={13} className="text-red-500" />}
      <span className={`text-xs font-medium ${isUp ? "text-green-600" : "text-red-500"}`}>
        {trendLock.metric} {isUp ? "up" : "down"} {Math.abs(trendLock.change || 0)}%
      </span>
    </div>
  );
}

function Scoreboard({ kpis }) {
  const findKpi = (keywords) =>
    kpis.find((k) => {
      const name = (k.label + " " + (k.column || "")).toLowerCase();
      return keywords.some((kw) => name.includes(kw));
    });

  const revenue = findKpi(["revenue", "sales", "income", "total"]);
  const customers = findKpi(["customer", "footfall", "visitor"]);
  const orders = findKpi(["order", "transaction", "bill"]);
  const expenses = findKpi(["expense", "cost", "spend"]);

  const cards = [
    revenue && { label: "Revenue", value: revenue.current, change: revenue.change, isRupee: true, icon: IndianRupee },
    customers && { label: "Customers", value: customers.current, change: customers.change, icon: Users },
    orders && { label: "Orders", value: orders.current, change: orders.change, icon: ShoppingCart },
    expenses && { label: "Expenses", value: expenses.current, change: expenses.change, isRupee: true, invertColor: true, icon: Wallet },
  ].filter(Boolean);

  const displayed =
    cards.length > 0
      ? cards
      : kpis.slice(0, 4).map((k) => ({ label: k.label, value: k.current, change: k.change, icon: BarChart3 }));
  if (displayed.length === 0) return null;

  if (revenue && expenses) {
    const profit = revenue.current - expenses.current;
    const margin = revenue.current > 0 ? (profit / revenue.current) * 100 : 0;
    displayed.push({
      label: "Est. Profit",
      value: profit,
      isRupee: true,
      suffix: `${margin.toFixed(0)}% margin`,
      icon: Award,
    });
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
      {displayed.map((card, i) => {
        const isUp = card.invertColor ? card.change < 0 : card.change > 0;
        const isNeutral = card.change == null || Math.abs(card.change) < 2;
        const CardIcon = card.icon || BarChart3;
        return (
          <div key={i} className="card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-indigo-50">
                <CardIcon size={14} className="text-indigo-500" />
              </div>
              <span className="text-[11px] text-surface-500 font-medium truncate">{card.label}</span>
            </div>
            <p className="text-xl font-bold text-surface-900 mb-1">
              {card.isRupee && <span className="text-base font-semibold text-surface-500 mr-0.5">''' + "\u20B9" + r'''</span>}
              {formatINR(card.value)}
            </p>
            {card.suffix ? (
              <p className="text-[10px] text-surface-500">{card.suffix}</p>
            ) : (
              <div className={`flex items-center gap-1 text-[11px] font-semibold ${isNeutral ? "text-surface-400" : isUp ? "text-green-600" : "text-red-500"}`}>
                {isNeutral ? <Minus size={11} /> : isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                {card.change != null ? `${Math.abs(card.change).toFixed(1)}%` : ""}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActionCard({ insight, index, expanded, onToggle }) {
  if (!insight) return null;
  const sevConfig = {
    critical: { bg: "bg-red-50 border-red-200", dot: "bg-red-500", tag: "Urgent", tagBg: "bg-red-100 text-red-700" },
    high: { bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500", tag: "Important", tagBg: "bg-amber-100 text-amber-700" },
    moderate: { bg: "bg-indigo-50 border-indigo-200", dot: "bg-indigo-500", tag: "Insight", tagBg: "bg-indigo-100 text-indigo-700" },
    low: { bg: "bg-green-50 border-green-200", dot: "bg-green-500", tag: "Good News", tagBg: "bg-green-100 text-green-700" },
    info: { bg: "bg-blue-50 border-blue-200", dot: "bg-blue-500", tag: "Info", tagBg: "bg-blue-100 text-blue-700" },
  };
  const cfg = sevConfig[insight.severity] || sevConfig.moderate;
  const uid = (insight.title || "") + index;
  const isOpen = expanded === uid;

  return (
    <div className={`rounded-xl border p-4 transition-all hover:shadow-sm ${cfg.bg}`}>
      <div className="flex items-start gap-3 cursor-pointer" onClick={() => onToggle(isOpen ? null : uid)}>
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.tagBg}`}>{cfg.tag}</span>
          </div>
          <p className="text-sm font-medium text-surface-800 leading-snug">{insight.title}</p>
          <p className="text-xs text-surface-600 mt-1 leading-relaxed">{insight.description}</p>
        </div>
        {isOpen ? (
          <ChevronUp size={16} className="text-surface-400 shrink-0 mt-1" />
        ) : (
          <ChevronDown size={16} className="text-surface-400 shrink-0 mt-1" />
        )}
      </div>
      {isOpen && insight.recommendation && (
        <div className="mt-3 ml-5 pl-3 border-l-2 border-surface-300">
          <p className="text-xs font-semibold text-surface-700 mb-1 flex items-center gap-1.5">
            <Zap size={12} className="text-amber-500" /> Recommended Action
          </p>
          <p className="text-xs text-surface-600 leading-relaxed">{insight.recommendation}</p>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
        {Icon && <Icon size={18} className="text-indigo-500" />} {title}
      </h2>
      {subtitle && <p className="text-xs text-surface-500 mt-0.5 ml-7">{subtitle}</p>}
    </div>
  );
}

function MetricBox({ label, value, change, isRupee = false, invertColor = false, highlight = false }) {
  const isUp = invertColor ? change < 0 : change > 0;
  const isNeutral = change == null || Math.abs(change) < 2;
  return (
    <div className={`rounded-lg p-4 ${highlight ? "bg-green-50 border border-green-200" : "bg-surface-100"}`}>
      <p className="text-[11px] text-surface-500 font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? "text-green-600" : "text-surface-900"}`}>
        {isRupee && <span className="text-lg font-semibold text-surface-400 mr-0.5">''' + "\u20B9" + r'''</span>}
        {formatINR(value)}
      </p>
      {change != null && !highlight && (
        <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${isNeutral ? "text-surface-400" : isUp ? "text-green-600" : "text-red-500"}`}>
          {isNeutral ? <Minus size={11} /> : isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {Math.abs(change).toFixed(1)}% {isUp ? "up" : change < -2 ? "down" : ""}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="card p-8 text-center">
      <Lightbulb size={24} className="text-surface-300 mx-auto mb-2" />
      <p className="text-xs text-surface-500">{text}</p>
    </div>
  );
}

/* ================================================================
   TAB SECTIONS (original 7)
   ================================================================ */

function KhataSection({ kpis, insights, trends }) {
  const [expanded, setExpanded] = useState(null);
  const khataInsights = insights.khata || [];
  const revenueKpi = findKpiByKeywords(kpis, ["revenue", "sales", "income"]);
  const expenseKpi = findKpiByKeywords(kpis, ["expense", "cost", "spend"]);

  return (
    <div className="space-y-6">
      <SectionHeader icon={Wallet} title="Daily Khata" subtitle="Your financial health at a glance. How to earn more profit?" />
      {revenueKpi && (
        <div className="card-elevated p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricBox label="Today's Revenue" value={revenueKpi.current} change={revenueKpi.change} isRupee />
            {expenseKpi && <MetricBox label="Expenses" value={expenseKpi.current} change={expenseKpi.change} isRupee invertColor />}
            {expenseKpi && <MetricBox label="Your Take-Home (Profit)" value={revenueKpi.current - expenseKpi.current} isRupee highlight />}
          </div>
        </div>
      )}
      {trends && <TrendCharts trends={trends} />}
      <div className="space-y-3">
        {khataInsights.map((ins, i) => (
          <ActionCard key={i} insight={ins} index={i} expanded={expanded} onToggle={setExpanded} />
        ))}
      </div>
      <KPIList kpis={kpis} excludeKeywords={["revenue", "sales", "income", "expense", "cost", "spend"]} />
    </div>
  );
}

function FootfallSection({ kpis, insights }) {
  const [expanded, setExpanded] = useState(null);
  const footfallInsights = insights.footfall || [];
  const customerKpi = findKpiByKeywords(kpis, ["customer", "footfall", "visitor"]);
  const orderKpi = findKpiByKeywords(kpis, ["order", "transaction", "bill"]);

  return (
    <div className="space-y-6">
      <SectionHeader icon={Footprints} title="Footfall & Orders" subtitle="Customer traffic patterns and order trends" />
      {(customerKpi || orderKpi) && (
        <div className="card-elevated p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {customerKpi && <MetricBox label="Customers" value={customerKpi.current} change={customerKpi.change} />}
            {orderKpi && <MetricBox label="Orders" value={orderKpi.current} change={orderKpi.change} />}
          </div>
        </div>
      )}
      <div className="space-y-3">
        {footfallInsights.map((ins, i) => (
          <ActionCard key={i} insight={ins} index={i} expanded={expanded} onToggle={setExpanded} />
        ))}
        {footfallInsights.length === 0 && <EmptyState text="Log customer and order data to see footfall insights." />}
      </div>
    </div>
  );
}

function GodownSection({ kpis, insights }) {
  const [expanded, setExpanded] = useState(null);
  const godownInsights = insights.godown || [];
  const invKpi = findKpiByKeywords(kpis, ["inventory", "stock", "godown"]);

  return (
    <div className="space-y-6">
      <SectionHeader icon={Warehouse} title="Smart Godown" subtitle="Inventory efficiency. What's overstocked or running low?" />
      {invKpi && (
        <div className="card-elevated p-5">
          <MetricBox label="Current Inventory" value={invKpi.current} change={invKpi.change} />
        </div>
      )}
      <div className="space-y-3">
        {godownInsights.map((ins, i) => (
          <ActionCard key={i} insight={ins} index={i} expanded={expanded} onToggle={setExpanded} />
        ))}
        {godownInsights.length === 0 && <EmptyState text="Log your inventory and stock data to see godown insights." />}
      </div>
    </div>
  );
}

function CustomerSection({ kpis, insights, correlations }) {
  const [expanded, setExpanded] = useState(null);
  const customerInsights = insights.customer || [];
  const basketKpi = findKpiByKeywords(kpis, ["basket", "avg_order", "ticket"]);

  return (
    <div className="space-y-6">
      <SectionHeader icon={UserCheck} title="Customer Intelligence" subtitle="Who are your customers? How to keep them coming back?" />
      {basketKpi && (
        <div className="card-elevated p-5">
          <MetricBox label="Average Bill Value" value={basketKpi.current} change={basketKpi.change} isRupee />
        </div>
      )}
      <div className="space-y-3">
        {customerInsights.map((ins, i) => (
          <ActionCard key={i} insight={ins} index={i} expanded={expanded} onToggle={setExpanded} />
        ))}
        {customerInsights.length === 0 && <EmptyState text="Log customer data and basket size to see customer insights." />}
      </div>
      {correlations.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-medium text-surface-900 mb-3 flex items-center gap-2">
            <Link2 size={14} className="text-indigo-500" /> How Your Numbers Connect
          </h3>
          <div className="space-y-2">
            {correlations.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-100 text-xs">
                <span className="font-medium text-surface-700">{c.label1}</span>
                <span className={`text-xs ${c.direction === "positive" ? "text-green-600" : "text-red-500"}`}>
                  {c.direction === "positive" ? <TrendingUp size={12} className="inline" /> : <TrendingDown size={12} className="inline" />}
                </span>
                <span className="font-medium text-surface-700">{c.label2}</span>
                <span className="text-surface-400 ml-auto">{c.strength} link</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdvisorSection({ insights, allInsights, trendLock, expandedInsight, setExpandedInsight }) {
  const advisorInsights = [
    ...(insights.advisor || []),
    ...(insights.growth || []),
    ...(insights.savings || []),
    ...(insights.opportunity || []),
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon={BrainCircuit} title="Yukti Advisor" subtitle="AI-powered action plan for your business this week" />
      {trendLock?.direction && (
        <div className={`card-elevated p-5 border-l-4 ${trendLock.direction === "up" ? "border-l-green-500" : trendLock.direction === "down" ? "border-l-red-500" : "border-l-surface-400"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-indigo-500" />
            <h3 className="text-sm font-semibold text-surface-900">Business Status</h3>
          </div>
          <p className="text-sm text-surface-600">
            {trendLock.direction === "up"
              ? `Your ${trendLock.metric} is growing at ${trendLock.change}%. Great work! Now focus on sustaining this momentum.`
              : trendLock.direction === "down"
                ? `Your ${trendLock.metric} is down ${Math.abs(trendLock.change || 0)}%. Let's focus on recovery this week.`
                : "Your business is running steady. A great time to plan for growth."}
          </p>
        </div>
      )}
      <div className="space-y-3">
        {advisorInsights.map((ins, i) => (
          <ActionCard key={i} insight={ins} index={i} expanded={expandedInsight} onToggle={setExpandedInsight} />
        ))}
        {advisorInsights.length === 0 && <EmptyState text="Run an analysis with more data to get personalized advisor insights." />}
      </div>
      {allInsights.length > 0 && (
        <div className="card-elevated p-5 bg-indigo-50/50 border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-indigo-700">Top Priority This Week</h3>
          </div>
          <p className="text-sm text-surface-700 mb-2">{allInsights[0].title}</p>
          <p className="text-xs text-surface-600 leading-relaxed">{allInsights[0].recommendation}</p>
        </div>
      )}
    </div>
  );
}

function PredictionsSection({ forecasts, dataSufficiency, insights }) {
  const forecastInsights = insights.forecast || [];
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-6">
      <SectionHeader icon={LineChart} title="Predictions" subtitle="Where your business is heading based on your data" />
      {dataSufficiency !== "full" && (
        <div className="card-elevated p-5 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <CalendarDays size={20} className="text-amber-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-700">Yukti is still learning your business</h3>
              <p className="text-xs text-amber-600 mt-1">
                Log 14+ days of data to unlock powerful predictions. The more data you provide, the smarter Yukti gets.
              </p>
            </div>
          </div>
        </div>
      )}
      {forecasts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {forecasts.slice(0, 6).map((f, i) => {
            const isGrowth = (f.growthRate || 0) > 0;
            const r2 = f.r2 || 0;
            const confidenceLabel = r2 > 0.8 ? "High" : r2 > 0.5 ? "Medium" : "Low";
            const confidenceColor = r2 > 0.8 ? "bg-green-100 text-green-700" : r2 > 0.5 ? "bg-amber-100 text-amber-700" : "bg-surface-200 text-surface-600";
            return (
              <div key={i} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <LineChart size={13} className="text-indigo-400" />
                  <p className="text-xs text-surface-500 truncate">{f.label || f.column}</p>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-xl font-bold text-surface-900">
                    {f.predictions?.[0]?.value != null ? formatINR(f.predictions[0].value) : "---"}
                  </span>
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${isGrowth ? "text-green-600" : "text-red-500"}`}>
                    {isGrowth ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(f.growthRate || 0).toFixed(1)}%
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${confidenceColor}`}>
                  Yukti Confidence: {confidenceLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {forecasts.length > 0 && (
        <div style={{ minHeight: "320px" }}>
          <ForecastPanel forecasts={forecasts} expanded />
        </div>
      )}
      <div className="space-y-3">
        {forecastInsights.map((ins, i) => (
          <ActionCard key={i} insight={ins} index={i} expanded={expanded} onToggle={setExpanded} />
        ))}
      </div>
    </div>
  );
}

function AlertsSection({ anomalies, insights }) {
  const [expanded, setExpanded] = useState(null);
  const anomalyInsights = insights.anomaly || [];

  return (
    <div className="space-y-6">
      <SectionHeader icon={Bell} title="Alerts & Unusual Activity" subtitle="Things that look different from your normal pattern" />
      {anomalies.length === 0 ? (
        <div className="card-elevated p-8 text-center">
          <CheckCircle2 size={32} className="text-green-500 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-surface-900 mb-1">All Clear</h3>
          <p className="text-xs text-surface-500">All your numbers are within normal range. Nothing unusual today.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {anomalies.map((a, i) => {
            const isCritical = a.severity === "critical";
            const isHigh = a.severity === "high";
            return (
              <div key={i} className={`card p-4 border-l-4 ${isCritical ? "border-l-red-500 bg-red-50" : isHigh ? "border-l-amber-500 bg-amber-50" : "border-l-surface-400"}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className={isCritical ? "text-red-500" : isHigh ? "text-amber-500" : "text-surface-400"} />
                  <div>
                    <p className="text-sm font-medium text-surface-800">
                      {a.label || a.column}: {a.type === "spike" ? "Unusually high" : "Unusually low"}
                    </p>
                    <p className="text-xs text-surface-600 mt-0.5">
                      {Math.abs(a.deviation)}% different from your normal pattern.
                      {isCritical ? " Check this immediately." : " Keep an eye on it."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="space-y-3">
        {anomalyInsights.map((ins, i) => (
          <ActionCard key={i} insight={ins} index={i} expanded={expanded} onToggle={setExpanded} />
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   STRATEGY SECTION (new — from StrategyAdvisorPage)
   ================================================================ */

function StrategySection() {
  const { user, userProfile, getIdToken } = useAuth();
  const businessType = userProfile?.businessType || "";
  const category = getBusinessCategory(businessType);
  const categoryLabel = getCategoryLabel(businessType);
  const hasStock = needsStockManagement(businessType);

  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState(null);
  const [error, setError] = useState(null);
  const [stratTab, setStratTab] = useState("sales");

  const generateStrategy = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const logsQ = query(
        collection(db, "users", user.uid, "dailyLogs"),
        orderBy("createdAt", "desc"),
        limit(60),
      );
      const logsSnap = await getDocs(logsQ);
      const dailyLogs = logsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      let stockEntries = [];
      if (hasStock) {
        const stockQ = query(
          collection(db, "users", user.uid, "stockEntries"),
          orderBy("createdAt", "desc"),
          limit(30),
        );
        const stockSnap = await getDocs(stockQ);
        stockEntries = stockSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }

      if (dailyLogs.length === 0 && stockEntries.length === 0) {
        setError("No data found. Please log a few daily entries first so Yukti can generate smart recommendations.");
        setLoading(false);
        return;
      }

      const role = userProfile?.role || "paid-user";
      const token = await getIdToken();
      const result = await getStrategyAdvice(dailyLogs, stockEntries, businessType, category, token, user?.uid, role);
      setStrategy(result);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to generate strategy. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, userProfile?.role, businessType, category, hasStock, getIdToken]);

  const STRAT_TABS = [
    { key: "sales", label: "Sales Tips", icon: TrendingUp },
    { key: "customers", label: "Customer Strategies", icon: Users },
    { key: "stock", label: "Stock Analysis", icon: Package },
    { key: "purchase", label: "Buy Next Month", icon: ShoppingCart },
    { key: "roadmap", label: "Monthly Roadmap", icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader icon={Target} title="Strategy Advisor" subtitle={`AI-powered tips tailored for ${categoryLabel || "your business"}`} />

      {/* Generate / Regenerate button */}
      {!strategy && !loading && !error && (
        <div className="card-elevated p-6 bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-white border-indigo-200/60">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <Lightbulb size={22} className="text-white" />
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="text-sm font-semibold text-surface-900">Get Smart Business Recommendations</h3>
                <p className="text-xs text-surface-500 mt-1 leading-relaxed">
                  Yukti will analyse your daily logs, revenue trends, and stock data to generate personalised strategies
                  including sales tips, customer acquisition ideas, stock optimisation, and a monthly roadmap.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: TrendingUp, label: "Sales Tips" },
                  { icon: Users, label: "Customer Strategies" },
                  { icon: Package, label: "Stock Analysis" },
                  { icon: Calendar, label: "Monthly Roadmap" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs text-surface-600">
                    <item.icon size={14} className="text-indigo-500" />
                    {item.label}
                  </div>
                ))}
              </div>
              <button
                onClick={generateStrategy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-sm transition-all"
              >
                <Sparkles size={15} /> Analyse <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Loading */}
      {loading && !strategy && (
        <div className="card-elevated p-12 text-center">
          <Loader2 size={32} className="text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-surface-700 font-semibold mb-2">Generating Your Personalised Strategy...</p>
          <p className="text-[10px] text-surface-400">This may take 10-20 seconds</p>
        </div>
      )}

      {/* Strategy content */}
      {strategy && (
        <>
          {/* Quick stats */}
          {strategy.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {strategy.stats.avg_daily_revenue != null && (
                <div className="card p-4">
                  <p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider mb-1">Avg Daily Revenue</p>
                  <p className="text-lg font-bold text-surface-900">''' + "\u20B9" + r'''{strategy.stats.avg_daily_revenue.toLocaleString()}</p>
                </div>
              )}
              {strategy.stats.avg_daily_customers != null && (
                <div className="card p-4">
                  <p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider mb-1">Avg Customers/Day</p>
                  <p className="text-lg font-bold text-surface-900">{strategy.stats.avg_daily_customers}</p>
                </div>
              )}
              {strategy.stats.avg_daily_orders != null && (
                <div className="card p-4">
                  <p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider mb-1">Avg Orders/Day</p>
                  <p className="text-lg font-bold text-surface-900">{strategy.stats.avg_daily_orders}</p>
                </div>
              )}
              {strategy.stats.total_entries != null && (
                <div className="card p-4">
                  <p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider mb-1">Data Points</p>
                  <p className="text-lg font-bold text-surface-900">{strategy.stats.total_entries}</p>
                </div>
              )}
            </div>
          )}

          {/* AI provider badge + Regenerate */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-600 text-[10px] font-semibold uppercase tracking-wider">
              <Sparkles size={10} />
              {strategy.generated_by === "gemini_ai" ? "Powered by Gemini AI"
                : strategy.generated_by === "groq_ai" ? "Powered by Groq AI"
                : strategy.generated_by === "claude_ai" ? "Powered by Claude AI"
                : "Data-Driven Analysis"}
            </span>
            <button
              onClick={generateStrategy}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-medium hover:bg-indigo-100 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              {loading ? "Generating..." : "Regenerate"}
            </button>
          </div>

          {/* Strategy sub-tabs */}
          <div className="flex gap-1 bg-surface-100 rounded-xl p-1 overflow-x-auto">
            {STRAT_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStratTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  stratTab === tab.key
                    ? "bg-white shadow-sm text-indigo-600 border border-surface-300"
                    : "text-surface-500 hover:text-surface-700"
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sales Tips */}
          {stratTab === "sales" && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-surface-700 flex items-center gap-2">
                <TrendingUp size={15} className="text-indigo-500" /> Sales Improvement Tips
              </h3>
              {(strategy.salesTips || []).map((tip, i) => (
                <div key={i} className="card-elevated p-5 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-indigo-500">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-sm font-semibold text-surface-900">{tip.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${PRIORITY_STYLES[tip.priority] || PRIORITY_STYLES.medium}`}>
                        {tip.priority}
                      </span>
                    </div>
                    <p className="text-xs text-surface-500 leading-relaxed">{tip.description}</p>
                  </div>
                </div>
              ))}
              {(!strategy.salesTips || strategy.salesTips.length === 0) && <EmptyState text="No sales tips available yet." />}
            </div>
          )}

          {/* Customer Strategies */}
          {stratTab === "customers" && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-surface-700 flex items-center gap-2">
                <Users size={15} className="text-indigo-500" /> Customer Attraction Strategies
              </h3>
              {(strategy.customerStrategies || []).map((strat, i) => (
                <div key={i} className="card-elevated p-5 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Target size={14} className="text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-sm font-semibold text-surface-900">{strat.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${PRIORITY_STYLES[strat.priority] || PRIORITY_STYLES.medium}`}>
                        {strat.priority}
                      </span>
                    </div>
                    <p className="text-xs text-surface-500 leading-relaxed">{strat.description}</p>
                  </div>
                </div>
              ))}
              {(!strategy.customerStrategies || strategy.customerStrategies.length === 0) && <EmptyState text="No customer strategies available yet." />}
            </div>
          )}

          {/* Stock Analysis */}
          {stratTab === "stock" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-surface-700 flex items-center gap-2 mb-3">
                  <AlertCircle size={15} className="text-amber-500" /> Why Stock is Pending
                </h3>
                <div className="card-elevated p-5 space-y-3">
                  {(strategy.stockAnalysis?.pendingReasons || []).map((reason, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-amber-700">{i + 1}</span>
                      </div>
                      <p className="text-xs text-surface-600 leading-relaxed">{reason}</p>
                    </div>
                  ))}
                  {(!strategy.stockAnalysis?.pendingReasons || strategy.stockAnalysis.pendingReasons.length === 0) && (
                    <p className="text-xs text-surface-400">No pending stock issues found.</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-surface-700 flex items-center gap-2 mb-3">
                  <CheckCircle2 size={15} className="text-green-500" /> Stock Optimisation Recommendations
                </h3>
                <div className="card-elevated p-5 space-y-3">
                  {(strategy.stockAnalysis?.recommendations || []).map((rec, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <ChevronRight size={14} className="text-green-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-surface-600 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                  {(!strategy.stockAnalysis?.recommendations || strategy.stockAnalysis.recommendations.length === 0) && (
                    <p className="text-xs text-surface-400">No recommendations yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Purchase Suggestions */}
          {stratTab === "purchase" && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-surface-700 flex items-center gap-2">
                <ShoppingCart size={15} className="text-indigo-500" /> Recommended Items to Purchase Next Month
              </h3>
              {(strategy.purchaseSuggestions || []).map((item, i) => (
                <div key={i} className="card-elevated p-5 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Star size={14} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-sm font-semibold text-surface-900">{item.item}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.medium}`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-xs text-surface-500 leading-relaxed">{item.reason}</p>
                  </div>
                </div>
              ))}
              {(!strategy.purchaseSuggestions || strategy.purchaseSuggestions.length === 0) && <EmptyState text="No purchase suggestions available yet." />}
            </div>
          )}

          {/* Monthly Roadmap */}
          {stratTab === "roadmap" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-surface-700 flex items-center gap-2">
                <Calendar size={15} className="text-indigo-500" /> 4-Week Action Roadmap
              </h3>
              <div className="relative">
                <div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-indigo-100" />
                {(strategy.roadmap || []).map((week, wi) => (
                  <div key={wi} className="relative flex items-start gap-5 mb-6 last:mb-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 border-2 border-indigo-300 flex items-center justify-center shrink-0 z-10">
                      <span className="text-[10px] font-bold text-indigo-600">W{wi + 1}</span>
                    </div>
                    <div className="card-elevated p-5 flex-1">
                      <h4 className="text-sm font-semibold text-surface-900 mb-3">{week.week}</h4>
                      <div className="space-y-2">
                        {(week.actions || []).map((action, ai) => (
                          <div key={ai} className="flex items-start gap-2.5">
                            <ArrowRight size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-surface-600 leading-relaxed">{action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {(!strategy.roadmap || strategy.roadmap.length === 0) && <EmptyState text="No roadmap available yet." />}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ================================================================
   KPI LIST (other metrics)
   ================================================================ */

function KPIList({ kpis, excludeKeywords = [] }) {
  const filtered = kpis.filter((k) => {
    const name = (k.label + " " + (k.column || "")).toLowerCase();
    return !excludeKeywords.some((kw) => name.includes(kw));
  });
  if (filtered.length === 0) return null;

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-surface-900 mb-3 flex items-center gap-2">
        <BarChart2 size={14} className="text-indigo-500" /> Other Metrics
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((kpi, i) => {
          const isUp = kpi.change > 0;
          const isNeutral = Math.abs(kpi.change) < 2;
          const trendWord = kpi.trend === "rising" ? "Growing" : kpi.trend === "falling" ? "Declining" : "Steady";
          return (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-100">
              <div className="min-w-0">
                <p className="text-xs text-surface-600 truncate">{kpi.label}</p>
                <p className="text-[10px] text-surface-400">{trendWord}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-sm font-bold text-surface-900">{formatINR(kpi.current)}</p>
                <span className={`text-[10px] font-semibold ${isNeutral ? "text-surface-400" : isUp ? "text-green-600" : "text-red-500"}`}>
                  {isUp ? "+" : ""}{kpi.change}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================
   UTILITIES
   ================================================================ */

function findKpiByKeywords(kpis, keywords) {
  return (
    kpis.find((k) => {
      const name = (k.label + " " + (k.column || "")).toLowerCase();
      return keywords.some((kw) => name.includes(kw));
    }) || null
  );
}

function computeHealthScore(kpis, anomalies, insights, schema) {
  let score = 75;
  score += Math.min(10, kpis.filter((k) => k.trend === "rising").length * 2);
  score -= anomalies.filter((a) => a.severity === "critical").length * 8;
  score -= anomalies.filter((a) => a.severity === "high").length * 3;
  score -= insights.filter((i) => i.severity === "critical").length * 5;
  const completeness = schema?.data_quality?.overall_completeness ?? 100;
  if (completeness >= 98) score += 5;
  else if (completeness < 90) score -= 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function formatINR(value) {
  if (value == null) return "---";
  const num = Number(value);
  if (isNaN(num)) return String(value);
  if (Math.abs(num) >= 10000000) return `${(num / 10000000).toFixed(1)} Cr`;
  if (Math.abs(num) >= 100000) return `${(num / 100000).toFixed(1)} L`;
  if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(1)}K`;
  if (Number.isInteger(num)) return num.toLocaleString("en-IN");
  return num.toFixed(2);
}
'''

with open(r"e:\Coding\decision-system\frontend\src\components\Dashboard.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Dashboard.jsx v4 written successfully -", len(content), "characters")
