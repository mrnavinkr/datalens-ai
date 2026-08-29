# 📊 DataLens AI

### AI-Powered Dataset Analysis & Visualization Platform

**DataLens AI** is a full-stack data analytics platform that allows users to upload datasets, analyze data, generate insights, and explore results through an interactive web interface.

The application combines a **React frontend**, **FastAPI backend**, **MySQL-compatible TiDB Cloud database**, and **Google Gemini AI** to provide an end-to-end data analysis experience.

---

## 🌐 Live Demo

🚀 **Live Application:**
https://datalens-ai12.netlify.app/

> The live demo is deployed on Netlify. Backend services run separately on Render.

---

## 🖼️ Project Overview

DataLens AI is designed to simplify the process of working with datasets.

Users can:

* 👤 Create an account and log in securely
* 📂 Upload datasets
* 📊 Analyze dataset information
* 🔍 Explore data insights
* 🤖 Use AI-powered analysis
* 📈 Work with analytical results and visualizations
* 🔐 Access protected application features through authentication

---

# ✨ Key Features

### 🔐 Authentication

* User registration
* Secure login
* JWT-based authentication
* Protected API endpoints
* Token-based session management
* Password hashing

### 📁 Dataset Management

* Upload datasets through the web interface
* File validation
* Configurable upload size
* Backend processing
* Dataset storage and analysis

### 📊 Data Analysis

* Dataset exploration
* Data statistics
* Column-level information
* Missing-value analysis
* Data processing and analytical workflows

### 🤖 AI-Powered Insights

Google Gemini AI is integrated to assist with dataset analysis and generate useful insights from data.

### 🎨 Modern Frontend

* Responsive UI
* React-based architecture
* Vite development environment
* Tailwind CSS styling
* Axios API integration

### ⚡ Fast Backend

* FastAPI REST API
* SQLAlchemy ORM
* Pydantic validation
* Uvicorn ASGI server
* MySQL/TiDB Cloud database connectivity

---

# 🛠️ Tech Stack

## Frontend

| Technology      | Purpose             |
| --------------- | ------------------- |
| ⚛️ React 18     | User interface      |
| ⚡ Vite          | Frontend build tool |
| 🎨 Tailwind CSS | Styling             |
| 🔗 Axios        | API communication   |
| 🟨 JavaScript   | Application logic   |

## Backend

| Technology          | Purpose             |
| ------------------- | ------------------- |
| 🐍 Python           | Backend programming |
| 🚀 FastAPI          | REST API framework  |
| 🦄 Uvicorn          | ASGI server         |
| 🗄️ SQLAlchemy      | Database ORM        |
| ✅ Pydantic          | Data validation     |
| 🔑 JWT              | Authentication      |
| 🔐 Passlib / Bcrypt | Password hashing    |

## Database

| Technology    | Purpose                |
| ------------- | ---------------------- |
| 🐬 MySQL      | Database technology    |
| ☁️ TiDB Cloud | Cloud database         |
| 🔌 PyMySQL    | Python database driver |

## AI

| Technology       | Purpose                     |
| ---------------- | --------------------------- |
| 🤖 Google Gemini | AI-powered dataset insights |

## Deployment

| Platform      | Purpose                       |
| ------------- | ----------------------------- |
| ▲ Netlify     | Frontend deployment           |
| 🚀 Render     | Backend deployment            |
| ☁️ TiDB Cloud | Cloud database                |
| 🐙 GitHub     | Source code & version control |

---

# 🏗️ Project Architecture

```text
                    ┌──────────────────────┐
                    │      User Browser    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React + Vite       │
                    │   Tailwind CSS        │
                    │   Netlify             │
                    └──────────┬───────────┘
                               │
                         REST API / Axios
                               │
                               ▼
                    ┌──────────────────────┐
                    │     FastAPI Backend   │
                    │       Render         │
                    └───────┬───────┬──────┘
                            │       │
                ┌───────────┘       └────────────┐
                ▼                                ▼
      ┌──────────────────┐              ┌──────────────────┐
      │   TiDB Cloud     │              │   Gemini AI      │
      │   MySQL Database │              │   AI Analysis    │
      └──────────────────┘              └──────────────────┘
```

---

# 📂 Project Structure

```text
datalens-ai/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
├── backend/
│   ├── main.py
│   ├── routers/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── uploads/
│   ├── requirements.txt
│   └── ...
│
├── .env.example
├── README.md
└── ...
```

---

# 🚀 Getting Started

Follow the steps below to run DataLens AI locally.

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/mrnavinkr/datalens-ai.git
```

Move into the project directory:

```bash
cd datalens-ai
```

---

# 🐍 Backend Setup

Open a terminal and move into the backend:

```bash
cd backend
```

## Create Virtual Environment

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

---

## Install Dependencies

```bash
python -m pip install -r requirements.txt
```

---

# 🔐 Environment Variables

Create a `.env` file inside the `backend` folder.

Example:

```env
DATABASE_URL=your_database_url

SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_gemini_model

UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=100

FRONTEND_URL=http://localhost:5173

APP_NAME=DataLens AI
DEBUG=false
```

> ⚠️ Never commit your real `.env` file, database password, or API keys to GitHub.

---

# ▶️ Start Backend

From the `backend` directory:

```bash
python -m uvicorn main:app --reload
```

Backend will run at:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

---

# ⚛️ Frontend Setup

Open another terminal.

Move into the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

---

## 🔗 API Configuration

Create/update the frontend environment file:

```env
VITE_API_URL=http://127.0.0.1:8000
```

The frontend communicates with the FastAPI backend through Axios.

---

# ▶️ Start Frontend

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

---

# ☁️ Production Deployment

DataLens AI is deployed using a separate frontend and backend architecture.

### Frontend

**Netlify**

```text
https://datalens-ai12.netlify.app/
```

### Backend

**Render**

```text
https://datalens-ai-backend-fu9i.onrender.com
```

### Database

**TiDB Cloud**

The production backend connects to the cloud database through SQLAlchemy and PyMySQL.

---

# 🔄 Production API Configuration

For the deployed frontend, the API URL points to the Render backend:

```env
VITE_API_URL=https://datalens-ai-backend-fu9i.onrender.com
```

The backend uses the deployed frontend URL for CORS configuration:

```env
FRONTEND_URL=https://datalens-ai12.netlify.app
```

---

# 🔒 Security

The project follows basic application security practices:

* 🔐 JWT authentication
* 🔑 Password hashing
* 🛡️ Protected API routes
* 🌐 CORS configuration
* 🔒 Environment-based secrets
* 🚫 Sensitive credentials excluded from GitHub
* 📦 Upload size restrictions

---

# 🧠 AI Integration

DataLens AI uses **Google Gemini** to provide AI-assisted analysis.

The AI layer can be used to transform dataset information into easier-to-understand insights and analytical responses.

The API key is stored securely through environment variables instead of being hard-coded into the application.

---

# 🔌 API

The backend exposes REST API endpoints for application functionality such as:

```text
/api/auth/register
/api/auth/login
```

Additional API functionality is available through FastAPI's interactive documentation.

### Local API Documentation

```text
http://127.0.0.1:8000/docs
```

### Production API

```text
https://datalens-ai-backend-fu9i.onrender.com
```

---

# 🧪 Development Workflow

The project was developed and tested locally before deployment.

```text
Development
     │
     ▼
React Frontend
     │
     ▼
FastAPI Backend
     │
     ▼
Database Connection
     │
     ▼
API Testing
     │
     ▼
GitHub
     │
     ├──────────────► Netlify
     │                  │
     │                  ▼
     │             Live Frontend
     │
     └──────────────► Render
                        │
                        ▼
                   Live Backend
```

---

# 📌 Important Configuration

For local development:

```env
FRONTEND_URL=http://localhost:5173
```

For production:

```env
FRONTEND_URL=https://datalens-ai12.netlify.app
```

Frontend production API:

```env
VITE_API_URL=https://datalens-ai-backend-fu9i.onrender.com
```

---

# 💡 What I Learned

While building DataLens AI, I worked with:

* Full-stack application development
* React frontend development
* FastAPI backend development
* REST API integration
* JWT authentication
* SQLAlchemy ORM
* MySQL/TiDB Cloud database integration
* Environment variable management
* CORS configuration
* AI API integration
* File upload workflows
* Git & GitHub
* Netlify deployment
* Render deployment
* Production debugging and troubleshooting

---

# 🎯 Project Goals

The main goal of DataLens AI is to make dataset analysis more accessible by combining traditional data-processing workflows with AI-assisted insights.

The project demonstrates how a modern full-stack application can connect:

**Frontend + Backend + Database + AI + Cloud Deployment**

into one complete data analytics platform.

---

# 🔗 Project Links

### 🌐 Live Demo

https://datalens-ai12.netlify.app/

### 💻 GitHub Repository

https://github.com/mrnavinkr/datalens-ai

### 👨‍💻 LinkedIn

**Navin Raj**
https://www.linkedin.com/in/navinhere/

---

# 👨‍💻 Developer

### Navin Raj

**B.Tech Computer Science & Engineering | Data Science**

Interested in:

* 📊 Data Analytics
* 🤖 Data Science
* 🐍 Python
* 🗄️ SQL
* 📈 Machine Learning
* ⚛️ Full-Stack Development
* ☁️ Cloud & AI Applications

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.

---

### 📄 License

This project is developed for educational, portfolio, and demonstration purposes.
