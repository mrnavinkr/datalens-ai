"""
data_explorer_service.py — Section 17: Data Explorer.

Provides paginated, searchable, sortable access to a dataset's raw rows
without ever loading the full file into the browser at once. Reads the
stored file fresh per request; Phase-1-appropriate (a cached/materialized
store is the natural upgrade for very large files/high traffic).
"""
from __future__ import annotations

import math
from typing import Any

import pandas as pd

from services.file_loader import load_dataframe

MAX_PAGE_SIZE = 200


def _json_safe(value: Any) -> Any:
    if pd.isna(value):
        return None
    if isinstance(value, (pd.Timestamp,)):
        return str(value)
    if hasattr(value, "item"):
        try:
            return value.item()
        except (ValueError, TypeError):
            return str(value)
    return value


def get_rows(
    stored_path: str,
    file_type: str,
    page: int = 1,
    page_size: int = 50,
    search: str | None = None,
    sort_by: str | None = None,
    sort_dir: str = "asc",
    columns: list[str] | None = None,
) -> dict[str, Any]:
    df = load_dataframe(stored_path, file_type)

    if columns:
        valid_cols = [c for c in columns if c in df.columns]
        if valid_cols:
            df = df[valid_cols]

    if search:
        mask = df.apply(lambda row: row.astype(str).str.contains(search, case=False, na=False).any(), axis=1)
        df = df[mask]

    if sort_by and sort_by in df.columns:
        df = df.sort_values(by=sort_by, ascending=(sort_dir != "desc"), na_position="last")

    total_rows = len(df)
    page_size = max(1, min(page_size, MAX_PAGE_SIZE))
    total_pages = max(1, math.ceil(total_rows / page_size))
    page = max(1, min(page, total_pages))

    start = (page - 1) * page_size
    end = start + page_size
    page_df = df.iloc[start:end]

    records = [
        {col: _json_safe(val) for col, val in row.items()}
        for row in page_df.to_dict(orient="records")
    ]

    return {
        "columns": list(df.columns),
        "rows": records,
        "page": page,
        "page_size": page_size,
        "total_rows": total_rows,
        "total_pages": total_pages,
    }
