import { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  RefreshCw,
} from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function formatINR(value) {
  if (value == null) return "---";
  const num = Number(value);
  if (isNaN(num)) return String(value);
  if (Math.abs(num) >= 10000000) return `₹${(num / 10000000).toFixed(1)} Cr`;
  if (Math.abs(num) >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
  if (Math.abs(num) >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toLocaleString("en-IN")}`;
}

export default function WeeklyDigest({ token, analysisReady }) {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDigest = async () => {
    if (!analysisReady) return;
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/weekly-digest`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setDigest(data.digest);
    } catch (err) {
      console.error("Weekly digest failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (analysisReady) fetchDigest();
  }, [analysisReady]);

  if (!analysisReady) return null;

  if (loading) {
    return (
      <div className="card p-5 flex items-center gap-3">
        <Loader2 size={16} className="animate-spin text-indigo-500" />
        <span className="text-sm text-surface-500">Generating weekly digest…</span>
      </div>
    );
  }

  if (!digest) return null;

  const isUp = digest.week_change > 0;
  const isDown = digest.week_change < -5;
  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : ArrowRight;

  const weekStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="card-elevated overflow-hidden">
      {/* Header band */}
      <div
        className={`px-5 py-4 ${
          isUp
            ? "bg-gradient-to-r from-green-500 to-emerald-600"
            : isDown
            ? "bg-gradient-to-r from-red-500 to-rose-600"
            : "bg-gradient-to-r from-indigo-500 to-purple-600"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-white/80" />
            <span className="text-xs text-white/80 font-medium">Weekly Digest — {weekStr}</span>
          </div>
          <button
            onClick={fetchDigest}
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
            title="Refresh"
          >
            <RefreshCw size={12} />
          </button>
        </div>
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendIcon size={20} className="text-white" />
            <span className="text-xl font-bold text-white">{digest.trend_word}</span>
            <span
              className={`text-sm font-semibold ${
                isUp ? "text-green-100" : isDown ? "text-red-100" : "text-white/70"
              }`}
            >
              {digest.week_change > 0 ? "+" : ""}
              {digest.week_change}%
            </span>
          </div>
          {digest.week_revenue > 0 && (
            <p className="text-white/80 text-sm">
              Week revenue: <span className="font-bold text-white">{formatINR(digest.week_revenue)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {/* Top insight */}
        <div className="mb-4 px-4 py-3 rounded-xl bg-surface-50 border border-surface-200">
          <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide mb-1">
            Key Insight
          </p>
          <p className="text-sm font-medium text-surface-800">{digest.top_insight_title}</p>
        </div>

        {/* Alert count */}
        {digest.alert_count > 0 && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">
              <span className="font-semibold">{digest.alert_count} alert{digest.alert_count !== 1 ? "s" : ""}</span> need your attention this week.
            </p>
          </div>
        )}

        {/* Actions */}
        <div>
          <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wide mb-3">
            Top Actions This Week
          </p>
          <div className="space-y-2.5">
            {(digest.actions || []).map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold ${
                    item.priority === 1
                      ? "bg-red-100 text-red-600"
                      : item.priority === 2
                      ? "bg-amber-100 text-amber-600"
                      : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-800 font-medium leading-snug">{item.action}</p>
                  {item.impact && (
                    <p className="text-[11px] text-surface-500 mt-0.5 flex items-center gap-1">
                      <Zap size={10} className="text-amber-400" />
                      {item.impact}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
