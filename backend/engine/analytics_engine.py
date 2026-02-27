"""
Layer 3: Analytics & Modeling Engine
Computes KPIs, trends, seasonality, volatility, growth patterns using
Pandas, NumPy, and statistical methods.
"""

import pandas as pd
import numpy as np
from scipy import stats


def compute_analytics(data: list[dict], schema: dict) -> dict:
    """Run full analytics pipeline on the dataset."""
    df = pd.DataFrame(data)

    kpis = _compute_kpis(df, schema)
    trends = _compute_trends(df, schema)
    distributions = _compute_distributions(df, schema)

    return {
        "kpis": kpis,
        "trends": trends,
        "distributions": distributions,
    }


def _compute_kpis(df: pd.DataFrame, schema: dict) -> list:
    """Compute KPI summary cards for each numeric feature."""
    kpis = []
    numeric_cols = [c for c in schema["columns"] if schema["types"].get(c) == "numeric"]

    for col in numeric_cols:
        series = _to_numeric(df[col])
        if len(series.dropna()) < 2:
            continue

        values = series.dropna().values
        n = len(values)
        current = float(values[-1])
        mean = float(np.mean(values))
        std = float(np.std(values))
        median = float(np.median(values))
        cv = abs(std / mean * 100) if mean != 0 else 0

        # Change vs recent baseline (last 10%)
        baseline_idx = max(0, n - max(2, int(n * 0.1)))
        baseline = float(np.mean(values[baseline_idx:]))
        prev_baseline = float(np.mean(values[:baseline_idx])) if baseline_idx > 0 else baseline
        change = ((baseline - prev_baseline) / abs(prev_baseline) * 100) if prev_baseline != 0 else 0

        # Trend detection via linear regression
        x = np.arange(n)
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, values)
        trend_dir = "rising" if slope > 0 and p_value < 0.1 else "falling" if slope < 0 and p_value < 0.1 else "stable"

        # Growth rate (annualized if temporal context)
        growth_rate = (slope / abs(mean) * 100) if mean != 0 else 0

        # Confidence based on R² and CV
        confidence = max(0.5, min(0.99, 0.5 + r_value ** 2 * 0.3 + (1 - min(cv / 100, 1)) * 0.2))

        # Significance score (combines volatility, trend strength, and range)
        significance = min(1.0, abs(r_value) * 0.4 + (cv / 100) * 0.3 + (0.3 if p_value < 0.05 else 0.1))

        kpis.append({
            "label": _format_label(col),
            "column": col,
            "current": round(current, 2),
            "mean": round(mean, 2),
            "median": round(median, 2),
            "min": round(float(np.min(values)), 2),
            "max": round(float(np.max(values)), 2),
            "std_dev": round(std, 2),
            "change": round(change, 2),
            "trend": trend_dir,
            "growth_rate": round(growth_rate, 2),
            "volatility": round(cv, 1),
            "confidence": round(confidence, 2),
            "significance": round(significance, 2),
            "p_value": round(p_value, 4),
            "r_squared": round(r_value ** 2, 3),
        })

    # Sort by significance descending
    kpis.sort(key=lambda x: x["significance"], reverse=True)
    return kpis


def _compute_trends(df: pd.DataFrame, schema: dict) -> list:
    """Compute time-series trend data for visualisation."""
    temporal_col = next((c for c in schema["columns"] if schema["types"].get(c) == "temporal"), None)
    numeric_cols = [c for c in schema["columns"] if schema["types"].get(c) == "numeric"]

    if not numeric_cols:
        return []

    if temporal_col:
        df_sorted = df.copy()
        df_sorted[temporal_col] = pd.to_datetime(df_sorted[temporal_col], errors="coerce")
        df_sorted = df_sorted.sort_values(temporal_col)
    else:
        df_sorted = df.copy()

    trends = []
    for col in numeric_cols[:6]:
        series = _to_numeric(df_sorted[col])
        data_points = []

        for i, (_, row) in enumerate(df_sorted.iterrows()):
            val = _safe_float(row[col])
            label = str(row[temporal_col])[:10] if temporal_col else str(i + 1)
            if val is not None:
                data_points.append({"x": label, "y": round(val, 2)})

        if data_points:
            # Compute moving average
            vals = [p["y"] for p in data_points]
            window = max(2, len(vals) // 6)
            ma = pd.Series(vals).rolling(window=window, center=True).mean().tolist()

            for j, p in enumerate(data_points):
                p["ma"] = round(ma[j], 2) if j < len(ma) and not pd.isna(ma[j]) else None

            trends.append({
                "column": col,
                "label": _format_label(col),
                "data": data_points,
            })

    return trends


def _compute_distributions(df: pd.DataFrame, schema: dict) -> list:
    """Compute histogram/distribution data for numeric columns."""
    distributions = []
    numeric_cols = [c for c in schema["columns"] if schema["types"].get(c) == "numeric"]

    for col in numeric_cols[:6]:
        series = _to_numeric(df[col]).dropna()
        if len(series) < 5:
            continue

        # Histogram bins
        counts, bin_edges = np.histogram(series, bins=min(20, len(series) // 2))
        bins = []
        for k in range(len(counts)):
            bins.append({
                "range": f"{bin_edges[k]:.1f}-{bin_edges[k+1]:.1f}",
                "count": int(counts[k]),
                "mid": round(float((bin_edges[k] + bin_edges[k + 1]) / 2), 2),
            })

        distributions.append({
            "column": col,
            "label": _format_label(col),
            "bins": bins,
            "stats": {
                "mean": round(float(series.mean()), 2),
                "median": round(float(series.median()), 2),
                "std": round(float(series.std()), 2),
                "skewness": round(float(series.skew()), 2),
            },
        })

    return distributions


# ---------- Helpers ----------

def _to_numeric(series: pd.Series) -> pd.Series:
    """Convert a series to numeric, handling $ and % symbols."""
    if pd.api.types.is_numeric_dtype(series):
        return series
    cleaned = series.astype(str).str.replace(r"[$,%]", "", regex=True)
    return pd.to_numeric(cleaned, errors="coerce")


def _safe_float(val) -> float | None:
    """Safely convert a value to float."""
    try:
        if pd.isna(val):
            return None
        s = str(val).replace("$", "").replace(",", "").replace("%", "").strip()
        return float(s)
    except (ValueError, TypeError):
        return None


def _format_label(col: str) -> str:
    """Convert column name to human-readable label."""
    import re
    label = re.sub(r"[_-]", " ", col)
    label = re.sub(r"([a-z])([A-Z])", r"\1 \2", label)
    return label.title().strip()
