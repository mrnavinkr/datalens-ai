"""
routers/admin.py — Section 25: Admin Panel.
"""
from sqlalchemy import func

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import get_current_admin
from database import get_db
from models import User, Dataset, DatasetAnalysis, AdminActivity, UserRole, DatasetStatus
from schemas import AdminStatsOut, AdminUserOut, RoleUpdate

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _log_activity(db: Session, admin: User, action: str, details: dict | None = None):
    db.add(AdminActivity(admin_id=admin.id, action=action, details=details))
    db.commit()


@router.get("/stats", response_model=AdminStatsOut)
def get_stats(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    total_datasets = db.query(func.count(Dataset.id)).scalar() or 0
    total_analyses = db.query(func.count(DatasetAnalysis.id)).scalar() or 0
    total_rows_analyzed = db.query(func.coalesce(func.sum(Dataset.total_rows), 0)).filter(
        Dataset.status == DatasetStatus.ready
    ).scalar() or 0
    storage_usage_bytes = db.query(func.coalesce(func.sum(Dataset.file_size_bytes), 0)).scalar() or 0

    return AdminStatsOut(
        total_users=total_users,
        active_users=active_users,
        total_datasets=total_datasets,
        total_analyses=total_analyses,
        total_rows_analyzed=int(total_rows_analyzed),
        storage_usage_bytes=int(storage_usage_bytes),
    )


@router.get("/users", response_model=list[AdminUserOut])
def list_users(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.put("/users/{user_id}/toggle-active", response_model=AdminUserOut)
def toggle_active(user_id: str, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.id == current_admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate your own account.")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    _log_activity(db, current_admin, "toggle_user_active", {"user_id": user.id, "is_active": user.is_active})
    return user


@router.put("/users/{user_id}/role", response_model=AdminUserOut)
def update_role(user_id: str, payload: RoleUpdate, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    user.role = UserRole(payload.role)
    db.commit()
    db.refresh(user)
    _log_activity(db, current_admin, "update_user_role", {"user_id": user.id, "role": payload.role})
    return user


@router.get("/datasets", response_model=list[dict])
def list_all_datasets(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).limit(200).all()
    return [
        {
            "id": d.id, "display_name": d.display_name, "user_id": d.user_id,
            "status": d.status, "total_rows": d.total_rows, "quality_score": d.quality_score,
            "created_at": d.created_at,
        }
        for d in datasets
    ]


@router.delete("/datasets/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_dataset(dataset_id: str, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    dataset = db.get(Dataset, dataset_id)
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found.")
    db.delete(dataset)
    db.commit()
    _log_activity(db, current_admin, "delete_dataset", {"dataset_id": dataset_id})
    return None
