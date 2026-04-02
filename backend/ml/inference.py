"""
Yukti — Premium Analysis Inference Engine
==========================================
Loads the fine-tuned Yukti model (LoRA adapter on TinyLlama) and
generates premium month-end business analysis from user data.

Premium uses a two-stage flow for deeper value:
    1) Detect critical issues and decision levers from user data + Yukti model context
    2) Use the existing AI stack (Gemini/Groq/Claude fallback) to produce
         convincing, detailed reasoning and curated action plans.

If the local model is not available, the system still mines issues from
data and synthesizes a premium report with AI reasoning.
"""

import os
import json
import logging
from pathlib import Path
from datetime import datetime

from engine.ai_client import generate_ai_content, is_any_ai_available

log = logging.getLogger("yukti.premium")

MODEL_DIR = Path(__file__).parent / "checkpoints" / "yukti-model"
_model_loaded = False
_model = None
_tokenizer = None
_model_device = "cpu"


def _load_model():
    """Lazy-load the fine-tuned model + LoRA adapter."""
    global _model_loaded, _model, _tokenizer, _model_device

    if _model_loaded:
        return _model is not None

    _model_loaded = True  # Don't try again if it fails

    config_path = MODEL_DIR / "yukti_config.json"
    if not config_path.exists():
        log.warning("⚠  Yukti model not found at %s — will use rule-based fallback", MODEL_DIR)
        return False

    try:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel

        with open(config_path) as f:
            config = json.load(f)

        base_model_name = config["base_model"]
        log.info("🤖 Loading Yukti model (base: %s)…", base_model_name)

        _tokenizer = AutoTokenizer.from_pretrained(str(MODEL_DIR), trust_remote_code=True)
        if _tokenizer.pad_token is None:
            _tokenizer.pad_token = _tokenizer.eos_token

        device = "cuda" if torch.cuda.is_available() else "cpu"
        _model_device = device
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            device_map="auto" if device == "cuda" else None,
            trust_remote_code=True,
        )
        _model = PeftModel.from_pretrained(base_model, str(MODEL_DIR))
        _model.eval()

        log.info("✅ Yukti model loaded successfully on %s", device)
        return True

    except ModuleNotFoundError as e:
        log.warning(
            "⚠  Failed to load Yukti model: %s — install ML deps with: pip install -r backend/requirements.txt",
            e,
        )
        _model = None
        _tokenizer = None
        return False
    except Exception as e:
        log.warning("⚠  Failed to load Yukti model: %s — will use rule-based fallback", e)
        _model = None
        _tokenizer = None
        return False


def _generate_with_local_model(prompt: str, max_new_tokens: int | None = None) -> str:
    """Generate text using the locally loaded fine-tuned model."""
    import torch

    # CPU generation can be slow for 1B+ models; keep defaults conservative
    # so frontend requests complete within practical limits.
    if max_new_tokens is None:
        max_new_tokens = 420 if _model_device == "cpu" else 900

    max_new_tokens = int(os.getenv("YUKTI_PREMIUM_MAX_NEW_TOKENS", max_new_tokens))
    max_time_seconds = float(os.getenv("YUKTI_PREMIUM_MAX_TIME_SECONDS", 90 if _model_device == "cpu" else 150))

    inputs = _tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024)
    if torch.cuda.is_available():
        inputs = {k: v.cuda() for k, v in inputs.items()}

    with torch.no_grad():
        outputs = _model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            max_time=max_time_seconds,
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
        f"<|system|>\nYou are Yukti, an expert Indian business analytics AI specializing in "
        f"retail intelligence, financial reasoning, and actionable strategy recommendations "
        f"for small businesses in India.</s>\n"
        f"<|user|>\nProvide a comprehensive month-end business analysis for this {biz_type.lower()} "
        f"with actionable recommendations.\n\n{data_text}</s>\n"
        f"<|assistant|>\n"
    )

    return prompt, data_text


def generate_premium_analysis(business_data: dict) -> dict:
    """
    Generate premium month-end analysis using Yukti's own model ONLY.

    Chain:
      1. Local fine-tuned Yukti model (custom trained on curated datasets)
      2. Data-driven rule-based engine (statistical analysis — no external APIs)

    This function can use existing AI providers for reasoning synthesis.
    """
    import time
    t_start = time.time()

    prompt, data_text = build_premium_prompt(business_data)
    issues = _mine_business_issues(business_data)
    issue_context = _format_issue_context(issues)

    # ── Attempt 1: Local Yukti model ──
    local_output = ""
    if _load_model():
        log.info("🤖 Generating premium analysis with Yukti custom model…")
        try:
            local_output = _generate_with_local_model(prompt)
            log.info("✅ Yukti model generated %d chars", len(local_output))
        except Exception as e:
            log.warning("⚠  Yukti model inference failed: %s — using rule-based engine", e)

    # ── Core fallback/report body from data-driven engine ──
    if not _load_model():
        log.info("📋 Yukti model not trained yet — using data-driven rule-based engine")
    else:
        log.info("🔧 Falling back to data-driven rule-based engine…")

    analysis = _build_premium_rule_based(business_data, data_text)

    # ── Stage 2: AI reasoning synthesis for premium depth ──
    ai_provider = None
    ai_synthesized = None
    if is_any_ai_available():
        try:
            synthesis_prompt = _build_premium_synthesis_prompt(
                business_data=business_data,
                issue_context=issue_context,
                local_output=local_output,
                rule_based_output=analysis,
            )
            ai_synthesized, ai_provider = generate_ai_content(synthesis_prompt)
            log.info("✨ Premium synthesis generated via %s", ai_provider)
        except Exception as e:
            log.warning("⚠  Premium AI synthesis failed: %s", e)

    final_analysis = ai_synthesized or _compose_non_ai_premium_report(
        issue_context=issue_context,
        local_output=local_output,
        rule_based_output=analysis,
    )

    generated_by = "yukti_rule_based"
    provider_label = "Yukti Data-Driven Engine"
    if local_output and ai_provider:
        generated_by = f"yukti_model+{ai_provider}"
        provider_label = f"Yukti Model + {ai_provider.title()} Reasoning"
    elif local_output:
        generated_by = "yukti_model"
        provider_label = "Yukti Custom Model"
    elif ai_provider:
        generated_by = f"yukti_rule_based+{ai_provider}"
        provider_label = f"Yukti Data + {ai_provider.title()} Reasoning"

    elapsed = time.time() - t_start

    return {
        "status": "success",
        "generated_by": generated_by,
        "provider_label": provider_label,
        "analysis": final_analysis,
        "generation_time": round(elapsed, 2),
        "issue_count": len(issues),
    }


def _mine_business_issues(business_data: dict) -> list[dict]:
    """Find high-impact issues and decisions from data before AI narration."""
    stats = business_data.get("stats", {})
    logs = business_data.get("logSummary", [])

    avg_rev = float(stats.get("avg_daily_revenue", 0) or 0)
    max_rev = float(stats.get("max_revenue_day", 0) or 0)
    min_rev = float(stats.get("min_revenue_day", 0) or 0)
    avg_customers = float(stats.get("avg_daily_customers", 0) or 0)
    avg_orders = float(stats.get("avg_daily_orders", 0) or 0)

    revenues = []
    expenses = []
    for row in logs:
        try:
            if row.get("revenue") is not None:
                revenues.append(float(row.get("revenue", 0)))
            if row.get("expenses") is not None:
                expenses.append(float(row.get("expenses", 0)))
        except (ValueError, TypeError):
            continue

    exp_ratio = 0.0
    if revenues and expenses:
        exp_ratio = (sum(expenses) / max(sum(revenues), 1)) * 100

    trend_pct = 0.0
    if len(revenues) >= 6:
        mid = len(revenues) // 2
        first_half = sum(revenues[:mid]) / max(mid, 1)
        second_half = sum(revenues[mid:]) / max(len(revenues) - mid, 1)
        if first_half > 0:
            trend_pct = ((second_half - first_half) / first_half) * 100

    volatility = 0.0
    if avg_rev > 0:
        volatility = ((max_rev - min_rev) / avg_rev) * 100

    basket = avg_rev / max(avg_orders, 1) if avg_orders else 0.0

    issues = []

    if trend_pct < -6:
        issues.append({
            "title": "Demand contraction risk",
            "severity": "critical",
            "signal": f"Revenue trend {trend_pct:+.1f}% over tracked period",
            "reason": "Sales momentum is declining, likely from weaker repeat behavior or conversion drop.",
            "decision": "Trigger a 14-day recovery sprint with customer win-back campaign and conversion tracking.",
            "expected_impact": "Recover 8-15% monthly revenue if executed consistently.",
            "priority_score": 95,
        })

    if exp_ratio > 58:
        issues.append({
            "title": "Margin compression",
            "severity": "high",
            "signal": f"Expense ratio is {exp_ratio:.1f}%",
            "reason": "Cost structure is too heavy for SMB sustainability and likely eroding take-home profit.",
            "decision": "Run cost-per-order audit and renegotiate top suppliers while pruning low-margin SKUs.",
            "expected_impact": "Improve net margin by 3-7 percentage points.",
            "priority_score": 88,
        })

    if volatility > 45:
        issues.append({
            "title": "Revenue volatility instability",
            "severity": "high",
            "signal": f"Best-to-worst day spread is {volatility:.0f}%",
            "reason": "Daily demand swings indicate weak planning and inconsistent demand capture.",
            "decision": "Introduce weekday-specific offers and stock/staff planning by day-part.",
            "expected_impact": "Reduce downside days and stabilize cash flow.",
            "priority_score": 81,
        })

    if avg_customers > 0 and basket > 0 and basket < 250:
        issues.append({
            "title": "Low basket monetization",
            "severity": "medium",
            "signal": f"Average basket is ₹{basket:,.0f}",
            "reason": "Customer traffic is not translating into enough value per transaction.",
            "decision": "Deploy bundle architecture and checkout upsell scripts for top categories.",
            "expected_impact": "Raise basket size by 10-20% and improve operating leverage.",
            "priority_score": 70,
        })

    if not issues:
        issues.append({
            "title": "Growth headroom unlocked",
            "severity": "info",
            "signal": "Core metrics are stable without critical red flags",
            "reason": "Business appears operationally steady with room to scale efficiently.",
            "decision": "Shift focus from firefighting to expansion experiments and retention loops.",
            "expected_impact": "Compounded growth through disciplined execution.",
            "priority_score": 55,
        })

    issues.sort(key=lambda x: x.get("priority_score", 0), reverse=True)
    return issues


def _format_issue_context(issues: list[dict]) -> str:
    lines = []
    for idx, issue in enumerate(issues, 1):
        lines.append(
            f"{idx}. {issue['title']} [{issue['severity']}]\n"
            f"   Signal: {issue['signal']}\n"
            f"   Why: {issue['reason']}\n"
            f"   Decision: {issue['decision']}\n"
            f"   Expected Impact: {issue['expected_impact']}"
        )
    return "\n".join(lines)


def _build_premium_synthesis_prompt(
    business_data: dict,
    issue_context: str,
    local_output: str,
    rule_based_output: str,
) -> str:
    """Prompt for convincing premium reasoning with strong decision depth."""
    biz_type = business_data.get("businessType", "General")
    biz_cat = business_data.get("businessCategory", "general")
    region = business_data.get("region", "India")
    stats = business_data.get("stats", {})
    history = business_data.get("historyContext", {})

    return f"""You are Yukti Premium Intelligence.
Your task is to convert issue mining + model outputs into an executive-grade, deeply reasoned premium report.

BUSINESS:
- Type: {biz_type} ({biz_cat})
- Region: {region}
- Stats: {json.dumps(stats, indent=2)}

ISSUE MINING OUTPUT:
{issue_context}

LOCAL MODEL OUTPUT (if available):
{local_output[:4000] if local_output else 'Not available'}

RULE-BASED ANALYSIS:
{rule_based_output[:4500]}

HISTORICAL MEMORY CONTEXT:
{json.dumps(history, indent=2) if history else 'Not available'}

QUALITY REQUIREMENTS:
1. Make this clearly PREMIUM: depth, clarity, strong reasoning, specific numbers.
2. For every major issue, explain:
   - Why it is happening (root cause)
   - How severe it is
   - What decision should be taken now
   - What trade-off/risk comes with that decision
   - Expected impact range and timeline
3. Include complex decisions: pricing vs volume, margin vs growth, inventory depth vs cashflow, acquisition vs retention.
4. Prioritize actions into now/next/later and define measurable KPIs.
5. Use convincing business language for owners/investors, but keep it practical.
6. Integrate insights from historical memory where relevant.

OUTPUT FORMAT (Markdown only):
- Executive Verdict
- Top Issues (ranked)
- Root-Cause Analysis
- Strategic Decisions & Trade-offs
- 30-Day Transformation Plan (Week 1-4)
- KPI Scorecard (targets)
- Risk Radar & Contingency Triggers
- Closing Recommendation (boardroom-style)

Return only the final markdown report.
"""


def _compose_non_ai_premium_report(issue_context: str, local_output: str, rule_based_output: str) -> str:
    """Fallback premium composition when AI synthesis is unavailable."""
    parts = [
        "# Yukti Premium Intelligence Report",
        "## Top Issues (Data-Mined)",
        issue_context,
    ]
    if local_output:
        parts.extend([
            "## Local Model Findings",
            local_output,
        ])
    parts.extend([
        "## Detailed Operational Plan",
        rule_based_output,
    ])
    return "\n\n".join(parts)


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
        f"# 📊 Yukti Premium Month-End Report — {current_month}\n"
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
        f"*Generated by Yukti Premium Analysis Engine • {current_month}*"
    )
