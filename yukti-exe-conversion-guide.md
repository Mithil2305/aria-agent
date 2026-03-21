# Yukti (aria-agent) — .exe Conversion Guide

> Full analysis of the React + Python project and step-by-step implementation plan to package it as a standalone Windows `.exe`.

---

## Table of Contents

1. [Project Analysis](#1-project-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Phase 1 — Bundle the React Frontend](#3-phase-1--bundle-the-react-frontend)
4. [Phase 2 — Serve Frontend from FastAPI](#4-phase-2--serve-frontend-from-fastapi)
5. [Phase 3 — Handle API Keys & Firebase at Runtime](#5-phase-3--handle-api-keys--firebase-at-runtime)
6. [Phase 4 — Add a First-Run Setup Page in React](#6-phase-4--add-a-first-run-setup-page-in-react)
7. [Phase 5 — PyInstaller Spec File](#7-phase-5--pyinstaller-spec-file)
8. [Phase 6 — Electron Wrapper](#8-phase-6--electron-wrapper)
9. [Phase 7 — FastAPI Port Argument](#9-phase-7--fastapi-port-argument)
10. [Phase 8 — Build & Package](#10-phase-8--build--package)
11. [Summary of All File Changes](#11-summary-of-all-file-changes)
12. [Important Caveats](#12-important-caveats)

---

## 1. Project Analysis

**Yukti** (Your Unified Knowledge & Trade Intelligence) is a full-stack decision intelligence platform for Indian SMB retailers, consisting of three parts:

| Part | Technology | Role |
|---|---|---|
| Frontend | React 19 + Vite + Tailwind CSS | SPA with 10 pages, Firebase Auth, Recharts |
| Backend | Python 3.10 + FastAPI + Uvicorn | 6-layer analytics engine, AI fallback chain, PDF generation |
| ML Worker | PyTorch + TinyLlama 1.1B + QLoRA | Custom fine-tuned model for premium analysis |

### Key Complexity Factors for .exe Packaging

- Backend uses **Firebase Admin SDK** — requires credentials at runtime
- **AI fallback chain** hits 3 external APIs (Gemini → Groq → Claude) — needs internet
- Optional **ML model** (TinyLlama + QLoRA) needs GPU / large VRAM — several GB in size
- Frontend is a **full React SPA** — must be bundled into static files first
- Backend uses **local filesystem** for session persistence (`pickle` files)
- Sessions stored in `backend/sessions/` — path must be user-writable in packaged form

---

## 2. Target Architecture

The strategy is: an **Electron shell** wraps the bundled React build, which talks to a **PyInstaller-packaged FastAPI** server that boots as a subprocess.

```
yukti.exe  (Electron)
  ├── Boots backend.exe (PyInstaller) on a random free port
  ├── Serves static React build from inside the .exe
  └── Opens a browser window pointed at localhost:{port}
```

### Folder Structure After Conversion

```
project-root/
├── frontend/               ← React source (unchanged)
│   └── dist/               ← Built static files (copied to backend/static)
│
├── backend/
│   ├── static/             ← NEW: React build lives here
│   ├── config.py           ← NEW: runtime config loader
│   ├── setup_route.py      ← NEW: /api/setup endpoint
│   ├── yukti_backend.spec  ← NEW: PyInstaller spec
│   └── main.py             ← EDITED: static serving + port arg
│
└── electron/               ← NEW: Electron wrapper
    ├── main.js
    ├── package.json
    └── assets/
        └── icon.ico
```

---

## 3. Phase 1 — Bundle the React Frontend

### File to change: `frontend/vite.config.js`

Add `base: './'` so all asset paths are relative — required when React is served by FastAPI instead of Vite's dev server.

```js
// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',           // ← ADD THIS LINE
  plugins: [react()],
  // ... rest of config unchanged
})
```

### Build command

```bash
cd frontend
npm run build
# Produces: frontend/dist/
```

### Copy build output into backend

```bash
cp -r frontend/dist/ backend/static/
```

---

## 4. Phase 2 — Serve Frontend from FastAPI

### File to change: `backend/main.py`

Add static file serving **after all existing API routes**:

```python
# ── ADD these imports at the top of main.py ──────────────────────────────────
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# ── ADD at the very bottom, after all @app route definitions ─────────────────
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

    @app.exception_handler(404)
    async def spa_fallback(request, exc):
        # Return index.html for all unknown routes so React Router works
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
```

> **Why this order matters:** FastAPI matches routes top-to-bottom. All `/api/*` routes must be registered before the catch-all static mount, otherwise API calls will be intercepted.

---

## 5. Phase 3 — Handle API Keys & Firebase at Runtime

### New file: `backend/config.py`

Instead of reading from `.env` (which won't exist after PyInstaller packaging), load from a user-writable config directory in `%APPDATA%`:

```python
# backend/config.py
import os
import json
from pathlib import Path

# Writable location that survives app updates
CONFIG_DIR = Path(os.getenv("APPDATA", Path.home())) / "Yukti"
CONFIG_FILE = CONFIG_DIR / "config.json"
CONFIG_DIR.mkdir(parents=True, exist_ok=True)


def load_config() -> dict:
    if CONFIG_FILE.exists():
        return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    return {}


def save_config(data: dict) -> None:
    CONFIG_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


# ── Resolved keys (config file takes priority over env vars) ─────────────────
cfg = load_config()
GEMINI_API_KEY    = cfg.get("GEMINI_API_KEY")    or os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY      = cfg.get("GROQ_API_KEY")      or os.getenv("GROQ_API_KEY", "")
ANTHROPIC_API_KEY = cfg.get("ANTHROPIC_API_KEY") or os.getenv("ANTHROPIC_API_KEY", "")
```

### File to change: `backend/engine/ai_client.py`

Replace all direct `os.getenv(...)` calls for API keys with imports from `config.py`:

```python
# BEFORE
import os
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# AFTER
from config import GEMINI_API_KEY, GROQ_API_KEY, ANTHROPIC_API_KEY
```

### New file: `backend/setup_route.py`

Expose a `/api/setup` endpoint that the React first-run page POSTs to:

```python
# backend/setup_route.py
from fastapi import APIRouter
from pydantic import BaseModel
from config import save_config, load_config

router = APIRouter()


class SetupPayload(BaseModel):
    gemini_api_key: str
    groq_api_key: str
    anthropic_api_key: str


@router.get("/api/setup/status")
def setup_status():
    cfg = load_config()
    configured = bool(cfg.get("GEMINI_API_KEY") or cfg.get("ANTHROPIC_API_KEY"))
    return {"configured": configured}


@router.post("/api/setup")
def save_setup(payload: SetupPayload):
    save_config({
        "GEMINI_API_KEY":    payload.gemini_api_key,
        "GROQ_API_KEY":      payload.groq_api_key,
        "ANTHROPIC_API_KEY": payload.anthropic_api_key,
    })
    return {"success": True}
```

Then register this router in `main.py`:

```python
# backend/main.py — add near top with other imports
from setup_route import router as setup_router
app.include_router(setup_router)
```

---

## 6. Phase 4 — Add a First-Run Setup Page in React

### New file: `frontend/src/pages/SetupPage.jsx`

A form that collects API keys and POSTs them to `/api/setup`:

```jsx
// frontend/src/pages/SetupPage.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function SetupPage() {
  const navigate = useNavigate();
  const [keys, setKeys] = useState({
    gemini_api_key: "",
    groq_api_key: "",
    anthropic_api_key: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await axios.post("/api/setup", keys);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="w-full max-w-md p-8 rounded-2xl bg-gray-900 space-y-6">
        <h1 className="text-2xl font-bold">Welcome to Yukti</h1>
        <p className="text-gray-400 text-sm">Enter your API keys to get started.</p>

        {["gemini_api_key", "groq_api_key", "anthropic_api_key"].map((key) => (
          <div key={key}>
            <label className="text-xs uppercase tracking-widest text-gray-500 mb-1 block">
              {key.replace(/_/g, " ")}
            </label>
            <input
              type="password"
              className="w-full bg-gray-800 rounded-lg px-4 py-2 text-sm outline-none"
              value={keys[key]}
              onChange={(e) => setKeys({ ...keys, [key]: e.target.value })}
            />
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-lg py-2 font-medium transition"
        >
          {saving ? "Saving..." : "Save & Continue"}
        </button>
      </div>
    </div>
  );
}
```

### File to change: `frontend/src/App.jsx`

Add the `/setup` route and a first-run redirect check:

```jsx
// frontend/src/App.jsx — add to imports
import SetupPage from "./pages/SetupPage";
import { useEffect } from "react";
import axios from "axios";

// Add inside your router, before other routes:
// <Route path="/setup" element={<SetupPage />} />

// Add a root-level check in your App component:
useEffect(() => {
  axios.get("/api/setup/status").then(({ data }) => {
    if (!data.configured) navigate("/setup");
  });
}, []);
```

---

## 7. Phase 5 — PyInstaller Spec File

### New file: `backend/yukti_backend.spec`

```python
# backend/yukti_backend.spec
block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        ('static',  'static'),    # bundled React build
        ('engine',  'engine'),    # analytics engine modules
        ('ml',      'ml'),        # ML inference (without model weights)
    ],
    hiddenimports=[
        # Uvicorn internals not auto-detected
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        # scikit-learn Cython extensions
        'sklearn.utils._cython_blas',
        'sklearn.neighbors._typedefs',
        'sklearn.neighbors._quad_tree',
        'sklearn.tree._utils',
        # statsmodels
        'statsmodels.tsa.statespace._filters',
        # ReportLab
        'reportlab.graphics.barcode.common',
        # Firebase
        'firebase_admin',
        'firebase_admin.auth',
        'firebase_admin.firestore',
    ],
    hookspath=[],
    runtime_hooks=[],
    # Exclude heavy ML training libs — ship model separately
    excludes=['torch', 'transformers', 'peft', 'bitsandbytes', 'trl', 'accelerate'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    name='yukti-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,       # no terminal window shown to user
    icon='../electron/assets/icon.ico',
)
```

### Build command

```bash
cd backend
pip install pyinstaller
pyinstaller yukti_backend.spec
# Output: backend/dist/yukti-backend.exe
```

---

## 8. Phase 6 — Electron Wrapper

### New file: `electron/package.json`

```json
{
  "name": "yukti",
  "version": "1.0.0",
  "description": "Yukti — Decision Intelligence for Indian SMBs",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "dist": "electron-builder --win --x64"
  },
  "dependencies": {
    "electron": "^31.0.0"
  },
  "devDependencies": {
    "electron-builder": "^24.0.0"
  },
  "build": {
    "appId": "com.yukti.app",
    "productName": "Yukti",
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    },
    "extraResources": [
      {
        "from": "../backend/dist/yukti-backend.exe",
        "to": "backend/yukti-backend.exe"
      }
    ]
  }
}
```

### New file: `electron/main.js`

The critical launcher — boots the Python backend and opens the app window:

```js
const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let backendProcess;
const PORT = 8765;

// ── Start the PyInstaller-packaged FastAPI backend ────────────────────────────
function startBackend() {
  const exePath = app.isPackaged
    ? path.join(process.resourcesPath, 'backend', 'yukti-backend.exe')
    : path.join(__dirname, '../backend/dist/yukti-backend.exe');

  backendProcess = spawn(exePath, ['--port', String(PORT)], {
    stdio: 'ignore',
    detached: false,
  });

  backendProcess.on('error', (err) => {
    dialog.showErrorBox('Backend Error', `Failed to start backend:\n${err.message}`);
  });
}

// ── Poll until the backend responds on /health ────────────────────────────────
function waitForBackend(retries = 40, delay = 500) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http.get(`http://127.0.0.1:${PORT}/health`, (res) => {
        if (res.statusCode === 200) return resolve();
        retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (retries-- <= 0) return reject(new Error('Backend did not start in time.'));
      setTimeout(attempt, delay);
    };
    attempt();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  startBackend();

  try {
    await waitForBackend();
  } catch (err) {
    dialog.showErrorBox('Startup Error', err.message);
    app.quit();
    return;
  }

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    titleBarStyle: 'default',
  });

  win.loadURL(`http://127.0.0.1:${PORT}`);
  win.setMenuBarVisibility(false);
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  app.quit();
});
```

---

## 9. Phase 7 — FastAPI Port Argument

### File to change: `backend/main.py`

Make the port configurable so Electron can pass it at launch:

```python
# backend/main.py — ADD at the very bottom
if __name__ == "__main__":
    import argparse
    import uvicorn

    parser = argparse.ArgumentParser(description="Yukti Backend")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host to bind")
    args = parser.parse_args()

    uvicorn.run("main:app", host=args.host, port=args.port, log_level="warning")
```

---

## 10. Phase 8 — Build & Package

Run these commands **in order**:

```bash
# ── Step 1: Build the React frontend ─────────────────────────────────────────
cd frontend
npm run build

# ── Step 2: Copy build output into backend/static ────────────────────────────
# Windows:
xcopy /E /I dist ..\backend\static
# Mac/Linux:
cp -r dist ../backend/static

# ── Step 3: Build the Python backend into a .exe ─────────────────────────────
cd ../backend
pip install pyinstaller
pyinstaller yukti_backend.spec
# Output → backend/dist/yukti-backend.exe

# ── Step 4: Build the final installer with Electron ──────────────────────────
cd ../electron
npm install
npm run dist
# Output → electron/dist/Yukti Setup 1.0.0.exe
```

The final installer at `electron/dist/Yukti Setup 1.0.0.exe` is what you distribute to users.

---

## 11. Summary of All File Changes

| File | Action | Why |
|---|---|---|
| `frontend/vite.config.js` | **Edit** | Add `base: './'` for relative asset paths when served by FastAPI |
| `backend/main.py` | **Edit** | Serve static React files + accept `--port` CLI argument |
| `backend/engine/ai_client.py` | **Edit** | Import API keys from `config.py` instead of `os.getenv` |
| `backend/config.py` | **New** | Runtime config loader from `%APPDATA%/Yukti/config.json` |
| `backend/setup_route.py` | **New** | `/api/setup` and `/api/setup/status` endpoints |
| `backend/yukti_backend.spec` | **New** | PyInstaller build specification |
| `frontend/src/pages/SetupPage.jsx` | **New** | First-run UI to collect API keys |
| `frontend/src/App.jsx` | **Edit** | Add `/setup` route + first-run redirect logic |
| `electron/main.js` | **New** | Electron entry — boots backend subprocess, opens window |
| `electron/package.json` | **New** | Electron + electron-builder configuration |

**Total files touched: 10** (4 existing edits + 6 new files)

---

## 12. Important Caveats

### ML Model (TinyLlama)
Do **not** bundle the model weights inside the `.exe` — they are several GB and would make the installer unusably large. Instead:
- Make the premium analysis feature **download the model on first use** to `%APPDATA%/Yukti/models/`
- Or **disable it in the desktop build** and keep it cloud-only (the existing rule-based fallback in `inference.py` handles the case where weights aren't available)

### Firebase Credentials
The `frontend/src/firebase.js` credentials (API key, project ID, etc.) are already public-facing client-side values — this is normal for Firebase. Firebase security is enforced by Firestore Rules, not by hiding the config. You can either:
- Hardcode your own project's Firebase config (acceptable)
- Collect it on the first-run setup page alongside the AI API keys

### Internet Requirement
The app still requires an internet connection for:
- Firebase Authentication
- Gemini / Groq / Claude API calls

It is **not a fully offline application**. Make this clear in the installer and UI.

### Session Files
Backend sessions are currently stored as `.pickle` files. After PyInstaller packaging, the working directory changes. Update the session path in `main.py` to use the same `%APPDATA%/Yukti/sessions/` directory as the config file to avoid permission errors.

```python
# backend/main.py — update SESSION_DIR
import os
from pathlib import Path

SESSION_DIR = Path(os.getenv("APPDATA", Path.home())) / "Yukti" / "sessions"
SESSION_DIR.mkdir(parents=True, exist_ok=True)
```

---

*Generated for: [github.com/Mithil2305/aria-agent](https://github.com/Mithil2305/aria-agent)*
