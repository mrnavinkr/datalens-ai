"""
visualization_service.py — Sections 15 & 16.

Computes chart-ready JSON (never raw dataframes) for:
- automatic dataset-level and per-column charts
- the Visualization Studio's user-configurable chart builder

All aggregation happens here in the backend; the frontend only renders
what it's given.
"""
from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from services.file_loader import load_dataframe

MAX_CATEGORIES = 15
HISTOGRAM_BINS = 12


def _histogram(series: pd.Series) -> dict[str, Any]:
    numeric = pd.to_numeric(series.dropna(), errors="coerce").dropna()
    if numeric.empty:
        return {"bins": [], "counts": []}
    counts, edges = np.histogram(numeric, bins=HISTOGRAM_BINS)
    labels = [f"{edges[i]:.2f}–{edges[i+1]:.2f}" for i in range(len(edges) - 1)]
    return {"bins": labels, "counts": [int(c) for c in counts]}


def _category_counts(series: pd.Series, top_n: int = MAX_CATEGORIES) -> dict[str, Any]:
    non_null = series.dropna().astype(str)
    counts = non_null.value_counts().head(top_n)
    return {"categories": counts.index.tolist(), "counts": [int(c) for c in counts.values]}


def _time_series_counts(series: pd.Series, freq: str = "M") -> dict[str, Any]:
    parsed = pd.to_datetime(series, errors="coerce").dropna()
    if parsed.empty:
        return {"periods": [], "counts": []}
    grouped = parsed.dt.to_period(freq).value_counts().sort_index()
    return {"periods": [str(p) for p in grouped.index], "counts": [int(c) for c in grouped.values]}


def auto_visualizations(dataset_path: str, file_type: str, col_types: dict[str, str]) -> dict[str, Any]:
    """
    Builds the automatic visualization set described in Section 15:
    dataset-level charts plus one meaningful chart per column type.
    """
    df = load_dataframe(dataset_path, file_type)
    total_rows = len(df)

    # Dataset-level
    missing_by_col = {col: int(df[col].isna().sum()) for col in df.columns}
    dataset_level = {
        "data_type_distribution": pd.Series(col_types).value_counts().to_dict(),
        "missing_by_column": missing_by_col,
        "completeness_by_column": {
            col: round(100 - (missing / total_rows * 100), 2) if total_rows else 100
            for col, missing in missing_by_col.items()
        },
    }

    numeric_charts = {}
    categorical_charts = {}
    date_charts = {}

    for col, col_type in col_types.items():
        if col_type in ("integer", "float"):
            numeric_charts[col] = {
                "histogram": _histogram(df[col]),
            }
        elif col_type in ("categorical", "text"):
            cat = _category_counts(df[col])
            if cat["categories"]:
                categorical_charts[col] = cat
        elif col_type in ("date", "datetime"):
            date_charts[col] = _time_series_counts(df[col])

    return {
        "dataset_level": dataset_level,
        "numeric": numeric_charts,
        "categorical": categorical_charts,
        "date": date_charts,
    }


def build_studio_chart(
    dataset_path: str,
    file_type: str,
    chart_type: str,
    x_axis: str | None = None,
    y_axis: str | None = None,
    aggregation: str = "count",
    group_by: str | None = None,
    filters: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Section 16 — the Visualization Studio. Computes chart data for a
    user-chosen X/Y axis, chart type, aggregation, and optional group-by/filter.
    """
    df = load_dataframe(dataset_path, file_type)

    if filters:
        for col, value in filters.items():
            if col in df.columns:
                df = df[df[col].astype(str) == str(value)]

    if chart_type == "histogram" and x_axis:
        return {"chart_type": "histogram", "x_axis": x_axis, "data": _histogram(df[x_axis])}

    if chart_type in ("pie", "donut") and x_axis:
        return {"chart_type": chart_type, "x_axis": x_axis, "data": _category_counts(df[x_axis])}

    if chart_type == "scatter" and x_axis and y_axis:
        clean = df[[x_axis, y_axis]].dropna()
        clean_x = pd.to_numeric(clean[x_axis], errors="coerce")
        clean_y = pd.to_numeric(clean[y_axis], errors="coerce")
        points = [
            {"x": float(x), "y": float(y)}
            for x, y in zip(clean_x, clean_y)
            if pd.notna(x) and pd.notna(y)
        ][:2000]  # cap points for browser performance
        return {"chart_type": "scatter", "x_axis": x_axis, "y_axis": y_axis, "data": points}

    if chart_type == "box" and x_axis:
        numeric = pd.to_numeric(df[x_axis].dropna(), errors="coerce").dropna()
        if numeric.empty:
            return {"chart_type": "box", "x_axis": x_axis, "data": {}}
        return {
            "chart_type": "box",
            "x_axis": x_axis,
            "data": {
                "min": float(numeric.min()),
                "q1": float(numeric.quantile(0.25)),
                "median": float(numeric.median()),
                "q3": float(numeric.quantile(0.75)),
                "max": float(numeric.max()),
            },
        }

    if chart_type in ("bar", "line", "area") and x_axis:
        working = df
        if group_by and group_by in working.columns:
            working = working[[x_axis, group_by]].dropna()
        else:
            working = working[[x_axis]].dropna() if y_axis is None else working[[x_axis, y_axis]].dropna()

        if y_axis and y_axis in df.columns:
            y_numeric = pd.to_numeric(working[y_axis], errors="coerce")
            working = working.assign(**{y_axis: y_numeric})
            grouped = working.groupby(x_axis)[y_axis]
            if aggregation == "sum":
                agg = grouped.sum()
            elif aggregation == "mean":
                agg = grouped.mean()
            elif aggregation == "max":
                agg = grouped.max()
            elif aggregation == "min":
                agg = grouped.min()
            else:
                agg = grouped.count()
            agg = agg.sort_values(ascending=False).head(MAX_CATEGORIES)
            return {
                "chart_type": chart_type,
                "x_axis": x_axis,
                "y_axis": y_axis,
                "data": {"labels": agg.index.astype(str).tolist(), "values": [round(float(v), 2) for v in agg.values]},
            }
        else:
            cat = _category_counts(working[x_axis])
            return {
                "chart_type": chart_type,
                "x_axis": x_axis,
                "data": {"labels": cat["categories"], "values": cat["counts"]},
            }

    if chart_type == "table":
        cols = [c for c in [x_axis, y_axis, group_by] if c and c in df.columns]
        subset = df[cols] if cols else df
        return {"chart_type": "table", "data": subset.head(100).to_dict(orient="records")}

    return {"chart_type": chart_type, "data": {}, "note": "Not enough axis configuration to build this chart."}
