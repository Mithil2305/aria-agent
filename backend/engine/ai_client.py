"""
Shared AI Client — Gemini-first, Groq-fallback, Claude-backup
Provides a single `generate_ai_content(prompt)` function that:
  1. Tries Google Gemini (gemini-3.1-flash)
  2. On failure → falls back to Groq (kimi-k2-instruct)
  3. On failure → falls back to Claude (claude-sonnet-4-20250514)
  4. Returns (text, provider) or raises if all fail
"""

import logging
import requests as _requests
from config import GEMINI_API_KEY, GROQ_API_KEY, ANTHROPIC_API_KEY

log = logging.getLogger("yukti.ai_client")


# Shared high-precision instruction applied across providers.
_COMMON_SYSTEM_INSTRUCTION = (
    "You are Yukti, an expert SMB business strategy and analytics copilot. "
    "Follow the user's requested schema exactly. "
    "Never return markdown fences, headings, or commentary outside the requested format. "
    "If JSON is requested, output valid JSON only. "
    "Use concrete, data-backed reasoning with clear actions and expected impact. "
    "If a value is unknown, use null instead of inventing facts."
)


def _with_common_instruction(prompt: str) -> str:
    """Attach a provider-agnostic quality and formatting contract to prompts."""
    return (
        "SYSTEM INSTRUCTION:\n"
        f"{_COMMON_SYSTEM_INSTRUCTION}\n\n"
        "TASK INPUT:\n"
        f"{prompt}\n\n"
        "FINAL OUTPUT RULE:\n"
        "Return only the final answer in the required format."
    )

# ---------------------------------------------------------------------------
# Gemini setup
# ---------------------------------------------------------------------------
_gemini_available = False
_gemini_client = None
try:
    from google import genai as _genai

    _gemini_key = GEMINI_API_KEY
    if _gemini_key:
        _gemini_client = _genai.Client(api_key=_gemini_key)
        _gemini_available = True
        log.info("[OK] Gemini configured (key ...%s)", _gemini_key[-6:])
    else:
        log.warning("[WARN] Gemini key not set - skipping")
except ImportError:
    log.warning("[ERROR] google-genai not installed - Gemini unavailable")

# ---------------------------------------------------------------------------
# Groq setup (OpenAI-compatible REST API)
# ---------------------------------------------------------------------------
_GROQ_API_KEY = GROQ_API_KEY
_GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
_GROQ_MODEL = "moonshotai/kimi-k2-instruct"
_groq_available = bool(_GROQ_API_KEY)
if _groq_available:
    log.info("[OK] Groq configured (key ...%s, model %s)", _GROQ_API_KEY[-6:], _GROQ_MODEL)
else:
    log.warning("[WARN] Groq key not set - skipping")

# ---------------------------------------------------------------------------
# Claude (Anthropic) setup
# ---------------------------------------------------------------------------
_ANTHROPIC_API_KEY = ANTHROPIC_API_KEY
_CLAUDE_MODEL = "claude-sonnet-4-20250514"
_claude_available = False
_claude_client = None
try:
    import anthropic as _anthropic

    if _ANTHROPIC_API_KEY:
        _claude_client = _anthropic.Anthropic(api_key=_ANTHROPIC_API_KEY)
        _claude_available = True
        log.info("[OK] Claude configured (key ...%s, model %s)", _ANTHROPIC_API_KEY[-6:], _CLAUDE_MODEL)
    else:
        log.warning("[WARN] Anthropic key not set - skipping")
except ImportError:
    log.warning("[ERROR] anthropic not installed - Claude unavailable")


def _call_gemini(prompt: str) -> str:
    """Call Gemini and return raw text. Raises on any failure."""
    if not _gemini_available or not _gemini_client:
        raise RuntimeError("Gemini not configured")

    response = _gemini_client.models.generate_content(
        model="gemini-3.1-flash",
        contents=_with_common_instruction(prompt),
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
                "content": _COMMON_SYSTEM_INSTRUCTION,
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        "top_p": 0.9,
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
        system=_COMMON_SYSTEM_INSTRUCTION,
        temperature=0.3,
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


def _extract_json_block(text: str) -> str | None:
    """Extract first complete top-level JSON object/array from mixed text."""
    if not text:
        return None

    start = -1
    opening = ""
    for ch in ("{", "["):
        i = text.find(ch)
        if i != -1 and (start == -1 or i < start):
            start = i
            opening = ch

    if start == -1:
        return None

    closing = "}" if opening == "{" else "]"
    depth = 0
    in_string = False
    escaped = False

    for idx in range(start, len(text)):
        ch = text[idx]

        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
            continue

        if ch == '"':
            in_string = True
            continue

        if ch == opening:
            depth += 1
        elif ch == closing:
            depth -= 1
            if depth == 0:
                return text[start : idx + 1]

    return None


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
        log.info("   [TRY] Trying Gemini (gemini-3.1-flash)...")
        try:
            raw = _call_gemini(prompt)
            log.info("   [OK] Gemini responded - %d chars", len(raw))
            cleaned = _clean_ai_response(raw)
            json_block = _extract_json_block(cleaned)
            return (json_block or cleaned), "gemini"
        except Exception as e:
            log.warning("   [FAIL] Gemini failed: %s", e)
            errors.append(f"Gemini: {e}")
    else:
        log.info("   [SKIP] Gemini not available - skipping")

    # ── Attempt 2: Groq (kimi-k2-instruct) ──
    if _groq_available:
        log.info("   [TRY] Trying Groq (%s)...", _GROQ_MODEL)
        try:
            raw = _call_groq(prompt)
            log.info("   [OK] Groq responded - %d chars", len(raw))
            cleaned = _clean_ai_response(raw)
            json_block = _extract_json_block(cleaned)
            return (json_block or cleaned), "groq"
        except Exception as e:
            log.warning("   [FAIL] Groq failed: %s", e)
            errors.append(f"Groq: {e}")
    else:
        log.info("   [SKIP] Groq not available - skipping")

    # ── Attempt 3: Claude (Anthropic) ──
    if _claude_available:
        log.info("   [TRY] Trying Claude (%s)...", _CLAUDE_MODEL)
        try:
            raw = _call_claude(prompt)
            log.info("   [OK] Claude responded - %d chars", len(raw))
            cleaned = _clean_ai_response(raw)
            json_block = _extract_json_block(cleaned)
            return (json_block or cleaned), "claude"
        except Exception as e:
            log.warning("   [FAIL] Claude failed: %s", e)
            errors.append(f"Claude: {e}")
    else:
        log.info("   [SKIP] Claude not available - skipping")

    # All failed
    log.error("   [ERROR] All AI providers failed: %s", "; ".join(errors))
    raise RuntimeError(f"All AI providers failed: {'; '.join(errors)}")


def is_any_ai_available() -> bool:
    """Check if at least one AI provider is configured."""
    return _gemini_available or _groq_available or _claude_available
