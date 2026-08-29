"""
routers/analysis.py — Sections 5, 6, 7, 8, 9, 14 read endpoints.
Reads persisted analysis results; never recomputes on the fly.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User, Dataset, DatasetAnalysis, DatasetColumn, DatasetStatus
from schemas import AnalysisOverviewOut, HealthOut, ColumnOut

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


def _get_ready_dataset(dataset_id: str, current_user: User, db: Session) -> Dataset:
    dataset = db.get(Dataset, dataset_id)
    if not dataset or dataset.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    if dataset.status == DatasetStatus.failed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=dataset.error_message or "This dataset failed to process.",
        )
    if dataset.status != DatasetStatus.ready:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Dataset is still processing.")
    return dataset


def _get_analysis(dataset: Dataset, db: Session) -> DatasetAnalysis:
    analysis = db.query(DatasetAnalysis).filter(DatasetAnalysis.dataset_id == dataset.id).first()
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found for this dataset.")
    return analysis


@router.get("/{dataset_id}/overview", response_model=AnalysisOverviewOut)
def get_overview(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dataset = _get_ready_dataset(dataset_id, current_user, db)
    analysis = _get_analysis(dataset, db)
    return AnalysisOverviewOut(
        total_rows=dataset.total_rows or 0,
        total_columns=dataset.total_columns or 0,
        total_cells=analysis.total_cells,
        memory_usage_bytes=analysis.memory_usage_bytes,
        numeric_columns=analysis.numeric_columns,
        categorical_columns=analysis.categorical_columns,
        date_columns=analysis.date_columns,
        text_columns=analysis.text_columns,
        boolean_columns=analysis.boolean_columns,
        total_missing_values=analysis.total_missing_values,
        missing_percentage=analysis.missing_percentage,
        duplicate_rows=analysis.duplicate_rows,
        duplicate_percentage=analysis.duplicate_percentage,
        quality_score=analysis.quality_score,
        usability_score=analysis.usability_score,
        usability_status=analysis.usability_status,
    )


@router.get("/{dataset_id}/health", response_model=HealthOut)
def get_health(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dataset = _get_ready_dataset(dataset_id, current_user, db)
    analysis = _get_analysis(dataset, db)
    return HealthOut(
        completeness_score=analysis.completeness_score,
        validity_score=analysis.validity_score,
        consistency_score=analysis.consistency_score,
        uniqueness_score=analysis.uniqueness_score,
        quality_score=analysis.quality_score,
        total_missing_values=analysis.total_missing_values,
        missing_percentage=analysis.missing_percentage,
        complete_rows=analysis.complete_rows,
        incomplete_rows=analysis.incomplete_rows,
        duplicate_rows=analysis.duplicate_rows,
        duplicate_percentage=analysis.duplicate_percentage,
        usability_score=analysis.usability_score,
        usability_status=analysis.usability_status,
        strengths=analysis.strengths or [],
        problems=analysis.problems or [],
        key_findings=analysis.key_findings or [],
        recommended_actions=analysis.recommended_actions or [],
    )


@router.get("/{dataset_id}/columns", response_model=list[ColumnOut])
def get_columns(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dataset = _get_ready_dataset(dataset_id, current_user, db)
    return db.query(DatasetColumn).filter(DatasetColumn.dataset_id == dataset.id).all()


@router.get("/{dataset_id}/correlations")
def get_correlations(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dataset = _get_ready_dataset(dataset_id, current_user, db)
    analysis = _get_analysis(dataset, db)
    return analysis.correlations or {"matrix": {}, "strong_positive": [], "strong_negative": []}


@router.get("/{dataset_id}/outliers")
def get_outliers(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dataset = _get_ready_dataset(dataset_id, current_user, db)
    columns = db.query(DatasetColumn).filter(DatasetColumn.dataset_id == dataset.id).all()
    return [
        {
            "column": c.name,
            "outlier_count": c.outlier_count or 0,
            "outlier_rate": round((c.outlier_count or 0) / dataset.total_rows * 100, 2) if dataset.total_rows else 0,
        }
        for c in columns
        if c.data_type in ("integer", "float")
    ]
