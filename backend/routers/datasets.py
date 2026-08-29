"""
routers/datasets.py — Section 3 (upload) and Section 24 (dataset history).
"""
import os
import shutil
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from auth import get_current_user
from config import settings
from database import get_db
from models import User, Dataset, DatasetStatus
from schemas import DatasetOut, DatasetRename
from services.file_loader import get_extension, SUPPORTED_EXTENSIONS
from services.analysis_pipeline import run_analysis
from services.data_explorer_service import get_rows

router = APIRouter(prefix="/api/datasets", tags=["datasets"])

MAX_FILE_SIZE_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


@router.post("/upload", response_model=DatasetOut, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    extension = get_extension(file.filename or "")
    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{extension}'. Supported formats: CSV, XLSX, XLS, JSON.",
        )

    user_upload_dir = os.path.join(settings.UPLOAD_DIR, current_user.id)
    os.makedirs(user_upload_dir, exist_ok=True)

    stored_filename = f"{uuid.uuid4()}.{extension}"
    stored_path = os.path.join(user_upload_dir, stored_filename)

    size_bytes = 0
    try:
        with open(stored_path, "wb") as out_file:
            while chunk := await file.read(1024 * 1024):
                size_bytes += len(chunk)
                if size_bytes > MAX_FILE_SIZE_BYTES:
                    out_file.close()
                    os.remove(stored_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds the maximum allowed size of {settings.MAX_FILE_SIZE_MB} MB.",
                    )
                out_file.write(chunk)
    except HTTPException:
        raise
    except Exception:
        if os.path.exists(stored_path):
            os.remove(stored_path)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save uploaded file.")

    if size_bytes == 0:
        os.remove(stored_path)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty.")

    dataset = Dataset(
        user_id=current_user.id,
        original_filename=file.filename,
        display_name=file.filename,
        stored_path=stored_path,
        file_type=extension,
        file_size_bytes=size_bytes,
        status=DatasetStatus.uploading,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    # Phase 1: run synchronously. This is the seam for background processing later.
    run_analysis(dataset, db)
    db.refresh(dataset)

    return dataset


@router.get("", response_model=list[DatasetOut])
def list_datasets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Dataset)
        .filter(Dataset.user_id == current_user.id)
        .order_by(Dataset.created_at.desc())
        .all()
    )


def _get_owned_dataset(dataset_id: str, current_user: User, db: Session) -> Dataset:
    dataset = db.get(Dataset, dataset_id)
    if not dataset or dataset.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    return dataset


@router.get("/{dataset_id}", response_model=DatasetOut)
def get_dataset(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _get_owned_dataset(dataset_id, current_user, db)


@router.put("/{dataset_id}/rename", response_model=DatasetOut)
def rename_dataset(
    dataset_id: str,
    payload: DatasetRename,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = _get_owned_dataset(dataset_id, current_user, db)
    dataset.display_name = payload.display_name
    db.commit()
    db.refresh(dataset)
    return dataset


@router.get("/{dataset_id}/rows")
def get_dataset_rows(
    dataset_id: str,
    page: int = 1,
    page_size: int = 50,
    search: str | None = None,
    sort_by: str | None = None,
    sort_dir: str = "asc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Section 17 — Data Explorer. Backend-paginated so the browser never
    has to hold the full dataset in memory."""
    dataset = _get_owned_dataset(dataset_id, current_user, db)
    if dataset.status != DatasetStatus.ready:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Dataset is still processing.")
    try:
        return get_rows(
            dataset.stored_path, dataset.file_type,
            page=page, page_size=page_size, search=search, sort_by=sort_by, sort_dir=sort_dir,
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not load dataset rows.")


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dataset(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dataset = _get_owned_dataset(dataset_id, current_user, db)
    if os.path.exists(dataset.stored_path):
        try:
            os.remove(dataset.stored_path)
        except OSError:
            pass
    db.delete(dataset)
    db.commit()
    return None
