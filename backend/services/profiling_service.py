"""
profiling_service.py

The core statistical engine. Everything here is computed directly from
the dataframe with Pandas/NumPy/SciPy — no AI, no invented numbers.
This is the single source of truth that dataset_analysis and
dataset_columns rows are built from, and later the only data Gemini
is ever allowed to explain (never generate).

Covers spec Sections 4 (Automatic Data Profiling), 6 (Data Health
Check), 7 (Data Quality Score), 8 (Usability), 9 (Column Analysis).
"""
from __future__ import annotations

import re
from typing import Any

import numpy as np
import pandas as pd
from scipy import stats as scipy_stats


# ---------------------------------------------------------------------------
# Data type detection
# ---------------------------------------------------------------------------

DATE_HINT_PATTERN = re.compile(r"date|_dt$|^dt_|time|created|updated|timestamp", re.IGNORECASE)


def _is_stringlike_dtype(series: pd.Series) -> bool:
    """
    True for legacy object-dtype string columns AND pandas' newer dedicated
    string dtypes (e.g. StringDtype / "str" backend introduced in pandas 2.x/3.x).
    Using only `dtype == object` silently breaks date/categorical detection
    on newer pandas versions where read_csv defaults to a string dtype.
    """
    return series.dtype == object or pd.api.types.is_string_dtype(series)


def _try_parse_dates(series: pd.Series) -> pd.Series | None:
    """Attempt to parse a column as dates. Returns parsed series or None."""
    if _is_stringlike_dtype(series) or "date" in str(series.dtype).lower():
        sample = series.dropna().astype(str).head(50)
        if sample.empty:
            return None
        try:
            parsed_sample = pd.to_datetime(sample, errors="coerce", format="mixed")
        except (ValueError, TypeError):
            return None
        # A majority of the sample parsing as a date is enough to classify the
        # column as a date column — the remainder is reported as invalid dates
        # rather than causing the whole column to be miscategorized as text.
        if parsed_sample.notna().mean() < 0.5:
            return None
        try:
            return pd.to_datetime(series, errors="coerce", format="mixed")
        except (ValueError, TypeError):
            return None
    return None


def detect_column_type(series: pd.Series, col_name: str) -> str:
    """
    Classify a column into one of:
    integer, float, boolean, date, datetime, categorical, text
    """
    non_null = series.dropna()
    if non_null.empty:
        return "text"

    if pd.api.types.is_bool_dtype(series):
        return "boolean"

    if pd.api.types.is_integer_dtype(series):
        return "integer"

    if pd.api.types.is_float_dtype(series):
        return "float"

    if pd.api.types.is_datetime64_any_dtype(series):
        has_time = (non_null.dt.time != pd.Timestamp(0).time()).any()
        return "datetime" if has_time else "date"

    # Try numeric coercion for object/string columns that are actually numbers-as-strings
    if _is_stringlike_dtype(series):
        numeric_coerced = pd.to_numeric(non_null, errors="coerce")
        if numeric_coerced.notna().mean() > 0.95:
            return "float" if (numeric_coerced % 1 != 0).any() else "integer"

        parsed_dates = _try_parse_dates(series)
        if parsed_dates is not None:
            has_time = (parsed_dates.dropna().dt.time != pd.Timestamp(0).time()).any()
            return "datetime" if has_time else "date"

        unique_ratio = non_null.nunique() / max(len(non_null), 1)
        avg_len = non_null.astype(str).str.len().mean()
        if unique_ratio < 0.5 or non_null.nunique() <= 50:
            return "categorical"
        if avg_len > 50:
            return "text"
        return "categorical"

    return "text"


# ---------------------------------------------------------------------------
# Dataset-level profiling (Section 4 & 5)
# ---------------------------------------------------------------------------

def profile_dataset(df: pd.DataFrame) -> dict[str, Any]:
    total_rows = len(df)
    total_columns = len(df.columns)
    total_cells = total_rows * total_columns
    memory_usage_bytes = int(df.memory_usage(deep=True).sum())

    col_types = {col: detect_column_type(df[col], col) for col in df.columns}

    type_counts = {
        "numeric_columns": sum(1 for t in col_types.values() if t in ("integer", "float")),
        "categorical_columns": sum(1 for t in col_types.values() if t == "categorical"),
        "date_columns": sum(1 for t in col_types.values() if t in ("date", "datetime")),
        "text_columns": sum(1 for t in col_types.values() if t == "text"),
        "boolean_columns": sum(1 for t in col_types.values() if t == "boolean"),
    }

    total_missing = int(df.isna().sum().sum())
    missing_percentage = round((total_missing / total_cells) * 100, 2) if total_cells else 0.0

    incomplete_rows = int(df.isna().any(axis=1).sum())
    complete_rows = total_rows - incomplete_rows

    duplicate_rows = int(df.duplicated().sum())
    duplicate_percentage = round((duplicate_rows / total_rows) * 100, 2) if total_rows else 0.0

    return {
        "total_rows": total_rows,
        "total_columns": total_columns,
        "total_cells": total_cells,
        "memory_usage_bytes": memory_usage_bytes,
        "col_types": col_types,
        **type_counts,
        "total_missing_values": total_missing,
        "missing_percentage": missing_percentage,
        "complete_rows": complete_rows,
        "incomplete_rows": incomplete_rows,
        "duplicate_rows": duplicate_rows,
        "duplicate_percentage": duplicate_percentage,
    }


# ---------------------------------------------------------------------------
# Column-level profiling (Section 9)
# ---------------------------------------------------------------------------

def _numeric_stats(series: pd.Series) -> dict[str, Any]:
    non_null = pd.to_numeric(series.dropna(), errors="coerce").dropna()
    if non_null.empty:
        return {}

    q1 = float(non_null.quantile(0.25))
    q3 = float(non_null.quantile(0.75))
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    outliers = non_null[(non_null < lower_bound) | (non_null > upper_bound)]

    skew = float(scipy_stats.skew(non_null)) if len(non_null) > 2 else 0.0

    return {
        "min_value": float(non_null.min()),
        "max_value": float(non_null.max()),
        "mean_value": float(non_null.mean()),
        "median_value": float(non_null.median()),
        "std_value": float(non_null.std()) if len(non_null) > 1 else 0.0,
        "variance_value": float(non_null.var()) if len(non_null) > 1 else 0.0,
        "q1_value": q1,
        "q3_value": q3,
        "iqr_value": iqr,
        "zero_count": int((non_null == 0).sum()),
        "negative_count": int((non_null < 0).sum()),
        "outlier_count": int(len(outliers)),
        "skewness": skew,
    }


def _categorical_stats(series: pd.Series, total_rows: int) -> dict[str, Any]:
    non_null = series.dropna().astype(str)
    if non_null.empty:
        return {}

    value_counts = non_null.value_counts()
    top_categories = {str(k): int(v) for k, v in value_counts.head(10).items()}
    most_frequent_value = str(value_counts.index[0]) if len(value_counts) else None
    most_frequent_freq = int(value_counts.iloc[0]) if len(value_counts) else None

    unique_count = non_null.nunique()
    high_cardinality = unique_count > 50 and (unique_count / max(total_rows, 1)) > 0.5

    return {
        "most_frequent_value": most_frequent_value,
        "most_frequent_freq": most_frequent_freq,
        "top_categories": top_categories,
        "high_cardinality": bool(high_cardinality),
    }


def _date_stats(series: pd.Series, col_type: str) -> dict[str, Any]:
    if col_type in ("date", "datetime") and pd.api.types.is_datetime64_any_dtype(series):
        parsed = series
    else:
        parsed = _try_parse_dates(series)
        if parsed is None:
            return {}

    invalid_count = int(series.notna().sum() - parsed.notna().sum())
    non_null = parsed.dropna()
    if non_null.empty:
        return {"invalid_date_count": invalid_count}

    return {
        "min_date": str(non_null.min().date()),
        "max_date": str(non_null.max().date()),
        "invalid_date_count": invalid_count,
    }


def profile_columns(df: pd.DataFrame, col_types: dict[str, str]) -> list[dict[str, Any]]:
    total_rows = len(df)
    results = []

    for col in df.columns:
        series = df[col]
        col_type = col_types[col]

        non_null_count = int(series.notna().sum())
        null_count = total_rows - non_null_count
        null_percentage = round((null_count / total_rows) * 100, 2) if total_rows else 0.0
        unique_count = int(series.nunique(dropna=True))
        unique_percentage = round((unique_count / total_rows) * 100, 2) if total_rows else 0.0
        duplicate_count = non_null_count - unique_count

        col_result: dict[str, Any] = {
            "name": str(col),
            "data_type": col_type,
            "total_values": total_rows,
            "non_null_count": non_null_count,
            "null_count": null_count,
            "null_percentage": null_percentage,
            "unique_count": unique_count,
            "unique_percentage": unique_percentage,
            "duplicate_count": max(duplicate_count, 0),
        }

        if col_type in ("integer", "float"):
            col_result.update(_numeric_stats(series))
        elif col_type == "categorical":
            col_result.update(_categorical_stats(series, total_rows))
        elif col_type in ("date", "datetime"):
            col_result.update(_date_stats(series, col_type))
        elif col_type == "text":
            col_result.update(_categorical_stats(series, total_rows))

        results.append(col_result)

    return results


# ---------------------------------------------------------------------------
# Data Health / Quality Score (Section 6 & 7)
# ---------------------------------------------------------------------------

def _consistency_issues(df: pd.DataFrame, col_types: dict[str, str]) -> tuple[float, list[str]]:
    """
    Detect formatting inconsistencies in categorical/text columns:
    mixed casing, leading/trailing spaces, near-duplicate category spellings.
    Returns a 0-100 consistency score and a list of human-readable problems.
    """
    problems: list[str] = []
    penalty = 0.0
    categorical_cols = [c for c, t in col_types.items() if t in ("categorical", "text")]

    for col in categorical_cols:
        non_null = df[col].dropna().astype(str)
        if non_null.empty:
            continue

        has_whitespace_issue = (non_null != non_null.str.strip()).any()
        if has_whitespace_issue:
            problems.append(f"{col} contains values with leading/trailing whitespace")
            penalty += 2

        # Case-insensitive collision: "New York" vs "new york" vs "NEW YORK"
        lowered = non_null.str.strip().str.lower()
        distinct_raw = non_null.str.strip().nunique()
        distinct_lower = lowered.nunique()
        if distinct_lower < distinct_raw:
            problems.append(f"{col} contains inconsistent capitalization for the same values")
            penalty += 3

    consistency_score = max(0.0, 100.0 - penalty)
    return round(consistency_score, 2), problems


def compute_health_and_quality(
    df: pd.DataFrame,
    dataset_profile: dict[str, Any],
    column_profiles: list[dict[str, Any]],
) -> dict[str, Any]:
    total_rows = dataset_profile["total_rows"]
    col_types = dataset_profile["col_types"]

    # --- Completeness ---
    completeness_score = round(100 - dataset_profile["missing_percentage"], 2)
    completeness_score = max(0.0, min(100.0, completeness_score))

    # --- Uniqueness (based on duplicate rows) ---
    uniqueness_score = round(100 - dataset_profile["duplicate_percentage"], 2)
    uniqueness_score = max(0.0, min(100.0, uniqueness_score))

    # --- Validity: invalid dates + numeric columns coerced with failures ---
    invalid_penalty = 0.0
    validity_problems: list[str] = []
    for col_result in column_profiles:
        invalid_dates = col_result.get("invalid_date_count") or 0
        if invalid_dates > 0:
            pct = round((invalid_dates / total_rows) * 100, 2) if total_rows else 0
            validity_problems.append(f"{col_result['name']} has {invalid_dates} invalid date value(s) ({pct}%)")
            invalid_penalty += min(pct, 10)

        # Empty strings hiding as non-null
        if col_result["data_type"] in ("categorical", "text") and col_result.get("most_frequent_value") == "":
            validity_problems.append(f"{col_result['name']} contains empty string values")
            invalid_penalty += 1

    validity_score = max(0.0, round(100 - invalid_penalty, 2))

    # --- Consistency ---
    consistency_score, consistency_problems = _consistency_issues(df, col_types)

    quality_score = round(
        (completeness_score * 0.35)
        + (validity_score * 0.25)
        + (consistency_score * 0.20)
        + (uniqueness_score * 0.20),
        2,
    )

    # --- Usability / Relevance (Section 8) ---
    strengths: list[str] = []
    problems: list[str] = list(validity_problems) + list(consistency_problems)
    usability_penalty = 0.0

    if total_rows >= 10000:
        strengths.append("Large dataset with sufficient rows for reliable analysis")
    elif total_rows < 100:
        problems.append(f"Very small dataset ({total_rows} rows) — statistical results may be unreliable")
        usability_penalty += 15

    if dataset_profile["missing_percentage"] < 5:
        strengths.append("Good completeness — low missing value rate")
    elif dataset_profile["missing_percentage"] > 20:
        problems.append(f"High missing value rate ({dataset_profile['missing_percentage']}%)")
        usability_penalty += 15
    else:
        usability_penalty += 5

    if dataset_profile["duplicate_percentage"] < 1:
        strengths.append("Low duplicate rate")
    elif dataset_profile["duplicate_percentage"] > 10:
        problems.append(f"High duplicate row rate ({dataset_profile['duplicate_percentage']}%)")
        usability_penalty += 10
    else:
        usability_penalty += 3

    if dataset_profile["numeric_columns"] > 0 and dataset_profile["categorical_columns"] > 0:
        strengths.append("Useful mix of numerical and categorical columns")

    constant_cols = [c["name"] for c in column_profiles if c["unique_count"] <= 1]
    if constant_cols:
        problems.append(f"{len(constant_cols)} constant column(s) with no variation: {', '.join(constant_cols[:5])}")
        usability_penalty += min(len(constant_cols) * 2, 10)

    high_card_cols = [c["name"] for c in column_profiles if c.get("high_cardinality")]
    if high_card_cols:
        problems.append(f"High-cardinality column(s) detected (likely identifiers): {', '.join(high_card_cols[:5])}")
        usability_penalty += min(len(high_card_cols) * 2, 8)

    high_outlier_cols = [
        c["name"] for c in column_profiles
        if c.get("outlier_count") and total_rows and (c["outlier_count"] / total_rows) > 0.05
    ]
    if high_outlier_cols:
        problems.append(f"Notable outliers detected in: {', '.join(high_outlier_cols[:5])}")
        usability_penalty += min(len(high_outlier_cols) * 2, 8)

    usability_score = max(0.0, round(100 - usability_penalty, 2))

    if usability_score >= 90:
        usability_status = "Excellent"
    elif usability_score >= 75:
        usability_status = "Good"
    elif usability_score >= 55:
        usability_status = "Needs Cleaning"
    elif usability_score >= 35:
        usability_status = "Poor"
    else:
        usability_status = "Not Recommended"

    # --- Key findings & recommended actions (Section 20) ---
    key_findings: list[str] = [
        f"{dataset_profile['missing_percentage']}% of values are missing.",
        f"{dataset_profile['duplicate_percentage']}% of records are duplicates.",
    ]
    high_null_cols = sorted(
        [c for c in column_profiles if c["null_percentage"] > 0],
        key=lambda c: c["null_percentage"],
        reverse=True,
    )[:3]
    for c in high_null_cols:
        key_findings.append(f"{c['name']} has {c['null_percentage']}% missing values.")
    if high_card_cols:
        key_findings.append(f"{high_card_cols[0]} has very high cardinality.")

    recommended_actions: list[str] = []
    priority = 1
    for c in high_null_cols[:2]:
        recommended_actions.append(f"Priority {priority}: Review missing values in {c['name']}.")
        priority += 1
    if dataset_profile["duplicate_rows"] > 0:
        recommended_actions.append(f"Priority {priority}: Inspect {dataset_profile['duplicate_rows']} duplicate record(s).")
        priority += 1
    if consistency_problems:
        recommended_actions.append(f"Priority {priority}: Standardize inconsistent category formatting.")
        priority += 1
    if high_outlier_cols:
        recommended_actions.append(f"Priority {priority}: Review extreme values in {high_outlier_cols[0]}.")
        priority += 1
    if high_card_cols:
        recommended_actions.append(f"Priority {priority}: Check identifier/high-cardinality columns: {high_card_cols[0]}.")
        priority += 1

    return {
        "completeness_score": completeness_score,
        "validity_score": validity_score,
        "consistency_score": consistency_score,
        "uniqueness_score": uniqueness_score,
        "quality_score": quality_score,
        "usability_score": usability_score,
        "usability_status": usability_status,
        "strengths": strengths,
        "problems": problems,
        "key_findings": key_findings,
        "recommended_actions": recommended_actions,
    }


# ---------------------------------------------------------------------------
# Correlation (Section 14)
# ---------------------------------------------------------------------------

def compute_correlations(df: pd.DataFrame, col_types: dict[str, str]) -> dict[str, Any]:
    numeric_cols = [c for c, t in col_types.items() if t in ("integer", "float")]
    if len(numeric_cols) < 2:
        return {"matrix": {}, "strong_positive": [], "strong_negative": []}

    numeric_df = df[numeric_cols].apply(pd.to_numeric, errors="coerce")
    corr_matrix = numeric_df.corr(numeric_only=True).round(3)
    matrix = corr_matrix.fillna(0).to_dict()
    # JSON-safe: ensure plain floats
    matrix = {k: {k2: float(v2) for k2, v2 in v.items()} for k, v in matrix.items()}

    strong_positive, strong_negative = [], []
    seen = set()
    for col_a in numeric_cols:
        for col_b in numeric_cols:
            if col_a == col_b or (col_b, col_a) in seen:
                continue
            seen.add((col_a, col_b))
            value = matrix.get(col_a, {}).get(col_b)
            if value is None:
                continue
            if value >= 0.7:
                strong_positive.append({"a": col_a, "b": col_b, "correlation": value})
            elif value <= -0.7:
                strong_negative.append({"a": col_a, "b": col_b, "correlation": value})

    return {
        "matrix": matrix,
        "strong_positive": sorted(strong_positive, key=lambda x: -x["correlation"]),
        "strong_negative": sorted(strong_negative, key=lambda x: x["correlation"]),
    }
