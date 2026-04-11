from fastapi import APIRouter
from pydantic import BaseModel
import os

from config import load_config, save_config

router = APIRouter()


def _firebase_env(name: str) -> str:
    """Read Firebase web config from backend env with backward-compatible keys."""
    return os.getenv(f"FIREBASE_{name}") or os.getenv(f"VITE_FIREBASE_{name}") or ""


class SetupPayload(BaseModel):
    gemini_api_key: str = ""
    groq_api_key: str = ""
    anthropic_api_key: str = ""


@router.get("/api/setup/status")
def setup_status():
    cfg = load_config()
    configured = bool(
        cfg.get("GEMINI_API_KEY")
        or cfg.get("ANTHROPIC_API_KEY")
        or cfg.get("GROQ_API_KEY")
        or os.getenv("GEMINI_API_KEY")
        or os.getenv("ANTHROPIC_API_KEY")
        or os.getenv("GROQ_API_KEY")
    )
    return {"configured": configured}


@router.post("/api/setup")
def save_setup(payload: SetupPayload):
    save_config(
        {
            "GEMINI_API_KEY": payload.gemini_api_key,
            "GROQ_API_KEY": payload.groq_api_key,
            "ANTHROPIC_API_KEY": payload.anthropic_api_key,
        }
    )
    return {"success": True}


@router.get("/api/public/firebase-config")
def firebase_public_config():
    """Serve Firebase client config from backend env so frontend does not read API keys from Vite env."""
    config = {
        "apiKey": _firebase_env("API_KEY"),
        "authDomain": _firebase_env("AUTH_DOMAIN"),
        "projectId": _firebase_env("PROJECT_ID"),
        "storageBucket": _firebase_env("STORAGE_BUCKET"),
        "messagingSenderId": _firebase_env("MESSAGING_SENDER_ID"),
        "appId": _firebase_env("APP_ID"),
    }

    configured = bool(config["apiKey"]) and bool(config["projectId"])
    return {"configured": configured, "config": config if configured else None}
