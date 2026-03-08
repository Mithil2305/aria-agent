"""
Yukti — Bill OCR Engine (PaddleOCR)

Uses PaddleOCR for local text detection + recognition on bill/invoice images.
This runs entirely offline — no API keys needed for the OCR step.

Architecture:
  1. PaddleOCR extracts raw text lines from the bill image
  2. Lines are sorted top-to-bottom, left-to-right for reading order
  3. Raw text is returned for AI-based structuring into product entries

Compatibility:
  - PaddleOCR 2.x: uses ocr(path, cls=True) → [[box, (text, conf)], ...]
  - PaddleOCR 3.x: uses predict(path) → list of result objects with .rec_texts etc.
  - Handles PaddlePaddle 3.3.0 oneDNN PIR bug on Windows (graceful fallback)
"""

import logging
import io
import tempfile
import os
from typing import Optional

from PIL import Image

log = logging.getLogger("yukti.bill_ocr")

# ── Lazy-load PaddleOCR to avoid slow startup ──
_ocr_instance = None
_ocr_available = False
_ocr_init_attempted = False
_ocr_version = None  # "2.x" or "3.x"


def _detect_paddleocr_version():
    """Detect installed PaddleOCR major version."""
    try:
        import paddleocr
        ver = getattr(paddleocr, "__version__", getattr(paddleocr, "VERSION", ""))
        if ver:
            major = int(str(ver).split(".")[0])
            return "3.x" if major >= 3 else "2.x"
    except Exception:
        pass
    # Heuristic: check if predict method exists on PaddleOCR class
    try:
        from paddleocr import PaddleOCR
        if hasattr(PaddleOCR, "predict"):
            return "3.x"
    except Exception:
        pass
    return "2.x"


def _get_ocr():
    """Lazy-initialize PaddleOCR instance (singleton)."""
    global _ocr_instance, _ocr_available, _ocr_init_attempted, _ocr_version

    if _ocr_init_attempted:
        return _ocr_instance

    _ocr_init_attempted = True

    try:
        # Suppress noisy PaddlePaddle/PaddleX logs during init
        os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")

        _ocr_version = _detect_paddleocr_version()
        log.info("🔧 Detected PaddleOCR %s", _ocr_version)

        from paddleocr import PaddleOCR

        log.info("🔧 Initializing PaddleOCR engine (first load may download models)…")

        if _ocr_version == "3.x":
            # PaddleOCR 3.x API
            _ocr_instance = PaddleOCR(
                lang="en",
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=True,
            )
        else:
            # PaddleOCR 2.x API
            _ocr_instance = PaddleOCR(
                use_angle_cls=True,
                lang="en",
                show_log=False,
            )

        _ocr_available = True
        log.info("✅ PaddleOCR %s engine ready", _ocr_version)
    except ImportError:
        log.warning("⚠  PaddleOCR not installed — pip install paddlepaddle paddleocr")
        _ocr_instance = None
        _ocr_available = False
    except Exception as e:
        log.warning("⚠  PaddleOCR init failed: %s", e)
        _ocr_instance = None
        _ocr_available = False

    return _ocr_instance


def is_ocr_available() -> bool:
    """Check if PaddleOCR is available (triggers lazy init)."""
    _get_ocr()
    return _ocr_available


def _save_temp_image(image_bytes: bytes) -> str:
    """Save image bytes to a temp file and return the path."""
    img = Image.open(io.BytesIO(image_bytes))
    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    img.convert("RGB").save(tmp, format="PNG")
    tmp.close()
    return tmp.name


def _parse_v3_result(results) -> list:
    """
    Parse PaddleOCR 3.x predict() result objects into [(y, x, text, conf), ...].
    PaddleOCR 3.x returns result objects with attributes like:
      .rec_texts, .rec_scores, .dt_polys  (list of per-line data)
    """
    lines = []
    for page_result in results:
        # 3.x result objects have different attribute names depending on version
        rec_texts = getattr(page_result, "rec_texts", None)
        rec_scores = getattr(page_result, "rec_scores", None)
        dt_polys = getattr(page_result, "dt_polys", None)

        if rec_texts is None:
            # Try dict-style access
            if hasattr(page_result, "__getitem__"):
                rec_texts = page_result.get("rec_texts", [])
                rec_scores = page_result.get("rec_scores", [])
                dt_polys = page_result.get("dt_polys", [])
            else:
                log.warning("   ⚠  Unexpected PaddleOCR 3.x result format: %s", type(page_result))
                continue

        if not rec_texts:
            continue

        for i, text in enumerate(rec_texts):
            conf = rec_scores[i] if rec_scores and i < len(rec_scores) else 0.0
            if dt_polys is not None and i < len(dt_polys):
                poly = dt_polys[i]
                try:
                    y_pos = min(float(pt[1]) for pt in poly)
                    x_pos = min(float(pt[0]) for pt in poly)
                except (TypeError, IndexError):
                    y_pos = float(i * 30)
                    x_pos = 0.0
            else:
                y_pos = float(i * 30)
                x_pos = 0.0
            lines.append((y_pos, x_pos, str(text), float(conf)))

    return lines


def _parse_v2_result(result) -> list:
    """
    Parse PaddleOCR 2.x ocr() result into [(y, x, text, conf), ...].
    2.x returns: [[  [box, (text, conf)], [box, (text, conf)], ...  ]]
    """
    lines = []
    if not result or not result[0]:
        return lines

    for line_info in result[0]:
        box = line_info[0]       # [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
        text = line_info[1][0]   # recognized text
        conf = line_info[1][1]   # confidence score

        y_pos = min(pt[1] for pt in box)
        x_pos = min(pt[0] for pt in box)
        lines.append((y_pos, x_pos, text, conf))

    return lines


def _group_lines(lines: list, img_height: int) -> str:
    """Sort lines by position and group into reading-order text."""
    if not lines:
        return ""

    # Sort by Y position (top→bottom), then X (left→right)
    lines.sort(key=lambda l: (l[0], l[1]))

    # Group lines on the same vertical row (within threshold)
    grouped_lines = []
    current_row = []
    current_y = None
    y_threshold = max(img_height * 0.015, 10)  # 1.5% of height, min 10px

    for y, x, text, conf in lines:
        if current_y is None or abs(y - current_y) > y_threshold:
            if current_row:
                current_row.sort(key=lambda c: c[0])
                row_text = "  ".join(c[1] for c in current_row)
                grouped_lines.append(row_text)
            current_row = [(x, text)]
            current_y = y
        else:
            current_row.append((x, text))

    # Last row
    if current_row:
        current_row.sort(key=lambda c: c[0])
        row_text = "  ".join(c[1] for c in current_row)
        grouped_lines.append(row_text)

    return "\n".join(grouped_lines)


def extract_text_from_image(image_bytes: bytes) -> Optional[str]:
    """
    Run PaddleOCR on an image and return all detected text lines
    concatenated in reading order (top→bottom, left→right).

    Args:
        image_bytes: Raw image bytes (JPEG, PNG, etc.)

    Returns:
        Extracted text as a single string with newlines, or None on failure.
    """
    ocr = _get_ocr()
    if ocr is None:
        log.warning("PaddleOCR not available — cannot extract text")
        return None

    tmp_path = None
    try:
        img = Image.open(io.BytesIO(image_bytes))
        log.info("   🔍 Running PaddleOCR %s on image (%dx%d)…",
                 _ocr_version, img.width, img.height)

        # Save to temp file — works with both 2.x and 3.x
        tmp_path = _save_temp_image(image_bytes)

        lines = []

        if _ocr_version == "3.x":
            # ── PaddleOCR 3.x: use predict() ──
            try:
                result = list(ocr.predict(tmp_path))
                lines = _parse_v3_result(result)
            except NotImplementedError as e:
                # Known PaddlePaddle 3.3.0 oneDNN PIR bug on Windows
                log.warning("   ⚠  PaddleOCR 3.x predict() hit oneDNN bug: %s", e)
                log.info("   🔄 Retrying with deprecated ocr() method…")
                try:
                    result = ocr.ocr(tmp_path)
                    lines = _parse_v2_result(result)
                except Exception as e2:
                    log.warning("   ❌ PaddleOCR ocr() also failed: %s", e2)
                    return None
            except Exception as e:
                log.warning("   ❌ PaddleOCR 3.x predict() failed: %s", e)
                return None
        else:
            # ── PaddleOCR 2.x: use ocr() ──
            try:
                result = ocr.ocr(tmp_path, cls=True)
                lines = _parse_v2_result(result)
            except Exception as e:
                log.warning("   ❌ PaddleOCR 2.x ocr() failed: %s", e)
                return None

        if not lines:
            log.warning("   ⚠  PaddleOCR returned no text lines")
            return None

        extracted_text = _group_lines(lines, img.height)
        num_lines = extracted_text.count("\n") + 1
        avg_conf = sum(l[3] for l in lines) / len(lines) if lines else 0

        log.info("   ✅ PaddleOCR extracted %d lines, %d chars (avg confidence: %.1f%%)",
                 num_lines, len(extracted_text), avg_conf * 100)

        return extracted_text

    except Exception as e:
        log.error("   ❌ PaddleOCR extraction failed: %s", e)
        return None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
