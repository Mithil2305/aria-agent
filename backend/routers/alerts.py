from fastapi import APIRouter, Body, Depends
import logging

from models.schemas import MetricsPayload
from services.ews_service import EWSService
from utils.auth import verify_firebase_token

router = APIRouter()
log = logging.getLogger("yukti.alerts")


@router.post("/evaluate")
async def evaluate_warnings(
    metrics: MetricsPayload | None = Body(default=None),
    user: dict = Depends(verify_firebase_token),
):
    """Evaluate warnings using Firestore history, with optional caller-provided metrics override."""
    service = EWSService()
    alerts = await service.evaluate(
        uid=user["uid"],
        metrics=metrics.model_dump() if metrics is not None else None,
    )
    return {
        "alerts": alerts,
        "evaluated_at": __import__("datetime").datetime.utcnow().isoformat(),
    }


@router.get("/active")
async def get_active_alerts(user: dict = Depends(verify_firebase_token)):
    """Return unresolved alerts for the current user."""
    service = EWSService()
    try:
        alerts = await service.get_active_alerts(uid=user["uid"])
        return {"alerts": alerts}
    except Exception as exc:
        log.warning("Active alerts fallback due to backend error: %s", exc)
        return {"alerts": []}


@router.post("/dismiss/{alert_id}")
async def dismiss_alert(alert_id: str, user: dict = Depends(verify_firebase_token)):
    service = EWSService()
    await service.dismiss_alert(uid=user["uid"], alert_id=alert_id)
    return {"status": "dismissed"}
