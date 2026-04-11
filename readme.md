# Yukti Web Application

Yukti is now a web-first application:

- Frontend: React + Vite single-page app
- Backend: FastAPI API server
- Optional ML pipeline for model training/inference

Desktop packaging (Electron/.exe) has been removed from this repository.

## Architecture

- Browser client calls backend REST APIs.
- Backend can also serve built frontend assets from `backend/static/` for single-origin deployment.
- Authentication uses Firebase.

## Project Structure

```text
aria-agent/
  backend/      # FastAPI API + analytics engine + optional static hosting
  frontend/     # React/Vite web client
```

## Local Development

### Single command (recommended)

From the workspace root:

```bash
npm install
npm run yukti
```

This starts both:

- Backend API on `http://127.0.0.1:8000`
- Frontend dev server on `http://localhost:5173`

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Production (Web)

You have two deployment patterns:

1. Separate frontend and backend

- Deploy frontend (Vite build) to a static host/CDN.
- Deploy backend (FastAPI) to a Python host.
- Set `VITE_API_URL` in frontend environment to backend URL.
- Configure backend CORS (`YUKTI_CORS_ALLOW_ORIGINS`) and hosts (`YUKTI_ALLOWED_HOSTS`).

2. Single backend host

- Build frontend: `cd frontend && npm run build`
- Copy frontend build output into `backend/static/`
- Run backend only; it serves both API and SPA routes.

## Environment Variables

Backend:

- `YUKTI_CORS_ALLOW_ORIGINS`: comma-separated allowed web origins
- `YUKTI_ALLOWED_HOSTS`: comma-separated trusted hosts
- `YUKTI_SESSION_DIR`: optional path for persisted session files
- `GOOGLE_APPLICATION_CREDENTIALS`: Firebase service account JSON path
- `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`: AI provider keys loaded by backend from local environment/config

Frontend:

- `VITE_API_URL`: backend base URL

## Notes

- Keep API keys and credentials out of git.
- If deploying behind a reverse proxy, set forwarded headers/proxy settings at the infrastructure level.
- If `backend/static/` is present, unknown routes fallback to SPA `index.html`.
