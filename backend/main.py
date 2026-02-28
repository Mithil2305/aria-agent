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
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

from engine.data_ingestion import ingest_file, generate_sample_data
from engine.schema_intelligence import analyze_schema
from engine.analytics_engine import compute_analytics
from engine.predictive_engine import compute_predictions
from engine.decision_engine import compute_decisions
from engine.insight_engine import generate_insights
from engine.report_generator import generate_pdf_report

from pydantic import BaseModel
from typing import List, Optional


class DailyLogEntry(BaseModel):
    date: str
    revenue: Optional[float] = None
    customers: Optional[float] = None
    orders: Optional[float] = None
    expenses: Optional[float] = None
    marketingSpend: Optional[float] = None
    inventory: Optional[float] = None
    avgBasketSize: Optional[float] = None
    wasteShrinkage: Optional[float] = None
    notes: Optional[str] = None


class DailyLogsPayload(BaseModel):
    logs: List[DailyLogEntry]
    filename: Optional[str] = "daily_logs.csv"


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
    allow_origins=["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Ensure unhandled exceptions still return proper CORS-friendly JSON."""
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
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
    """Recursively convert numpy/pandas types to JSON-safe Python types."""
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_sanitize(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating, float)):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return float(obj)
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    if isinstance(obj, np.ndarray):
        return _sanitize(obj.tolist())
    if isinstance(obj, (pd.Timestamp,)):
        return obj.isoformat() if pd.notna(obj) else None
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    if isinstance(obj, (pd.Series, pd.DataFrame)):
        return _sanitize(obj.to_dict())
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

    try:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

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


@app.post("/api/upload-logs")
async def upload_daily_logs(payload: DailyLogsPayload, uid: str = Depends(get_current_user)):
    """
    Accept daily log entries from the frontend, convert to a DataFrame,
    and store in session so /api/analyze can process them.
    """
    try:
        if not payload.logs or len(payload.logs) == 0:
            raise HTTPException(status_code=400, detail="No log entries provided.")

        # Convert logs to DataFrame
        records = []
        for log in payload.logs:
            row = {"date": log.date}
            if log.revenue is not None:
                row["revenue"] = log.revenue
            if log.customers is not None:
                row["customers"] = log.customers
            if log.orders is not None:
                row["orders"] = log.orders
            if log.expenses is not None:
                row["expenses"] = log.expenses
            if log.marketingSpend is not None:
                row["marketing_spend"] = log.marketingSpend
            if log.inventory is not None:
                row["inventory"] = log.inventory
            if log.avgBasketSize is not None:
                row["avg_basket_size"] = log.avgBasketSize
            if log.wasteShrinkage is not None:
                row["waste_shrinkage"] = log.wasteShrinkage
            records.append(row)

        df = pd.DataFrame(records)

        # Parse date column
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df = df.dropna(subset=["date"]).sort_values("date").reset_index(drop=True)

        if len(df) == 0:
            raise HTTPException(status_code=400, detail="No valid date entries found.")

        filename = payload.filename or "daily_logs.csv"

        session_store["raw_data"] = df
        session_store["filename"] = filename
        session_store["row_count"] = len(df)
        session_store["col_count"] = len(df.columns)
        _save_session(session_store)

        return JSONResponse(content=_sanitize({
            "status": "success",
            "filename": filename,
            "row_count": len(df),
            "col_count": len(df.columns),
            "columns": list(df.columns),
        }))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


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
