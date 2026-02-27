"""
Layer 2: Schema Intelligence Engine
Auto-detects numeric, categorical, temporal features.
Computes statistical profiles, distributions, and data quality metrics.
"""

import pandas as pd
import numpy as np
from datetime import datetime


def analyze_schema(data: list[dict]) -> dict:
    """Analyze dataset schema: types, profiles, distributions, quality."""
    df = pd.DataFrame(data)

    columns = list(df.columns)
    types = {}
    profiles = {}

    for col in columns:
        series = df[col]
        col_type = _infer_type(series, col)
        types[col] = col_type
        profiles[col] = _profile_column(series, col_type)

    # Summary counts
    type_counts = {"numeric": 0, "categorical": 0, "temporal": 0}
    for t in types.values():
        if t in type_counts:
            type_counts[t] += 1

    return {
        "columns": columns,
        "types": types,
        "profiles": profiles,
        "type_counts": type_counts,
        "total_rows": len(df),
        "total_columns": len(columns),
        "data_quality": _compute_quality(df, types),
    }


def _infer_type(series: pd.Series, col_name: str) -> str:
    """Infer whether a column is numeric, categorical, or temporal."""
    name_lower = col_name.lower()

    # Temporal keywords
    temporal_kw = ["date", "time", "year", "month", "day", "created", "updated",
                   "timestamp", "period", "quarter"]
    if any(kw in name_lower for kw in temporal_kw):
        if _is_temporal(series):
            return "temporal"

    # Check if already datetime
    if pd.api.types.is_datetime64_any_dtype(series):
        return "temporal"

    # Check numeric
    if pd.api.types.is_numeric_dtype(series):
        # If very few unique values relative to count, might be categorical encoded
        if series.nunique() < min(10, len(series) * 0.05) and series.nunique() < 20:
            return "categorical"
        return "numeric"

    # Try parsing as numeric (handles "$1,234" style)
    cleaned = series.dropna().astype(str).str.replace(r"[$,%]", "", regex=True).str.strip()
    numeric_count = pd.to_numeric(cleaned, errors="coerce").notna().sum()
    if numeric_count / max(len(series.dropna()), 1) > 0.8:
        return "numeric"

    # Try parsing as datetime
    if _is_temporal(series):
        return "temporal"

    return "categorical"


def _is_temporal(series: pd.Series) -> bool:
    """Test if a series can be parsed as dates."""
    try:
        sample = series.dropna().head(50)
        parsed = pd.to_datetime(sample, errors="coerce")
        return parsed.notna().sum() / max(len(sample), 1) > 0.7
    except Exception:
        return False


def _profile_column(series: pd.Series, col_type: str) -> dict:
    """Generate detailed profile for a column based on its type."""
    total = len(series)
    non_null = int(series.notna().sum())
    null_count = total - non_null
    unique_count = int(series.nunique())
    completeness = round(non_null / total * 100, 1) if total > 0 else 0

    base = {
        "total_count": total,
        "non_null": non_null,
        "null_count": null_count,
        "unique_count": unique_count,
        "completeness": completeness,
    }

    if col_type == "numeric":
        nums = pd.to_numeric(
            series.dropna().astype(str).str.replace(r"[$,%]", "", regex=True),
            errors="coerce"
        ).dropna()

        if len(nums) > 0:
            base.update({
                "min": round(float(nums.min()), 4),
                "max": round(float(nums.max()), 4),
                "mean": round(float(nums.mean()), 4),
                "median": round(float(nums.median()), 4),
                "std_dev": round(float(nums.std()), 4),
                "variance": round(float(nums.var()), 4),
                "skewness": round(float(nums.skew()), 4),
                "kurtosis": round(float(nums.kurtosis()), 4),
                "q1": round(float(nums.quantile(0.25)), 4),
                "q3": round(float(nums.quantile(0.75)), 4),
                "iqr": round(float(nums.quantile(0.75) - nums.quantile(0.25)), 4),
                "cv": round(float(nums.std() / abs(nums.mean())) * 100, 2) if nums.mean() != 0 else 0,
            })

    elif col_type == "temporal":
        try:
            dates = pd.to_datetime(series.dropna(), errors="coerce").dropna()
            if len(dates) > 0:
                base.update({
                    "earliest": dates.min().isoformat(),
                    "latest": dates.max().isoformat(),
                    "span_days": int((dates.max() - dates.min()).days),
                    "frequency_guess": _guess_frequency(dates),
                })
        except Exception:
            pass

    elif col_type == "categorical":
        freq = series.dropna().value_counts()
        top_values = [[str(k), int(v)] for k, v in freq.head(10).items()]
        base.update({
            "cardinality": unique_count,
            "top_values": top_values,
            "mode": str(freq.index[0]) if len(freq) > 0 else None,
            "mode_frequency": int(freq.iloc[0]) if len(freq) > 0 else 0,
        })

    return base


def _guess_frequency(dates: pd.Series) -> str:
    """Guess the frequency of a date series."""
    if len(dates) < 2:
        return "unknown"
    diffs = dates.sort_values().diff().dropna().dt.days
    median_diff = diffs.median()
    if median_diff <= 1:
        return "daily"
    elif median_diff <= 8:
        return "weekly"
    elif median_diff <= 35:
        return "monthly"
    elif median_diff <= 95:
        return "quarterly"
    elif median_diff <= 370:
        return "yearly"
    return "irregular"


def _compute_quality(df: pd.DataFrame, types: dict) -> dict:
    """Compute overall data quality metrics."""
    total_cells = df.shape[0] * df.shape[1]
    null_cells = int(df.isnull().sum().sum())
    completeness = round((1 - null_cells / total_cells) * 100, 1) if total_cells > 0 else 100

    # Duplicate rows
    dup_count = int(df.duplicated().sum())

    return {
        "overall_completeness": completeness,
        "total_cells": total_cells,
        "null_cells": null_cells,
        "duplicate_rows": dup_count,
        "quality_score": round(min(100, completeness + (5 if dup_count == 0 else 0)), 1),
    }
