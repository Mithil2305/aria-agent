"""
Layer 5: Decision Intelligence Engine
Correlation analysis, feature importance estimation, risk scoring,
and dependency mapping. Uses Pandas, NumPy, SciPy, scikit-learn.
"""

import pandas as pd
import numpy as np
from scipy import stats
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler


def compute_decisions(data: list[dict], schema: dict) -> dict:
    """Run decision intelligence pipeline."""
    df = pd.DataFrame(data)

    correlations = _compute_correlations(df, schema)
    feature_importance = _compute_feature_importance(df, schema)
    risk_scores = _compute_risk_scores(df, schema)

    return {
        "correlations": correlations,
        "feature_importance": feature_importance,
        "risk_scores": risk_scores,
    }


def _compute_correlations(df: pd.DataFrame, schema: dict) -> list:
    """Compute Pearson correlations between all numeric pairs."""
    numeric_cols = [c for c in schema["columns"] if schema["types"].get(c) == "numeric"]

    if len(numeric_cols) < 2:
        return []

    # Build numeric dataframe
    num_df = pd.DataFrame()
    for col in numeric_cols:
        num_df[col] = _to_numeric(df[col])

    num_df = num_df.dropna()
    if len(num_df) < 5:
        return []

    correlations = []
    for i in range(len(numeric_cols)):
        for j in range(i + 1, len(numeric_cols)):
            col1 = numeric_cols[i]
            col2 = numeric_cols[j]

            r, p_value = stats.pearsonr(num_df[col1].values, num_df[col2].values)

            if abs(r) < 0.25:
                continue

            strength = "strong" if abs(r) > 0.7 else "moderate" if abs(r) > 0.5 else "weak"
            direction = "positive" if r > 0 else "negative"

            # Sample scatter points
            sample = num_df[[col1, col2]].sample(min(200, len(num_df)), random_state=42)
            scatter = [
                {"x": round(float(row[col1]), 2), "y": round(float(row[col2]), 2)}
                for _, row in sample.iterrows()
            ]

            correlations.append({
                "col1": col1,
                "col2": col2,
                "label1": _format_label(col1),
                "label2": _format_label(col2),
                "correlation": round(float(r), 3),
                "p_value": round(float(p_value), 4),
                "strength": strength,
                "direction": direction,
                "scatter": scatter,
                "is_significant": p_value < 0.05,
            })

    correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)
    return correlations[:20]


def _compute_feature_importance(df: pd.DataFrame, schema: dict) -> list:
    """Estimate feature importance using Random Forest on first numeric column as target."""
    numeric_cols = [c for c in schema["columns"] if schema["types"].get(c) == "numeric"]

    if len(numeric_cols) < 3:
        return []

    # Use first column as target (typically the most important business metric)
    target_col = numeric_cols[0]
    feature_cols = numeric_cols[1:]

    num_df = pd.DataFrame()
    for col in numeric_cols:
        num_df[col] = _to_numeric(df[col])
    num_df = num_df.dropna()

    if len(num_df) < 10:
        return []

    X = num_df[feature_cols].values
    y = num_df[target_col].values

    try:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        rf = RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42)
        rf.fit(X_scaled, y)

        importances = rf.feature_importances_
        result = []
        for k, col in enumerate(feature_cols):
            result.append({
                "feature": col,
                "label": _format_label(col),
                "importance": round(float(importances[k]), 4),
                "rank": 0,  # will be set below
                "target": _format_label(target_col),
            })

        result.sort(key=lambda x: x["importance"], reverse=True)
        for rank, item in enumerate(result):
            item["rank"] = rank + 1

        return result
    except Exception:
        return []


def _compute_risk_scores(df: pd.DataFrame, schema: dict) -> list:
    """Compute risk indicators for each numeric metric."""
    numeric_cols = [c for c in schema["columns"] if schema["types"].get(c) == "numeric"]
    risks = []

    for col in numeric_cols:
        series = _to_numeric(df[col]).dropna()
        if len(series) < 5:
            continue

        values = series.values.astype(float)
        mean = float(np.mean(values))
        std = float(np.std(values))
        cv = abs(std / mean * 100) if mean != 0 else 0

        # Trend (linear regression)
        x = np.arange(len(values))
        slope, _, r_value, p_value, _ = stats.linregress(x, values)
        growth = (slope / abs(mean) * 100) if mean != 0 else 0

        # Risk components
        volatility_risk = min(1.0, cv / 80)
        trend_risk = min(1.0, max(0, -growth / 10)) if growth < 0 else 0
        outlier_ratio = np.sum(np.abs((values - mean) / std) > 2.5) / len(values) if std > 0 else 0
        outlier_risk = min(1.0, outlier_ratio * 10)

        # Composite risk score
        risk_score = (volatility_risk * 0.4 + trend_risk * 0.35 + outlier_risk * 0.25)
        risk_level = "critical" if risk_score > 0.7 else "high" if risk_score > 0.5 else "moderate" if risk_score > 0.3 else "low"

        risks.append({
            "column": col,
            "label": _format_label(col),
            "risk_score": round(risk_score, 2),
            "risk_level": risk_level,
            "volatility_component": round(volatility_risk, 2),
            "trend_component": round(trend_risk, 2),
            "outlier_component": round(outlier_risk, 2),
            "growth_rate": round(growth, 2),
        })

    risks.sort(key=lambda x: x["risk_score"], reverse=True)
    return risks


# ---------- Helpers ----------

def _to_numeric(series: pd.Series) -> pd.Series:
    if pd.api.types.is_numeric_dtype(series):
        return series
    cleaned = series.astype(str).str.replace(r"[$,%]", "", regex=True)
    return pd.to_numeric(cleaned, errors="coerce")


def _format_label(col: str) -> str:
    import re
    label = re.sub(r"[_-]", " ", col)
    label = re.sub(r"([a-z])([A-Z])", r"\1 \2", label)
    return label.title().strip()
