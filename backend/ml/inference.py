"""
ARIA — Premium Analysis Inference Engine
==========================================
Loads the fine-tuned ARIA model (LoRA adapter on TinyLlama) and
generates premium month-end business analysis from user data.

This is the EXCLUSIVE premium engine — it does NOT fall back to
external AI APIs (Gemini / Groq). The premium feature is powered
entirely by ARIA's own custom-trained model.

If the model is not yet trained, it uses the built-in data-driven
rule-based engine (which uses statistical analysis on the user's
actual data — no external API calls).
"""

import os
import json
import logging
from pathlib import Path
from datetime import datetime

log = logging.getLogger("aria.premium")

MODEL_DIR = Path(__file__).parent / "checkpoints" / "aria-model"
_model_loaded = False
_model = None
_tokenizer = None


def _load_model():
    """Lazy-load the fine-tuned model + LoRA adapter."""
    global _model_loaded, _model, _tokenizer

    if _model_loaded:
        return _model is not None

    _model_loaded = True  # Don't try again if it fails

    config_path = MODEL_DIR / "aria_config.json"
    if not config_path.exists():
        log.warning("⚠  ARIA model not found at %s — will use AI fallback", MODEL_DIR)
        return False

    try:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel

        with open(config_path) as f:
            config = json.load(f)

        base_model_name = config["base_model"]
        log.info("🤖 Loading ARIA model (base: %s)…", base_model_name)

        _tokenizer = AutoTokenizer.from_pretrained(str(MODEL_DIR), trust_remote_code=True)
        if _tokenizer.pad_token is None:
            _tokenizer.pad_token = _tokenizer.eos_token

        device = "cuda" if torch.cuda.is_available() else "cpu"
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            device_map="auto" if device == "cuda" else None,
            trust_remote_code=True,
        )
        _model = PeftModel.from_pretrained(base_model, str(MODEL_DIR))
        _model.eval()

        log.info("✅ ARIA model loaded successfully on %s", device)
        return True

    except Exception as e:
        log.warning("⚠  Failed to load ARIA model: %s — will use AI fallback", e)
        _model = None
        _tokenizer = None
        return False


def _generate_with_local_model(prompt: str, max_new_tokens: int = 1500) -> str:
    """Generate text using the locally loaded fine-tuned model."""
    import torch

    inputs = _tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024)
    if torch.cuda.is_available():
        inputs = {k: v.cuda() for k, v in inputs.items()}

    with torch.no_grad():
        outputs = _model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
            pad_token_id=_tokenizer.pad_token_id,
        )

    # Decode only the new tokens
    new_tokens = outputs[0][inputs["input_ids"].shape[1]:]
    return _tokenizer.decode(new_tokens, skip_special_tokens=True).strip()


def build_premium_prompt(business_data: dict) -> str:
    """Build the premium analysis prompt from user's business data."""
    biz_type = business_data.get("businessType", "General Store")
    biz_cat = business_data.get("businessCategory", "general")
    region = business_data.get("region", "Tamil Nadu, India")
    stats = business_data.get("stats", {})
    log_summary = business_data.get("logSummary", [])
    stock_summary = business_data.get("stockSummary", [])

    # Compute deep metrics from logs
    revenues = []
    expenses_list = []
    customers_list = []
    orders_list = []
    waste_list = []

    for entry in log_summary:
        rev = entry.get("revenue")
        if rev is not None:
            try: revenues.append(float(rev))
            except (ValueError, TypeError): pass
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

    avg_rev = sum(revenues) / max(len(revenues), 1)
    avg_cust = sum(customers_list) / max(len(customers_list), 1)
    avg_orders = sum(orders_list) / max(len(orders_list), 1)
    total_exp = sum(expenses_list)
    total_rev = sum(revenues)
    exp_ratio = (total_exp / max(total_rev, 1)) * 100
    waste_pct = (sum(waste_list) / max(total_rev, 1)) * 100 if waste_list else 0
    basket = avg_rev / max(avg_orders, 1)

    # Revenue trend
    trend_pct = 0.0
    if len(revenues) >= 4:
        mid = len(revenues) // 2
        first_half = sum(revenues[:mid]) / mid
        second_half = sum(revenues[mid:]) / (len(revenues) - mid)
        if first_half > 0:
            trend_pct = ((second_half - first_half) / first_half) * 100

    data_text = (
        f"Business: {biz_type} ({biz_cat}) in {region}\n"
        f"Period: Last {len(log_summary)} days\n"
        f"Average daily revenue: ₹{avg_rev:,.0f}\n"
        f"Average daily customers: {avg_cust:.0f}\n"
        f"Average daily orders: {avg_orders:.0f}\n"
        f"Expense ratio: {exp_ratio:.0f}%\n"
        f"Average basket size: ₹{basket:,.0f}\n"
        f"Waste/shrinkage: {waste_pct:.1f}% of revenue\n"
        f"Revenue trend: {trend_pct:+.1f}%\n"
        f"Stock items tracked: {len(stock_summary)}\n"
        f"Max revenue day: ₹{max(revenues):,.0f}\n"
        f"Min revenue day: ₹{min(revenues):,.0f}\n"
    ) if revenues else f"Business: {biz_type} in {region}\nInsufficient data for deep analysis."

    # Build prompt in model's expected format
    prompt = (
        f"<|system|>\nYou are ARIA, an expert Indian business analytics AI specializing in "
        f"retail intelligence, financial reasoning, and actionable strategy recommendations "
        f"for small businesses in India.</s>\n"
        f"<|user|>\nProvide a comprehensive month-end business analysis for this {biz_type.lower()} "
        f"with actionable recommendations.\n\n{data_text}</s>\n"
        f"<|assistant|>\n"
    )

    return prompt, data_text


def generate_premium_analysis(business_data: dict) -> dict:
    """
    Generate premium month-end analysis using ARIA's own model ONLY.

    Chain:
      1. Local fine-tuned ARIA model (custom trained on curated datasets)
      2. Data-driven rule-based engine (statistical analysis — no external APIs)

    This function NEVER calls Gemini, Groq, or any external AI API.
    """
    import time
    t_start = time.time()

    prompt, data_text = build_premium_prompt(business_data)

    # ── Attempt 1: Local ARIA model ──
    if _load_model():
        log.info("🤖 Generating premium analysis with ARIA custom model…")
        try:
            raw_output = _generate_with_local_model(prompt)
            elapsed = time.time() - t_start
            log.info("✅ ARIA model generated %d chars in %.1fs", len(raw_output), elapsed)

            return {
                "status": "success",
                "generated_by": "aria_model",
                "provider_label": "ARIA Custom Model",
                "analysis": raw_output,
                "generation_time": round(elapsed, 2),
            }
        except Exception as e:
            log.warning("⚠  ARIA model inference failed: %s — using rule-based engine", e)

    # ── Fallback: Data-driven rule-based engine (NO external APIs) ──
    if not _load_model():
        log.info("📋 ARIA model not trained yet — using data-driven rule-based engine")
    else:
        log.info("🔧 Falling back to data-driven rule-based engine…")

    analysis = _build_premium_rule_based(business_data, data_text)
    elapsed = time.time() - t_start

    return {
        "status": "success",
        "generated_by": "aria_rule_based",
        "provider_label": "ARIA Data-Driven Engine",
        "analysis": analysis,
        "generation_time": round(elapsed, 2),
    }


def _build_premium_rule_based(business_data: dict, data_text: str) -> str:
    """Build a comprehensive rule-based premium analysis from actual data."""
    stats = business_data.get("stats", {})
    log_summary = business_data.get("logSummary", [])
    biz_type = business_data.get("businessType", "Store")

    avg_rev = stats.get("avg_daily_revenue", 0)
    avg_cust = stats.get("avg_daily_customers", 0)
    avg_orders = stats.get("avg_daily_orders", 0)
    max_rev = stats.get("max_revenue_day", 0)
    min_rev = stats.get("min_revenue_day", 0)
    total_entries = stats.get("total_entries", 0)

    # Compute from logs
    revenues = []
    expenses_list = []
    for entry in log_summary:
        rev = entry.get("revenue")
        if rev is not None:
            try: revenues.append(float(rev))
            except: pass
        exp = entry.get("expenses")
        if exp is not None:
            try: expenses_list.append(float(exp))
            except: pass

    total_rev = sum(revenues) if revenues else avg_rev * total_entries
    total_exp = sum(expenses_list)
    exp_ratio = (total_exp / max(total_rev, 1)) * 100
    daily_profit = avg_rev - (total_exp / max(total_entries, 1))
    basket = avg_rev / max(avg_orders, 1) if avg_orders else 0

    trend_pct = 0
    if len(revenues) >= 4:
        mid = len(revenues) // 2
        first = sum(revenues[:mid]) / mid
        second = sum(revenues[mid:]) / (len(revenues) - mid)
        if first > 0:
            trend_pct = ((second - first) / first) * 100

    current_month = datetime.now().strftime("%B %Y")

    return (
        f"# 📊 ARIA Premium Month-End Report — {current_month}\n"
        f"## {biz_type}\n\n"
        f"---\n\n"
        f"## 1. Executive Summary\n"
        f"Your {biz_type.lower()} averaged ₹{avg_rev:,.0f}/day over {total_entries} tracked days "
        f"with a revenue trend of {trend_pct:+.1f}%. "
        f"{'Strong momentum — capitalize on it.' if trend_pct > 5 else 'Needs strategic action to accelerate growth.' if trend_pct > -5 else 'Urgent intervention required to reverse the decline.'}\n\n"
        f"## 2. Revenue Performance\n"
        f"- **Daily Average**: ₹{avg_rev:,.0f}\n"
        f"- **Best Day**: ₹{max_rev:,.0f}\n"
        f"- **Worst Day**: ₹{min_rev:,.0f}\n"
        f"- **Revenue Spread**: {((max_rev-min_rev)/max(avg_rev,1))*100:.0f}% (best-to-worst gap)\n"
        f"- **Trend**: {trend_pct:+.1f}% — {'📈 Growing' if trend_pct > 5 else '📊 Stable' if trend_pct > -5 else '📉 Declining'}\n"
        f"- **Monthly Projection**: ₹{avg_rev*30:,.0f}\n\n"
        f"## 3. Profitability Analysis\n"
        f"- **Expense Ratio**: {exp_ratio:.0f}%\n"
        f"- **Est. Daily Profit**: ₹{daily_profit:,.0f}\n"
        f"- **Monthly Profit Projection**: ₹{daily_profit*30:,.0f}\n"
        f"- **Assessment**: {'⚠️ High cost structure — target reducing to 50%' if exp_ratio > 60 else '✅ Healthy margins — maintain discipline'}\n\n"
        f"## 4. Customer Intelligence\n"
        f"- **Daily Footfall**: {avg_cust:.0f} customers\n"
        f"- **Avg Basket Size**: ₹{basket:,.0f}\n"
        f"- **Revenue per Customer**: ₹{avg_rev/max(avg_cust,1):,.0f}\n"
        f"- **Opportunity**: Increasing basket by just ₹{max(20,basket*0.1):,.0f} adds ₹{max(20,basket*0.1)*avg_cust:,.0f}/day\n\n"
        f"## 5. Risk Assessment\n"
        f"1. **Revenue Volatility** — ₹{max_rev-min_rev:,.0f} daily swing needs stabilization\n"
        f"2. **{'High expense ratio' if exp_ratio > 55 else 'Customer concentration'}** — "
        f"{'Negotiate supplier terms immediately' if exp_ratio > 55 else 'Diversify customer acquisition channels'}\n"
        f"3. **Single-channel dependency** — Add WhatsApp orders, Google Business, and local delivery\n\n"
        f"## 6. Growth Opportunities (Ranked by Impact)\n"
        f"1. 🎯 **Loyalty Programme** — Capture 40% of {avg_cust:.0f} daily customers as repeats\n"
        f"2. 📱 **WhatsApp Commerce** — ₹{avg_rev*0.15:,.0f}/day from broadcast offers\n"
        f"3. 🏷️ **Combo Deals** — Boost basket from ₹{basket:,.0f} to ₹{basket*1.2:,.0f}\n"
        f"4. 🚗 **Local Delivery** — Reach 2km radius customers who don't walk in\n"
        f"5. 📊 **Dynamic Pricing** — Premium pricing during peak hours, discounts during off-peak\n\n"
        f"## 7. Monthly Action Plan\n"
        f"**Week 1**: Audit expenses, set ₹{avg_rev*1.1:,.0f}/day target, launch WhatsApp list\n"
        f"**Week 2**: Start combo deals, negotiate 2 supplier contracts\n"
        f"**Week 3**: Distribute pamphlets, launch loyalty punch cards\n"
        f"**Week 4**: Review month, plan next month's stock orders\n\n"
        f"## 8. Next Month Forecast\n"
        f"- **Revenue Target**: ₹{avg_rev*1.15:,.0f}/day (₹{avg_rev*1.15*30:,.0f}/month)\n"
        f"- **Customer Target**: {avg_cust*1.1:.0f}/day\n"
        f"- **Profit Target**: ₹{daily_profit*1.2:,.0f}/day\n\n"
        f"---\n"
        f"*Generated by ARIA Premium Analysis Engine • {current_month}*"
    )
