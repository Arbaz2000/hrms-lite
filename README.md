# HRMS Lite

Lightweight HR Management System: employee records and attendance tracking.

**Prerequisites:** Python 3.9+, Node 18+

```bash
# Backend
cd backend && pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

**Run locally:**
- Backend: `cd backend && uvicorn main:app --reload` (port 8000)
- Frontend: `cd frontend && npm run dev` (port 5173)

**Run tests:**
```bash
cd frontend

# Mocked tests (no backend needed - recommended for quick testing)
npm run test:mocked

# E2E tests (requires backend running)
npm run test:e2e

# Interactive test UI
npm run test:ui
```

See [RECRUITER.md](RECRUITER.md) for full documentation.
> **Note:** For testing or development, you can switch to the `test` branch: