"""
routers/demo.py — Section 40: Demo Mode.

Public, unauthenticated endpoint. Computes analysis on the fly (nothing
is persisted per-visitor) so anyone can see a full DataLens AI analysis
without registering.
"""
from fastapi import APIRouter

from config import settings
from services.demo_service import ensure_demo_dataset
from services.file_loader import load_dataframe
from services.profiling_service import (
    profile_dataset, profile_columns, compute_health_and_quality, compute_correlations,
)
from services.visualization_service import auto_visualizations

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.get("/analysis")
def demo_analysis():
    demo_path = ensure_demo_dataset(settings.UPLOAD_DIR)
    df = load_dataframe(demo_path, "csv")

    dataset_profile = profile_dataset(df)
    columns = profile_columns(df, dataset_profile["col_types"])
    health = compute_health_and_quality(df, dataset_profile, columns)
    correlations = compute_correlations(df, dataset_profile["col_types"])
    charts = auto_visualizations(demo_path, "csv", dataset_profile["col_types"])

    return {
        "dataset_name": "Demo: E-Commerce Sales Dataset",
        "overview": {
            "total_rows": dataset_profile["total_rows"],
            "total_columns": dataset_profile["total_columns"],
            "total_cells": dataset_profile["total_cells"],
            "memory_usage_bytes": dataset_profile["memory_usage_bytes"],
            "numeric_columns": dataset_profile["numeric_columns"],
            "categorical_columns": dataset_profile["categorical_columns"],
            "date_columns": dataset_profile["date_columns"],
            "text_columns": dataset_profile["text_columns"],
            "boolean_columns": dataset_profile["boolean_columns"],
            "total_missing_values": dataset_profile["total_missing_values"],
            "missing_percentage": dataset_profile["missing_percentage"],
            "duplicate_rows": dataset_profile["duplicate_rows"],
            "duplicate_percentage": dataset_profile["duplicate_percentage"],
            "quality_score": health["quality_score"],
            "usability_score": health["usability_score"],
            "usability_status": health["usability_status"],
        },
        "health": health,
        "columns": columns,
        "correlations": correlations,
        "charts": charts,
    }
