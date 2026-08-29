"""
SQLAlchemy ORM models.

Phase 1 tables are fully wired up (users, datasets, dataset_columns,
dataset_analysis, dataset_statistics). Later-phase tables
(visualizations, chat_sessions, chat_messages, reports, admin_activity)
are defined now so the schema is stable, but their routers/services
land in later phases.
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class DatasetStatus(str, enum.Enum):
    uploading = "uploading"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.user, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    datasets: Mapped[list["Dataset"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)  # csv, xlsx, xls, json
    file_size_bytes: Mapped[int] = mapped_column(Integer, default=0)

    status: Mapped[DatasetStatus] = mapped_column(Enum(DatasetStatus), default=DatasetStatus.uploading)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    total_rows: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_columns: Mapped[int | None] = mapped_column(Integer, nullable=True)

    quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    usability_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    usability_status: Mapped[str | None] = mapped_column(String(30), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="datasets")
    columns: Mapped[list["DatasetColumn"]] = relationship(back_populates="dataset", cascade="all, delete-orphan")
    analysis: Mapped["DatasetAnalysis"] = relationship(back_populates="dataset", uselist=False, cascade="all, delete-orphan")


class DatasetColumn(Base):
    """Per-column profiling results (Section 9 of the spec)."""
    __tablename__ = "dataset_columns"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    data_type: Mapped[str] = mapped_column(String(30), nullable=False)  # integer, float, string, categorical, boolean, date, datetime, text

    total_values: Mapped[int] = mapped_column(Integer, default=0)
    non_null_count: Mapped[int] = mapped_column(Integer, default=0)
    null_count: Mapped[int] = mapped_column(Integer, default=0)
    null_percentage: Mapped[float] = mapped_column(Float, default=0)
    unique_count: Mapped[int] = mapped_column(Integer, default=0)
    unique_percentage: Mapped[float] = mapped_column(Float, default=0)
    duplicate_count: Mapped[int] = mapped_column(Integer, default=0)

    # Numeric stats (null for non-numeric columns)
    min_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    mean_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    median_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    std_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    variance_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    q1_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    q3_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    iqr_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    zero_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    negative_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    outlier_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    skewness: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Categorical stats
    most_frequent_value: Mapped[str | None] = mapped_column(String(500), nullable=True)
    most_frequent_freq: Mapped[int | None] = mapped_column(Integer, nullable=True)
    top_categories: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    high_cardinality: Mapped[bool] = mapped_column(Boolean, default=False)

    # Date stats
    min_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    max_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    invalid_date_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    dataset: Mapped["Dataset"] = relationship(back_populates="columns")


class DatasetAnalysis(Base):
    """Dataset-level rollups: health check, quality score, usability (Sections 6-8, 20)."""
    __tablename__ = "dataset_analysis"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id"), unique=True, nullable=False)

    total_cells: Mapped[int] = mapped_column(Integer, default=0)
    memory_usage_bytes: Mapped[int] = mapped_column(Integer, default=0)

    numeric_columns: Mapped[int] = mapped_column(Integer, default=0)
    categorical_columns: Mapped[int] = mapped_column(Integer, default=0)
    date_columns: Mapped[int] = mapped_column(Integer, default=0)
    text_columns: Mapped[int] = mapped_column(Integer, default=0)
    boolean_columns: Mapped[int] = mapped_column(Integer, default=0)

    total_missing_values: Mapped[int] = mapped_column(Integer, default=0)
    missing_percentage: Mapped[float] = mapped_column(Float, default=0)
    complete_rows: Mapped[int] = mapped_column(Integer, default=0)
    incomplete_rows: Mapped[int] = mapped_column(Integer, default=0)

    duplicate_rows: Mapped[int] = mapped_column(Integer, default=0)
    duplicate_percentage: Mapped[float] = mapped_column(Float, default=0)

    completeness_score: Mapped[float] = mapped_column(Float, default=0)
    validity_score: Mapped[float] = mapped_column(Float, default=0)
    consistency_score: Mapped[float] = mapped_column(Float, default=0)
    uniqueness_score: Mapped[float] = mapped_column(Float, default=0)
    quality_score: Mapped[float] = mapped_column(Float, default=0)

    usability_score: Mapped[float] = mapped_column(Float, default=0)
    usability_status: Mapped[str] = mapped_column(String(30), default="Unknown")
    strengths: Mapped[list | None] = mapped_column(JSON, nullable=True)
    problems: Mapped[list | None] = mapped_column(JSON, nullable=True)

    key_findings: Mapped[list | None] = mapped_column(JSON, nullable=True)
    recommended_actions: Mapped[list | None] = mapped_column(JSON, nullable=True)

    correlations: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    dataset: Mapped["Dataset"] = relationship(back_populates="analysis")


class Visualization(Base):
    __tablename__ = "visualizations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    chart_type: Mapped[str] = mapped_column(String(30), nullable=False)
    config: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    mode: Mapped[str] = mapped_column(String(30), default="explorer")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("chat_sessions.id"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(10), nullable=False)  # user / assistant
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    format: Mapped[str] = mapped_column(String(10), nullable=False)  # pdf, xlsx, csv
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AdminActivity(Base):
    __tablename__ = "admin_activity"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    admin_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
