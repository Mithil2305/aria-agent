from fastapi import APIRouter
from pydantic import BaseModel
import os

from config import load_config, save_config

router = APIRouter()


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
