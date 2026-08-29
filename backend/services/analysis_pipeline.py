"""
analysis_pipeline.py

Orchestrates the full analysis pipeline for a dataset: load file ->
profile -> health/quality/usability -> correlations -> persist to DB.

This is called synchronously right after upload for Phase 1. It's the
natural seam for background/async processing in a later phase (Section 33).
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from models import Dataset, DatasetStatus, DatasetColumn, DatasetAnalysis
from services.file_loader import load_dataframe, DatasetLoadError
from services.profiling_service import (
    profile_dataset,
    profile_columns,
    compute_health_and_quality,
    compute_correlations,
)


def run_analysis(dataset: Dataset, db: Session) -> None:
    """
    Runs the full pipeline for a single dataset row and commits results.
    On failure, marks the dataset as failed with a user-facing message
    rather than raising a raw stack trace up to the API layer.
    """
    dataset.status = DatasetStatus.processing
    db.commit()

    try:
        df = load_dataframe(dataset.stored_path, dataset.file_type)

        dataset_profile = profile_dataset(df)
        column_profiles = profile_columns(df, dataset_profile["col_types"])
        health = compute_health_and_quality(df, dataset_profile, column_profiles)
        correlations = compute_correlations(df, dataset_profile["col_types"])

        # Clear any previous columns/analysis (e.g. re-analysis)
        db.query(DatasetColumn).filter(DatasetColumn.dataset_id == dataset.id).delete()
        db.query(DatasetAnalysis).filter(DatasetAnalysis.dataset_id == dataset.id).delete()

        for col in column_profiles:
            db.add(DatasetColumn(dataset_id=dataset.id, **col))

        db.add(
            DatasetAnalysis(
                dataset_id=dataset.id,
                total_cells=dataset_profile["total_cells"],
                memory_usage_bytes=dataset_profile["memory_usage_bytes"],
                numeric_columns=dataset_profile["numeric_columns"],
                categorical_columns=dataset_profile["categorical_columns"],
                date_columns=dataset_profile["date_columns"],
                text_columns=dataset_profile["text_columns"],
                boolean_columns=dataset_profile["boolean_columns"],
                total_missing_values=dataset_profile["total_missing_values"],
                missing_percentage=dataset_profile["missing_percentage"],
                complete_rows=dataset_profile["complete_rows"],
                incomplete_rows=dataset_profile["incomplete_rows"],
                duplicate_rows=dataset_profile["duplicate_rows"],
                duplicate_percentage=dataset_profile["duplicate_percentage"],
                completeness_score=health["completeness_score"],
                validity_score=health["validity_score"],
                consistency_score=health["consistency_score"],
                uniqueness_score=health["uniqueness_score"],
                quality_score=health["quality_score"],
                usability_score=health["usability_score"],
                usability_status=health["usability_status"],
                strengths=health["strengths"],
                problems=health["problems"],
                key_findings=health["key_findings"],
                recommended_actions=health["recommended_actions"],
                correlations=correlations,
            )
        )

        dataset.total_rows = dataset_profile["total_rows"]
        dataset.total_columns = dataset_profile["total_columns"]
        dataset.quality_score = health["quality_score"]
        dataset.usability_score = health["usability_score"]
        dataset.usability_status = health["usability_status"]
        dataset.status = DatasetStatus.ready
        dataset.error_message = None

        db.commit()

    except DatasetLoadError as exc:
        db.rollback()
        dataset.status = DatasetStatus.failed
        dataset.error_message = str(exc)
        db.commit()
    except Exception as exc:  # noqa: BLE001 — never leak a raw traceback to the user
        db.rollback()
        dataset.status = DatasetStatus.failed
        dataset.error_message = "An unexpected error occurred while analyzing this dataset."
        db.commit()
        raise
