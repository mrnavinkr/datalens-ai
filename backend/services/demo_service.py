"""
demo_service.py — Section 40: Demo Mode.

Generates a realistic sample sales dataset (with deliberate, realistic
data-quality issues: missing values, duplicates, inconsistent casing,
and outliers) so a visitor can see a full analysis without uploading
their own file. Deterministic (seeded) so the demo looks the same for
everyone and stays reproducible.
"""
from __future__ import annotations

import os
import random

import numpy as np
import pandas as pd

DEMO_ROWS = 5000
DEMO_FILENAME = "demo_sales_dataset.csv"


def ensure_demo_dataset(upload_dir: str) -> str:
    """Creates the demo CSV on disk once, then reuses it. Returns its path."""
    demo_path = os.path.join(upload_dir, "_demo", DEMO_FILENAME)
    os.makedirs(os.path.dirname(demo_path), exist_ok=True)

    if os.path.exists(demo_path):
        return demo_path

    rng = random.Random(42)
    np_rng = np.random.default_rng(42)

    cities = ["New York", "new york", "NEW YORK", "Boston", "  Boston  ", "Chicago", "Austin", "Seattle", "Miami"]
    categories = ["Electronics", "Home & Kitchen", "Apparel", "Sports", "Books", "Toys"]

    n = DEMO_ROWS
    dates = pd.date_range("2023-01-01", "2024-12-31", periods=n)

    df = pd.DataFrame({
        "Order_ID": range(100000, 100000 + n),
        "Customer_Age": np_rng.choice([*range(18, 70), None], size=n, p=[0.98 / 52] * 52 + [0.02]),
        "City": [rng.choice(cities) for _ in range(n)],
        "Category": [rng.choice(categories) for _ in range(n)],
        "Quantity": np_rng.integers(1, 12, size=n),
        "Unit_Price": np.round(np_rng.uniform(5, 500, size=n), 2),
        "Order_Date": dates,
        "Customer_Email": [f"customer{i}@example.com" if rng.random() > 0.05 else None for i in range(n)],
    })

    df["Sales"] = np.round(df["Quantity"] * df["Unit_Price"], 2)
    df["Profit"] = np.round(df["Sales"] * np_rng.uniform(0.1, 0.35, size=n), 2)

    # Inject realistic issues
    outlier_idx = np_rng.choice(n, size=int(n * 0.01), replace=False)
    df.loc[outlier_idx, "Sales"] = df.loc[outlier_idx, "Sales"] * 25

    df = pd.concat([df, df.sample(frac=0.02, random_state=42)], ignore_index=True)

    df.to_csv(demo_path, index=False)
    return demo_path
