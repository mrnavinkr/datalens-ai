"""
routers/visualization.py — Sections 15 & 16.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User, DatasetColumn
from schemas import ChartRequest
from services.visualization_service import auto_visualizations, build_studio_chart
from routers.analysis import _get_ready_dataset

router = APIRouter(prefix="/api/visualization", tags=["visualization"])


@router.get("/{dataset_id}")
def get_auto_visualizations(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dataset = _get_ready_dataset(dataset_id, current_user, db)
    columns = db.query(DatasetColumn).filter(DatasetColumn.dataset_id == dataset.id).all()
    col_types = {c.name: c.data_type for c in columns}
    return auto_visualizations(dataset.stored_path, dataset.file_type, col_types)


@router.post("/create")
def create_studio_chart(
    payload: ChartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = _get_ready_dataset(payload.dataset_id, current_user, db)
    return build_studio_chart(
        dataset.stored_path,
        dataset.file_type,
        chart_type=payload.chart_type,
        x_axis=payload.x_axis,
        y_axis=payload.y_axis,
        aggregation=payload.aggregation,
        group_by=payload.group_by,
        filters=payload.filters,
    )
