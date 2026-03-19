"""
Layer 6: AI Insight & Reasoning Engine (Indian SMB Edition)

Generates shopkeeper-friendly, action-oriented insights in simple language.
Uses INR currency, Hindi-English terminology, and "tell them what to DO" framing.
Includes contradiction-prevention via trend-locking and data-sufficiency guards.
"""

import os
import json
from datetime import datetime

from engine.ai_client import generate_ai_content, is_any_ai_available

# ---------------------------------------------------------------------------
# Data-sufficiency thresholds
# ---------------------------------------------------------------------------
MIN_ROWS_FOR_FORECAST = 14
MIN_ROWS_FOR_BASIC = 3


# ────────────────────────────────────────────────────────────────────
#  PUBLIC API
# ────────────────────────────────────────────────────────────────────

def generate_insights(
    schema: dict,
    analytics: dict,
    predictions: dict,
    decisions: dict,
    history_context: dict | None = None,
) -> dict:
    """Produce insights, narrative, and recommendations in simple language."""
    row_count = schema.get("total_rows", schema.get("row_count", 0))
    kpis = analytics.get("kpis", [])
    anomalies = predictions.get("anomalies", [])
    forecasts = predictions.get("forecasts", [])
    correlations = decisions.get("correlations", [])
    trends = analytics.get("trends", [])
    history_context = history_context or {}

    # ── Step 1: Lock primary trend (contradiction prevention) ──
    trend_lock = _lock_primary_trend(kpis, trends)

    # ── Step 2: Data sufficiency ──
    data_sufficiency = (
        "full" if row_count >= MIN_ROWS_FOR_FORECAST
        else "partial" if row_count >= MIN_ROWS_FOR_BASIC
        else "insufficient"
    )

    # ── Step 3: Generate categorized insights ──
    insights = []

    # Khata (financial)
    insights.extend(_daily_khata_insights(kpis, trend_lock))

    # Footfall & orders
    insights.extend(_footfall_order_insights(kpis, trends, trend_lock))

    # Godown / inventory
    insights.extend(_godown_inventory_insights(kpis, trend_lock))

    # Customer insights
    insights.extend(_customer_insights(kpis, correlations, trend_lock))

    # Anomalies (simple language)
    insights.extend(_anomaly_insights_simple(anomalies))

    # Forecasts (only if enough data)
    if data_sufficiency == "full":
        insights.extend(_forecast_insights_simple(forecasts, trend_lock))

    # Data quality
    insights.extend(_quality_insights_simple(schema, data_sufficiency))

    # Personalized root-cause diagnostics from current + historical report memory
    insights.extend(
        _build_personalized_diagnostics(
            kpis=kpis,
            anomalies=anomalies,
            correlations=correlations,
            trend_lock=trend_lock,
            history_context=history_context,
        )
    )

    # AI-powered advisor (growth / savings / opportunity)
    advisor_insights, ai_provider = _ai_advisor_insights(
        kpis,
        anomalies,
        forecasts,
        correlations,
        trends,
        trend_lock,
        data_sufficiency,
        history_context,
    )
    insights.extend(advisor_insights)

    # ── Step 4: Sort by severity ──
    severity_order = {"critical": 0, "high": 1, "moderate": 2, "low": 3, "info": 4}
    insights.sort(key=lambda x: severity_order.get(x.get("severity", "info"), 5))

    # ── Step 5: Narrative ──
    narrative = _build_narrative_simple(
        kpis,
        anomalies,
        forecasts,
        trend_lock,
        data_sufficiency,
        history_context,
    )

    return {
        "insights": insights,
        "narrative": narrative,
        "trend_lock": trend_lock,
        "data_sufficiency": data_sufficiency,
        "ai_provider": ai_provider,
        "history_used": bool(history_context.get("recent_reports")),
    }


def _build_personalized_diagnostics(
    kpis: list,
    anomalies: list,
    correlations: list,
    trend_lock: dict,
    history_context: dict,
) -> list:
    """Create root-cause style insights with evidence and personalized actions."""
    diagnostics = []
    recurring = history_context.get("recurring_issues", [])[:3]
    wins = history_context.get("successful_actions", [])[:3]

    revenue_kpi = _find_kpi(kpis, ["revenue", "sales", "income"])
    customer_kpi = _find_kpi(kpis, ["customer", "footfall", "visitor"])
    expense_kpi = _find_kpi(kpis, ["expense", "cost", "spend"])

    if revenue_kpi and revenue_kpi.get("change", 0) < -4:
        change = revenue_kpi.get("change", 0)
        reasons = []
        if customer_kpi and customer_kpi.get("change", 0) < -3:
            reasons.append("customer visits have dropped")
        if expense_kpi and expense_kpi.get("change", 0) > 4:
            reasons.append("costs are rising faster than sales")
        if anomalies:
            reasons.append("recent anomaly spikes suggest unstable operations")
        if not reasons:
            reasons.append("conversion and demand need closer diagnosis")

        recurring_txt = (
            f"Recurring in past reports: {', '.join(recurring)}. " if recurring else ""
        )
        win_txt = f"Previously effective: {wins[0]}." if wins else ""

        diagnostics.append({
            "title": f"Why sales are down ({abs(change):.1f}%): likely demand + execution gap",
            "description": (
                f"Sales declined by {abs(change):.1f}% because {', '.join(reasons)}. "
                f"{recurring_txt}{win_txt}"
            ).strip(),
            "reason": ", ".join(reasons),
            "evidence": _diagnostic_evidence(revenue_kpi, customer_kpi, expense_kpi),
            "recommendation": _diagnostic_action_plan(recurring, wins, direction="down"),
            "expected_impact": "Can recover 6-12% revenue in 2-4 weeks when executed consistently",
            "severity": "high",
            "category": "khata",
            "section": "diagnose",
        })

    if expense_kpi and revenue_kpi:
        rev = revenue_kpi.get("current", 0)
        exp = expense_kpi.get("current", 0)
        if rev and exp and rev > 0:
            margin = ((rev - exp) / rev) * 100
            if margin < 15:
                diagnostics.append({
                    "title": f"Profit squeeze detected: margin at {margin:.1f}%",
                    "description": "Your current cost structure is suppressing profitability.",
                    "reason": "cost mix is heavier than healthy SMB benchmark levels",
                    "evidence": f"Revenue ~{_fmt_inr(rev)} vs expense ~{_fmt_inr(exp)}",
                    "recommendation": (
                        "Run a 7-day cost audit: renegotiate top supplier, reduce waste-heavy SKU orders, "
                        "and add premium upsell bundles at billing counter."
                    ),
                    "expected_impact": "2-5% margin improvement in the next billing cycle",
                    "severity": "high",
                    "category": "savings",
                    "section": "optimize",
                })

    strong_links = [
        c for c in correlations
        if c.get("strength") == "strong" and c.get("direction") in {"positive", "negative"}
    ]
    if strong_links:
        top = strong_links[0]
        direction = "moves together" if top.get("direction") == "positive" else "moves opposite"
        diagnostics.append({
            "title": f"Business driver found: {top.get('label1', 'Metric A')} {direction} {top.get('label2', 'Metric B')}",
            "description": "This relationship is strong enough to use as a weekly decision lever.",
            "reason": "historical movement indicates a repeatable operational pattern",
            "evidence": f"Correlation strength: {top.get('strength', 'strong')} ({top.get('correlation', 0):.2f})",
            "recommendation": (
                f"Track {top.get('label1', 'driver metric')} daily and set a threshold alert to protect "
                f"{top.get('label2', 'outcome metric')} before it drops."
            ),
            "expected_impact": "Earlier intervention and fewer surprise downturns",
            "severity": "moderate",
            "category": "opportunity",
            "section": "levers",
        })

    return diagnostics


def _diagnostic_evidence(revenue_kpi, customer_kpi, expense_kpi) -> str:
    parts = []
    if revenue_kpi:
        parts.append(
            f"Revenue {revenue_kpi.get('change', 0):+.1f}% (current {_fmt_inr(revenue_kpi.get('current', 0))})"
        )
    if customer_kpi:
        parts.append(f"Footfall {customer_kpi.get('change', 0):+.1f}%")
    if expense_kpi:
        parts.append(f"Expenses {expense_kpi.get('change', 0):+.1f}%")
    return " | ".join(parts) if parts else "Limited evidence due to sparse KPI history"


def _diagnostic_action_plan(recurring: list, wins: list, direction: str) -> str:
    if direction == "down":
        base = (
            "Next 7 days: Day 1 identify top 10 lost customers, Day 2 launch return-offer campaign, "
            "Day 3 fix stock/pricing gaps, Day 4-7 track conversion daily and iterate."
        )
    else:
        base = "Scale what is working while monitoring margin and stock pressure daily."
    if recurring:
        base += f" Focus first on recurring issue: {recurring[0]}."
    if wins:
        base += f" Reuse successful playbook: {wins[0]}."
    return base


# ────────────────────────────────────────────────────────────────────
#  TREND LOCKING (contradiction prevention)
# ────────────────────────────────────────────────────────────────────

def _lock_primary_trend(kpis: list, trends: dict) -> dict:
    """Determine the single dominant business direction.
    All insights must be consistent with this lock."""
    if not kpis:
        return {"direction": "stable", "metric": "business", "change": 0}

    # Find the "most important" KPI by keyword priority
    priority_keywords = [
        ["revenue", "sales", "income"],
        ["profit", "margin"],
        ["order", "transaction"],
        ["customer", "footfall"],
    ]

    best_kpi = None
    for keywords in priority_keywords:
        for kpi in kpis:
            name = (kpi.get("label", "") + " " + kpi.get("column", "")).lower()
            if any(kw in name for kw in keywords):
                best_kpi = kpi
                break
        if best_kpi:
            break

    if not best_kpi:
        best_kpi = kpis[0]

    change = best_kpi.get("change", 0)
    direction = "up" if change > 3 else "down" if change < -3 else "stable"

    return {
        "direction": direction,
        "metric": best_kpi.get("label", "business"),
        "change": round(change, 1),
    }


# ────────────────────────────────────────────────────────────────────
#  DAILY KHATA (financial insights)
# ────────────────────────────────────────────────────────────────────

def _daily_khata_insights(kpis: list, trend_lock: dict) -> list:
    insights = []
    revenue_kpi = _find_kpi(kpis, ["revenue", "sales", "income", "total"])
    expense_kpi = _find_kpi(kpis, ["expense", "cost", "spend"])

    if revenue_kpi:
        change = revenue_kpi.get("change", 0)
        current = revenue_kpi.get("current", 0)
        if change > 5:
            insights.append({
                "title": f"Revenue is growing at {change:.1f}%",
                "description": f"Your revenue is now ~{_fmt_inr(current)}. Keep this momentum going!",
                "recommendation": "Double down on what's working. Consider running the same promotions or stocking the same popular items.",
                "severity": "low",
                "category": "khata",
            })
        elif change < -5:
            insights.append({
                "title": f"Revenue dropped by {abs(change):.1f}%",
                "description": f"Revenue is down to ~{_fmt_inr(current)}. This needs your attention.",
                "recommendation": "Check if footfall is down, prices changed, or any popular items went out of stock.",
                "severity": "high",
                "category": "khata",
            })

    if revenue_kpi and expense_kpi:
        rev = revenue_kpi.get("current", 0)
        exp = expense_kpi.get("current", 0)
        if rev > 0 and exp > 0:
            margin = ((rev - exp) / rev) * 100
            if margin < 10:
                insights.append({
                    "title": f"Profit margin is only {margin:.0f}%",
                    "description": "Your expenses are eating most of the revenue.",
                    "recommendation": "Review your top 3 expenses. Can you negotiate better rates with suppliers?",
                    "severity": "high",
                    "category": "khata",
                })
            elif margin > 30:
                insights.append({
                    "title": f"Healthy profit margin: {margin:.0f}%",
                    "description": "You are keeping good control over costs.",
                    "recommendation": "Consider reinvesting some profit into marketing or inventory to grow faster.",
                    "severity": "low",
                    "category": "khata",
                })

    return insights


# ────────────────────────────────────────────────────────────────────
#  FOOTFALL & ORDER INSIGHTS
# ────────────────────────────────────────────────────────────────────

def _footfall_order_insights(kpis: list, trends: dict, trend_lock: dict) -> list:
    insights = []
    customer_kpi = _find_kpi(kpis, ["customer", "footfall", "visitor"])
    order_kpi = _find_kpi(kpis, ["order", "transaction", "bill"])

    if customer_kpi:
        change = customer_kpi.get("change", 0)
        if change > 5:
            insights.append({
                "title": f"Footfall up {change:.1f}%",
                "description": "More customers are visiting your shop. Great sign!",
                "recommendation": "Make sure you have enough staff and stock to handle the rush.",
                "severity": "low",
                "category": "footfall",
            })
        elif change < -5:
            insights.append({
                "title": f"Customer visits dropped {abs(change):.1f}%",
                "description": "Fewer people are coming to your shop compared to before.",
                "recommendation": "Try a special offer or WhatsApp broadcast to bring customers back.",
                "severity": "high",
                "category": "footfall",
            })

    if order_kpi and customer_kpi:
        orders = order_kpi.get("current", 0)
        customers = customer_kpi.get("current", 1)
        if customers > 0:
            conversion = (orders / customers) * 100
            if conversion < 50:
                insights.append({
                    "title": "Many visitors but few buyers",
                    "description": f"Only {conversion:.0f}% of visitors are making a purchase.",
                    "recommendation": "Check your pricing, product display, or offer a first-purchase discount.",
                    "severity": "moderate",
                    "category": "footfall",
                })

    return insights


# ────────────────────────────────────────────────────────────────────
#  GODOWN / INVENTORY INSIGHTS
# ────────────────────────────────────────────────────────────────────

def _godown_inventory_insights(kpis: list, trend_lock: dict) -> list:
    insights = []
    inv_kpi = _find_kpi(kpis, ["inventory", "stock", "godown", "quantity"])

    if inv_kpi:
        change = inv_kpi.get("change", 0)
        if change > 20:
            insights.append({
                "title": "Inventory is piling up",
                "description": f"Stock levels increased by {change:.0f}%. You might be over-ordering.",
                "recommendation": "Run a clearance sale or reduce next order quantity for slow-moving items.",
                "severity": "moderate",
                "category": "godown",
            })
        elif change < -20:
            insights.append({
                "title": "Stock running low!",
                "description": f"Inventory dropped by {abs(change):.0f}%. You might run out soon.",
                "recommendation": "Place a reorder now for your fastest-selling items. Don't wait!",
                "severity": "high",
                "category": "godown",
            })

    return insights


# ────────────────────────────────────────────────────────────────────
#  CUSTOMER INSIGHTS
# ────────────────────────────────────────────────────────────────────

def _customer_insights(kpis: list, correlations: list, trend_lock: dict) -> list:
    insights = []
    basket_kpi = _find_kpi(kpis, ["basket", "avg_order", "ticket", "average"])

    if basket_kpi:
        change = basket_kpi.get("change", 0)
        current = basket_kpi.get("current", 0)
        if change > 5:
            insights.append({
                "title": f"Average bill increased to {_fmt_inr(current)}",
                "description": "Customers are spending more per visit. Your upselling is working!",
                "recommendation": "Keep suggesting add-on products at the billing counter.",
                "severity": "low",
                "category": "customer",
            })
        elif change < -5:
            insights.append({
                "title": f"Average bill dropped to {_fmt_inr(current)}",
                "description": "Customers are buying less per visit.",
                "recommendation": "Try combo offers or 'buy 2 get 1' deals to increase bill size.",
                "severity": "moderate",
                "category": "customer",
            })

    # Simple correlation-based insight
    for corr in correlations[:3]:
        if corr.get("strength") == "strong" and corr.get("direction") == "positive":
            insights.append({
                "title": f"{corr.get('label1', 'A')} and {corr.get('label2', 'B')} grow together",
                "description": f"When {corr.get('label1', 'one')} increases, {corr.get('label2', 'the other')} also goes up.",
                "recommendation": f"Focus on boosting {corr.get('label1', 'the first metric')} to see gains in both.",
                "severity": "info",
                "category": "customer",
            })

    return insights


# ────────────────────────────────────────────────────────────────────
#  ANOMALY INSIGHTS (simple language)
# ────────────────────────────────────────────────────────────────────

def _anomaly_insights_simple(anomalies: list) -> list:
    insights = []
    critical = [a for a in anomalies if a.get("severity") == "critical"]
    high = [a for a in anomalies if a.get("severity") == "high"]

    if critical:
        names = ", ".join(a.get("label", a.get("column", "?")) for a in critical[:3])
        insights.append({
            "title": f"{len(critical)} number(s) look very unusual",
            "description": f"These need immediate attention: {names}",
            "recommendation": "Check if there was a data entry error, or if something genuinely changed in your business.",
            "severity": "critical",
            "category": "anomaly",
        })

    if high:
        names = ", ".join(a.get("label", a.get("column", "?")) for a in high[:3])
        insights.append({
            "title": f"{len(high)} number(s) are outside normal range",
            "description": f"Keep an eye on: {names}",
            "recommendation": "Monitor these over the next few days. If the pattern continues, investigate.",
            "severity": "high",
            "category": "anomaly",
        })

    if not anomalies:
        insights.append({
            "title": "Everything looks normal",
            "description": "No unusual patterns found in your data today.",
            "severity": "low",
            "category": "anomaly",
        })

    return insights


# ────────────────────────────────────────────────────────────────────
#  FORECAST INSIGHTS (simple language, no R-squared)
# ────────────────────────────────────────────────────────────────────

def _forecast_insights_simple(forecasts: list, trend_lock: dict) -> list:
    insights = []
    growing = []
    declining = []

    for f in forecasts:
        gr = f.get("growth_rate", f.get("growthRate", 0))
        label = f.get("label", f.get("column", "metric"))
        if gr > 5:
            growing.append(label)
        elif gr < -5:
            declining.append(label)

    if growing:
        insights.append({
            "title": f"{len(growing)} metric(s) predicted to grow",
            "description": f"Expected growth in: {', '.join(growing[:4])}.",
            "recommendation": "Prepare for increased demand. Stock up and ensure staffing is ready.",
            "severity": "low",
            "category": "forecast",
        })

    if declining:
        # Respect trend lock
        sev = "moderate"
        if trend_lock.get("direction") == "down":
            sev = "high"
        insights.append({
            "title": f"{len(declining)} metric(s) may decline",
            "description": f"Possible decline in: {', '.join(declining[:4])}.",
            "recommendation": "Plan promotions or cost reductions to offset the expected dip.",
            "severity": sev,
            "category": "forecast",
        })

    return insights


# ────────────────────────────────────────────────────────────────────
#  DATA QUALITY INSIGHTS
# ────────────────────────────────────────────────────────────────────

def _quality_insights_simple(schema: dict, data_sufficiency: str) -> list:
    insights = []
    dq = schema.get("data_quality", {})
    completeness = dq.get("overall_completeness", 100)

    if completeness < 90:
        insights.append({
            "title": "Some data is missing",
            "description": f"About {100 - completeness:.0f}% of your data has empty fields.",
            "recommendation": "Try to fill in all columns when entering data. Complete data = better insights.",
            "severity": "moderate",
            "category": "data_quality",
        })

    if data_sufficiency == "partial":
        insights.append({
            "title": "Log more days to unlock predictions",
            "description": "Yukti needs at least 14 days of data for accurate predictions.",
            "recommendation": "Keep logging your daily numbers. Predictions will unlock soon!",
            "severity": "info",
            "category": "data_quality",
        })
    elif data_sufficiency == "insufficient":
        insights.append({
            "title": "Need more data to analyze",
            "description": "You have less than 3 days of data. Yukti needs more to find patterns.",
            "recommendation": "Log your daily sales, expenses, and customer numbers for at least a week.",
            "severity": "moderate",
            "category": "data_quality",
        })

    return insights


# ────────────────────────────────────────────────────────────────────
#  AI-POWERED ADVISOR
# ────────────────────────────────────────────────────────────────────

def _ai_advisor_insights(
    kpis,
    anomalies,
    forecasts,
    correlations,
    trends,
    trend_lock,
    data_sufficiency,
    history_context,
) -> list:
    """Use AI (Gemini/Groq/Claude) to generate advisor insights."""
    if not is_any_ai_available():
        return _fallback_advisor_insights(kpis, trend_lock), "rule_based"

    # Build context for the AI
    kpi_summary = []
    for k in kpis[:8]:
        kpi_summary.append(
            f"- {k.get('label', k.get('column', '?'))}: "
            f"current={k.get('current', '?')}, change={k.get('change', 0)}%, "
            f"trend={k.get('trend', 'stable')}"
        )

    anomaly_summary = []
    for a in anomalies[:5]:
        anomaly_summary.append(
            f"- {a.get('label', a.get('column', '?'))}: "
            f"severity={a.get('severity', '?')}, type={a.get('type', '?')}"
        )

    forecast_summary = []
    for f in forecasts[:5]:
        forecast_summary.append(
            f"- {f.get('label', f.get('column', '?'))}: "
            f"growth={f.get('growthRate', 0):.1f}%"
        )

    recent_reports = history_context.get("recent_reports", [])[:5]
    report_summary = []
    for rep in recent_reports:
        report_summary.append(
            f"- {rep.get('section', 'analysis')}: trend={rep.get('trend', 'n/a')}; "
            f"top_issue={rep.get('top_issue', 'n/a')}; action={rep.get('action', 'n/a')}"
        )

    prompt = f"""You are Yukti, a business advisor for small Indian shopkeepers (kirana stores, 
small retail, local businesses in tier 2-3 cities).

BUSINESS DATA:
Trend direction: {trend_lock.get('direction', 'stable')} 
(primary metric: {trend_lock.get('metric', 'business')} at {trend_lock.get('change', 0)}%)
Data sufficiency: {data_sufficiency}

KPIs:
{chr(10).join(kpi_summary) if kpi_summary else 'No KPIs available'}

Anomalies:
{chr(10).join(anomaly_summary) if anomaly_summary else 'None'}

Forecasts:
{chr(10).join(forecast_summary) if forecast_summary else 'Not enough data'}

Historical Report Memory:
{chr(10).join(report_summary) if report_summary else 'No report memory available yet'}

RULES:
1. Use simple English a shopkeeper can understand
2. Use Indian Rupee (₹) for all money values
3. NO technical terms (no R², no regression, no coefficient, no statistical jargon)
4. Every insight MUST have a specific ACTION the shopkeeper can take TODAY or THIS WEEK
5. Be consistent with the trend direction: {trend_lock.get('direction', 'stable')}
6. Generate 6-8 insights covering different aspects of the business
7. Categories must be one of: growth, savings, opportunity
8. Include at least one insight about: pricing strategy, customer retention, seasonal planning, and cost optimization
9. Make recommendations very specific — mention exact numbers, days, or actions where possible
10. If forecasts show growth, suggest how to prepare for increased demand
11. If forecasts show decline, suggest concrete recovery steps
12. Every insight must include a clear reason of WHY this happened and evidence from given data
13. Reuse learnings from Historical Report Memory where relevant

Return ONLY valid JSON array like:
[
  {{
    "title": "short headline",
    "description": "1-2 sentence explanation with specific numbers",
        "reason": "root-cause in plain language",
        "evidence": "data-backed proof",
    "recommendation": "specific action to take today or this week",
        "expected_impact": "what business outcome to expect",
    "severity": "moderate",
        "category": "growth",
        "section": "diagnose"
  }}
]"""

    try:
        response, provider = generate_ai_content(prompt)
        if not response:
            return _fallback_advisor_insights(kpis, trend_lock), "rule_based"

        # Parse JSON from response
        text = response.strip()
        # Find JSON array in the response
        start = text.find("[")
        end = text.rfind("]") + 1
        if start >= 0 and end > start:
            parsed = json.loads(text[start:end])
            # Validate and clean
            valid = []
            allowed_cats = {"growth", "savings", "opportunity", "advisor", "khata", "customer", "footfall", "godown"}
            allowed_sections = {"diagnose", "prioritize", "act", "measure", "optimize", "levers"}
            for item in parsed[:8]:
                if isinstance(item, dict) and "title" in item:
                    if item.get("category") not in allowed_cats:
                        item["category"] = "advisor"
                    if item.get("section") not in allowed_sections:
                        item["section"] = "act"
                    if item.get("severity") not in {"critical", "high", "moderate", "low", "info"}:
                        item["severity"] = "moderate"
                    valid.append(item)
            return valid, provider
    except Exception as e:
        print(f"[insight_engine] AI advisor error: {e}")

    return _fallback_advisor_insights(kpis, trend_lock), "rule_based"


def _fallback_advisor_insights(kpis: list, trend_lock: dict) -> list:
    """Rule-based advisor when AI is unavailable — richer set of insights."""
    insights = []
    direction = trend_lock.get("direction", "stable")

    if direction == "up":
        insights.append({
            "title": "Your business is growing - time to invest!",
            "description": "Revenue is trending up. This is the best time to reinvest in your business.",
            "recommendation": "Consider adding a new product line, improving your shop display, or running a loyalty program.",
            "severity": "low",
            "category": "growth",
        })
        insights.append({
            "title": "Prepare for increased demand",
            "description": "Growing sales means you need to keep stock ready. Running out of popular items costs you money.",
            "recommendation": "Increase order quantity for your top 5 selling items by 15-20% this week to avoid stockouts.",
            "severity": "moderate",
            "category": "growth",
        })
    elif direction == "down":
        insights.append({
            "title": "Time to focus on cost control",
            "description": "Revenue is declining. Focus on reducing waste and unnecessary expenses.",
            "recommendation": "Review your top 5 expenses. Cancel any subscriptions you don't need. Negotiate with suppliers for better rates.",
            "severity": "high",
            "category": "savings",
        })
        insights.append({
            "title": "Win back lost customers",
            "description": "When sales drop, reconnecting with past customers is the fastest recovery path.",
            "recommendation": "Send a WhatsApp message to your top 10 regular customers with a special offer or discount to bring them back.",
            "severity": "high",
            "category": "growth",
        })
    else:
        insights.append({
            "title": "Business is steady - good time to experiment",
            "description": "Your numbers are stable. This is a safe time to try new things.",
            "recommendation": "Try a new product, a weekend sale, or start a WhatsApp group for your regular customers.",
            "severity": "moderate",
            "category": "opportunity",
        })

    # Revenue-specific insight
    revenue_kpi = _find_kpi(kpis, ["revenue", "sales", "income"])
    if revenue_kpi and revenue_kpi.get("current"):
        insights.append({
            "title": f"Your revenue is at {_fmt_inr(revenue_kpi['current'])}",
            "description": f"Current revenue trend: {revenue_kpi.get('trend', 'steady')}. "
                          f"Change: {revenue_kpi.get('change', 0):.1f}% from previous period.",
            "recommendation": "Set a target to increase revenue by 10% next month. Start by upselling to existing customers.",
            "severity": "info",
            "category": "growth",
        })

    # Expense-specific insight
    expense_kpi = _find_kpi(kpis, ["expense", "cost", "spend"])
    if expense_kpi and expense_kpi.get("current"):
        insights.append({
            "title": "Review your expenses",
            "description": f"Current expenses: {_fmt_inr(expense_kpi['current'])}. "
                          f"Even a 5% reduction can improve your profit significantly.",
            "recommendation": "List all recurring expenses. Cut the bottom 3 that give least value. Renegotiate supplier terms for bulk discounts.",
            "severity": "moderate",
            "category": "savings",
        })

    # Customer-specific insight
    customer_kpi = _find_kpi(kpis, ["customer", "footfall", "visitor"])
    if customer_kpi and customer_kpi.get("current"):
        change = customer_kpi.get("change", 0)
        if change > 5:
            insights.append({
                "title": "Customer footfall is increasing",
                "description": f"You're seeing {change:.0f}% more customers. Convert this traffic into higher sales.",
                "recommendation": "Place high-margin items near the billing counter. Train staff to suggest add-on products.",
                "severity": "low",
                "category": "growth",
            })
        elif change < -5:
            insights.append({
                "title": "Fewer customers this period",
                "description": f"Customer visits are down {abs(change):.0f}%. Focus on bringing people back.",
                "recommendation": "Run a 'bring a friend' offer or a limited-time discount on popular items to attract footfall.",
                "severity": "high",
                "category": "opportunity",
            })

    # Always add general business tips
    insights.append({
        "title": "Track your numbers daily",
        "description": "Businesses that track daily perform 30% better on average.",
        "recommendation": "Log your sales, expenses, and customer count every evening. Yukti will find patterns you might miss.",
        "severity": "info",
        "category": "advisor",
    })

    insights.append({
        "title": "Plan for the weekend rush",
        "description": "Most retail businesses see 30-40% higher sales on weekends.",
        "recommendation": "Stock up on fast-moving items by Thursday. Schedule extra help for Saturday if needed.",
        "severity": "info",
        "category": "opportunity",
    })

    return insights


# ────────────────────────────────────────────────────────────────────
#  NARRATIVE BUILDER
# ────────────────────────────────────────────────────────────────────

def _build_narrative_simple(kpis, anomalies, forecasts, trend_lock, data_sufficiency, history_context) -> str:
    """Build a 1-2 sentence summary for the dashboard header."""
    direction = trend_lock.get("direction", "stable")
    metric = trend_lock.get("metric", "business")
    change = abs(trend_lock.get("change", 0))

    parts = []

    if direction == "up":
        parts.append(f"Your {metric} is up {change}% - great progress!")
    elif direction == "down":
        parts.append(f"Your {metric} is down {change}% - let's work on recovery.")
    else:
        parts.append(f"Your {metric} is holding steady.")

    critical = len([a for a in anomalies if a.get("severity") == "critical"])
    if critical:
        parts.append(f"{critical} item(s) need your immediate attention.")

    if data_sufficiency == "partial":
        parts.append("Log more days to unlock full predictions.")
    elif data_sufficiency == "insufficient":
        parts.append("Start logging daily data to get better insights.")

    if history_context.get("recent_reports"):
        parts.append("This report is personalized using your previous report outcomes.")

    return " ".join(parts)


# ────────────────────────────────────────────────────────────────────
#  UTILITY HELPERS
# ────────────────────────────────────────────────────────────────────

def _find_kpi(kpis: list, keywords: list):
    """Find a KPI whose label/column matches any keyword."""
    for kpi in kpis:
        name = (kpi.get("label", "") + " " + kpi.get("column", "")).lower()
        if any(kw in name for kw in keywords):
            return kpi
    return None


def _fmt_inr(value) -> str:
    """Format a number in Indian Rupee style."""
    if value is None:
        return "?"
    num = float(value)
    if abs(num) >= 10_000_000:
        return f"₹{num / 10_000_000:.1f} Cr"
    if abs(num) >= 100_000:
        return f"₹{num / 100_000:.1f} L"
    if abs(num) >= 1_000:
        return f"₹{num / 1_000:.1f}K"
    return f"₹{num:,.0f}"