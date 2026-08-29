"""
Pydantic schemas for request validation and API responses.
"""
from datetime import datetime
from typing import Optional, Any  # noqa: F401 — Any used in dict[str, Any] fields below

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------- Auth ----------

class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Datasets ----------

class DatasetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    original_filename: str
    display_name: str
    file_type: str
    file_size_bytes: int
    status: str
    error_message: Optional[str] = None
    total_rows: Optional[int] = None
    total_columns: Optional[int] = None
    quality_score: Optional[float] = None
    usability_score: Optional[float] = None
    usability_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class DatasetRename(BaseModel):
    display_name: str = Field(min_length=1, max_length=255)


# ---------- Analysis ----------

class ColumnOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    data_type: str
    total_values: int
    non_null_count: int
    null_count: int
    null_percentage: float
    unique_count: int
    unique_percentage: float
    duplicate_count: int

    min_value: Optional[float] = None
    max_value: Optional[float] = None
    mean_value: Optional[float] = None
    median_value: Optional[float] = None
    std_value: Optional[float] = None
    variance_value: Optional[float] = None
    q1_value: Optional[float] = None
    q3_value: Optional[float] = None
    iqr_value: Optional[float] = None
    zero_count: Optional[int] = None
    negative_count: Optional[int] = None
    outlier_count: Optional[int] = None
    skewness: Optional[float] = None

    most_frequent_value: Optional[str] = None
    most_frequent_freq: Optional[int] = None
    top_categories: Optional[dict[str, Any]] = None
    high_cardinality: bool = False

    min_date: Optional[str] = None
    max_date: Optional[str] = None
    invalid_date_count: Optional[int] = None


class AnalysisOverviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_rows: int
    total_columns: int
    total_cells: int
    memory_usage_bytes: int
    numeric_columns: int
    categorical_columns: int
    date_columns: int
    text_columns: int
    boolean_columns: int
    total_missing_values: int
    missing_percentage: float
    duplicate_rows: int
    duplicate_percentage: float
    quality_score: float
    usability_score: float
    usability_status: str


class HealthOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    completeness_score: float
    validity_score: float
    consistency_score: float
    uniqueness_score: float
    quality_score: float
    total_missing_values: int
    missing_percentage: float
    complete_rows: int
    incomplete_rows: int
    duplicate_rows: int
    duplicate_percentage: float
    usability_score: float
    usability_status: str
    strengths: list[str] = []
    problems: list[str] = []
    key_findings: list[str] = []
    recommended_actions: list[str] = []


# ---------- Data Explorer ----------

class RowsQuery(BaseModel):
    page: int = 1
    page_size: int = 50
    search: Optional[str] = None
    sort_by: Optional[str] = None
    sort_dir: str = "asc"


# ---------- Visualization Studio ----------

class ChartRequest(BaseModel):
    dataset_id: str
    chart_type: str
    x_axis: Optional[str] = None
    y_axis: Optional[str] = None
    aggregation: str = "count"
    group_by: Optional[str] = None
    filters: Optional[dict[str, Any]] = None


# ---------- Chat ----------

class ChatRequest(BaseModel):
    dataset_id: str
    mode: str = "explorer"
    message: str = Field(min_length=1)
    session_id: Optional[str] = None


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    role: str
    content: str
    created_at: datetime


class ChatResponse(BaseModel):
    session_id: str
    reply: ChatMessageOut


# ---------- Reports ----------

class ReportGenerateRequest(BaseModel):
    format: str = Field(pattern="^(pdf|xlsx|csv)$")


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    dataset_id: str
    format: str
    created_at: datetime


# ---------- Admin ----------

class AdminStatsOut(BaseModel):
    total_users: int
    active_users: int
    total_datasets: int
    total_analyses: int
    total_rows_analyzed: int
    storage_usage_bytes: int


class AdminUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime


class RoleUpdate(BaseModel):
    role: str = Field(pattern="^(user|admin)$")


# ---------- Profile ----------

class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)
