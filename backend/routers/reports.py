"""
routers/reports.py — Section 21: Report Export.
"""
import os

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from auth import get_current_user
from config import settings
from database import get_db
from models import User, Report, DatasetColumn
from schemas import ReportGenerateRequest, ReportOut
from services.report_service import generate_pdf_report, generate_excel_report, generate_csv_report
from routers.analysis import _get_ready_dataset, _get_analysis

router = APIRouter(prefix="/api/reports", tags=["reports"])

MEDIA_TYPES = {
    "pdf": "application/pdf",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "csv": "text/csv",
}


@router.post("/generate", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def generate_report(payload: ReportGenerateRequest, dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dataset = _get_ready_dataset(dataset_id, current_user, db)
    analysis = _get_analysis(dataset, db)
    columns = db.query(DatasetColumn).filter(DatasetColumn.dataset_id == dataset.id).all()

    try:
        if payload.format == "pdf":
            path = generate_pdf_report(dataset, analysis, columns, settings.UPLOAD_DIR)
        elif payload.format == "xlsx":
            path = generate_excel_report(dataset, analysis, columns, settings.UPLOAD_DIR)
        else:
            path = generate_csv_report(dataset, analysis, columns, settings.UPLOAD_DIR)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not generate the report.")

    report = Report(dataset_id=dataset.id, format=payload.format, file_path=path)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/{report_id}", response_model=ReportOut)
def get_report(report_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    _get_ready_dataset(report.dataset_id, current_user, db)  # ownership check
    return report


@router.get("/{report_id}/download")
def download_report(report_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    dataset = _get_ready_dataset(report.dataset_id, current_user, db)  # ownership check
    if not os.path.exists(report.file_path):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="This report file is no longer available.")

    filename = f"{dataset.display_name.rsplit('.', 1)[0]}_report.{report.format}"
    return FileResponse(report.file_path, media_type=MEDIA_TYPES.get(report.format, "application/octet-stream"), filename=filename)
