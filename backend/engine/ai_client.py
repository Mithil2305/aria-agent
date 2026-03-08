"""
Shared AI Client — Gemini-first, Groq-fallback, Claude-backup
Provides a single `generate_ai_content(prompt)` function that:
  1. Tries Google Gemini (gemini-2.0-flash)
  2. On failure → falls back to Groq (kimi-k2-instruct)
  3. On failure → falls back to Claude (claude-sonnet-4-20250514)
  4. Returns (text, provider) or raises if all fail
"""

import os
import json
import logging
import requests as _requests

log = logging.getLogger("yukti.ai_client")

# ---------------------------------------------------------------------------
# Gemini setup
# ---------------------------------------------------------------------------
_gemini_available = False
_gemini_client = None
try:
    from google import genai as _genai

    _gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if _gemini_key:
        _gemini_client = _genai.Client(api_key=_gemini_key)
        _gemini_available = True
        log.info("🟢 Gemini configured (key …%s)", _gemini_key[-6:])
    else:
        log.warning("🟡 Gemini key not set — skipping")
except ImportError:
    log.warning("🔴 google-genai not installed — Gemini unavailable")

# ---------------------------------------------------------------------------
# Groq setup (OpenAI-compatible REST API)
# ---------------------------------------------------------------------------
_GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
_GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
_GROQ_MODEL = "moonshotai/kimi-k2-instruct"
_groq_available = bool(_GROQ_API_KEY)
if _groq_available:
    log.info("🟢 Groq configured (key …%s, model %s)", _GROQ_API_KEY[-6:], _GROQ_MODEL)
else:
    log.warning("🟡 Groq key not set — skipping")

# ---------------------------------------------------------------------------
# Claude (Anthropic) setup
# ---------------------------------------------------------------------------
_ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
_CLAUDE_MODEL = "claude-sonnet-4-20250514"
_claude_available = False
_claude_client = None
try:
    import anthropic as _anthropic

    if _ANTHROPIC_API_KEY:
        _claude_client = _anthropic.Anthropic(api_key=_ANTHROPIC_API_KEY)
        _claude_available = True
        log.info("🟢 Claude configured (key …%s, model %s)", _ANTHROPIC_API_KEY[-6:], _CLAUDE_MODEL)
    else:
        log.warning("🟡 Anthropic key not set — skipping")
except ImportError:
    log.warning("🔴 anthropic not installed — Claude unavailable")


def _call_gemini(prompt: str) -> str:
    """Call Gemini and return raw text. Raises on any failure."""
    if not _gemini_available or not _gemini_client:
        raise RuntimeError("Gemini not configured")

    response = _gemini_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
    )
    return response.text.strip()


def _call_groq(prompt: str) -> str:
    """Call Groq (kimi-k2-instruct) via OpenAI-compatible API. Raises on failure."""
    if not _groq_available:
        raise RuntimeError("Groq not configured — set GROQ_API_KEY env var")

    headers = {
        "Authorization": f"Bearer {_GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": _GROQ_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You are an expert business analytics AI. Always respond with valid JSON only, no markdown fences or extra text.",
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 4096,
    }

    resp = _requests.post(_GROQ_ENDPOINT, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()

    text = data["choices"][0]["message"]["content"].strip()
    return text


def _call_claude(prompt: str) -> str:
    """Call Claude (Anthropic) and return raw text. Raises on any failure."""
    if not _claude_available or not _claude_client:
        raise RuntimeError("Claude not configured — set ANTHROPIC_API_KEY env var")

    message = _claude_client.messages.create(
        model=_CLAUDE_MODEL,
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": prompt,
            },
        ],
        system="You are an expert business analytics AI. Always respond with valid JSON only, no markdown fences or extra text.",
        temperature=0.7,
    )
    return message.content[0].text.strip()


def _clean_ai_response(text: str) -> str:
    """Strip markdown fences and leading 'json' tag from AI responses."""
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    if text.startswith("json"):
        text = text[4:].strip()
    return text


def generate_ai_content(prompt: str) -> tuple[str, str]:
    """
    Try Gemini first, fall back to Groq, then Claude on any failure.

    Returns:
        (cleaned_text, provider)  where provider is "gemini", "groq", or "claude"

    Raises:
        RuntimeError if all providers fail.
    """
    errors = []

    # ── Attempt 1: Gemini ──
    if _gemini_available:
        log.info("   🔄 Trying Gemini (gemini-2.0-flash)…")
        try:
            raw = _call_gemini(prompt)
            log.info("   ✅ Gemini responded — %d chars", len(raw))
            return _clean_ai_response(raw), "gemini"
        except Exception as e:
            log.warning("   ❌ Gemini failed: %s", e)
            errors.append(f"Gemini: {e}")
    else:
        log.info("   ⏭  Gemini not available — skipping")

    # ── Attempt 2: Groq (kimi-k2-instruct) ──
    if _groq_available:
        log.info("   🔄 Trying Groq (%s)…", _GROQ_MODEL)
        try:
            raw = _call_groq(prompt)
            log.info("   ✅ Groq responded — %d chars", len(raw))
            return _clean_ai_response(raw), "groq"
        except Exception as e:
            log.warning("   ❌ Groq failed: %s", e)
            errors.append(f"Groq: {e}")
    else:
        log.info("   ⏭  Groq not available — skipping")

    # ── Attempt 3: Claude (Anthropic) ──
    if _claude_available:
        log.info("   🔄 Trying Claude (%s)…", _CLAUDE_MODEL)
        try:
            raw = _call_claude(prompt)
            log.info("   ✅ Claude responded — %d chars", len(raw))
            return _clean_ai_response(raw), "claude"
        except Exception as e:
            log.warning("   ❌ Claude failed: %s", e)
            errors.append(f"Claude: {e}")
    else:
        log.info("   ⏭  Claude not available — skipping")

    # All failed
    log.error("   🔴 All AI providers failed: %s", "; ".join(errors))
    raise RuntimeError(f"All AI providers failed: {'; '.join(errors)}")


def is_any_ai_available() -> bool:
    """Check if at least one AI provider is configured."""
    return _gemini_available or _groq_available or _claude_available
