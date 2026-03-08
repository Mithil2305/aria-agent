"""Quick test of the bill scan endpoint pipeline."""
import os
import sys
import json
import logging

# Load .env
from dotenv import load_dotenv
load_dotenv()

# Setup logging to see everything
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(name)s %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)

os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

# Test PaddleOCR
print("=" * 60)
print("STAGE 1: PaddleOCR Test")
print("=" * 60)

from engine.bill_ocr import extract_text_from_image, is_ocr_available

img_bytes = open("test_bill.png", "rb").read()
print(f"OCR available: {is_ocr_available()}")
ocr_text = extract_text_from_image(img_bytes)
print(f"OCR result: {repr(ocr_text[:200] if ocr_text else None)}")

# Test Gemini Vision
print("\n" + "=" * 60)
print("STAGE 2: Gemini Vision Test")
print("=" * 60)

from engine.ai_client import _gemini_available, _gemini_client

print(f"Gemini available: {_gemini_available}")
if _gemini_available and _gemini_client:
    try:
        from google.genai import types as _gtypes
        response = _gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                _gtypes.Content(
                    parts=[
                        _gtypes.Part(
                            inline_data=_gtypes.Blob(
                                mime_type="image/png",
                                data=img_bytes,
                            )
                        ),
                        _gtypes.Part(text="What items are on this bill? Reply with just the item names."),
                    ]
                )
            ],
        )
        print(f"Gemini Vision response: {response.text[:300]}")
    except Exception as e:
        print(f"Gemini Vision FAILED: {e}")

# Test Groq Vision
print("\n" + "=" * 60)
print("STAGE 3: Groq Vision Test")
print("=" * 60)

from engine.ai_client import _groq_available, _GROQ_API_KEY, _GROQ_ENDPOINT
import base64
import requests

print(f"Groq available: {_groq_available}")
if _groq_available:
    try:
        img_b64 = base64.b64encode(img_bytes).decode("utf-8")
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
                                "url": f"data:image/png;base64,{img_b64}"
                            },
                        },
                        {"type": "text", "text": "What items are on this bill? Reply with just the item names."},
                    ],
                }
            ],
            "temperature": 0.3,
            "max_tokens": 512,
        }
        resp = requests.post(_GROQ_ENDPOINT, headers=headers, json=payload, timeout=60)
        print(f"Groq status: {resp.status_code}")
        if resp.status_code == 200:
            text = resp.json()["choices"][0]["message"]["content"]
            print(f"Groq Vision response: {text[:300]}")
        else:
            print(f"Groq Vision error: {resp.text[:300]}")
    except Exception as e:
        print(f"Groq Vision FAILED: {e}")

# Test Claude Vision
print("\n" + "=" * 60)
print("STAGE 4: Claude Vision Test")
print("=" * 60)

from engine.ai_client import _claude_available, _claude_client

print(f"Claude available: {_claude_available}")
if _claude_available and _claude_client:
    try:
        img_b64 = base64.b64encode(img_bytes).decode("utf-8")
        message = _claude_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=512,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": img_b64,
                            },
                        },
                        {"type": "text", "text": "What items are on this bill? Reply with just the item names."},
                    ],
                }
            ],
            temperature=0.3,
        )
        print(f"Claude Vision response: {message.content[0].text[:300]}")
    except Exception as e:
        print(f"Claude Vision FAILED: {e}")

print("\n" + "=" * 60)
print("DONE")
print("=" * 60)
