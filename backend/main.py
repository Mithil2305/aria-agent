"""
Yukti — Autonomous Decision Intelligence Agent
FastAPI Backend Server

Architecture Layers:
  1. Data Ingestion        - CSV/Excel parsing, cleaning, normalization
  2. Schema Intelligence   - Auto feature detection, type inference, profiling
  3. Analytics & Modeling   - KPIs, trends, seasonality, volatility
  4. Predictive Intelligence - Forecasting, anomaly detection, uncertainty
  5. Decision Intelligence  - Correlations, risk scoring, feature importance
  6. AI Reasoning          - Insight generation, narratives, recommendations
"""
from dotenv import load_dotenv

load_dotenv()

from engine.smart_advisor import (
    generate_smart_alerts,
    generate_pricing_insights,
    answer_business_question,
    generate_weekly_digest,
    generate_actionable_forecast_summary,
    MARKET_BENCHMARKS,
)
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import requests
import uvicorn
import json
import io
import base64
import hashlib
import pickle
import os
import logging
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, date
from setup_route import router as setup_router

DEFAULT_ADMIN_EMAIL = "admin@yukti.com"
DEFAULT_ADMIN_PASSWORD = "Admin@2026/"

# ── API keys are loaded from local backend environment/config ──
if not os.environ.get("GEMINI_API_KEY"):
    print("  [INFO] Using local .env/config for API keys")

# ── Configure logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(message)s",
    datefmt="%H:%M:%S",
)

from engine.data_ingestion import ingest_file, generate_sample_data
from engine.schema_intelligence import analyze_schema
from engine.analytics_engine import compute_analytics
from engine.predictive_engine import compute_predictions
from engine.decision_engine import compute_decisions
from engine.insight_engine import generate_insights
from engine.report_generator import generate_pdf_report

from pydantic import BaseModel
from typing import Any, List, Optional

try:
    from cryptography.fernet import Fernet, InvalidToken
except Exception:
    Fernet = None
    InvalidToken = Exception


class DailyLogEntry(BaseModel):
    date: str
    # Common fields
    revenue: Optional[float] = None
    customers: Optional[float] = None
    expenses: Optional[float] = None
    # Shared across many types
    orders: Optional[float] = None
    marketingSpend: Optional[float] = None
    inventory: Optional[float] = None
    avgBasketSize: Optional[float] = None
    wasteShrinkage: Optional[float] = None
    # Grocery / Retail / Clothing
    itemsSold: Optional[float] = None
    inventoryCount: Optional[float] = None
    unitsSold: Optional[float] = None
    returnsRefunds: Optional[float] = None
    onlineSales: Optional[float] = None
    topProducts: Optional[str] = None
    outOfStockItems: Optional[str] = None
    # Restaurant
    avgOrderValue: Optional[float] = None
    tablesTurned: Optional[float] = None
    onlineOrders: Optional[float] = None
    foodCost: Optional[float] = None
    tipRevenue: Optional[float] = None
    topDishes: Optional[str] = None
    staffCount: Optional[float] = None
    # Bakery
    itemsBaked: Optional[float] = None
    ingredientsCost: Optional[float] = None
    customOrders: Optional[float] = None
    # Pharmacy
    prescriptionsFilled: Optional[float] = None
    expiredItems: Optional[float] = None
    # Meta
    notes: Optional[str] = None
    businessType: Optional[str] = None
    businessCategory: Optional[str] = None


class DailyLogsPayload(BaseModel):
    logs: List[DailyLogEntry]
    filename: Optional[str] = "daily_logs.csv"


class IntegrationSyncRequest(BaseModel):
    platformId: str
    connectionId: str


class IntegrationConnectionPayload(BaseModel):
    platformId: str
    platformName: Optional[str] = None
    credentials: dict[str, Any]
    businessType: Optional[str] = None
    businessCategory: Optional[str] = None
    connectionId: Optional[str] = None


class IntegrationConnectionTestPayload(BaseModel):
    platformId: str
    credentials: dict[str, Any]


class ContactInquiryRequest(BaseModel):
    fullName: str
    workEmail: str
    companyName: str
    businessType: str
    revenueScale: str
    teamSize: Optional[str] = None
    purpose: str
    message: str
    consent: bool


class StrategyRequest(BaseModel):
    dailyLogs: List[dict]
    stockEntries: Optional[List[dict]] = None
    businessType: Optional[str] = None
    businessCategory: Optional[str] = None
    region: Optional[str] = "India"  # default region context


class PremiumAnalysisRequest(BaseModel):
    dailyLogs: List[dict]
    stockEntries: Optional[List[dict]] = None
    businessType: Optional[str] = None
    businessCategory: Optional[str] = None
    region: Optional[str] = "India"


class AdminUserPatch(BaseModel):
    role: Optional[str] = None
    suspended: Optional[bool] = None
    disabledServices: Optional[List[str]] = None
    serviceLimits: Optional[dict[str, int]] = None
    featureFlags: Optional[dict[str, bool]] = None
    notes: Optional[str] = None


class AdminServiceToggle(BaseModel):
    enabled: bool


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
    title="Yukti Decision Intelligence",
    description="Autonomous AI-driven analytics system",
    version="1.0.0",
)

app.include_router(setup_router)


def _env_csv(name: str) -> list[str]:
    raw = os.getenv(name, "")
    return [value.strip() for value in raw.split(",") if value.strip()]


default_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:4173",
    "http://127.0.0.1:8765",
]

allowed_origins = _env_csv("YUKTI_CORS_ALLOW_ORIGINS") or default_origins
allowed_hosts = _env_csv("YUKTI_ALLOWED_HOSTS") or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,

    
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)


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


def _admin_email_set() -> set[str]:
    return {e.lower() for e in _env_csv("YUKTI_ADMIN_EMAILS") if e}


def _firestore_user_doc(uid: str):
    db = _get_firestore_client()
    if db is None:
        return None
    return db.collection("users").document(uid)


def _is_admin_user(uid: Optional[str], email: Optional[str] = None) -> bool:
    if not uid:
        return False

    if email and email.lower() in _admin_email_set():
        return True

    user_ref = _firestore_user_doc(uid)
    if user_ref is None:
        return False

    try:
        snap = user_ref.get()
        if not snap.exists:
            return False
        role = (snap.to_dict() or {}).get("role", "")
        return str(role).lower() == "admin"
    except Exception:
        return False


def _assert_service_allowed(uid: Optional[str], service_key: str) -> None:
    """Server-side enforcement for admin-managed user controls."""
    if not uid:
        return
    if _is_admin_user(uid):
        return

    user_ref = _firestore_user_doc(uid)
    if user_ref is None:
        return

    try:
        snap = user_ref.get()
        if not snap.exists:
            return
        managed = (snap.to_dict() or {}).get("managed", {}) or {}
        if bool(managed.get("suspended")):
            raise HTTPException(
                status_code=403,
                detail="Your account is temporarily suspended by admin.",
            )
        disabled = set(managed.get("disabledServices", []) or [])
        if service_key in disabled:
            raise HTTPException(
                status_code=403,
                detail="This service is currently disabled for your account by admin.",
            )
    except HTTPException:
        raise
    except Exception:
        return


async def require_admin(
    creds: HTTPAuthorizationCredentials = Depends(security),
):
    if not _firebase_available:
        # Local-development fallback: allow admin routes to respond gracefully
        # even when Firebase Admin credentials are not configured.
        dev_bypass = os.getenv("YUKTI_ALLOW_DEV_ADMIN_NO_FIREBASE", "1").strip()
        if dev_bypass.lower() in {"1", "true", "yes", "on"}:
            return {
                "uid": "local-admin",
                "email": DEFAULT_ADMIN_EMAIL,
                "devBypass": True,
            }
        raise HTTPException(
            status_code=503,
            detail="Admin APIs require Firebase Admin credentials on backend.",
        )
    if creds is None:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    try:
        decoded = firebase_auth.verify_id_token(creds.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    uid = decoded.get("uid")
    email = decoded.get("email")
    if decoded.get("admin") is True:
        return {"uid": uid, "email": email}
    if not _is_admin_user(uid, email):
        raise HTTPException(status_code=403, detail="Admin access required")
    return {"uid": uid, "email": email}

# ---------------------------------------------------------------------------
# Session store — persisted to disk so data survives uvicorn --reload
# ---------------------------------------------------------------------------
_default_session_dir = Path(__file__).resolve().parent / "sessions"
_SESSION_DIR = Path(os.getenv("YUKTI_SESSION_DIR", str(_default_session_dir)))
_SESSION_DIR.mkdir(parents=True, exist_ok=True)
_SESSION_PATH = str(_SESSION_DIR / "yukti_session.pkl")


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


def _get_firestore_client():
    """Return Firestore client when Firebase Admin is configured."""
    if not _firebase_available:
        return None
    try:
        from firebase_admin import firestore as _fs

        return _fs.client()
    except Exception:
        return None


def _bootstrap_default_admin_account() -> None:
    """Ensure default admin credentials exist and are mapped to admin role."""
    if not _firebase_available:
        return

    # Allow explicit opt-out in production environments.
    if os.getenv("YUKTI_BOOTSTRAP_DEFAULT_ADMIN", "1").strip() in {"0", "false", "False"}:
        return

    try:
        try:
            user_record = firebase_auth.get_user_by_email(DEFAULT_ADMIN_EMAIL)
            # Keep credentials in sync with requested defaults.
            firebase_auth.update_user(
                user_record.uid,
                password=DEFAULT_ADMIN_PASSWORD,
                email_verified=True,
            )
        except Exception:
            user_record = firebase_auth.create_user(
                email=DEFAULT_ADMIN_EMAIL,
                password=DEFAULT_ADMIN_PASSWORD,
                display_name="Yukti Admin",
                email_verified=True,
            )

        # Grant hard admin custom claim for token-based checks.
        firebase_auth.set_custom_user_claims(user_record.uid, {"admin": True})

        db = _get_firestore_client()
        if db is not None:
            db.collection("users").document(user_record.uid).set(
                {
                    "email": DEFAULT_ADMIN_EMAIL,
                    "ownerName": "Yukti Admin",
                    "businessName": "Yukti Platform",
                    "businessType": "Platform Admin",
                    "role": "admin",
                    "currency": "INR",
                    "managed": {
                        "suspended": False,
                        "disabledServices": [],
                        "featureFlags": {"fullPlatformAccess": True},
                        "updatedAt": datetime.utcnow(),
                        "updatedBy": "system-bootstrap",
                        "notes": "Auto-bootstrapped default admin account",
                    },
                    "updatedAt": datetime.utcnow(),
                },
                merge=True,
            )

        logging.getLogger("yukti.admin").info(
            "✅ Default admin account ready: %s", DEFAULT_ADMIN_EMAIL
        )
    except Exception as e:
        logging.getLogger("yukti.admin").warning(
            "⚠ Could not bootstrap default admin account: %s", e
        )


def _cleanup_legacy_plan_field() -> None:
    """Remove legacy `plan` field from all Firestore user docs."""
    db = _get_firestore_client()
    if db is None:
        return

    try:
        from firebase_admin import firestore as _fs

        removed = 0
        for doc in db.collection("users").stream():
            data = doc.to_dict() or {}
            if "plan" not in data:
                continue
            doc.reference.set({"plan": _fs.DELETE_FIELD}, merge=True)
            removed += 1

        if removed:
            logging.getLogger("yukti.admin").info(
                "✅ Removed legacy plan field from %s user docs", removed
            )
    except Exception as e:
        logging.getLogger("yukti.admin").warning(
            "⚠ Could not cleanup legacy plan field: %s", e
        )


_bootstrap_default_admin_account()
_cleanup_legacy_plan_field()


def _build_history_context(uid: Optional[str], limit: int = 12) -> dict:
    """Build report memory context for personalized prompts and diagnostics."""
    context = {
        "recent_reports": [],
        "recurring_issues": [],
        "successful_actions": [],
    }
    if not uid:
        return context

    db = _get_firestore_client()
    if db is None:
        return context

    try:
        from firebase_admin import firestore as _fs

        reports_ref = (
            db.collection("users")
            .document(uid)
            .collection("reports")
            .order_by("createdAt", direction=_fs.Query.DESCENDING)
            .limit(limit)
        )
        generated_ref = (
            db.collection("users")
            .document(uid)
            .collection("generatedReports")
            .order_by("createdAt", direction=_fs.Query.DESCENDING)
            .limit(limit)
        )

        recent = []
        top_issues = []
        successful_actions = []

        for doc in reports_ref.stream():
            item = doc.to_dict() or {}
            analysis_raw = item.get("analysisData")
            analysis_obj = None
            if isinstance(analysis_raw, str):
                try:
                    analysis_obj = json.loads(analysis_raw)
                except Exception:
                    analysis_obj = None

            trend = (
                (analysis_obj or {}).get("trend_lock", {}).get("direction")
                if isinstance(analysis_obj, dict)
                else None
            )
            insights = (analysis_obj or {}).get("insights", []) if isinstance(analysis_obj, dict) else []
            top_issue = None
            action = None
            for ins in insights:
                if ins.get("severity") in {"critical", "high"} and ins.get("title"):
                    top_issue = ins.get("title")
                    action = ins.get("recommendation")
                    break
            if not top_issue and item.get("narrative"):
                top_issue = item.get("narrative", "")[:120]

            if top_issue:
                top_issues.append(top_issue.strip().lower())
            if action and len(action) > 8:
                successful_actions.append(action)

            recent.append(
                {
                    "section": "analysis",
                    "trend": trend or "unknown",
                    "top_issue": top_issue or "n/a",
                    "action": action or "n/a",
                }
            )

        for doc in generated_ref.stream():
            item = doc.to_dict() or {}
            top_issue = item.get("top_issue") or item.get("summary")
            action = item.get("action")
            if top_issue:
                top_issues.append(str(top_issue).strip().lower())
            if action and len(action) > 8:
                successful_actions.append(str(action))

            recent.append(
                {
                    "section": item.get("section", "advisor"),
                    "trend": item.get("trend", "n/a"),
                    "top_issue": top_issue or "n/a",
                    "action": action or "n/a",
                }
            )

        issue_counts = {}
        for issue in top_issues:
            issue_counts[issue] = issue_counts.get(issue, 0) + 1

        recurring = [k[:120] for k, v in issue_counts.items() if v >= 2]

        dedup_actions = []
        seen = set()
        for action in successful_actions:
            key = action.strip().lower()
            if key in seen:
                continue
            seen.add(key)
            dedup_actions.append(action)

        context["recent_reports"] = recent[:limit]
        context["recurring_issues"] = recurring[:5]
        context["successful_actions"] = dedup_actions[:5]
        return context
    except Exception:
        return context


def _save_generated_report(uid: Optional[str], section: str, payload: dict[str, Any]) -> None:
    """Persist generated section outputs under the authenticated user id."""
    if not uid:
        return
    db = _get_firestore_client()
    if db is None:
        return

    try:
        report = {
            "section": section,
            "date": datetime.utcnow().isoformat() + "Z",
            "createdAt": datetime.utcnow(),
            "summary": payload.get("summary"),
            "top_issue": payload.get("top_issue"),
            "action": payload.get("action"),
            "trend": payload.get("trend"),
            "payload": _sanitize(payload),
        }
        (
            db.collection("users")
            .document(uid)
            .collection("generatedReports")
            .add(report)
        )
    except Exception:
        # Best-effort persistence should never break the API response
        pass


def _coerce_usage_value(value: Any) -> int:
    try:
        return int(value)
    except Exception:
        return 0


@app.get("/api/admin/overview")
async def admin_overview(admin=Depends(require_admin)):
    db = _get_firestore_client()
    if db is None:
        return {
            "status": "unavailable",
            "reason": "Firestore not configured",
            "month": datetime.utcnow().strftime("%Y-%m"),
            "users": {"total": 0, "suspended": 0, "roles": {}},
            "usageTotals": {},
            "admin": {
                "uid": admin.get("uid"),
                "email": admin.get("email"),
            },
        }

    try:
        users_docs = list(db.collection("users").stream())
        month_key = datetime.utcnow().strftime("%Y-%m")

        role_counts = {"admin": 0, "paid-user": 0, "free-tier": 0, "other": 0}
        suspended_count = 0

        for doc in users_docs:
            data = doc.to_dict() or {}
            role = str(data.get("role", "paid-user")).lower()
            if role in role_counts:
                role_counts[role] += 1
            else:
                role_counts["other"] += 1

            managed = data.get("managed", {}) or {}
            if bool(managed.get("suspended")):
                suspended_count += 1

        usage_totals: dict[str, int] = {}
        for usage_user in db.collection("usage").stream():
            month_snap = (
                db.collection("usage")
                .document(usage_user.id)
                .collection("months")
                .document(month_key)
                .get()
            )
            if not month_snap.exists:
                continue
            udata = month_snap.to_dict() or {}
            for key, value in udata.items():
                if key.startswith("_"):
                    continue
                usage_totals[key] = usage_totals.get(key, 0) + _coerce_usage_value(value)

        return {
            "status": "success",
            "month": month_key,
            "users": {
                "total": len(users_docs),
                "suspended": suspended_count,
                "roles": role_counts,
            },
            "usageTotals": usage_totals,
            "admin": {
                "uid": admin.get("uid"),
                "email": admin.get("email"),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load admin overview: {e}")


@app.get("/api/admin/users")
async def admin_list_users(limit: int = 200, admin=Depends(require_admin)):
    db = _get_firestore_client()
    if db is None:
        return {
            "status": "unavailable",
            "reason": "Firestore not configured",
            "count": 0,
            "users": [],
            "requestedBy": admin.get("uid"),
        }

    safe_limit = max(1, min(limit, 500))
    try:
        users = []
        for doc in db.collection("users").limit(safe_limit).stream():
            data = doc.to_dict() or {}
            managed = data.get("managed", {}) or {}
            users.append(
                {
                    "uid": doc.id,
                    "email": data.get("email"),
                    "ownerName": data.get("ownerName"),
                    "businessName": data.get("businessName"),
                    "businessType": data.get("businessType"),
                    "role": data.get("role", "paid-user"),
                    "currency": data.get("currency", "INR"),
                    "suspended": bool(managed.get("suspended", False)),
                    "disabledServices": managed.get("disabledServices", []),
                    "serviceLimits": managed.get("serviceLimits", {}),
                    "featureFlags": managed.get("featureFlags", {}),
                    "notes": managed.get("notes", ""),
                    "managedUpdatedAt": managed.get("updatedAt"),
                }
            )

        return {
            "status": "success",
            "count": len(users),
            "users": users,
            "requestedBy": admin.get("uid"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list users: {e}")


@app.get("/api/admin/usage")
async def admin_usage(month: Optional[str] = None, admin=Depends(require_admin)):
    db = _get_firestore_client()
    if db is None:
        return {
            "status": "unavailable",
            "reason": "Firestore not configured",
            "month": month or datetime.utcnow().strftime("%Y-%m"),
            "rows": [],
            "totals": {},
            "requestedBy": admin.get("uid"),
        }

    month_key = month or datetime.utcnow().strftime("%Y-%m")
    try:
        usage_rows = []
        totals: dict[str, int] = {}
        for user_doc in db.collection("usage").stream():
            uid = user_doc.id
            month_snap = (
                db.collection("usage")
                .document(uid)
                .collection("months")
                .document(month_key)
                .get()
            )
            if not month_snap.exists:
                continue
            data = month_snap.to_dict() or {}
            clean = {}
            for key, value in data.items():
                if key.startswith("_"):
                    continue
                iv = _coerce_usage_value(value)
                clean[key] = iv
                totals[key] = totals.get(key, 0) + iv

            usage_rows.append({"uid": uid, "usage": clean})

        return {
            "status": "success",
            "month": month_key,
            "rows": usage_rows,
            "totals": totals,
            "requestedBy": admin.get("uid"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch usage: {e}")


@app.patch("/api/admin/users/{target_uid}")
async def admin_patch_user(target_uid: str, payload: AdminUserPatch, admin=Depends(require_admin)):
    db = _get_firestore_client()
    if db is None:
        raise HTTPException(
            status_code=400,
            detail="Admin user management requires Firestore configuration on backend.",
        )

    try:
        user_ref = db.collection("users").document(target_uid)
        snap = user_ref.get()
        if not snap.exists:
            raise HTTPException(status_code=404, detail="User not found")

        patch: dict[str, Any] = {"updatedAt": datetime.utcnow()}
        managed_patch: dict[str, Any] = {
            "updatedAt": datetime.utcnow(),
            "updatedBy": admin.get("uid"),
        }

        if payload.role is not None:
            normalized_role = str(payload.role).strip().lower()
            allowed_roles = {"free-tier", "paid-user", "admin"}
            if normalized_role not in allowed_roles:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid role. Allowed roles: free-tier, paid-user, admin.",
                )
            patch["role"] = normalized_role
        if payload.suspended is not None:
            managed_patch["suspended"] = bool(payload.suspended)
        if payload.disabledServices is not None:
            managed_patch["disabledServices"] = sorted(
                list({str(s).strip() for s in payload.disabledServices if str(s).strip()})
            )
        if payload.serviceLimits is not None:
            managed_patch["serviceLimits"] = {
                str(k): max(0, int(v)) for k, v in payload.serviceLimits.items()
            }
        if payload.featureFlags is not None:
            managed_patch["featureFlags"] = {
                str(k): bool(v) for k, v in payload.featureFlags.items()
            }
        if payload.notes is not None:
            managed_patch["notes"] = str(payload.notes)[:500]

        patch["managed"] = managed_patch
        user_ref.set(patch, merge=True)

        # Ensure legacy field cannot survive after any admin patch operation.
        from firebase_admin import firestore as _fs
        user_ref.set({"plan": _fs.DELETE_FIELD}, merge=True)

        return {
            "status": "success",
            "uid": target_uid,
            "updated": patch,
            "requestedBy": admin.get("uid"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user: {e}")


@app.post("/api/admin/users/{target_uid}/services/{service_key}")
async def admin_toggle_service(
    target_uid: str,
    service_key: str,
    payload: AdminServiceToggle,
    admin=Depends(require_admin),
):
    db = _get_firestore_client()
    if db is None:
        raise HTTPException(
            status_code=400,
            detail="Admin service controls require Firestore configuration on backend.",
        )

    try:
        user_ref = db.collection("users").document(target_uid)
        snap = user_ref.get()
        if not snap.exists:
            raise HTTPException(status_code=404, detail="User not found")

        managed = (snap.to_dict() or {}).get("managed", {}) or {}
        disabled = set(managed.get("disabledServices", []) or [])
        if payload.enabled:
            disabled.discard(service_key)
        else:
            disabled.add(service_key)

        user_ref.set(
            {
                "managed": {
                    "disabledServices": sorted(disabled),
                    "updatedAt": datetime.utcnow(),
                    "updatedBy": admin.get("uid"),
                }
            },
            merge=True,
        )

        return {
            "status": "success",
            "uid": target_uid,
            "service": service_key,
            "enabled": payload.enabled,
            "disabledServices": sorted(disabled),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle service: {e}")


@app.get("/api/admin/activity")
async def admin_activity(limit: int = 60, admin=Depends(require_admin)):
    db = _get_firestore_client()
    if db is None:
        return {
            "status": "unavailable",
            "reason": "Firestore not configured",
            "count": 0,
            "activity": [],
        }

    safe_limit = max(1, min(limit, 200))
    try:
        rows = []
        for user_doc in db.collection("users").stream():
            uid = user_doc.id
            gen = (
                db.collection("users")
                .document(uid)
                .collection("generatedReports")
                .limit(10)
                .stream()
            )
            for d in gen:
                data = d.to_dict() or {}
                rows.append(
                    {
                        "uid": uid,
                        "section": data.get("section"),
                        "summary": data.get("summary"),
                        "top_issue": data.get("top_issue"),
                        "date": data.get("date"),
                        "createdAt": data.get("createdAt"),
                    }
                )

        def _row_sort_key(item: dict[str, Any]) -> str:
            created = item.get("createdAt")
            if hasattr(created, "isoformat"):
                return created.isoformat()
            return str(item.get("date") or "")

        rows = sorted(rows, key=_row_sort_key, reverse=True)[:safe_limit]

        return {
            "status": "success",
            "count": len(rows),
            "activity": rows,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch activity: {e}")


@app.get("/health")
async def health():
    return {"status": "ok", "engine": "Yukti Decision Intelligence v1.0"}


@app.post("/api/contact")
async def submit_contact_inquiry(
    payload: ContactInquiryRequest,
    uid: str = Depends(get_current_user),
):
    if not payload.consent:
        raise HTTPException(status_code=400, detail="Consent is required to submit inquiry.")

    if "@" not in payload.workEmail or payload.workEmail.count("@") != 1:
        raise HTTPException(status_code=400, detail="Please enter a valid work email address.")

    safe = {
        "fullName": payload.fullName.strip(),
        "workEmail": payload.workEmail.strip().lower(),
        "companyName": payload.companyName.strip(),
        "businessType": payload.businessType.strip(),
        "revenueScale": payload.revenueScale.strip(),
        "teamSize": (payload.teamSize or "").strip(),
        "purpose": payload.purpose.strip(),
        "message": payload.message.strip(),
        "consent": bool(payload.consent),
        "source": "website-contact-form",
        "uid": uid,
        "createdAt": datetime.utcnow(),
    }

    if not safe["fullName"] or not safe["companyName"] or not safe["purpose"] or not safe["message"]:
        raise HTTPException(status_code=400, detail="Please fill all required fields.")

    db = _get_firestore_client()
    if db is not None:
        db.collection("contactInquiries").add(_sanitize(safe))
    else:
        logging.getLogger("yukti.contact").info("contact inquiry (no firestore): %s", _sanitize(safe))

    return {
        "status": "success",
        "message": "Thanks for reaching out. Our team will get back to you soon.",
    }


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), uid: str = Depends(get_current_user)):
    """Data Ingestion Layer: Parse and normalize uploaded dataset."""
    _assert_service_allowed(uid, "data_upload")
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
    _assert_service_allowed(uid, "data_upload")
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
    Run the complete Yukti analysis pipeline:
    Schema Intelligence → Analytics → Predictions → Decisions → Insights
    """
    _assert_service_allowed(uid, "analysis")
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

        history_context = _build_history_context(uid)

        # Layer 6: AI Reasoning
        insights = generate_insights(
            schema=schema,
            analytics=analytics,
            predictions=predictions,
            decisions=decisions,
            history_context=history_context,
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

    top_issue = None
    top_action = None
    for ins in insights.get("insights", []):
        if ins.get("severity") in {"critical", "high"}:
            top_issue = ins.get("title")
            top_action = ins.get("recommendation")
            break

    _save_generated_report(
        uid,
        "analysis",
        {
            "summary": insights.get("narrative", "")[:200],
            "top_issue": top_issue,
            "action": top_action,
            "trend": insights.get("trend_lock", {}).get("direction", "unknown"),
            "insightCount": len(insights.get("insights", [])),
            "kpiCount": len(analytics.get("kpis", [])),
        },
    )

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
        "insights": insights.get("insights", []),
        "narrative": insights.get("narrative", ""),
        "trend_lock": insights.get("trend_lock", {}),
        "data_sufficiency": insights.get("data_sufficiency", "full"),
        "ai_provider": insights.get("ai_provider", "rule_based"),
    }))


@app.post("/api/upload-logs")
async def upload_daily_logs(payload: DailyLogsPayload, uid: str = Depends(get_current_user)):
    """
    Accept daily log entries from the frontend, convert to a DataFrame,
    and store in session so /api/analyze can process them.
    """
    _assert_service_allowed(uid, "data_upload")
    try:
        if not payload.logs or len(payload.logs) == 0:
            raise HTTPException(status_code=400, detail="No log entries provided.")

        # Convert logs to DataFrame — dynamically include all non-None fields
        # camelCase → snake_case mapping for common analytics column names
        FIELD_MAP = {
            "marketingSpend": "marketing_spend",
            "avgBasketSize": "avg_basket_size",
            "wasteShrinkage": "waste_shrinkage",
            "itemsSold": "items_sold",
            "inventoryCount": "inventory_count",
            "unitsSold": "units_sold",
            "returnsRefunds": "returns_refunds",
            "onlineSales": "online_sales",
            "topProducts": "top_products",
            "outOfStockItems": "out_of_stock_items",
            "avgOrderValue": "avg_order_value",
            "tablesTurned": "tables_turned",
            "onlineOrders": "online_orders",
            "foodCost": "food_cost",
            "tipRevenue": "tip_revenue",
            "topDishes": "top_dishes",
            "staffCount": "staff_count",
            "itemsBaked": "items_baked",
            "ingredientsCost": "ingredients_cost",
            "customOrders": "custom_orders",
            "prescriptionsFilled": "prescriptions_filled",
            "expiredItems": "expired_items",
            "businessType": "business_type",
            "businessCategory": "business_category",
        }

        records = []
        for log in payload.logs:
            row = {"date": log.date}
            log_dict = log.model_dump(exclude_none=True, exclude={"date"})
            for key, value in log_dict.items():
                col_name = FIELD_MAP.get(key, key)
                row[col_name] = value
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
    _assert_service_allowed(uid, "report_download")
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

    ins = session_store.get("analysis", {}).get("insights", {})
    _save_generated_report(
        uid,
        "pdf_report",
        {
            "summary": f"PDF report generated for {session_store.get('filename', 'dataset')}",
            "top_issue": ins.get("narrative"),
            "action": "Review prioritized actions in report sections Diagnose -> Prioritize -> Act.",
            "trend": ins.get("trend_lock", {}).get("direction", "unknown"),
        },
    )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="Yukti_Intelligence_Report.pdf"'
        },
    )


# ---------------------------------------------------------------------------
# Integrations — Webhook Receiver & Manual Sync
# ---------------------------------------------------------------------------

# Platform field-mapping (billing field → Yukti daily-log field)
PLATFORM_FIELD_MAPS = {
    "square": {
        "gross_sales": "revenue",
        "total_transactions": "orders",
        "total_customers": "customers",
        "total_tips": "tip_revenue",
        "total_discounts": "marketing_spend",
        "net_sales": "revenue",
    },
    "shopify": {
        "total_sales": "revenue",
        "total_orders": "orders",
        "total_customers": "customers",
        "total_units_sold": "units_sold",
        "total_refunds": "returns_refunds",
    },
    "clover": {
        "revenue": "revenue",
        "order_count": "orders",
        "customer_count": "customers",
        "tips": "tip_revenue",
        "refunds": "returns_refunds",
    },
    "lightspeed": {
        "total_revenue": "revenue",
        "transaction_count": "orders",
        "customer_count": "customers",
        "units_sold": "units_sold",
        "avg_sale": "avg_basket_size",
    },
    "toast": {
        "net_sales": "revenue",
        "order_count": "orders",
        "guest_count": "customers",
        "tips": "tip_revenue",
        "food_cost": "food_cost",
        "avg_check": "avg_order_value",
    },
    "zoho_books": {
        "total_income": "revenue",
        "total_expense": "expenses",
        "invoice_count": "orders",
    },
    # ── Indian billing platforms ──
    "tally_prime": {
        "total_sales": "revenue",
        "cash_sales": "revenue",
        "total_purchase": "expenses",
        "receipt_count": "orders",
        "customer_count": "customers",
    },
    "busy_accounting": {
        "net_sales": "revenue",
        "total_expenses": "expenses",
        "invoice_count": "orders",
        "customer_count": "customers",
        "stock_value": "inventory_count",
    },
    "vyapar": {
        "total_invoice_amount": "revenue",
        "payment_received": "revenue",
        "total_expense_amount": "expenses",
        "invoice_count": "orders",
        "items_sold": "items_sold",
        "stock_quantity": "inventory_count",
    },
    "petpooja": {
        "total_revenue": "revenue",
        "order_count": "orders",
        "dine_in_count": "tables_turned",
        "online_orders": "online_orders",
        "avg_order_value": "avg_order_value",
        "food_cost": "food_cost",
        "customer_count": "customers",
    },
    "posist": {
        "net_sales": "revenue",
        "total_bills": "orders",
        "covers": "customers",
        "avg_check_size": "avg_order_value",
        "online_sales": "online_orders",
        "tips": "tip_revenue",
    },
    "khatabook": {
        "total_credit": "revenue",
        "total_debit": "expenses",
        "transaction_count": "orders",
        "customer_count": "customers",
    },
    "mybillbook": {
        "total_sales": "revenue",
        "total_purchases": "expenses",
        "invoice_count": "orders",
        "items_sold": "items_sold",
        "stock_in_hand": "inventory_count",
        "customer_count": "customers",
    },
    "gofrugal": {
        "total_sales": "revenue",
        "invoice_count": "orders",
        "customer_count": "customers",
        "total_expenses": "expenses",
        "items_sold": "items_sold",
    },
    "nammabilling": {
        "total_sales": "revenue",
        "bill_count": "orders",
        "customer_count": "customers",
        "total_expenses": "expenses",
    },
    "marg_erp": {
        "net_sales": "revenue",
        "invoice_count": "orders",
        "customer_count": "customers",
        "purchase_value": "expenses",
        "stock_qty": "inventory_count",
    },
    "retailpos_unipro": {
        "gross_sales": "revenue",
        "order_count": "orders",
        "customer_count": "customers",
        "refund_amount": "returns_refunds",
    },
    "ecbill": {
        "total_amount": "revenue",
        "bill_count": "orders",
        "customer_count": "customers",
        "expense_amount": "expenses",
    },
    "zubizi": {
        "sales_total": "revenue",
        "orders_total": "orders",
        "customers_total": "customers",
        "expenses_total": "expenses",
        "units_total": "units_sold",
    },
    "custom_webhook": {},  # pass-through: fields already named correctly
}

# Platform defaults and parser hints used by manual sync.
# If a platform has a vendor-specific API, users can still override with
# apiBaseUrl/endpointPath in saved credentials.
PLATFORM_API_DEFAULTS = {
    "tally_prime": {
        "base_env": "TALLY_PRIME_API_BASE",
        "default_base": "",
        "default_path": "/api/v1/transactions",
    },
    "zoho_books": {
        "base_env": "ZOHO_BOOKS_API_BASE",
        "default_base": "https://www.zohoapis.in/books/v3",
        "default_path": "/invoices",
    },
    "gofrugal": {
        "base_env": "GOFRUGAL_API_BASE",
        "default_base": "",
        "default_path": "/transactions",
    },
    "vyapar": {
        "base_env": "VYAPAR_API_BASE",
        "default_base": "",
        "default_path": "/transactions",
    },
    "mybillbook": {
        "base_env": "MYBILLBOOK_API_BASE",
        "default_base": "",
        "default_path": "/transactions",
    },
    "nammabilling": {
        "base_env": "NAMMABILLING_API_BASE",
        "default_base": "",
        "default_path": "/transactions",
    },
    "marg_erp": {
        "base_env": "MARG_ERP_API_BASE",
        "default_base": "",
        "default_path": "/transactions",
    },
    "retailpos_unipro": {
        "base_env": "RETAILPOS_UNIPRO_API_BASE",
        "default_base": "",
        "default_path": "/transactions",
    },
    "ecbill": {
        "base_env": "ECBILL_API_BASE",
        "default_base": "",
        "default_path": "/transactions",
    },
    "zubizi": {
        "base_env": "ZUBIZI_API_BASE",
        "default_base": "",
        "default_path": "/transactions",
    },
    "petpooja": {
        "base_env": "PETPOOJA_API_BASE",
        "default_base": "",
        "default_path": "/transactions",
    },
    "custom_webhook": {
        "base_env": "",
        "default_base": "",
        "default_path": "",
    },
}

def _integration_numeric(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float, np.integer, np.floating)):
        try:
            num = float(value)
            if np.isnan(num) or np.isinf(num):
                return None
            return num
        except Exception:
            return None
    if isinstance(value, str):
        raw = value.strip().replace(",", "")
        if not raw:
            return None
        try:
            num = float(raw)
            if np.isnan(num) or np.isinf(num):
                return None
            return num
        except Exception:
            return None
    return None


def _integration_to_iso_date(value: Any) -> str:
    if value is None:
        return date.today().isoformat()
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    raw = str(value).strip()
    if not raw:
        return date.today().isoformat()
    # Accept date or datetime formats; fallback to today.
    for parser in (datetime.fromisoformat,):
        try:
            return parser(raw.replace("Z", "+00:00")).date().isoformat()
        except Exception:
            pass
    try:
        return datetime.strptime(raw[:10], "%Y-%m-%d").date().isoformat()
    except Exception:
        return date.today().isoformat()


def _integration_get(records_payload: Any, candidates: list[str]) -> Any:
    if not isinstance(records_payload, dict):
        return None
    lower = {str(k).lower(): v for k, v in records_payload.items()}
    for key in candidates:
        if key.lower() in lower:
            return lower[key.lower()]
    return None


def _integration_fernet():
    if Fernet is None:
        raise HTTPException(
            status_code=500,
            detail="cryptography package is required for secure integration credentials.",
        )

    secret = os.getenv("YUKTI_INTEGRATION_CRED_SECRET", "").strip()
    if not secret:
        raise HTTPException(
            status_code=500,
            detail="YUKTI_INTEGRATION_CRED_SECRET is not configured on backend.",
        )

    digest = hashlib.sha256(secret.encode("utf-8")).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def _encrypt_integration_credentials(creds: dict[str, Any]) -> str:
    try:
        blob = json.dumps(_sanitize(creds), separators=(",", ":")).encode("utf-8")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid credentials payload.")
    token = _integration_fernet().encrypt(blob)
    return token.decode("utf-8")


def _decrypt_integration_credentials(token: str) -> dict[str, Any]:
    if not token:
        return {}
    try:
        raw = _integration_fernet().decrypt(token.encode("utf-8"))
        data = json.loads(raw.decode("utf-8"))
        return data if isinstance(data, dict) else {}
    except InvalidToken:
        raise HTTPException(status_code=500, detail="Stored integration credentials cannot be decrypted.")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Invalid encrypted credentials format.")


def _get_connection_credentials(connection_doc: dict[str, Any]) -> dict[str, Any]:
    # Backward-compatible fallback for old plain-text integration docs.
    creds = connection_doc.get("credentials")
    if isinstance(creds, dict):
        return creds

    encrypted = connection_doc.get("credentialsEncrypted")
    if isinstance(encrypted, str) and encrypted.strip():
        return _decrypt_integration_credentials(encrypted)

    return {}


def _extract_platform_records(payload: Any) -> list[dict]:
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]
    if isinstance(payload, dict):
        for key in (
            "transactions",
            "orders",
            "invoices",
            "data",
            "items",
            "results",
            "records",
        ):
            value = payload.get(key)
            if isinstance(value, list):
                return [row for row in value if isinstance(row, dict)]
        # Some APIs return a single summary object.
        return [payload]
    return []


def _map_platform_record(platform: str, raw_record: dict) -> dict:
    field_map = PLATFORM_FIELD_MAPS.get(platform, {})
    mapped = {}

    if platform == "custom_webhook":
        mapped = dict(raw_record)
    else:
        for src_key, value in raw_record.items():
            target = field_map.get(src_key)
            if target:
                mapped[target] = value

    date_raw = (
        mapped.get("date")
        or raw_record.get("date")
        or raw_record.get("created_at")
        or raw_record.get("createdAt")
        or raw_record.get("invoice_date")
        or raw_record.get("bill_date")
        or raw_record.get("transaction_date")
    )
    mapped["date"] = _integration_to_iso_date(date_raw)

    mapped["revenue"] = _integration_numeric(mapped.get("revenue"))
    mapped["orders"] = _integration_numeric(mapped.get("orders")) or 1.0
    mapped["customers"] = _integration_numeric(mapped.get("customers"))
    mapped["expenses"] = _integration_numeric(mapped.get("expenses"))

    if mapped.get("customers") is None:
        mapped["customers"] = 0.0
    if mapped.get("expenses") is None:
        mapped["expenses"] = 0.0
    if mapped.get("revenue") is None:
        mapped["revenue"] = 0.0

    for candidate, key in (
        ("units_sold", "unitsSold"),
        ("items_sold", "itemsSold"),
        ("online_orders", "onlineOrders"),
        ("inventory_count", "inventoryCount"),
        ("food_cost", "foodCost"),
        ("tip_revenue", "tipRevenue"),
        ("returns_refunds", "returnsRefunds"),
    ):
        value = _integration_numeric(mapped.get(candidate))
        if value is not None:
            mapped[key] = value

    mapped["source"] = platform
    mapped["synced"] = True
    return mapped


def _platform_base_and_path(platform: str, creds: dict) -> tuple[str, str]:
    defaults = PLATFORM_API_DEFAULTS.get(platform, {})
    base_env = defaults.get("base_env")
    base = (
        (creds.get("apiBaseUrl") or "").strip()
        or (creds.get("serverUrl") or "").strip()
        or (os.getenv(base_env, "").strip() if base_env else "")
        or defaults.get("default_base", "")
    )
    path = (creds.get("endpointPath") or "").strip() or defaults.get("default_path", "")
    return base.rstrip("/"), path


def _platform_headers(platform: str, creds: dict) -> dict:
    headers = {"Accept": "application/json"}

    token = (
        creds.get("accessToken")
        or creds.get("apiToken")
        or creds.get("apiKey")
        or creds.get("token")
    )
    if token:
        headers["Authorization"] = f"Bearer {token}"

    if creds.get("clientId"):
        headers["X-Client-Id"] = str(creds.get("clientId"))
    if creds.get("clientSecret"):
        headers["X-Client-Secret"] = str(creds.get("clientSecret"))
    if creds.get("organizationId"):
        headers["X-com-zoho-books-organizationid"] = str(creds.get("organizationId"))

    # Allow explicit header overrides from connection config.
    extra = creds.get("headers")
    if isinstance(extra, dict):
        for key, value in extra.items():
            if value is not None:
                headers[str(key)] = str(value)

    return headers


def _platform_query_params(creds: dict) -> dict:
    today = date.today().isoformat()
    from_date = str(creds.get("fromDate") or today)
    to_date = str(creds.get("toDate") or today)
    params = {
        "from_date": from_date,
        "to_date": to_date,
        "fromDate": from_date,
        "toDate": to_date,
        "date": today,
    }
    for key in (
        "locationId",
        "storeDomain",
        "merchantId",
        "accountId",
        "restaurantId",
        "businessId",
        "companyName",
        "companyCode",
        "outletId",
    ):
        value = creds.get(key)
        if value:
            params[key] = value
    return params


def _get_user_integration_connection(uid: str, connection_id: str) -> dict:
    db = _get_firestore_client()
    if db is None:
        raise HTTPException(status_code=503, detail="Firestore is not configured.")

    ref = (
        db.collection("users")
        .document(uid)
        .collection("integrations")
        .document(connection_id)
    )
    snap = ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Integration connection not found.")

    data = snap.to_dict() or {}
    creds = _get_connection_credentials(data)
    data["credentials"] = creds
    return data


def _store_sync_results(
    uid: str,
    platform: str,
    connection_id: str,
    mapped_records: list[dict],
    raw_records: list[dict],
) -> int:
    db = _get_firestore_client()
    if db is None:
        raise HTTPException(status_code=503, detail="Firestore is not configured.")

    tx_collection = (
        db.collection("users")
        .document(uid)
        .collection("transactions")
    )
    logs_collection = (
        db.collection("users")
        .document(uid)
        .collection("dailyLogs")
    )

    imported = 0
    aggregate_by_date: dict[str, dict] = {}

    for idx, mapped in enumerate(mapped_records):
        raw = raw_records[idx] if idx < len(raw_records) and isinstance(raw_records[idx], dict) else {}
        log_date = _integration_to_iso_date(mapped.get("date"))

        external_id = (
            raw.get("id")
            or raw.get("invoice_id")
            or raw.get("order_id")
            or raw.get("voucher_no")
            or f"auto-{log_date}-{idx}"
        )
        doc_id = f"{platform}_{connection_id}_{str(external_id)}_{idx}".replace("/", "_")

        revenue = _integration_numeric(mapped.get("revenue")) or 0.0
        orders = _integration_numeric(mapped.get("orders")) or 1.0
        customers = _integration_numeric(mapped.get("customers")) or 0.0
        expenses = _integration_numeric(mapped.get("expenses")) or 0.0

        tx_collection.document(doc_id).set(
            {
                "platformId": platform,
                "connectionId": connection_id,
                "date": log_date,
                "externalId": str(external_id),
                "revenue": revenue,
                "orders": orders,
                "customers": customers,
                "expenses": expenses,
                "mapped": _sanitize(mapped),
                "raw": _sanitize(raw),
                "source": "integration_sync",
                "synced": True,
                "updatedAt": datetime.utcnow(),
            },
            merge=True,
        )

        bucket = aggregate_by_date.setdefault(
            log_date,
            {
                "date": log_date,
                "revenue": 0.0,
                "orders": 0.0,
                "customers": 0.0,
                "expenses": 0.0,
                "source": platform,
                "synced": True,
                "platformId": platform,
                "connectionId": connection_id,
                "updatedAt": datetime.utcnow(),
            },
        )
        bucket["revenue"] += revenue
        bucket["orders"] += orders
        bucket["customers"] += customers
        bucket["expenses"] += expenses
        imported += 1

    for log_date, payload in aggregate_by_date.items():
        log_doc = logs_collection.document(f"{log_date}_{platform}_{connection_id}")
        log_doc.set(_sanitize(payload), merge=True)

    return imported


def _fetch_platform_transactions(platform: str, creds: dict) -> tuple[list[dict], dict]:
    if platform == "custom_webhook":
        return [], {
            "status": "skipped",
            "message": "Custom webhook integrations receive pushed data; manual pull is not required.",
        }

    base, path = _platform_base_and_path(platform, creds)
    if not base or not path:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{platform} connection missing API endpoint. "
                "Save apiBaseUrl/serverUrl and endpointPath in integration credentials, "
                "or configure platform API base env variables on backend."
            ),
        )

    url = f"{base}{path if path.startswith('/') else '/' + path}"
    headers = _platform_headers(platform, creds)
    params = _platform_query_params(creds)
    method = str(creds.get("httpMethod") or "GET").upper()

    body = creds.get("requestBody") if isinstance(creds.get("requestBody"), dict) else None
    timeout = int(creds.get("timeoutMs") or 20_000) / 1000

    try:
        if method == "POST":
            response = requests.post(url, json=body or {}, params=params, headers=headers, timeout=timeout)
        else:
            response = requests.get(url, params=params, headers=headers, timeout=timeout)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Failed to reach {platform} API: {exc}")

    if response.status_code >= 400:
        detail = response.text[:600] if response.text else "no response body"
        raise HTTPException(
            status_code=502,
            detail=f"{platform} API error {response.status_code}: {detail}",
        )

    try:
        payload = response.json()
    except Exception:
        raise HTTPException(status_code=502, detail=f"{platform} API returned non-JSON response.")

    records = _extract_platform_records(payload)
    return records, {
        "status": "ok",
        "url": url,
        "records": len(records),
    }


@app.post("/api/integrations/test")
async def test_integration_connection(
    payload: IntegrationConnectionTestPayload,
    uid: str = Depends(get_current_user),
):
    if not uid:
        raise HTTPException(status_code=401, detail="Authentication required for integration test.")

    platform = payload.platformId
    if platform not in PLATFORM_FIELD_MAPS:
        raise HTTPException(status_code=400, detail=f"Unknown platform: {platform}")

    if platform == "custom_webhook":
        return JSONResponse(content=_sanitize({
            "status": "success",
            "platform": platform,
            "message": "Custom webhook connection is valid. Use webhook URL + secret to push data.",
            "importable": False,
        }))

    raw_records, meta = _fetch_platform_transactions(platform, payload.credentials or {})
    mapped_preview = [_map_platform_record(platform, row) for row in raw_records[:3]]

    return JSONResponse(content=_sanitize({
        "status": "success",
        "platform": platform,
        "message": f"Connection test passed for {platform}.",
        "recordsFound": len(raw_records),
        "preview": mapped_preview,
        "meta": meta,
        "importable": True,
    }))


@app.post("/api/integrations/connection")
async def save_integration_connection(
    payload: IntegrationConnectionPayload,
    uid: str = Depends(get_current_user),
):
    if not uid:
        raise HTTPException(status_code=401, detail="Authentication required for integration setup.")

    platform = payload.platformId
    if platform not in PLATFORM_FIELD_MAPS:
        raise HTTPException(status_code=400, detail=f"Unknown platform: {platform}")

    if not isinstance(payload.credentials, dict) or not payload.credentials:
        raise HTTPException(status_code=400, detail="Credentials are required.")

    db = _get_firestore_client()
    if db is None:
        raise HTTPException(status_code=503, detail="Firestore is not configured.")

    ref = (
        db.collection("users")
        .document(uid)
        .collection("integrations")
    )

    doc_ref = ref.document(payload.connectionId) if payload.connectionId else ref.document()
    now = datetime.utcnow()
    encrypted = _encrypt_integration_credentials(payload.credentials)

    doc_ref.set(
        {
            "platformId": platform,
            "platformName": payload.platformName or platform,
            "credentialsEncrypted": encrypted,
            "credentialsVersion": 1,
            "credentialFingerprint": hashlib.sha256(encrypted.encode("utf-8")).hexdigest()[:16],
            "status": "connected",
            "lastSyncAt": None,
            "syncCount": 0,
            "businessType": payload.businessType,
            "businessCategory": payload.businessCategory,
            "updatedAt": now,
            "createdAt": now,
            # Clear any legacy plain credentials if they were present.
            "credentials": None,
        },
        merge=True,
    )

    return JSONResponse(content=_sanitize({
        "status": "success",
        "platform": platform,
        "connectionId": doc_ref.id,
        "message": f"{payload.platformName or platform} connection saved securely.",
    }))


@app.post("/api/integrations/webhook/{platform}")
async def receive_webhook(
    platform: str,
    request: Request,
    uid: str = Depends(get_current_user),
):
    """
    Receive billing data from an external platform webhook.
    Maps the incoming fields to Yukti daily-log fields using the platform's field map.
    Returns the mapped entry so the frontend can save it to Firestore.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")

    if not uid:
        raise HTTPException(status_code=401, detail="Authentication required for integrations webhook.")

    field_map = PLATFORM_FIELD_MAPS.get(platform, {})

    if platform not in PLATFORM_FIELD_MAPS:
        raise HTTPException(status_code=400, detail=f"Unknown platform: {platform}")

    # Optional webhook secret check for custom webhook connections.
    if platform == "custom_webhook":
        supplied_secret = request.headers.get("X-Webhook-Secret", "").strip()
        if not supplied_secret:
            raise HTTPException(status_code=400, detail="Missing X-Webhook-Secret header.")
        db = _get_firestore_client()
        if db is None:
            raise HTTPException(status_code=503, detail="Firestore is not configured.")
        matches = (
            db.collection("users")
            .document(uid)
            .collection("integrations")
            .where("platformId", "==", "custom_webhook")
            .stream()
        )
        allowed = False
        for snap in matches:
            creds = _get_connection_credentials(snap.to_dict() or {})
            if str(creds.get("webhookSecret") or "").strip() == supplied_secret:
                allowed = True
                break
        if not allowed:
            raise HTTPException(status_code=403, detail="Invalid webhook secret.")

    # If custom_webhook, pass through; otherwise map fields
    if platform == "custom_webhook":
        mapped = body
    else:
        mapped = {}
        for src_key, value in body.items():
            target = field_map.get(src_key)
            if target:
                mapped[target] = value
            elif src_key in ("date", "notes"):
                mapped[src_key] = value

    # Ensure a date is present
    if "date" not in mapped:
        from datetime import date
        mapped["date"] = date.today().isoformat()

    # Add source metadata
    mapped["source"] = platform
    mapped["synced"] = True

    # Persist webhook payload for this authenticated user.
    imported = _store_sync_results(uid, platform, "webhook", [mapped], [body])

    return JSONResponse(content=_sanitize({
        "status": "success",
        "platform": platform,
        "entry": mapped,
        "imported": imported,
    }))


@app.post("/api/integrations/sync")
async def manual_sync(
    payload: IntegrationSyncRequest,
    uid: str = Depends(get_current_user),
):
    """
    Manual sync trigger.
    Pulls transactions/orders from the configured platform API using the
    authenticated user's saved integration credentials, then persists data
    into users/{uid}/transactions and users/{uid}/dailyLogs.
    """
    if not uid:
        raise HTTPException(status_code=401, detail="Authentication required for integration sync.")

    platform = payload.platformId
    if platform not in PLATFORM_FIELD_MAPS:
        raise HTTPException(status_code=400, detail=f"Unknown platform: {platform}")

    connection = _get_user_integration_connection(uid, payload.connectionId)
    if connection.get("platformId") != platform:
        raise HTTPException(
            status_code=400,
            detail="Connection does not match platform. Please reconnect this integration.",
        )

    creds = connection.get("credentials") or {}
    raw_records, meta = _fetch_platform_transactions(platform, creds)

    mapped_records = [_map_platform_record(platform, record) for record in raw_records]
    imported = _store_sync_results(uid, platform, payload.connectionId, mapped_records, raw_records)

    db = _get_firestore_client()
    if db is not None:
        db.collection("users").document(uid).collection("integrations").document(payload.connectionId).set(
            {
                "lastSyncAt": datetime.utcnow(),
                "lastSyncMeta": _sanitize(meta),
                "status": "connected",
            },
            merge=True,
        )

    return JSONResponse(content=_sanitize({
        "status": "success",
        "platform": platform,
        "connectionId": payload.connectionId,
        "message": f"Imported {imported} records from {platform} for this user account.",
        "imported": imported,
        "meta": meta,
    }))


# ---------------------------------------------------------------------------
# Strategy Advisor — AI-powered business recommendations
# ---------------------------------------------------------------------------
# Uses shared AI client: Gemini first, Groq (kimi-k2-instruct) fallback
from engine.ai_client import generate_ai_content, is_any_ai_available


def _build_rule_based_strategy(stats, biz_type, biz_cat, region, log_summary, stock_summary):
    """
    Generate a data-driven rule-based strategy by actually analysing
    the user's daily logs and stock entries.
    """
    import logging
    from datetime import datetime
    log = logging.getLogger("yukti.strategy")

    log.info("  📊 Building rule-based strategy from %d logs, %d stock entries",
             len(log_summary), len(stock_summary))

    current_month = datetime.now().strftime("%B")
    current_month_num = datetime.now().month
    avg_rev = stats.get("avg_daily_revenue", 0)
    max_rev = stats.get("max_revenue_day", 0)
    min_rev = stats.get("min_revenue_day", 0)
    avg_cust = stats.get("avg_daily_customers", 0)
    avg_orders = stats.get("avg_daily_orders", 0)
    total_entries = stats.get("total_entries", 0)

    # ── Deep analysis of log data ──
    revenues = []
    expenses_list = []
    customers_list = []
    orders_list = []
    waste_list = []
    dates_revenues = []  # (date, revenue) pairs
    all_keys = set()

    for entry in log_summary:
        all_keys.update(entry.keys())
        rev = entry.get("revenue")
        if rev is not None:
            try:
                revenues.append(float(rev))
                dates_revenues.append((entry.get("date", ""), float(rev)))
            except (ValueError, TypeError):
                pass
        exp = entry.get("expenses")
        if exp is not None:
            try: expenses_list.append(float(exp))
            except (ValueError, TypeError): pass
        cust = entry.get("customers")
        if cust is not None:
            try: customers_list.append(float(cust))
            except (ValueError, TypeError): pass
        ords = entry.get("orders")
        if ords is not None:
            try: orders_list.append(float(ords))
            except (ValueError, TypeError): pass
        waste = entry.get("wasteShrinkage") or entry.get("waste_shrinkage")
        if waste is not None:
            try: waste_list.append(float(waste))
            except (ValueError, TypeError): pass

    # Revenue trend (first half vs second half)
    revenue_trend = "stable"
    trend_pct = 0.0
    if len(revenues) >= 4:
        mid = len(revenues) // 2
        first_half_avg = sum(revenues[:mid]) / mid
        second_half_avg = sum(revenues[mid:]) / (len(revenues) - mid)
        if first_half_avg > 0:
            trend_pct = round(((second_half_avg - first_half_avg) / first_half_avg) * 100, 1)
            if trend_pct > 5:
                revenue_trend = "growing"
            elif trend_pct < -5:
                revenue_trend = "declining"

    # Revenue volatility
    rev_volatility = "low"
    if len(revenues) >= 3 and avg_rev > 0:
        import statistics
        rev_std = statistics.stdev(revenues)
        cv = (rev_std / avg_rev) * 100
        if cv > 30:
            rev_volatility = "high"
        elif cv > 15:
            rev_volatility = "moderate"

    # Best and worst performing days
    best_day = ""
    worst_day = ""
    if dates_revenues:
        sorted_dr = sorted(dates_revenues, key=lambda x: x[1], reverse=True)
        best_day = sorted_dr[0][0] if sorted_dr else ""
        worst_day = sorted_dr[-1][0] if sorted_dr else ""

    # Expense ratio
    expense_ratio = 0
    if expenses_list and revenues:
        total_exp = sum(expenses_list)
        total_rev = sum(revenues)
        if total_rev > 0:
            expense_ratio = round((total_exp / total_rev) * 100, 1)

    # Average basket / order value
    avg_basket = 0
    if revenues and orders_list and sum(orders_list) > 0:
        avg_basket = round(sum(revenues) / sum(orders_list), 0)

    # Waste ratio
    waste_ratio = 0
    if waste_list and revenues:
        waste_ratio = round((sum(waste_list) / sum(revenues)) * 100, 1)

    # Stock analysis
    stock_items = set()
    stock_pending = []
    for s in stock_summary:
        name = s.get("productName") or s.get("product_name") or s.get("itemName", "")
        if name:
            stock_items.add(name)
        qty_in = float(s.get("quantityIn", 0) or s.get("quantity_in", 0) or 0)
        qty_out = float(s.get("quantityOut", 0) or s.get("quantity_out", 0) or 0)
        if qty_in > 0 and qty_out < qty_in * 0.5:
            stock_pending.append(name or "Unnamed item")

    # Upcoming Tamil Nadu festivals
    tn_festivals = {
        1: "Pongal (Jan 14-17)",
        4: "Tamil New Year / Chithirai Thiruvizha (Apr 14)",
        8: "Krishna Jayanthi / Gokulashtami",
        9: "Vinayagar Chaturthi / Navaratri begins",
        10: "Vijayadashami / Deepavali preparation",
        11: "Deepavali / Karthigai",
        12: "Christmas / New Year shopping season",
        3: "Holi / Ugadi season",
        5: "Summer season — beverages & cool products peak",
        6: "Summer sales / back-to-school",
    }
    upcoming_festival = tn_festivals.get(current_month_num, "Regular sales period")
    next_month_festival = tn_festivals.get((current_month_num % 12) + 1, "Regular sales period")

    log.info("  📈 Analysis: trend=%s (%+.1f%%), volatility=%s, expense_ratio=%.1f%%, avg_basket=₹%.0f",
             revenue_trend, trend_pct, rev_volatility, expense_ratio, avg_basket)

    # ══════════════════════════════════════════════════════════════
    # ── Build curated, data-specific tips ──
    # ══════════════════════════════════════════════════════════════

    sales_tips = []

    # Tip based on revenue trend
    if revenue_trend == "declining":
        sales_tips.append({
            "title": f"Revenue Declining {trend_pct:+.1f}% — Act Now",
            "description": f"Your recent revenue trend shows a {abs(trend_pct):.1f}% decline (₹{avg_rev:,.0f}/day avg). "
                           f"Best day was {best_day} at ₹{max_rev:,.0f}, worst was {worst_day} at ₹{min_rev:,.0f}. "
                           f"Run an urgent flash sale this week and push WhatsApp offers to your top customers to reverse this trend.",
            "priority": "high",
        })
    elif revenue_trend == "growing":
        sales_tips.append({
            "title": f"Revenue Growing {trend_pct:+.1f}% — Accelerate It",
            "description": f"Your sales are trending up {trend_pct:.1f}% with ₹{avg_rev:,.0f}/day average. "
                           f"Peak day was {best_day} (₹{max_rev:,.0f}). Double down on what's working — "
                           f"increase stock of top sellers and extend your most successful promotions.",
            "priority": "high",
        })
    else:
        sales_tips.append({
            "title": f"Revenue Flat at ₹{avg_rev:,.0f}/day — Break the Plateau",
            "description": f"Your revenue has been stable around ₹{avg_rev:,.0f}/day across {total_entries} entries. "
                           f"Gap between best (₹{max_rev:,.0f}) and worst (₹{min_rev:,.0f}) day shows untapped potential. "
                           f"Introduce combo deals or time-limited offers to push past this plateau.",
            "priority": "high",
        })

    # Tip based on expense ratio
    if expense_ratio > 60:
        sales_tips.append({
            "title": f"Expense Ratio {expense_ratio:.0f}% — Margins at Risk",
            "description": f"Your expenses are {expense_ratio:.0f}% of revenue, eating into profits. "
                           f"Review your top 3 expense categories and negotiate supplier rates. "
                           f"Even a 5% reduction in costs at your revenue level saves ₹{(sum(revenues)*0.05/len(revenues)):,.0f}/day.",
            "priority": "high",
        })
    elif expense_ratio > 40:
        sales_tips.append({
            "title": f"Expense Ratio {expense_ratio:.0f}% — Room to Optimise",
            "description": f"Your cost-to-revenue ratio is {expense_ratio:.0f}%. This is manageable but can be improved. "
                           f"Compare prices from 2-3 wholesale suppliers in your area and switch to weekly procurement for perishables.",
            "priority": "medium",
        })

    # Tip based on order value
    if avg_basket > 0:
        sales_tips.append({
            "title": f"Average Order ₹{avg_basket:,.0f} — Upsell Opportunity",
            "description": f"Each customer spends ~₹{avg_basket:,.0f} per visit with {avg_orders:.0f} orders/day. "
                           f"Train staff to suggest add-ons at billing. If you increase this by just ₹{max(20, avg_basket*0.1):,.0f}, "
                           f"that's ₹{max(20, avg_basket*0.1)*avg_orders:,.0f} extra daily revenue.",
            "priority": "medium",
        })

    # Tip based on waste
    if waste_ratio > 3:
        sales_tips.append({
            "title": f"Shrinkage/Waste at {waste_ratio:.1f}% — Fix Leakage",
            "description": f"You're losing {waste_ratio:.1f}% of revenue to waste/shrinkage (₹{sum(waste_list)/max(len(waste_list),1):,.0f}/day avg). "
                           f"Implement FIFO stock rotation, reduce perishable order quantities, and run evening discounts on items nearing expiry.",
            "priority": "high",
        })

    # Festival-based tip
    sales_tips.append({
        "title": f"Prepare for {upcoming_festival}",
        "description": f"This month's key event in Tamil Nadu: {upcoming_festival}. "
                       f"Stock up on festival-related items, create themed displays, and send WhatsApp offers 1 week before. "
                       f"Next month focus: {next_month_festival}.",
        "priority": "medium",
    })

    if rev_volatility == "high":
        sales_tips.append({
            "title": "High Revenue Swings — Stabilise Sales",
            "description": f"Your daily revenue swings between ₹{min_rev:,.0f} and ₹{max_rev:,.0f} — that's a {((max_rev-min_rev)/max(avg_rev,1))*100:.0f}% spread. "
                           f"Identify what makes your best days different (weather, day-of-week, promotions) and replicate those conditions.",
            "priority": "medium",
        })

    # ── Customer strategies ──
    customer_strategies = []

    if avg_cust > 0:
        customer_strategies.append({
            "title": f"You See ~{avg_cust:.0f} Customers/Day — Build Loyalty",
            "description": f"With {avg_cust:.0f} daily customers, a loyalty programme (punch card or WhatsApp-based) that captures even 40% of them "
                           f"gives you a {avg_cust*0.4:.0f}-person repeat customer base. Offer every 10th visit free or ₹{max(50, avg_basket*0.05):,.0f} off.",
            "priority": "high",
        })
    else:
        customer_strategies.append({
            "title": "Start Tracking Customer Count",
            "description": "Your logs don't include customer counts yet. Start recording footfall daily — it's the #1 metric for planning promotions and staffing.",
            "priority": "high",
        })

    customer_strategies.extend([
        {
            "title": "WhatsApp Business — Your Best Channel",
            "description": f"Create a broadcast list of your regular customers. Send 2-3 offers/week with product photos. "
                           f"In Tamil Nadu, WhatsApp has 90%+ open rates. Target ₹{avg_rev*0.15:,.0f} extra daily revenue from WhatsApp-driven visits.",
            "priority": "high",
        },
        {
            "title": "Google Business Profile + Local SEO",
            "description": f"Customers searching '{biz_type} near me' should find you first. Add photos weekly, respond to reviews, "
                           f"and post offers on Google Business. This drives 10-20 new walk-ins/month for free.",
            "priority": "medium",
        },
        {
            "title": "Neighbourhood Pamphlets in Tamil",
            "description": f"Print 500 pamphlets highlighting your top products with prices, distribute in a 2 km radius — "
                           f"apartments, temples, bus stops. Cost: ~₹1,500. Expected return: 15-30 new customers.",
            "priority": "medium",
        },
        {
            "title": "Referral Programme — ₹50 for Each New Customer",
            "description": f"Offer existing customers ₹50 off when they bring a friend. Word-of-mouth is #1 in Tamil Nadu local markets. "
                           f"Even 5 referrals/week = 20 new customers/month at ₹{avg_basket*20:,.0f} potential revenue.",
            "priority": "low",
        },
    ])

    # ── Stock analysis ──
    pending_reasons = []
    if stock_pending:
        pending_reasons.append(
            f"Slow-moving items detected: {', '.join(stock_pending[:5])} — less than 50% of stock-in has been sold."
        )
    if expense_ratio > 50:
        pending_reasons.append(
            f"High expense ratio ({expense_ratio:.0f}%) suggests over-ordering. Capital is tied up in unsold inventory."
        )
    if revenue_trend == "declining":
        pending_reasons.append(
            f"Revenue decline of {abs(trend_pct):.1f}% means existing stock is moving slower than planned."
        )
    pending_reasons.extend([
        "Supplier delivery inconsistency — local wholesalers may delay during peak festival seasons.",
        f"Insufficient demand forecasting. With {total_entries} data points, you can now predict weekly demand more accurately.",
    ])

    stock_recs = [
        f"Reorder fast movers immediately. Your {total_entries} log entries show which items drive revenue — stock those first.",
        "Switch to weekly procurement for perishables instead of monthly bulk. Reduces waste and frees up cash.",
    ]
    if waste_ratio > 2:
        stock_recs.append(f"Waste is {waste_ratio:.1f}% of revenue. Implement FIFO, reduce order sizes for perishable items by 20%.")
    stock_recs.append(
        f"Set reorder points: when any item drops below 3-day supply (based on your avg {avg_orders:.0f} orders/day), trigger a purchase order."
    )
    if stock_items:
        stock_recs.append(f"Currently tracking {len(stock_items)} stock items. Review bottom 20% sellers and consider discontinuing.")

    # ── Purchase suggestions ──
    purchase_suggestions = [
        {
            "item": "Restock Your Top Revenue Drivers",
            "reason": f"Your best day generated ₹{max_rev:,.0f}. Ensure you never run out of items that made that possible. "
                      f"Cross-reference top-revenue days with what sold most.",
            "priority": "high",
        },
        {
            "item": f"Festival Stock for {next_month_festival}",
            "reason": f"Next month's key event: {next_month_festival}. Order festival-specific items 2-3 weeks in advance "
                      f"from wholesale markets. Early ordering gets better prices and availability.",
            "priority": "high",
        },
    ]
    if revenue_trend == "declining":
        purchase_suggestions.append({
            "item": "Value Packs & Combo SKUs",
            "reason": f"Revenue is down {abs(trend_pct):.1f}%. Introduce budget-friendly combo packs (₹99, ₹199 bundles) "
                      f"to attract price-conscious customers and boost basket size.",
            "priority": "high",
        })
    if avg_basket > 0:
        purchase_suggestions.append({
            "item": f"Impulse-Buy Items (₹10-₹{max(50, avg_basket*0.15):,.0f} range)",
            "reason": f"Place small, high-margin items near the counter. At {avg_orders:.0f} orders/day, "
                      f"even ₹20 extra per transaction adds ₹{avg_orders*20:,.0f}/day to revenue.",
            "priority": "medium",
        })
    purchase_suggestions.append({
        "item": "Cut Slow Movers by 25%",
        "reason": f"Reduce order quantities for items with low turnover. Redirect that budget to top sellers. "
                  f"This alone can improve margins by 5-8%.",
        "priority": "medium",
    })

    # ── Monthly roadmap with actual data references ──
    roadmap = [
        {
            "week": "Week 1 — Data Audit & Quick Wins",
            "actions": [
                f"Review all {total_entries} log entries. Identify top 5 revenue days and what drove them.",
                f"Current avg: ₹{avg_rev:,.0f}/day. Set a Week 1 target of ₹{avg_rev*1.1:,.0f}/day (+10%).",
                f"Create WhatsApp broadcast list. Send first offer featuring your best sellers.",
                f"Audit stock levels. Reorder items that are below 5-day supply based on your {avg_orders:.0f} orders/day rate.",
            ],
        },
        {
            "week": "Week 2 — Promotions & Cost Control",
            "actions": [
                f"Launch a combo deal (₹{max(99, avg_basket*0.8):,.0f} bundle). Promote via WhatsApp + in-store banner.",
                f"{'Cut wastage — currently ' + str(waste_ratio) + '% of revenue. Implement evening discounts on perishables.' if waste_ratio > 1 else 'Track waste daily. Set a target below 2% of revenue.'}",
                f"Negotiate with 2 suppliers for better rates. Target reducing expense ratio from {expense_ratio:.0f}% to {max(30, expense_ratio-5):.0f}%.",
                f"Prepare {next_month_festival} stock orders. Get quotes from wholesalers early.",
            ],
        },
        {
            "week": "Week 3 — Customer Growth",
            "actions": [
                "Distribute 500 pamphlets in Tamil in nearby residential areas and apartments.",
                f"Launch referral programme: ₹50 off for each new customer brought in.",
                "Update Google Business profile with fresh photos and this week's offers.",
                f"Analyse which days hit below ₹{min_rev:,.0f}. Investigate and plan counter-measures (flash deals, extended hours).",
            ],
        },
        {
            "week": "Week 4 — Review & Next Month Planning",
            "actions": [
                f"Compare Week 4 revenue vs. Week 1 average (₹{avg_rev:,.0f}). Measure improvement.",
                "Count new customers added through referrals and pamphlets. Calculate cost-per-acquisition.",
                f"Finalise next month's stock order. Budget based on trending {'upward' if revenue_trend == 'growing' else 'patterns'} data.",
                f"Set next month's goals: Revenue target ₹{avg_rev*1.15:,.0f}/day, Customer target {avg_cust*1.1:.0f}/day.",
            ],
        },
    ]

    return {
        "status": "success",
        "generated_by": "rule_based",
        "salesTips": sales_tips[:6],
        "customerStrategies": customer_strategies[:5],
        "stockAnalysis": {
            "pendingReasons": pending_reasons[:5],
            "recommendations": stock_recs[:5],
        },
        "purchaseSuggestions": purchase_suggestions[:5],
        "roadmap": roadmap,
    }


@app.post("/api/strategy")
async def generate_strategy(
    payload: StrategyRequest,
    uid: str = Depends(get_current_user),
):
    """
    AI Strategy Advisor endpoint.
    Uses Gemini to analyze daily logs + stock data and produce:
      1. Sales improvement tips
      2. Customer attraction strategies
      3. Stock pending analysis & reasons
      4. Recommended items to purchase next month
      5. Monthly roadmap
    All contextualised for India / Tamil Nadu local businesses.
    """
    _assert_service_allowed(uid, "ai_strategy")
    import time as _time
    import logging
    log = logging.getLogger("yukti.strategy")

    t_start = _time.time()

    logs = payload.dailyLogs or []
    stocks = payload.stockEntries or []
    biz_type = payload.businessType or "General"
    biz_cat = payload.businessCategory or "general"
    region = payload.region or "India"

    log.info("━" * 60)
    log.info("🚀 [STRATEGY] Request received")
    log.info("   ├─ User: %s", (uid[:12] + "…") if uid else "anonymous (local dev)")
    log.info("   ├─ Business: %s (%s) — %s", biz_type, biz_cat, region)
    log.info("   ├─ Daily logs: %d entries", len(logs))
    log.info("   └─ Stock entries: %d entries", len(stocks))

    if not logs and not stocks:
        log.warning("   ⚠  No data provided — returning 400")
        raise HTTPException(
            status_code=400,
            detail="No data provided. Log at least a few daily entries first.",
        )

    # ── Build a data summary for the AI ──
    log.info("📋 [STRATEGY] Building data summary…")
    log_summary = []
    for l in logs[-30:]:  # last 30 entries
        log_summary.append({
            k: v for k, v in l.items()
            if k not in ("id", "createdAt", "businessType", "businessCategory")
            and v is not None and v != ""
        })

    stock_summary = []
    for s in stocks[-20:]:
        stock_summary.append({
            k: v for k, v in s.items()
            if k not in ("id", "createdAt") and v is not None and v != ""
        })
    log.info("   ├─ Log summary: %d entries (from last 30)", len(log_summary))
    log.info("   └─ Stock summary: %d entries (from last 20)", len(stock_summary))

    # ── Compute basic stats if possible ──
    log.info("🧮 [STRATEGY] Computing stats…")
    try:
        revenues = [float(l.get("revenue", 0)) for l in logs if l.get("revenue")]
        customers = [float(l.get("customers", 0)) for l in logs if l.get("customers")]
        orders = [float(l.get("orders", 0)) for l in logs if l.get("orders")]

        stats = {
            "avg_daily_revenue": round(sum(revenues) / max(len(revenues), 1), 2),
            "max_revenue_day": round(max(revenues) if revenues else 0, 2),
            "min_revenue_day": round(min(revenues) if revenues else 0, 2),
            "avg_daily_customers": round(sum(customers) / max(len(customers), 1), 1),
            "avg_daily_orders": round(sum(orders) / max(len(orders), 1), 1),
            "total_entries": len(logs),
        }
        log.info("   ├─ Avg revenue: ₹%.0f/day", stats["avg_daily_revenue"])
        log.info("   ├─ Revenue range: ₹%.0f – ₹%.0f", stats["min_revenue_day"], stats["max_revenue_day"])
        log.info("   ├─ Avg customers: %.0f/day", stats["avg_daily_customers"])
        log.info("   └─ Avg orders: %.0f/day", stats["avg_daily_orders"])
    except Exception as e:
        stats = {"total_entries": len(logs)}
        log.warning("   ⚠  Stats computation failed: %s", e)

    # ── If no AI provider is available, return rule-based fallback ──
    if not is_any_ai_available():
        log.info("🔧 [STRATEGY] No AI provider available → rule-based fallback")
        fallback = _build_rule_based_strategy(stats, biz_type, biz_cat, region, log_summary, stock_summary)
        fallback["stats"] = stats
        log.info("✅ [STRATEGY] Rule-based response ready (%.2fs)", _time.time() - t_start)
        return JSONResponse(content=_sanitize(fallback))

    # ── AI generation (Gemini → Groq → rule-based) ──
    log.info("🤖 [STRATEGY] Attempting AI generation (Gemini → Groq fallback)…")
    prompt = f"""You are an expert Indian retail business consultant specialising in {region}, specifically Tamil Nadu local businesses.

Business Type: {biz_type} ({biz_cat})
Region: {region} — Tamil Nadu

Recent Daily Log Data (last 30 days):
{json.dumps(log_summary, indent=2, default=str)}

Stock Entries:
{json.dumps(stock_summary, indent=2, default=str)}

Computed Stats:
{json.dumps(stats, indent=2)}

Based on this data, generate a comprehensive strategy report in JSON format with these exact keys:

1. "salesTips" — array of 4-5 objects with keys: "title", "description", "priority" (high/medium/low). Specific, actionable tips to improve sales. Reference actual numbers from the data. Consider Tamil Nadu local market dynamics, festivals (Pongal, Deepavali, Ramadan, Christmas), weather patterns, and local shopping habits.

2. "customerStrategies" — array of 4-5 objects with keys: "title", "description", "priority". Strategies to attract new customers and retain existing ones. Include digital (WhatsApp, Google Business, Instagram) and offline (pamphlets, local events, kolam/banner) methods suitable for Tamil Nadu.

3. "stockAnalysis" — object with:
   - "pendingReasons": array of 3-4 strings explaining why stock might be pending/delayed
   - "recommendations": array of 3-4 actionable strings for stock optimization

4. "purchaseSuggestions" — array of 4-5 objects with keys: "item", "reason", "priority". Specific items or categories to buy next month to boost sales, based on trends in the data and upcoming seasonal demand in Tamil Nadu.

5. "roadmap" — array of 4 objects (Week 1-4), each with keys: "week" (string), "actions" (array of 3-4 action strings). A detailed monthly action plan.

Return ONLY valid JSON with the 5 keys above. No markdown, no explanation, no code fences."""

    try:
        text, provider = generate_ai_content(prompt)
        log.info("✨ [STRATEGY] AI response received from %s (%d chars)", provider, len(text))
        result = json.loads(text)
        log.info("✅ [STRATEGY] JSON parsed — %d sales tips, %d customer strategies",
                 len(result.get("salesTips", [])), len(result.get("customerStrategies", [])))
        log.info("   ⏱  Total time: %.2fs", _time.time() - t_start)

        return JSONResponse(content=_sanitize({
            "status": "success",
            "generated_by": f"{provider}_ai",
            "salesTips": result.get("salesTips", []),
            "customerStrategies": result.get("customerStrategies", []),
            "stockAnalysis": result.get("stockAnalysis", {}),
            "purchaseSuggestions": result.get("purchaseSuggestions", []),
            "roadmap": result.get("roadmap", []),
            "stats": stats,
        }))
    except Exception as e:
        # On ANY AI failure (both Gemini & Groq exhausted, parse error, etc.)
        # gracefully fall back to rule-based strategy instead of crashing
        log.warning("⚠  [STRATEGY] AI failed: %s", e)
        log.info("🔧 [STRATEGY] Falling back to data-driven rule-based strategy…")
        fallback = _build_rule_based_strategy(stats, biz_type, biz_cat, region, log_summary, stock_summary)
        fallback["stats"] = stats
        fallback["fallback_reason"] = str(e)
        log.info("✅ [STRATEGY] Rule-based response ready (%.2fs)", _time.time() - t_start)
        return JSONResponse(content=_sanitize(fallback))


# ═══════════════════════════════════════════════════════════════════════════
#  PREMIUM MONTH-END ANALYSIS (once per calendar month)
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/premium-analysis")
async def premium_analysis(
    payload: PremiumAnalysisRequest,
    uid: str = Depends(get_current_user),
):
    """
    Premium one-time month-end analysis powered by the custom Yukti model.
    Gate: each user gets exactly ONE premium analysis per calendar month.
    """
    _assert_service_allowed(uid, "ai_premium")
    import time as _time
    from datetime import datetime as _dt

    log = logging.getLogger("yukti.premium")
    t_start = _time.time()

    logs = payload.dailyLogs or []
    stocks = payload.stockEntries or []
    biz_type = payload.businessType or "General"
    biz_cat = payload.businessCategory or "general"
    region = payload.region or "India"

    log.info("━" * 60)
    log.info("👑 [PREMIUM] Request received")
    log.info("   ├─ User: %s", (uid[:12] + "…") if uid else "anonymous (local dev)")
    log.info("   ├─ Business: %s (%s) — %s", biz_type, biz_cat, region)
    log.info("   ├─ Daily logs: %d entries", len(logs))
    log.info("   └─ Stock entries: %d entries", len(stocks))

    if not logs:
        raise HTTPException(
            status_code=400,
            detail="No daily logs provided. Log at least a week of data for premium analysis.",
        )

    # ── Month-end gating via Firestore ──
    now = _dt.utcnow()
    month_key = now.strftime("%Y-%m")  # e.g. "2025-07"

    if _firebase_available and uid:
        try:
            from firebase_admin import firestore as _fs
            db = _fs.client()
            pa_ref = db.collection("users").document(uid).collection("premiumAnalyses").document(month_key)
            existing = pa_ref.get()
            if existing.exists:
                cached = existing.to_dict()
                log.info("📦 [PREMIUM] Returning cached analysis for %s", month_key)
                return JSONResponse(content={
                    "status": "success",
                    "cached": True,
                    "month": month_key,
                    **cached,
                })
        except Exception as e:
            log.warning("⚠  [PREMIUM] Firestore check failed: %s — proceeding anyway", e)

    # ── Build data summaries (same as strategy) ──
    log_summary = []
    for l in logs[-30:]:
        log_summary.append({
            k: v for k, v in l.items()
            if k not in ("id", "createdAt", "businessType", "businessCategory")
            and v is not None and v != ""
        })

    stock_summary = []
    for s in stocks[-20:]:
        stock_summary.append({
            k: v for k, v in s.items()
            if k not in ("id", "createdAt") and v is not None and v != ""
        })

    # ── Compute stats ──
    revenues = [float(l.get("revenue", 0)) for l in log_summary if l.get("revenue")]
    expenses = [float(l.get("expenses", 0)) for l in log_summary if l.get("expenses")]
    customers = [float(l.get("customers", 0)) for l in log_summary if l.get("customers")]
    orders = [float(l.get("orders", 0)) for l in log_summary if l.get("orders")]

    stats = {
        "total_entries": len(log_summary),
        "avg_daily_revenue": sum(revenues) / max(len(revenues), 1),
        "avg_daily_customers": sum(customers) / max(len(customers), 1),
        "avg_daily_orders": sum(orders) / max(len(orders), 1),
        "max_revenue_day": max(revenues) if revenues else 0,
        "min_revenue_day": min(revenues) if revenues else 0,
    }

    # ── Run inference ──
    log.info("🤖 [PREMIUM] Running inference…")
    try:
        from ml.inference import generate_premium_analysis

        business_data = {
            "businessType": biz_type,
            "businessCategory": biz_cat,
            "region": region,
            "stats": stats,
            "logSummary": log_summary,
            "stockSummary": stock_summary,
            "historyContext": _build_history_context(uid),
        }

        result = generate_premium_analysis(business_data)
    except Exception as e:
        log.error("❌ [PREMIUM] Inference failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Analysis generation failed: {e}")

    # ── Store in Firestore for caching ──
    response_data = {
        "generated_by": result.get("generated_by", "unknown"),
        "provider_label": result.get("provider_label", "Yukti"),
        "analysis": result.get("analysis", ""),
        "generation_time": result.get("generation_time", 0),
        "generated_at": now.isoformat(),
        "stats": stats,
    }

    if _firebase_available and uid:
        try:
            from firebase_admin import firestore as _fs
            db = _fs.client()
            pa_ref = db.collection("users").document(uid).collection("premiumAnalyses").document(month_key)
            pa_ref.set(response_data)
            log.info("💾 [PREMIUM] Cached analysis for %s in Firestore", month_key)
        except Exception as e:
            log.warning("⚠  [PREMIUM] Failed to cache in Firestore: %s", e)

    elapsed = _time.time() - t_start
    log.info("✅ [PREMIUM] Response ready (%.2fs)", elapsed)

    return JSONResponse(content={
        "status": "success",
        "cached": False,
        "month": month_key,
        **response_data,
    })


@app.get("/api/premium-analysis/status")
async def premium_analysis_status(uid: str = Depends(get_current_user)):
    """Check if the user has already used their monthly premium analysis."""
    _assert_service_allowed(uid, "ai_premium")
    from datetime import datetime as _dt

    now = _dt.utcnow()
    month_key = now.strftime("%Y-%m")

    if not _firebase_available or not uid:
        return JSONResponse(content={
            "month": month_key,
            "used": False,
            "available": True,
        })

    try:
        from firebase_admin import firestore as _fs
        db = _fs.client()
        pa_ref = db.collection("users").document(uid).collection("premiumAnalyses").document(month_key)
        existing = pa_ref.get()
        return JSONResponse(content={
            "month": month_key,
            "used": existing.exists,
            "available": not existing.exists,
            "generated_at": existing.to_dict().get("generated_at") if existing.exists else None,
        })
    except Exception as e:
        return JSONResponse(content={
            "month": month_key,
            "used": False,
            "available": True,
            "error": str(e),
        })


# ═══════════════════════════════════════════════════════════════════════════
#  BILL IMAGE SCANNER — OCR via Gemini Vision
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/stock/scan-bill")
async def scan_bill_image(
    file: UploadFile = File(...),
    uid: str = Depends(get_current_user),
):
    """
    Accept a bill/invoice image upload. Uses a two-stage pipeline:
      1. PaddleOCR (local) — extracts raw text from the image
      2. AI (Gemini/Groq/Claude) — structures raw text into product entries

    Fallback: If PaddleOCR is unavailable, tries Gemini Vision directly.
    """
    _assert_service_allowed(uid, "bill_scan")
    log = logging.getLogger("yukti.bill_scan")

    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"}
    content_type = file.content_type or ""
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}. Upload a JPG, PNG, or WEBP image.",
        )

    # Read image bytes
    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="Image too large. Maximum 10 MB.")

    log.info("━" * 60)
    log.info("📸 [BILL SCAN] Image received: %s (%.1f KB, %s)",
             file.filename, len(image_bytes) / 1024, content_type)

    extracted = None
    ocr_method = None

    # ── STAGE 1: PaddleOCR — Local text extraction (primary) ──
    try:
        from engine.bill_ocr import extract_text_from_image, is_ocr_available

        if is_ocr_available():
            log.info("   🔄 [Stage 1] Running PaddleOCR text extraction…")
            raw_ocr_text = extract_text_from_image(image_bytes)

            if raw_ocr_text and len(raw_ocr_text.strip()) > 10:
                log.info("   ✅ PaddleOCR extracted %d chars of text", len(raw_ocr_text))
                log.info("   📝 OCR preview: %s…", raw_ocr_text[:200].replace("\n", " | "))

                # ── STAGE 2: AI structures the raw OCR text ──
                log.info("   � [Stage 2] Sending OCR text to AI for structuring…")

                structure_prompt = f"""You are an expert bill/invoice parser. I extracted the following raw text from a bill image using OCR. 
Parse this text and extract ALL products/items listed.

=== RAW OCR TEXT ===
{raw_ocr_text}
=== END OCR TEXT ===

For each item, extract:
- "productName": the product/item name (string)
- "category": best-guess category like "Grocery", "Dairy", "Beverages", "Snacks", "Personal Care", "Household", "Vegetables", "Fruits", "Meat", "Bakery", "Electronics", "Stationery", "Other" (string)
- "quantity": number of units purchased (number, default 1 if unclear)
- "unit": the unit type — "units", "kg", "lbs", "liters", "packs", "boxes", "bottles", "dozens" (string, default "units")
- "unitCost": price per unit in the bill's currency (number, 0 if unclear)
- "totalCost": total cost for this line item (number, 0 if unclear)

Also extract:
- "billDate": the date on the bill if visible (string in YYYY-MM-DD format, or null)
- "storeName": the store/shop name if visible (string or null)
- "billTotal": the total amount on the bill (number or null)

Return ONLY valid JSON with this exact structure:
{{"items": [ {{ "productName": "...", "category": "...", "quantity": 1, "unit": "units", "unitCost": 0, "totalCost": 0 }} ], "billDate": "YYYY-MM-DD or null", "storeName": "... or null", "billTotal": 0}}

No markdown, no explanation, no code fences. Just the JSON."""

                try:
                    ai_text, provider = generate_ai_content(structure_prompt)
                    # Clean markdown fences if present
                    ai_text = ai_text.strip()
                    if ai_text.startswith("```"):
                        ai_text = ai_text.split("\n", 1)[1] if "\n" in ai_text else ai_text[3:]
                    if ai_text.endswith("```"):
                        ai_text = ai_text[:-3]
                    ai_text = ai_text.strip()
                    if ai_text.startswith("json"):
                        ai_text = ai_text[4:].strip()

                    extracted = json.loads(ai_text)
                    ocr_method = f"PaddleOCR + {provider}"
                    log.info("   ✅ AI (%s) structured %d items from OCR text",
                             provider, len(extracted.get("items", [])))
                except Exception as e:
                    log.warning("   ❌ AI structuring failed: %s", e)
            else:
                log.warning("   ⚠  PaddleOCR returned insufficient text")
        else:
            log.info("   ⚠  PaddleOCR not available, skipping…")
    except ImportError:
        log.info("   ⚠  PaddleOCR module not installed, skipping…")
    except Exception as e:
        log.warning("   ❌ PaddleOCR stage failed: %s", e)

    # ── FALLBACK: Gemini Vision (direct image analysis) ──
    if extracted is None:
        from engine.ai_client import _gemini_available, _gemini_client

        vision_prompt = """You are an expert bill/invoice OCR system. Analyze this bill image and extract ALL products/items listed on it.

For each item, extract:
- "productName": the product/item name (string)
- "category": best-guess category like "Grocery", "Dairy", "Beverages", "Snacks", "Personal Care", "Household", "Vegetables", "Fruits", "Meat", "Bakery", "Electronics", "Stationery", "Other" (string)
- "quantity": number of units purchased (number, default 1 if unclear)
- "unit": the unit type — "units", "kg", "lbs", "liters", "packs", "boxes", "bottles", "dozens" (string, default "units")
- "unitCost": price per unit in the bill's currency (number, 0 if unclear)
- "totalCost": total cost for this line item (number, 0 if unclear)

Also extract:
- "billDate": the date on the bill if visible (string in YYYY-MM-DD format, or null)
- "storeName": the store/shop name if visible (string or null)
- "billTotal": the total amount on the bill (number or null)

Return ONLY valid JSON with this exact structure:
{
  "items": [ { "productName": "...", "category": "...", "quantity": 1, "unit": "units", "unitCost": 0, "totalCost": 0 } ],
  "billDate": "YYYY-MM-DD" or null,
  "storeName": "..." or null,
  "billTotal": 0 or null
}

No markdown, no explanation, no code fences. Just the JSON."""

        if _gemini_available and _gemini_client:
            log.info("   🔄 [Fallback] Using Gemini Vision for direct OCR…")
            try:
                from engine import ai_client as _ai_client

                _gtypes = getattr(getattr(_ai_client, "_genai", None), "types", None)
                if _gtypes is None:
                    raise RuntimeError("google-genai types unavailable")

                response = None
                vision_models = [
                    "gemini-3-flash-preview",
                    "gemini-2.5-flash",
                    "gemini-2.0-flash",
                ]

                last_vision_error = None
                for vision_model in vision_models:
                    try:
                        response = _gemini_client.models.generate_content(
                            model=vision_model,
                            contents=[
                                _gtypes.Content(
                                    parts=[
                                        _gtypes.Part(
                                            inline_data=_gtypes.Blob(
                                                mime_type=content_type,
                                                data=image_bytes,
                                            )
                                        ),
                                        _gtypes.Part(text=vision_prompt),
                                    ]
                                )
                            ],
                        )
                        log.info("   ✅ Gemini Vision model selected: %s", vision_model)
                        break
                    except Exception as model_err:
                        last_vision_error = model_err
                        log.warning("   ⚠  Gemini vision model %s failed: %s", vision_model, model_err)

                if response is None:
                    raise RuntimeError(
                        f"No supported Gemini vision model available: {last_vision_error}"
                    )

                raw_text = response.text.strip()
                if raw_text.startswith("```"):
                    raw_text = raw_text.split("\n", 1)[1] if "\n" in raw_text else raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                raw_text = raw_text.strip()
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:].strip()

                extracted = json.loads(raw_text)
                ocr_method = "Gemini Vision"
                log.info("   ✅ Gemini Vision extracted %d items", len(extracted.get("items", [])))
            except Exception as e:
                log.warning("   ❌ Gemini Vision failed: %s", e)

    # ── FALLBACK 2: Groq Vision (OpenAI-compatible multimodal) ──
    if extracted is None:
        from engine.ai_client import _groq_available, _GROQ_API_KEY, _GROQ_ENDPOINT

        if _groq_available:
            log.info("   🔄 [Fallback 2] Using Groq Vision…")
            try:
                import base64 as _b64
                import requests as _req

                img_b64 = _b64.b64encode(image_bytes).decode("utf-8")
                headers = {
                    "Authorization": f"Bearer {_GROQ_API_KEY}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": "meta-llama/llama-4-scout-17b-16e-instruct",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:{content_type};base64,{img_b64}"
                                    },
                                },
                                {"type": "text", "text": vision_prompt},
                            ],
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 4096,
                }
                resp = _req.post(_GROQ_ENDPOINT, headers=headers, json=payload, timeout=90)
                resp.raise_for_status()
                raw_text = resp.json()["choices"][0]["message"]["content"].strip()
                if raw_text.startswith("```"):
                    raw_text = raw_text.split("\n", 1)[1] if "\n" in raw_text else raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                raw_text = raw_text.strip()
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:].strip()

                extracted = json.loads(raw_text)
                ocr_method = "Groq Vision"
                log.info("   ✅ Groq Vision extracted %d items", len(extracted.get("items", [])))
            except Exception as e:
                log.warning("   ❌ Groq Vision failed: %s", e)

    # ── FALLBACK 3: Claude Vision (Anthropic multimodal) ──
    if extracted is None:
        from engine.ai_client import _claude_available, _claude_client

        if _claude_available and _claude_client:
            log.info("   🔄 [Fallback 3] Using Claude Vision…")
            try:
                import base64 as _b64

                img_b64 = _b64.b64encode(image_bytes).decode("utf-8")
                # Map content_type for Claude (it's strict about media_type)
                media_type = content_type if content_type in {
                    "image/jpeg", "image/png", "image/gif", "image/webp"
                } else "image/png"

                message = _claude_client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=4096,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image",
                                    "source": {
                                        "type": "base64",
                                        "media_type": media_type,
                                        "data": img_b64,
                                    },
                                },
                                {"type": "text", "text": vision_prompt},
                            ],
                        }
                    ],
                    temperature=0.3,
                )
                raw_text = message.content[0].text.strip()
                if raw_text.startswith("```"):
                    raw_text = raw_text.split("\n", 1)[1] if "\n" in raw_text else raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                raw_text = raw_text.strip()
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:].strip()

                extracted = json.loads(raw_text)
                ocr_method = "Claude Vision"
                log.info("   ✅ Claude Vision extracted %d items", len(extracted.get("items", [])))
            except Exception as e:
                log.warning("   ❌ Claude Vision failed: %s", e)

    # ── LAST RESORT: Return empty template ──
    if extracted is None:
        log.warning("   ❌ All OCR methods failed — returning empty template")
        ocr_method = "none"
        extracted = {
            "items": [],
            "billDate": None,
            "storeName": None,
            "billTotal": None,
            "message": "Could not process the bill image. Please enter items manually.",
        }

    log.info("   📊 Final result: %d items via %s", len(extracted.get("items", [])), ocr_method)

    return JSONResponse(content=_sanitize({
        "status": "success",
        "filename": file.filename,
        "items": extracted.get("items", []),
        "billDate": extracted.get("billDate"),
        "storeName": extracted.get("storeName"),
        "billTotal": extracted.get("billTotal"),
        "itemCount": len(extracted.get("items", [])),
        "ocrMethod": ocr_method,
        "message": extracted.get("message"),
    }))


# ═══════════════════════════════════════════════════════════════════════════
#  RATE LIMITS — Usage Dashboard Endpoint  (REMOVED — tracked via Firestore)
# ═══════════════════════════════════════════════════════════════════════════


# ---------------------------------------------------------------------------
# Smart Advisor Routes
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    question: str
    category: Optional[str] = "general"


def _get_advisor_context() -> dict:
    """
    Extract KPIs, anomalies, forecasts, and raw log rows from session.
    Falls back to empty lists so routes never crash on missing keys.
    """
    global session_store
    if "raw_data" not in session_store:
        session_store = _load_session()

    analysis = session_store.get("analysis", {})
    analytics = analysis.get("analytics", {})
    predictions = analysis.get("predictions", {})
    decisions = analysis.get("decisions", {})

    kpis = analytics.get("kpis", [])
    anomalies = predictions.get("anomalies", [])
    forecasts = predictions.get("forecasts", [])

    # Convert raw DataFrame rows to plain dicts for the advisor functions
    raw = session_store.get("raw_data")
    if raw is None:
        logs = []
    elif isinstance(raw, pd.DataFrame):
        logs = raw.to_dict(orient="records")
    else:
        logs = list(raw)

    correlations = decisions.get("correlations", [])
    insights = analysis.get("insights", {}).get("insights", [])

    return {
        "kpis": kpis,
        "anomalies": anomalies,
        "forecasts": forecasts,
        "logs": logs,
        "correlations": correlations,
        "insights": insights,
    }


def _require_data():
    """Raise 400 if no dataset has been loaded yet."""
    global session_store
    if "raw_data" not in session_store:
        session_store = _load_session()
    if "raw_data" not in session_store:
        raise HTTPException(status_code=400, detail="No dataset loaded. Upload or analyse first.")


@app.post("/api/smart-alerts")
async def smart_alerts(uid: str = Depends(get_current_user)):
    """Generate proactive smart alerts from the current session data."""
    _assert_service_allowed(uid, "ai_strategy")
    _require_data()
    try:
        ctx = _get_advisor_context()
        alerts = generate_smart_alerts(
            kpis=ctx["kpis"],
            anomalies=ctx["anomalies"],
            forecasts=ctx["forecasts"],
            logs=ctx["logs"],
            history_context=_build_history_context(uid),
        )
        top = alerts[0] if alerts else {}
        _save_generated_report(
            uid,
            "smart_alerts",
            {
                "summary": f"Generated {len(alerts)} smart alerts",
                "top_issue": top.get("title"),
                "action": top.get("action"),
                "trend": top.get("category", "alerts"),
                "count": len(alerts),
            },
        )
        return JSONResponse(content=_sanitize({"alerts": alerts}))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat")
async def business_chat(payload: ChatRequest, uid: str = Depends(get_current_user)):
    """Answer a natural-language business question about the loaded data."""
    _assert_service_allowed(uid, "ai_strategy")
    _require_data()
    try:
        ctx = _get_advisor_context()
        result = answer_business_question(
            question=payload.question,
            kpis=ctx["kpis"],
            logs=ctx["logs"],
            category=payload.category or "general",
            correlations=ctx["correlations"],
            forecasts=ctx["forecasts"],
            history_context=_build_history_context(uid),
        )
        _save_generated_report(
            uid,
            "business_chat",
            {
                "summary": f"Q: {payload.question[:100]}",
                "top_issue": result.get("answer"),
                "action": result.get("action"),
                "trend": result.get("confidence", "unknown"),
            },
        )
        return JSONResponse(content=_sanitize(result))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/weekly-digest")
async def weekly_digest(uid: str = Depends(get_current_user)):
    """Generate a week-over-week digest with top 3 prioritised actions."""
    _assert_service_allowed(uid, "ai_strategy")
    _require_data()
    try:
        ctx = _get_advisor_context()
        digest = generate_weekly_digest(
            kpis=ctx["kpis"],
            anomalies=ctx["anomalies"],
            forecasts=ctx["forecasts"],
            insights=ctx["insights"],
            logs=ctx["logs"],
            history_context=_build_history_context(uid),
        )
        top_action = (digest.get("actions") or [{}])[0].get("action") if isinstance(digest, dict) else None
        _save_generated_report(
            uid,
            "weekly_digest",
            {
                "summary": digest.get("trend_word") if isinstance(digest, dict) else "weekly digest",
                "top_issue": digest.get("top_insight_title") if isinstance(digest, dict) else None,
                "action": top_action,
                "trend": digest.get("week_change") if isinstance(digest, dict) else "unknown",
            },
        )
        return JSONResponse(content=_sanitize(digest))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/market-benchmark")
async def market_benchmark(category: str = "general", uid: str = Depends(get_current_user)):
    """Return Tamil Nadu market benchmarks for the given business category."""
    _assert_service_allowed(uid, "ai_strategy")
    cat = category.lower().strip()
    benchmark = MARKET_BENCHMARKS.get(cat, MARKET_BENCHMARKS.get("general", {}))
    return JSONResponse(content=_sanitize({"category": cat, "benchmark": benchmark}))


@app.post("/api/pricing-insights")
async def pricing_insights(uid: str = Depends(get_current_user)):
    """Generate pricing insights by comparing margins vs market benchmarks."""
    _assert_service_allowed(uid, "ai_strategy")
    _require_data()
    try:
        ctx = _get_advisor_context()
        # Derive category from logs if possible
        category = "general"
        if ctx["logs"]:
            category = str(ctx["logs"][0].get("business_category", "general") or "general").lower()
        insights = generate_pricing_insights(
            kpis=ctx["kpis"],
            logs=ctx["logs"],
            category=category,
        )
        top = insights[0] if insights else {}
        _save_generated_report(
            uid,
            "pricing_insights",
            {
                "summary": f"Pricing analysis for {category}",
                "top_issue": top.get("title"),
                "action": top.get("action"),
                "trend": top.get("priority", "unknown"),
            },
        )
        return JSONResponse(content=_sanitize({"insights": insights}))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/forecast-actions")
async def forecast_actions(uid: str = Depends(get_current_user)):
    """Convert forecast trends into plain-language action cards."""
    _assert_service_allowed(uid, "ai_strategy")
    _require_data()
    try:
        ctx = _get_advisor_context()
        actions = generate_actionable_forecast_summary(
            forecasts=ctx["forecasts"],
            logs=ctx["logs"],
            history_context=_build_history_context(uid),
        )
        top = actions[0] if actions else {}
        _save_generated_report(
            uid,
            "forecast_actions",
            {
                "summary": f"Generated {len(actions)} forecast action cards",
                "top_issue": top.get("headline"),
                "action": top.get("action"),
                "trend": top.get("urgency", "unknown"),
            },
        )
        return JSONResponse(content=_sanitize({"actions": actions, "forecast_actions": actions}))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

    @app.exception_handler(404)
    async def spa_fallback(request: Request, exc):
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Yukti Backend")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host to bind")
    args = parser.parse_args()

    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="warning",
        log_config=None,
        access_log=False,
    )