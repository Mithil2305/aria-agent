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

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
import json
import io
import base64
import pickle
import tempfile
import os
import logging
import numpy as np
import pandas as pd
from datetime import datetime, date
from dotenv import load_dotenv

load_dotenv()

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
from typing import List, Optional


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "https://aria-agent-alpha.vercel.app",
    ],
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
_SESSION_PATH = os.path.join(tempfile.gettempdir(), "yukti_session.pkl")


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
    return {"status": "ok", "engine": "Yukti Decision Intelligence v1.0"}


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
    Run the complete Yukti analysis pipeline:
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
    "custom_webhook": {},  # pass-through: fields already named correctly
}


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

    field_map = PLATFORM_FIELD_MAPS.get(platform, {})

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

    return JSONResponse(content=_sanitize({
        "status": "success",
        "platform": platform,
        "entry": mapped,
        "imported": 1,
    }))


@app.post("/api/integrations/sync")
async def manual_sync(
    payload: IntegrationSyncRequest,
    uid: str = Depends(get_current_user),
):
    """
    Manual sync trigger.
    In a production environment this would call the platform's API using
    stored credentials. For now, it acknowledges the request.
    """
    platform = payload.platformId
    if platform not in PLATFORM_FIELD_MAPS:
        raise HTTPException(status_code=400, detail=f"Unknown platform: {platform}")

    return JSONResponse(content=_sanitize({
        "status": "success",
        "platform": platform,
        "connectionId": payload.connectionId,
        "message": f"Sync acknowledged for {platform}. "
                   f"In production, this would pull today's data via the platform API.",
        "imported": 0,
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
                from google.genai import types as _gtypes

                response = _gemini_client.models.generate_content(
                    model="gemini-2.0-flash",
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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
