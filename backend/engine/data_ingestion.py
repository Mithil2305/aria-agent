"""
Layer 1: Data Ingestion
Parses CSV/Excel files, cleans data, normalizes into unified structures.
Uses Pandas for robust data handling.
"""

import pandas as pd
import numpy as np
import io
import json
from datetime import datetime, timedelta


def ingest_file(contents: bytes, filename: str) -> dict:
    """Parse uploaded file contents into a cleaned DataFrame dictionary."""
    ext = filename.rsplit(".", 1)[-1].lower()

    if ext == "csv":
        df = pd.read_csv(io.BytesIO(contents))
    elif ext in ("xlsx", "xls"):
        df = pd.read_excel(io.BytesIO(contents), engine="openpyxl")
    else:
        raise ValueError(f"Unsupported file format: .{ext}")

    df = _clean_dataframe(df)

    data = df.to_dict(orient="records")
    # Sanitize NaN/Inf for JSON
    data = _sanitize_for_json(data)

    return {
        "data": data,
        "columns": list(df.columns),
        "row_count": len(df),
        "col_count": len(df.columns),
        "preview": _sanitize_for_json(df.head(5).to_dict(orient="records")),
    }


def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and normalize a DataFrame."""
    # Remove empty columns
    df = df.dropna(axis=1, how="all")
    # Remove completely empty rows
    df = df.dropna(axis=0, how="all")
    # Strip whitespace from column names
    df.columns = [str(c).strip() for c in df.columns]
    # Remove unnamed columns
    df = df[[c for c in df.columns if not c.startswith("Unnamed")]]
    # Convert date-like strings
    for col in df.columns:
        if df[col].dtype == object:
            try:
                parsed = pd.to_datetime(df[col], errors="coerce")
                if parsed.notna().sum() / len(df) > 0.7:
                    df[col] = parsed
            except Exception:
                pass
    return df.reset_index(drop=True)


def _sanitize_for_json(data):
    """Replace NaN/Inf with None for JSON serialization."""
    if isinstance(data, list):
        return [_sanitize_for_json(item) for item in data]
    elif isinstance(data, dict):
        return {k: _sanitize_for_json(v) for k, v in data.items()}
    elif isinstance(data, float):
        if np.isnan(data) or np.isinf(data):
            return None
        return data
    elif isinstance(data, (np.integer,)):
        return int(data)
    elif isinstance(data, (np.floating,)):
        if np.isnan(data) or np.isinf(data):
            return None
        return float(data)
    elif isinstance(data, (np.bool_,)):
        return bool(data)
    elif isinstance(data, (pd.Timestamp, datetime)):
        return data.isoformat()
    elif isinstance(data, (np.ndarray,)):
        return data.tolist()
    return data


def generate_sample_data() -> dict:
    """Generate a realistic business dataset for demonstration."""
    np.random.seed(42)
    n = 36  # 3 years monthly

    dates = pd.date_range(start="2023-01-01", periods=n, freq="MS")

    # Trend + seasonality + noise
    trend = np.linspace(0, 0.4, n)
    seasonality = 0.15 * np.sin(np.arange(n) / 12 * 2 * np.pi)
    noise = np.random.normal(0, 0.05, n)

    base_revenue = 125000
    revenue = base_revenue * (1 + trend + seasonality + noise)
    # Inject anomalies
    revenue[11] *= 1.38  # Dec 2023 spike
    revenue[23] *= 1.32  # Dec 2024 spike
    revenue[7] *= 0.71   # Aug 2023 dip

    customers = (3200 * (1 + trend * 0.7 + seasonality * 0.5 + np.random.normal(0, 0.04, n))).astype(int)
    avg_order = 38 + np.arange(n) * 0.3 + np.random.normal(0, 2, n)
    conversion = 3.2 + seasonality * 2 + np.random.normal(0, 0.3, n)
    churn = np.clip(4.5 - trend * 3 + np.random.normal(0, 0.4, n), 0.5, 8)
    marketing = 18000 + np.arange(n) * 500 + np.random.normal(0, 1500, n)
    nps = np.clip(42 + np.arange(n) * 0.8 + np.random.normal(0, 2.5, n), 10, 80)
    support_tickets = np.clip(450 - np.arange(n) * 5 + np.random.normal(0, 30, n), 50, 800).astype(int)
    mrr = revenue * 0.72 + np.random.normal(0, 2000, n)
    cac = np.clip(85 - np.arange(n) * 0.8 + np.random.normal(0, 5, n), 20, 150)
    ltv = avg_order * 12 * (1 + trend * 0.5) + np.random.normal(0, 10, n)

    regions = ["North", "South", "East", "West"]
    categories = ["SaaS Platform", "Enterprise Suite", "SMB Tools"]
    segments = ["Growth", "Mature", "New"]

    records = []
    for i in range(n):
        records.append({
            "Date": dates[i].strftime("%Y-%m-%d"),
            "Revenue": round(float(revenue[i]), 2),
            "MRR": round(float(mrr[i]), 2),
            "Active Customers": int(customers[i]),
            "Avg Order Value": round(float(avg_order[i]), 2),
            "Conversion Rate %": round(float(conversion[i]), 2),
            "Churn Rate %": round(float(churn[i]), 2),
            "Marketing Spend": round(float(marketing[i]), 2),
            "CAC": round(float(cac[i]), 2),
            "Customer LTV": round(float(ltv[i]), 2),
            "Net Promoter Score": round(float(nps[i]), 1),
            "Support Tickets": int(support_tickets[i]),
            "Region": regions[i % 4],
            "Product Line": categories[i % 3],
            "Segment": segments[i % 3],
        })

    return {
        "data": records,
        "filename": "business_metrics_2023_2025.csv",
        "columns": list(records[0].keys()),
        "row_count": len(records),
        "col_count": len(records[0]),
        "preview": records[:5],
    }
