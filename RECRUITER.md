# HRMS Lite — Recruiter Documentation

## Overview

HRMS Lite is a lightweight HR Management System for managing employee records and attendance. It provides a dashboard, employee CRUD, and attendance tracking with check-in/check-out.

## Features

- **Employee Management**: Create, view, and delete employee records with full name, email, and department
- **Attendance Tracking**: Mark employee attendance as Present or Absent with timestamp recording
- **Dashboard Analytics**: Real-time statistics showing total employees, attendance records, present/absent counts, and attendance rate percentage
- **Date Range Filtering**: Filter attendance data by custom date ranges for detailed analytics
- **Interactive Modals**: Click-through dashboards tiles to view detailed employee lists and attendance records
- **Responsive UI**: Modern, mobile-friendly interface built with Tailwind CSS
- **Real-time Updates**: React Query for optimistic updates and automatic cache invalidation
- **Form Validation**: Email validation and required field checks

## Architecture

```mermaid
flowchart TB
    User[User Browser]
    Frontend[React Frontend<br/>Vite Dev Server<br/>Port 5173]
    API[FastAPI Backend<br/>Uvicorn Server<br/>Port 8000]
    DB[(Database<br/>SQLite/PostgreSQL)]
    
    User -->|HTTP Requests| Frontend
    Frontend -->|REST API Calls| API
    API -->|SQLAlchemy ORM| DB
    
    subgraph frontendLayer [Frontend Layer]
        Frontend
        Components[Components:<br/>Dashboard, EmployeeList<br/>AttendanceTracker]
        APIClient[API Client<br/>Axios]
        Frontend --> Components
        Components --> APIClient
    end
    
    subgraph backendLayer [Backend Layer]
        API
        Models[SQLAlchemy Models]
        Schemas[Pydantic Schemas]
        Routes[API Routes]
        API --> Routes
        Routes --> Models
        Routes --> Schemas
    end
```

### System Components

- **Backend** (`backend/`): REST API built with FastAPI, async SQLAlchemy ORM
- **Frontend** (`frontend/`): React 19 SPA with Vite 7 dev server
- **Database**: SQLite by default for local development; PostgreSQL for production (Render)
- **Deployment**: `render.yaml` configuration for Render.com (API + managed PostgreSQL)

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Backend | FastAPI, SQLAlchemy (async), asyncpg/aiosqlite |
| Frontend | React 19, Vite 7, Tailwind CSS, React Query |
| Database | SQLite (local), PostgreSQL (production) |
| Tests | Playwright (E2E + mocked) |

## Technology Rationale

### Why These Choices?

- **FastAPI**: High-performance Python web framework with automatic OpenAPI documentation, async support, and excellent developer experience
- **SQLAlchemy Async**: Non-blocking database operations for better scalability and performance
- **React 19 + Vite 7**: Lightning-fast dev server with HMR (Hot Module Replacement), modern React features, and optimized production builds
- **Tailwind CSS**: Utility-first CSS framework enabling rapid UI development without context switching
- **Playwright**: Comprehensive E2E testing with support for both real API integration tests and mocked unit tests
- **SQLite/PostgreSQL**: Zero-config SQLite for easy local development; production-ready PostgreSQL for cloud deployment

## Prerequisites

- Python 3.9+
- Node 18+
- pip, npm

## Install Packages

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

## Run Locally

```bash
# Terminal 1 — Backend (port 8000)
cd backend
uvicorn main:app --reload

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open http://localhost:5173

## Development Workflow

### Hot Reload & Auto-Restart

- **Backend**: Uvicorn runs with `--reload` flag, automatically restarting on Python file changes
- **Frontend**: Vite HMR instantly reflects component changes without full page reload
- **Database**: Tables auto-create on backend startup via SQLAlchemy metadata

### Local Database

- SQLite file location: `backend/hrms_lite.db` (auto-created)
- No PostgreSQL server needed for local development
- Database schema auto-migrates on app startup

### CORS Configuration

Backend is pre-configured for local development origins:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (alternative)
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | `backend/.env` | PostgreSQL connection string. Omit for local SQLite. |
| `VITE_API_URL` | `frontend/.env` | API base URL (e.g. `http://localhost:8000` for local) |

### Local Development Defaults

- Backend uses SQLite (`./hrms_lite.db`) when `DATABASE_URL` is not set
- Frontend uses `VITE_API_URL` from `.env` or falls back to localhost:8000

### Production Example

```bash
# backend/.env
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname

# frontend/.env
VITE_API_URL=https://your-api.onrender.com
```

## Project Structure

```
hrms-lite/
├── backend/
│   ├── main.py          # FastAPI app, API routes, CORS
│   ├── models.py        # SQLAlchemy models (Employee, Attendance)
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── database.py      # DB engine, session factory, connection
│   ├── crud.py          # Business logic helpers
│   ├── requirements.txt # Python dependencies
│   ├── .env             # Database configuration
│   └── hrms_lite.db     # SQLite database (auto-generated)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx           # Main dashboard with stats
│   │   │   ├── EmployeeList.jsx        # Employee CRUD table
│   │   │   ├── AttendanceTracker.jsx   # Mark attendance form
│   │   │   ├── Layout.jsx              # Layout wrapper
│   │   │   ├── Navbar.jsx              # Navigation header
│   │   │   └── modals/
│   │   │       ├── EmployeeListModal.jsx      # Employee list view
│   │   │       ├── AttendanceListModal.jsx    # Attendance records
│   │   │       └── EmployeeAttendanceModal.jsx # Individual attendance
│   │   ├── api/
│   │   │   └── client.js    # Axios instance, API functions
│   │   ├── App.jsx          # Root component
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Tailwind styles
│   ├── tests/
│   │   ├── e2e/             # End-to-end tests (real API)
│   │   ├── mocked/          # Mocked tests (no backend)
│   │   ├── helpers/         # Test utilities
│   │   └── fixtures/        # Test data
│   ├── e2e/                 # Additional E2E tests
│   ├── package.json         # Node dependencies
│   ├── vite.config.js       # Vite configuration
│   ├── playwright.config.js # Playwright test config
│   └── .env                 # API URL configuration
├── render.yaml              # Render.com deployment config
└── README.md                # Quick start guide
```

## Database Schema

### Employee Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique employee identifier |
| `full_name` | String | NOT NULL | Employee's full name |
| `email` | String | UNIQUE, NOT NULL, Indexed | Employee email address |
| `department` | String | NOT NULL | Department name |
| `created_at` | DateTime | NOT NULL, Default: now() | Record creation timestamp |

**Relationships**: One-to-many with Attendance (cascade delete)

### Attendance Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique attendance record ID |
| `employee_id` | Integer | Foreign Key → employees.id, NOT NULL | Reference to employee |
| `date` | DateTime | NOT NULL | Attendance date and time |
| `status` | Enum | NOT NULL | "Present" or "Absent" |
| `created_at` | DateTime | NOT NULL, Default: now() | Record creation timestamp |

**Relationships**: Many-to-one with Employee

**Cascade Behavior**: Deleting an employee automatically deletes all their attendance records

## API Endpoints

### Employee Endpoints

#### Create Employee
```
POST /api/employees
Content-Type: application/json

Request Body:
{
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "department": "Engineering"
}

Response (201 Created):
{
  "id": 1,
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "department": "Engineering",
  "created_at": "2026-02-12T10:30:00"
}
```

#### List All Employees
```
GET /api/employees

Response (200 OK):
[
  {
    "id": 1,
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "department": "Engineering",
    "created_at": "2026-02-12T10:30:00"
  }
]
```

#### Delete Employee
```
DELETE /api/employees/{employee_id}

Response (200 OK):
{
  "message": "Employee 1 deleted successfully"
}
```

### Attendance Endpoints

#### Mark Attendance
```
POST /api/attendance
Content-Type: application/json

Request Body:
{
  "employee_id": 1,
  "date": "2026-02-12T09:00:00",
  "status": "Present"
}

Response (201 Created):
{
  "id": 1,
  "employee_id": 1,
  "date": "2026-02-12T09:00:00",
  "status": "Present",
  "created_at": "2026-02-12T09:00:00"
}
```

#### Get Employee Attendance
```
GET /api/attendance/{employee_id}?start_date=2026-02-01&end_date=2026-02-28

Query Parameters:
- start_date (optional): Filter from date (YYYY-MM-DD)
- end_date (optional): Filter to date (YYYY-MM-DD)

Response (200 OK):
[
  {
    "id": 1,
    "employee_id": 1,
    "date": "2026-02-12T09:00:00",
    "status": "Present",
    "created_at": "2026-02-12T09:00:00"
  }
]
```

### Dashboard Endpoints

#### Get Dashboard Summary
```
GET /api/dashboard/summary?start_date=2026-02-01&end_date=2026-02-28

Query Parameters:
- start_date (optional): Filter from date (YYYY-MM-DD)
- end_date (optional): Filter to date (YYYY-MM-DD)

Response (200 OK):
{
  "total_employees": 10,
  "total_attendance_records": 150,
  "present_count": 135,
  "absent_count": 15,
  "attendance_rate": 90.00
}
```

#### Get Employees with Attendance Stats
```
GET /api/dashboard/employees?status=Present&start_date=2026-02-01&end_date=2026-02-28

Query Parameters:
- status (optional): Filter by "Present" or "Absent"
- start_date (optional): Filter from date (YYYY-MM-DD)
- end_date (optional): Filter to date (YYYY-MM-DD)

Response (200 OK):
[
  {
    "id": 1,
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "department": "Engineering",
    "present_count": 18,
    "absent_count": 2,
    "total_records": 20
  }
]
```

## Frontend Architecture

### Component Hierarchy

```
App.jsx (Root)
└── Layout.jsx
    ├── Navbar.jsx
    └── Main Content:
        ├── Dashboard.jsx
        │   ├── Stats Cards (clickable)
        │   ├── Date Filters
        │   └── Attendance Rate Card
        ├── EmployeeList.jsx
        │   ├── Employee Table
        │   └── Add Employee Form
        └── AttendanceTracker.jsx
            ├── Employee Select
            ├── Date Picker
            └── Status Selector

Modals (conditional rendering):
├── EmployeeListModal.jsx
├── AttendanceListModal.jsx
└── EmployeeAttendanceModal.jsx
```

### Key Components

**Dashboard.jsx**
- Displays 4 stat cards: Total Employees, Total Attendance Records, Present Days, Absent Days
- Date range filtering (start/end date inputs)
- Clickable tiles open detailed modals
- Attendance rate visualization

**EmployeeList.jsx**
- Tabular employee list with department info
- Inline add employee form
- Delete employee action
- Real-time updates via React Query

**AttendanceTracker.jsx**
- Dropdown to select employee
- Date picker for attendance date
- Present/Absent status selector
- Submit form to mark attendance

### API Client (`frontend/src/api/client.js`)

Three API modules:
- `employeeAPI`: `getAll()`, `create()`, `delete()`
- `attendanceAPI`: `getByEmployee()`, `mark()`
- `dashboardAPI`: `getSummary()`, `getEmployeesWithAttendance()`

All functions return promises with Axios response data.

## Testing

### Test Structure

```
frontend/tests/
├── e2e/                    # End-to-end tests (require running backend)
│   ├── dashboard.spec.js
│   ├── employee-management.spec.js
│   └── attendance-tracker.spec.js
├── mocked/                 # Mocked tests (MSW, no backend needed)
│   ├── dashboard.spec.js
│   ├── employee-management.spec.js
│   └── attendance-tracker.spec.js
├── helpers/                # Test utilities and actions
└── fixtures/               # Test data fixtures
```

### Running Tests

```bash
cd frontend

# Run all Playwright tests (E2E + mocked)
npm run test:all

# E2E tests only (requires backend running on port 8000)
npm run test:e2e

# Mocked tests only (no backend needed)
npm run test:mocked

# Interactive UI mode (visual test runner)
npm run test:ui

# Debug mode (step-by-step execution)
npm run test:debug

# Show HTML test report
npm run test:report
```

### Test Coverage

- **Dashboard Flow**: Stats display, date filtering, modal interactions
- **Employee Management**: Create, list, delete employee operations
- **Attendance Tracking**: Mark attendance, view records, date filtering

### Test Projects

Two Playwright projects:
- `e2e`: Tests against real backend API (integration tests)
- `mocked`: Tests with MSW (Mock Service Worker) for isolated frontend testing

## Deployment

### Render.com Configuration

The `render.yaml` blueprint defines:

**Web Service: `hrms-lite-api`**
- Runtime: Python
- Root directory: `backend/`
- Build command: `pip install -r requirements.txt`
- Start command: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `DATABASE_URL` injected from managed database

**Database: `hrms-lite-db`**
- Type: PostgreSQL
- Plan: Free tier
- Auto-connected to web service via `DATABASE_URL`

### Deployment Process

1. Push code to GitHub
2. Connect repository to Render
3. Render auto-detects `render.yaml`
4. Creates PostgreSQL database
5. Deploys backend service
6. Database tables auto-create on first startup

### Frontend Deployment

Frontend can be deployed to:
- Vercel (recommended for Vite/React)
- Netlify
- Render Static Site

Set `VITE_API_URL` environment variable to your deployed backend URL.

## Key Files to Review

| Path | Purpose | Lines of Code |
|------|---------|---------------|
| `backend/main.py` | FastAPI app, API routes, CORS, lifespan | ~317 |
| `backend/models.py` | SQLAlchemy Employee & Attendance models | ~37 |
| `backend/schemas.py` | Pydantic validation schemas | ~68 |
| `backend/database.py` | DB engine, async session factory | ~52 |
| `frontend/src/App.jsx` | Root component, routing | ~50 |
| `frontend/src/components/Dashboard.jsx` | Dashboard with stats and filters | ~247 |
| `frontend/src/components/EmployeeList.jsx` | Employee CRUD interface | ~150 |
| `frontend/src/components/AttendanceTracker.jsx` | Attendance marking form | ~200 |
| `frontend/src/api/client.js` | Axios API client with typed functions | ~101 |

## API Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These docs are auto-generated from code and include:
- All endpoints with request/response schemas
- Try-it-out functionality
- Schema definitions

## Common Development Tasks

### Add a New Employee Field

1. Update `Employee` model in `backend/models.py`
2. Update `EmployeeBase` schema in `backend/schemas.py`
3. Update frontend form in `AddEmployee.jsx`
4. Database will auto-migrate on restart (SQLite) or add migration for production

### Add a New API Endpoint

1. Define route in `backend/main.py`
2. Create Pydantic schema if needed
3. Add function to `frontend/src/api/client.js`
4. Use in React component with React Query

### Debug Backend Issues

```bash
# Enable SQL query logging
# In backend/database.py, set echo=True in create_async_engine()

# Check SQLite database
cd backend
sqlite3 hrms_lite.db
> .tables
> SELECT * FROM employees;
```

### Debug Frontend Issues

- Check browser DevTools Network tab for API calls
- Use React DevTools to inspect component state
- Check Vite console for build errors

## Performance Considerations

- **Async Operations**: All database queries use async/await for non-blocking I/O
- **Connection Pooling**: SQLAlchemy manages connection pool automatically
- **React Query Caching**: API responses cached client-side, reducing redundant requests
- **Optimistic Updates**: UI updates before API confirmation for snappy UX
- **Production Builds**: Vite optimizes bundle size with tree-shaking and minification

## Security Notes

- **CORS**: Configured for specific origins (not wildcard `*`)
- **Email Validation**: Pydantic enforces valid email format
- **SQL Injection**: SQLAlchemy ORM prevents SQL injection attacks
- **Environment Variables**: Sensitive credentials in `.env` files (not committed to git)

## Future Enhancements

Potential features for expansion:
- User authentication & authorization
- Employee profile pictures
- Attendance reports & exports (PDF/CSV)
- Leave management system
- Shift scheduling
- Email notifications
- Admin dashboard with analytics charts
