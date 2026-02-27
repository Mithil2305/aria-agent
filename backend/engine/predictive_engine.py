"""
Layer 4: Predictive Intelligence Engine
Forecasting with linear/polynomial regression, uncertainty bands,
anomaly detection with Z-score and IQR methods.
Uses NumPy, SciPy, and scikit-learn.
"""

import pandas as pd
import numpy as np
from scipy import stats
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures


def compute_predictions(data: list[dict], schema: dict) -> dict:
    """Run predictive analytics: forecasting + anomaly detection."""
    df = pd.DataFrame(data)

    forecasts = _generate_forecasts(df, schema)
    anomalies = _detect_anomalies(df, schema)

    return {
        "forecasts": forecasts,
        "anomalies": anomalies,
    }


def _generate_forecasts(df: pd.DataFrame, schema: dict) -> list:
    """Generate forecasts for numeric columns using regression + uncertainty."""
    temporal_col = next((c for c in schema["columns"] if schema["types"].get(c) == "temporal"), None)
    numeric_cols = [c for c in schema["columns"] if schema["types"].get(c) == "numeric"]

    if not numeric_cols:
        return []

    forecasts = []
    for col in numeric_cols[:4]:
        series = _to_numeric(df[col]).dropna()
        if len(series) < 5:
            continue

        values = series.values.astype(float)
        n = len(values)
        x = np.arange(n).reshape(-1, 1)

        # Fit linear regression
        model = LinearRegression()
        model.fit(x, values)
        r2_linear = model.score(x, values)

        # Try polynomial (degree 2) for better fit
        poly = PolynomialFeatures(degree=2)
        x_poly = poly.fit_transform(x)
        model_poly = LinearRegression()
        model_poly.fit(x_poly, values)
        r2_poly = model_poly.score(x_poly, values)

        # Use poly if significantly better
        use_poly = r2_poly > r2_linear + 0.05

        # Compute residuals for uncertainty estimation
        if use_poly:
            predicted_hist = model_poly.predict(x_poly)
        else:
            predicted_hist = model.predict(x)

        residuals = values - predicted_hist
        residual_std = float(np.std(residuals))

        # Historical data points
        historical = []
        for i in range(n):
            label = str(df.iloc[i].get(temporal_col, ""))[:10] if temporal_col else str(i + 1)
            historical.append({
                "index": i,
                "actual": round(float(values[i]), 2),
                "fitted": round(float(predicted_hist[i]), 2),
                "label": label,
            })

        # Forecast future points
        forecast_steps = max(5, int(n * 0.25))
        forecast_data = []

        for i in range(forecast_steps):
            x_future = np.array([[n + i]])
            if use_poly:
                x_future_poly = poly.transform(x_future)
                pred = float(model_poly.predict(x_future_poly)[0])
            else:
                pred = float(model.predict(x_future)[0])

            # Widen uncertainty over forecast horizon
            uncertainty = residual_std * np.sqrt(1 + (i + 1) / n) * 1.96

            forecast_data.append({
                "index": n + i,
                "predicted": round(pred, 2),
                "upper": round(pred + uncertainty, 2),
                "lower": round(pred - uncertainty, 2),
                "label": f"F+{i + 1}",
            })

        # Overall forecast metadata
        slope = float(model.coef_[0])
        mean_val = float(np.mean(values))
        growth_rate = (slope / abs(mean_val) * 100) if mean_val != 0 else 0
        r2 = round(r2_poly if use_poly else r2_linear, 3)
        conf = max(0.4, min(0.97, r2 * 0.6 + (1 - min(residual_std / abs(mean_val), 1)) * 0.4)) if mean_val != 0 else 0.5

        trend_dir = "upward" if slope > 0 else "downward" if slope < 0 else "flat"

        forecasts.append({
            "column": col,
            "label": _format_label(col),
            "historical": historical,
            "forecast": forecast_data,
            "trend": trend_dir,
            "growth_rate": round(growth_rate, 2),
            "confidence": round(conf, 2),
            "r2": r2,
            "model_type": "polynomial" if use_poly else "linear",
            "residual_std": round(residual_std, 2),
        })

    return forecasts


def _detect_anomalies(df: pd.DataFrame, schema: dict) -> list:
    """Detect anomalies using Z-score and IQR methods."""
    anomalies = []
    numeric_cols = [c for c in schema["columns"] if schema["types"].get(c) == "numeric"]
    temporal_col = next((c for c in schema["columns"] if schema["types"].get(c) == "temporal"), None)

    for col in numeric_cols:
        series = _to_numeric(df[col]).dropna()
        if len(series) < 5:
            continue

        values = series.values.astype(float)
        mean = float(np.mean(values))
        std = float(np.std(values))
        q1 = float(np.percentile(values, 25))
        q3 = float(np.percentile(values, 75))
        iqr = q3 - q1

        # Z-score method
        z_threshold = 2.5
        # IQR method
        iqr_lower = q1 - 1.5 * iqr
        iqr_upper = q3 + 1.5 * iqr

        for i, val in enumerate(values):
            z_score = abs((val - mean) / std) if std > 0 else 0
            is_iqr_outlier = val < iqr_lower or val > iqr_upper

            if z_score > z_threshold or is_iqr_outlier:
                severity = "critical" if z_score > 3.5 else "high" if z_score > 3.0 else "medium"
                deviation = ((val - mean) / abs(mean) * 100) if mean != 0 else 0
                anom_type = "spike" if val > mean else "dip"

                label_val = str(df.iloc[i].get(temporal_col, ""))[:10] if temporal_col else f"Row {i + 1}"

                anomalies.append({
                    "column": col,
                    "label": _format_label(col),
                    "index": i,
                    "row_label": label_val,
                    "value": round(float(val), 2),
                    "expected": round(mean, 2),
                    "deviation": round(deviation, 1),
                    "z_score": round(z_score, 2),
                    "severity": severity,
                    "type": anom_type,
                    "method": "z-score" if z_score > z_threshold else "iqr",
                })

    # Sort by severity (critical first) then z-score
    severity_rank = {"critical": 0, "high": 1, "medium": 2}
    anomalies.sort(key=lambda x: (severity_rank.get(x["severity"], 9), -x["z_score"]))
    return anomalies[:25]


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
