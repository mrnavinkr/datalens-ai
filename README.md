# DataLens AI

**AI-Powered Data Intelligence & Data Health Platform**
Understand Your Data. Find Its Problems. Discover Its Insights.

Full-stack implementation of the complete spec: auth, dataset upload,
automatic profiling, data health/quality/usability scoring, column
analysis, missing/duplicate/outlier/distribution analysis, correlation,
automatic visualizations + a Visualization Studio, a paginated Data
Explorer, a multi-mode AI Data Analyst (Gemini), PDF/Excel/CSV report
export, an Admin Panel, dark/light mode, and a public Demo mode.

---

## What's implemented

### Backend (FastAPI + MySQL)
- **Auth** — JWT register/login/`/me`, profile update, first registered user becomes admin
- **Datasets** — upload (CSV/XLSX/XLS/JSON) with validation & size limits, list/rename/delete, paginated+searchable+sortable row access (Data Explorer)
- **Profiling engine** (`services/profiling_service.py`) — real Pandas/NumPy/SciPy statistics, nothing invented:
  - Automatic column type detection (integer, float, boolean, date, datetime, categorical, text)
  - Dataset-level profile: rows, columns, cells, memory usage, missing/duplicate rates
  - Column-level stats: min/max/mean/median/std/variance/quartiles/IQR/outliers/skew (numeric); top categories/high-cardinality flag (categorical); date ranges/invalid dates (dates)
  - Data Health scoring: completeness, validity, consistency, uniqueness → overall quality score
  - Data Usability scoring with strengths/problems and prioritized recommended actions
  - Correlation matrix with strong positive/negative pairs
- **Visualization** (`services/visualization_service.py`) — automatic dataset/column charts, plus a configurable chart builder (bar/line/area/pie/donut/histogram/scatter/box/table) for the Visualization Studio
- **Data Explorer** (`services/data_explorer_service.py`) — backend-paginated raw row access with search/sort, capped page size so the browser never holds the whole dataset
- **AI Data Analyst** (`services/ai_service.py`) — Google Gemini integration with 6 chat modes (Explorer, Health, Visualization, Insight, Recommendation, Report). The AI is only ever given the already-computed structured analysis JSON — it explains numbers, it never calculates or invents them
- **Reports** (`services/report_service.py`) — real PDF (ReportLab), Excel (openpyxl, multi-sheet), and CSV report generation from persisted analysis data — tested, produces valid downloadable files
- **Admin Panel** — platform stats, user list/activate-deactivate/role management, dataset oversight, activity log
- **Demo Mode** (`services/demo_service.py`) — generates a deterministic realistic sample sales dataset (with real injected messiness: missing values, inconsistent casing, outliers, duplicates) and serves a full analysis with no login required

### Frontend (React + Vite + Tailwind)
- Landing page, Login, Register, public Demo page
- Dashboard shell with responsive sidebar (mobile-friendly)
- Dataset dashboard: stat cards + recent-datasets table (rename/delete)
- Upload page: drag-and-drop, validation, progress, live "analyzing" state
- Dataset workspace (tabbed): Overview, Data Health, Columns, Data Explorer, Statistics
  (distribution charts), Correlation (heatmap), Visualization Studio (chart builder),
  AI Analyst (multi-mode chat), Reports (PDF/Excel/CSV download)
- Profile page (name/password, theme toggle)
- Admin Dashboard (stats, users, datasets)
- **Dark/light mode** — theme-aware CSS variables so every existing component works in both themes without per-component overrides
- Design direction: deep-ink "diagnostic scan" palette with a teal accent — the signature `ScoreGauge` component reads quality/usability scores like a vital-sign monitor

---

## Getting started

### 1. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: DATABASE_URL (real MySQL 8+), SECRET_KEY (random string),
# and GEMINI_API_KEY if you want the AI Data Analyst to work
uvicorn main:app --reload --port 8000
```

Tables are created automatically on startup. Point `DATABASE_URL` at an
existing MySQL database, e.g.:

```
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/datalens_ai
```

Without `GEMINI_API_KEY` set, every other feature works normally — only
the AI Data Analyst chat will return a clear "not configured yet" message
instead of a model reply.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Visit `http://localhost:5173`. The first account you register becomes an admin.
Visit `/demo` without logging in to see a full analysis of a sample dataset.

---

## Project structure

```
datalens-ai/
├── backend/
│   ├── main.py                      FastAPI app entrypoint, mounts all routers
│   ├── config.py                    Settings from environment variables
│   ├── database.py                  SQLAlchemy engine/session
│   ├── models.py                    ORM models (users, datasets, columns, analysis,
│   │                                 visualizations, chat, reports, admin activity)
│   ├── schemas.py                   Pydantic request/response models
│   ├── auth.py                      JWT + password hashing + current-user/admin deps
│   ├── routers/
│   │   ├── auth.py                  /api/auth/*        (register, login, me, profile)
│   │   ├── datasets.py              /api/datasets/*     (upload, list, rename, delete, rows)
│   │   ├── analysis.py              /api/analysis/*     (overview, health, columns, correlations, outliers)
│   │   ├── visualization.py         /api/visualization/*  (auto charts, chart builder)
│   │   ├── chat.py                  /api/chat           (AI Data Analyst, 6 modes)
│   │   ├── reports.py               /api/reports/*      (generate + download PDF/XLSX/CSV)
│   │   ├── admin.py                 /api/admin/*        (stats, users, dataset oversight)
│   │   └── demo.py                  /api/demo/analysis  (public, unauthenticated)
│   ├── services/
│   │   ├── file_loader.py           Safe CSV/XLSX/XLS/JSON loading, chunked CSV reads
│   │   ├── profiling_service.py     The core statistics/health/quality engine
│   │   ├── analysis_pipeline.py     Orchestrates profiling -> DB persistence
│   │   ├── visualization_service.py Chart-ready data for auto charts + Studio
│   │   ├── data_explorer_service.py Paginated/searchable/sortable row access
│   │   ├── ai_service.py            Gemini prompt building + calling
│   │   ├── report_service.py        PDF/Excel/CSV report rendering
│   │   └── demo_service.py          Deterministic sample dataset generator
│   └── uploads/                     Per-user uploaded files (gitignored)
│
└── frontend/
    └── src/
        ├── api/                     Axios client + all endpoint functions
        ├── context/                 AuthContext, ThemeContext (dark/light)
        ├── layouts/
        │   ├── DashboardLayout.jsx  Sidebar shell (Dashboard/Upload/Profile/Admin)
        │   └── DatasetLayout.jsx    Per-dataset tab navigation + shared data fetch
        ├── components/              Logo, Footer, StatCard, ScoreGauge
        └── pages/                   Home, Login, Register, Demo, Dashboard, Upload,
                                       Profile, AdminDashboard, DatasetOverview, DataHealth,
                                       ColumnAnalysis, DataExplorer, Statistics,
                                       CorrelationAnalysis, VisualizationStudio,
                                       AIDataAnalyst, Reports
```

---

## Testing notes

This was built and verified in a sandboxed environment without outbound
network access, so `npm install` / a live MySQL instance / a live Gemini
API call could not be exercised directly. What *was* verified directly:

- The full profiling pipeline (type detection, stats, health/quality/usability
  scoring, correlations) against a synthetic messy dataset — confirmed it
  correctly catches invalid dates, inconsistent casing, whitespace, outliers,
  and duplicates, and produces sensible scores and prioritized recommendations
- The demo dataset generator + full pipeline + chart data generation, end-to-end
- PDF, Excel, and CSV report generation — all three produce valid, non-empty
  downloadable files with real content
- Every backend Python file compiles cleanly (`py_compile`)
- Every frontend JS/JSX file (29 files) passes an esbuild syntax check

Run `npm install` and point `DATABASE_URL` at a real MySQL instance to
run it end-to-end yourself.

---

Developed by **Er. Navin Kumar**
[LinkedIn](https://www.linkedin.com/in/navinhere) · [GitHub](https://github.com/mrnavinkr)
