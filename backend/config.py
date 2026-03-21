import base64
import ctypes
import ctypes.wintypes
import json
import os
from pathlib import Path

CONFIG_DIR = Path(os.getenv("APPDATA", str(Path.home()))) / "Yukti"
CONFIG_FILE = CONFIG_DIR / "config.json"
CONFIG_DIR.mkdir(parents=True, exist_ok=True)


class DATA_BLOB(ctypes.Structure):
    _fields_ = [("cbData", ctypes.wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_byte))]


def _build_blob(raw: bytes) -> DATA_BLOB:
    if not raw:
        return DATA_BLOB(0, None)
    buf = (ctypes.c_byte * len(raw))(*raw)
    return DATA_BLOB(len(raw), ctypes.cast(buf, ctypes.POINTER(ctypes.c_byte)))


def _blob_to_bytes(blob: DATA_BLOB) -> bytes:
    if not blob.cbData or not blob.pbData:
        return b""
    return bytes(ctypes.string_at(blob.pbData, blob.cbData))


def _dpapi_encrypt(raw: bytes) -> bytes:
    if os.name != "nt" or not raw:
        return raw
    in_blob = _build_blob(raw)
    out_blob = DATA_BLOB()
    if not ctypes.windll.crypt32.CryptProtectData(
        ctypes.byref(in_blob),
        "YuktiConfig",
        None,
        None,
        None,
        0,
        ctypes.byref(out_blob),
    ):
        return raw
    encrypted = _blob_to_bytes(out_blob)
    ctypes.windll.kernel32.LocalFree(out_blob.pbData)
    return encrypted


def _dpapi_decrypt(raw: bytes) -> bytes:
    if os.name != "nt" or not raw:
        return raw
    in_blob = _build_blob(raw)
    out_blob = DATA_BLOB()
    if not ctypes.windll.crypt32.CryptUnprotectData(
        ctypes.byref(in_blob),
        None,
        None,
        None,
        None,
        0,
        ctypes.byref(out_blob),
    ):
        return b""
    decrypted = _blob_to_bytes(out_blob)
    ctypes.windll.kernel32.LocalFree(out_blob.pbData)
    return decrypted


def load_config() -> dict:
    if not CONFIG_FILE.exists():
        return {}

    try:
        parsed = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}

    if isinstance(parsed, dict) and parsed.get("__encrypted__") and parsed.get("payload"):
        try:
            encrypted = base64.b64decode(parsed["payload"])
            decrypted = _dpapi_decrypt(encrypted)
            if not decrypted:
                return {}
            return json.loads(decrypted.decode("utf-8"))
        except Exception:
            return {}

    # Backward-compatible fallback for existing plaintext configs.
    if isinstance(parsed, dict):
        return parsed

    return {}


def save_config(data: dict) -> None:
    payload = json.dumps(data, separators=(",", ":")).encode("utf-8")
    encrypted = _dpapi_encrypt(payload)
    wrapped = {
        "__encrypted__": True,
        "payload": base64.b64encode(encrypted).decode("utf-8"),
    }
    CONFIG_FILE.write_text(json.dumps(wrapped, indent=2), encoding="utf-8")


cfg = load_config()
GEMINI_API_KEY = cfg.get("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = cfg.get("GROQ_API_KEY") or os.getenv("GROQ_API_KEY", "")
ANTHROPIC_API_KEY = cfg.get("ANTHROPIC_API_KEY") or os.getenv("ANTHROPIC_API_KEY", "")
