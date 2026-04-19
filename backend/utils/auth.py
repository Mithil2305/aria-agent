import os
from pathlib import Path

import firebase_admin
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth, credentials

security = HTTPBearer(auto_error=True)


_initialized = False


def _dev_auth_bypass_enabled() -> bool:
    return os.getenv("YUKTI_DEV_AUTH_BYPASS", "1").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


def _ensure_firebase_app() -> None:
    global _initialized
    if _initialized:
        return

    if firebase_admin._apps:
        _initialized = True
        return

    cred_path = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS",
        str(Path(__file__).resolve().parents[1] / "service-account.json"),
    )
    if not os.path.exists(cred_path):
        raise HTTPException(
            status_code=503,
            detail="Firebase Admin credentials are not configured on the backend",
        )

    try:
        firebase_admin.initialize_app(credentials.Certificate(cred_path))
        _initialized = True
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Firebase init failed: {exc}") from exc


def verify_firebase_token(
    credentials_obj: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """Verify Firebase ID token and return decoded claims."""
    try:
        _ensure_firebase_app()
    except HTTPException:
        if _dev_auth_bypass_enabled():
            return {"uid": "local-dev-user", "auth_mode": "dev_bypass"}
        raise

    try:
        decoded = firebase_auth.verify_id_token(credentials_obj.credentials)
        uid = decoded.get("uid")
        if not uid:
            raise HTTPException(status_code=401, detail="Token payload missing uid")
        return decoded
    except HTTPException:
        raise
    except Exception as exc:
        if _dev_auth_bypass_enabled():
            return {"uid": "local-dev-user", "auth_mode": "dev_bypass"}
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc
