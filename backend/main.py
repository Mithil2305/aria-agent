"""
ARIA — Autonomous Decision Intelligence Agent
FastAPI Backend Server

Architecture Layers:
  1. Data Ingestion        - CSV/Excel parsing, cleaning, normalization
  2. Schema Intelligence   - Auto feature detection, type inference, profiling
  3. Analytics & Modeling   - KPIs, trends, seasonality, volatility
  4. Predictive Intelligence - Forecasting, anomaly detection, uncertainty
  5. Decision Intelligence  - Correlations, risk scoring, feature importance
  6. AI Reasoning          - Insight generation, narratives, recommendations
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
import json
import io
import pickle
import tempfile
import os
import numpy as np

from engine.data_ingestion import ingest_file, generate_sample_data
from engine.schema_intelligence import analyze_schema
from engine.analytics_engine import compute_analytics
from engine.predictive_engine import compute_predictions
from engine.decision_engine import compute_decisions
from engine.insight_engine import generate_insights
from engine.report_generator import generate_pdf_report

# ---------------------------------------------------------------------------
# Firebase Admin SDK (optional – works without it for local development)
# ---------------------------------------------------------------------------
_firebase_available = False
try:
    import firebase_admin
    from firebase_admin import credentials, auth as firebase_auth

    # Initialize only once
    if not firebase_admin._apps:
        # Option 1: Use GOOGLE_APPLICATION_CREDENTIALS env var
        # Option 2: Use a service-account.json file in the backend folder
        cred_path = os.environ.get(
            "GOOGLE_APPLICATION_CREDENTIALS",
            os.path.join(os.path.dirname(__file__), "service-account.json"),
        )
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            _firebase_available = True
        else:
            # No credentials found — Firebase auth verification disabled
            pass
except ImportError:
    pass

app = FastAPI(
    title="ARIA Decision Intelligence",
    description="Autonomous AI-driven analytics system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Firebase Auth — optional bearer token verification
# ---------------------------------------------------------------------------
security = HTTPBearer(auto_error=False)


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
):
    """Verify Firebase ID token. Returns uid or None when Firebase is not configured."""
    if not _firebase_available or creds is None:
        return None  # Allow unauthenticated access during local dev
    try:
        decoded = firebase_auth.verify_id_token(creds.credentials)
        return decoded.get("uid")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ---------------------------------------------------------------------------
# Session store — persisted to a temp file so data survives uvicorn --reload
# ---------------------------------------------------------------------------
_SESSION_PATH = os.path.join(tempfile.gettempdir(), "aria_session.pkl")


def _load_session() -> dict:
    """Load session from disk; return empty dict on any failure."""
    try:
        if os.path.exists(_SESSION_PATH):
            with open(_SESSION_PATH, "rb") as f:
                return pickle.load(f)
    except Exception:
        pass
    return {}


def _save_session(store: dict) -> None:
    """Persist session to disk."""
    try:
        with open(_SESSION_PATH, "wb") as f:
            pickle.dump(store, f)
    except Exception:
        pass


session_store: dict = _load_session()


def _sanitize(obj):
    """Recursively convert numpy types to native Python types for JSON serialization."""
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj


@app.get("/health")
async def health():
    return {"status": "ok", "engine": "ARIA Decision Intelligence v1.0"}


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), uid: str = Depends(get_current_user)):
    """Data Ingestion Layer: Parse and normalize uploaded dataset."""
    try:
        contents = await file.read()
        filename = file.filename
        result = ingest_file(contents, filename)

        session_store["raw_data"] = result["data"]
        session_store["filename"] = filename
        session_store["row_count"] = result["row_count"]
        session_store["col_count"] = result["col_count"]
        _save_session(session_store)

        return JSONResponse(content=_sanitize({
            "status": "success",
            "filename": filename,
            "row_count": result["row_count"],
            "col_count": result["col_count"],
            "columns": result["columns"],
            "preview": result["preview"],
        }))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/demo")
async def load_demo(uid: str = Depends(get_current_user)):
    """Load built-in sample business dataset for demonstration."""
    result = generate_sample_data()
    session_store["raw_data"] = result["data"]
    session_store["filename"] = result["filename"]
    session_store["row_count"] = result["row_count"]
    session_store["col_count"] = result["col_count"]
    _save_session(session_store)

    return JSONResponse(content=_sanitize({
        "status": "success",
        "filename": result["filename"],
        "row_count": result["row_count"],
        "col_count": result["col_count"],
        "columns": result["columns"],
        "preview": result["preview"],
    }))


@app.get("/api/analyze")
async def run_full_analysis(uid: str = Depends(get_current_user)):
    """
    Run the complete ARIA analysis pipeline:
    Schema Intelligence → Analytics → Predictions → Decisions → Insights
    """
    global session_store
    # Re-hydrate from disk in case server reloaded after upload/demo
    if "raw_data" not in session_store:
        session_store = _load_session()

    if "raw_data" not in session_store:
        raise HTTPException(status_code=400, detail="No dataset loaded. Upload first.")

    data = session_store["raw_data"]
    filename = session_store["filename"]

    # Layer 2: Schema Intelligence
    schema = analyze_schema(data)

    # Layer 3: Analytics & Modeling
    analytics = compute_analytics(data, schema)

    # Layer 4: Predictive Intelligence
    predictions = compute_predictions(data, schema)

    # Layer 5: Decision Intelligence
    decisions = compute_decisions(data, schema)

    # Layer 6: AI Reasoning
    insights = generate_insights(
        schema=schema,
        analytics=analytics,
        predictions=predictions,
        decisions=decisions,
    )

    # Cache for report generation
    session_store["analysis"] = {
        "schema": schema,
        "analytics": analytics,
        "predictions": predictions,
        "decisions": decisions,
        "insights": insights,
    }
    _save_session(session_store)

    return JSONResponse(content=_sanitize({
        "status": "success",
        "filename": filename,
        "row_count": session_store["row_count"],
        "schema": schema,
        "kpis": analytics["kpis"],
        "trends": analytics["trends"],
        "distributions": analytics.get("distributions", []),
        "forecasts": predictions["forecasts"],
        "anomalies": predictions["anomalies"],
        "correlations": decisions["correlations"],
        "feature_importance": decisions.get("feature_importance", []),
        "risk_scores": decisions.get("risk_scores", []),
        "insights": insights["insights"],
        "narrative": insights["narrative"],
        "severity_summary": insights["severity_summary"],
    }))


@app.get("/api/report")
async def download_report(uid: str = Depends(get_current_user)):
    """Generate and download PDF intelligence report."""
    global session_store
    if "analysis" not in session_store:
        session_store = _load_session()

    if "analysis" not in session_store:
        raise HTTPException(status_code=400, detail="Run analysis first.")

    pdf_bytes = generate_pdf_report(
        filename=session_store["filename"],
        row_count=session_store["row_count"],
        analysis=session_store["analysis"],
    )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="ARIA_Intelligence_Report.pdf"'
        },
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
