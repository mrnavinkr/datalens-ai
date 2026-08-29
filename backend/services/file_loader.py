"""
file_loader.py

Loads an uploaded dataset file into a Pandas DataFrame, with validation
and chunked reading for large CSVs (Section 33 — large dataset performance).
"""
from __future__ import annotations

import os
import pandas as pd

SUPPORTED_EXTENSIONS = {"csv", "xlsx", "xls", "json"}

# Above this row count we still load fully into memory for Phase 1,
# but chunked reads keep peak memory lower during the initial parse.
CSV_CHUNK_SIZE = 50_000


class DatasetLoadError(Exception):
    pass


def get_extension(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext


def load_dataframe(path: str, file_type: str) -> pd.DataFrame:
    if file_type not in SUPPORTED_EXTENSIONS:
        raise DatasetLoadError(f"Unsupported file type: {file_type}")

    if not os.path.exists(path):
        raise DatasetLoadError("Uploaded file could not be found on disk")

    try:
        if file_type == "csv":
            chunks = pd.read_csv(path, chunksize=CSV_CHUNK_SIZE, low_memory=False)
            df = pd.concat(chunks, ignore_index=True)
        elif file_type in ("xlsx", "xls"):
            df = pd.read_excel(path)
        elif file_type == "json":
            df = pd.read_json(path)
        else:
            raise DatasetLoadError(f"Unsupported file type: {file_type}")
    except pd.errors.EmptyDataError:
        raise DatasetLoadError("The uploaded file is empty")
    except Exception as exc:  # noqa: BLE001 — surface as a clean user-facing error
        raise DatasetLoadError(f"Could not parse file: {exc}") from exc

    if df.empty:
        raise DatasetLoadError("The dataset contains no rows")
    if len(df.columns) == 0:
        raise DatasetLoadError("The dataset contains no usable columns")

    # Drop fully-empty unnamed columns often produced by trailing commas
    unnamed_empty = [
        c for c in df.columns
        if str(c).startswith("Unnamed:") and df[c].isna().all()
    ]
    if unnamed_empty:
        df = df.drop(columns=unnamed_empty)

    return df
