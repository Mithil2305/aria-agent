"""
Yukti Smart Advisor Engine
==========================
Transforms raw analytics into ACTIONABLE decisions:
- Automatic pricing recommendations
- Margin analysis with specific actions
- Natural language Q&A about business data
- Smart proactive alerts
- Market benchmarking context
- Weekly digest generation
- Actionable forecasting (stock-out warnings, etc.)
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Optional

from engine.ai_client import generate_ai_content, is_any_ai_available

log = logging.getLogger("yukti.smart_advisor")

# ── Tamil Nadu market benchmarks by business category ──
MARKET_BENCHMARKS = {
    "grocery": {
        "avg_margin_pct": 18,
        "avg_daily_revenue": 15000,
        "avg_basket_size": 320,
        "avg_customers_per_day": 60,
        "peak_hours": "7-9 AM, 6-8 PM",
        "peak_days": "Saturday, Sunday",
    },
    "restaurant": {
        "avg_margin_pct": 28,
        "avg_daily_revenue": 18000,
        "avg_basket_size": 280,
        "avg_customers_per_day": 80,
        "peak_hours": "12-2 PM, 7-9 PM",
        "peak_days": "Friday, Saturday, Sunday",
    },
    "retail": {
        "avg_margin_pct": 35,
        "avg_daily_revenue": 12000,
        "avg_basket_size": 450,
        "avg_customers_per_day": 35,
        "peak_hours": "11 AM - 1 PM, 5-8 PM",
        "peak_days": "Saturday, Sunday",
    },
    "pharmacy": {
        "avg_margin_pct": 20,
        "avg_daily_revenue": 10000,
        "avg_basket_size": 250,
        "avg_customers_per_day": 45,
        "peak_hours": "9-11 AM, 6-8 PM",
        "peak_days": "Monday, Tuesday",
    },
    "bakery": {
        "avg_margin_pct": 45,
        "avg_daily_revenue": 8000,
        "avg_basket_size": 180,
        "avg_customers_per_day": 50,
        "peak_hours": "7-10 AM, 4-7 PM",
        "peak_days": "Saturday, Sunday",
    },
    "general": {
        "avg_margin_pct": 25,
        "avg_daily_revenue": 10000,
        "avg_basket_size": 300,
        "avg_customers_per_day": 40,
        "peak_hours": "10 AM - 1 PM, 5-8 PM",
        "peak_days": "Saturday, Sunday",
    },
}


def generate_smart_alerts(kpis: list, anomalies: list, forecasts: list, logs: list) -> list:
    """
    Generate proactive, specific smart alerts from business data.
    Returns list of alert objects with severity, title, detail, and action.
    """
    alerts = []

    # Revenue decline alert
    revenue_kpi = _find_kpi(kpis, ["revenue", "sales", "income"])
    if revenue_kpi and revenue_kpi.get("change", 0) < -10:
        change = abs(revenue_kpi.get("change", 0))
        alerts.append({
            "id": "rev_decline",
            "severity": "critical",
            "icon": "📉",
            "title": f"Sales dropped {change:.0f}% this period",
            "detail": f"Your revenue fell from ₹{_fmt_inr(revenue_kpi.get('mean', 0))} average to ₹{_fmt_inr(revenue_kpi.get('current', 0))}.",
            "action": "Run a flash sale or WhatsApp offer to bring customers back this week.",
            "category": "revenue",
        })
    elif revenue_kpi and revenue_kpi.get("change", 0) > 15:
        alerts.append({
            "id": "rev_growth",
            "severity": "positive",
            "icon": "📈",
            "title": f"Revenue up {revenue_kpi['change']:.0f}% — great momentum!",
            "detail": "Your sales are growing. Now is the time to double down.",
            "action": "Increase stock of top-selling items by 20% to avoid stockouts.",
            "category": "revenue",
        })

    # Stock-out forecast alert
    for fc in forecasts:
        if fc.get("trend") == "downward" and fc.get("growthRate", 0) < -20:
            alerts.append({
                "id": f"forecast_decline_{fc.get('column', '')}",
                "severity": "high",
                "icon": "⚠️",
                "title": f"{fc.get('label', 'A metric')} may drop sharply next period",
                "detail": f"Predicted decline of {abs(fc.get('growthRate', 0)):.0f}% based on current trends.",
                "action": "Plan promotions or cost cuts now before the decline hits.",
                "category": "forecast",
            })

    # Customer footfall drop
    customer_kpi = _find_kpi(kpis, ["customer", "footfall", "visitor"])
    if customer_kpi and customer_kpi.get("change", 0) < -15:
        alerts.append({
            "id": "footfall_drop",
            "severity": "high",
            "icon": "👥",
            "title": f"Customer visits down {abs(customer_kpi['change']):.0f}%",
            "detail": "Fewer people are walking into your shop.",
            "action": "Distribute 500 flyers nearby and send a WhatsApp offer to regulars today.",
            "category": "footfall",
        })

    # Low margin alert from expense ratio
    expense_kpi = _find_kpi(kpis, ["expense", "cost", "spend"])
    if revenue_kpi and expense_kpi:
        rev = revenue_kpi.get("current", 0)
        exp = expense_kpi.get("current", 0)
        if rev > 0 and exp > 0:
            margin = ((rev - exp) / rev) * 100
            if margin < 10:
                alerts.append({
                    "id": "low_margin",
                    "severity": "critical",
                    "icon": "💸",
                    "title": f"Profit margin is critically low at {margin:.0f}%",
                    "detail": f"Expenses are eating ₹{_fmt_inr(exp)} out of ₹{_fmt_inr(rev)} revenue.",
                    "action": "Review your top 3 expenses. Negotiate supplier prices or remove the lowest-margin product.",
                    "category": "margin",
                })
            elif margin < 20:
                alerts.append({
                    "id": "margin_warning",
                    "severity": "medium",
                    "icon": "⚡",
                    "title": f"Margin at {margin:.0f}% — room for improvement",
                    "detail": "Your profit margin is below the industry average of ~25%.",
                    "action": "Try increasing prices by ₹10-20 on your top 5 items and track if demand holds.",
                    "category": "margin",
                })

    # Critical anomalies
    critical_anomalies = [a for a in anomalies if a.get("severity") == "critical"]
    if critical_anomalies:
        for anom in critical_anomalies[:2]:
            direction = "spike" if anom.get("type") == "spike" else "dip"
            alerts.append({
                "id": f"anomaly_{anom.get('column', '')}",
                "severity": "critical",
                "icon": "🚨",
                "title": f"Unusual {direction} in {anom.get('label', anom.get('column', 'data'))}",
                "detail": f"This is {abs(anom.get('deviation', 0)):.0f}% {direction} from your normal pattern. Z-score: {anom.get('zScore', 0):.1f}σ",
                "action": "Check if this was a data entry error or a real business event. Investigate immediately.",
                "category": "anomaly",
            })

    return alerts


def generate_pricing_insights(kpis: list, logs: list, category: str) -> list:
    """
    Generate specific pricing recommendations based on margins and benchmarks.
    """
    insights = []
    benchmarks = MARKET_BENCHMARKS.get(category, MARKET_BENCHMARKS["general"])
    
    revenue_kpi = _find_kpi(kpis, ["revenue", "sales", "income"])
    expense_kpi = _find_kpi(kpis, ["expense", "cost", "spend"])
    customer_kpi = _find_kpi(kpis, ["customer", "footfall", "visitor"])
    order_kpi = _find_kpi(kpis, ["order", "transaction", "bill"])

    if revenue_kpi and customer_kpi and customer_kpi.get("current", 0) > 0:
        avg_basket = revenue_kpi.get("current", 0) / max(customer_kpi.get("current", 1), 1)
        benchmark_basket = benchmarks["avg_basket_size"]
        
        if avg_basket < benchmark_basket * 0.8:
            gap = benchmark_basket - avg_basket
            monthly_upside = gap * customer_kpi.get("current", 0) * 30
            insights.append({
                "type": "pricing_opportunity",
                "icon": "💰",
                "title": f"Your average bill (₹{avg_basket:.0f}) is below market average (₹{benchmark_basket})",
                "detail": f"Businesses like yours in Tamil Nadu average ₹{benchmark_basket} per customer.",
                "action": f"Increasing your basket by just ₹{gap*0.3:.0f} could add ₹{_fmt_inr(monthly_upside*0.3)} per month.",
                "priority": "high",
            })

    if revenue_kpi and expense_kpi:
        rev = revenue_kpi.get("current", 0)
        exp = expense_kpi.get("current", 0)
        if rev > 0 and exp > 0:
            margin = ((rev - exp) / rev) * 100
            benchmark_margin = benchmarks["avg_margin_pct"]
            if margin < benchmark_margin - 5:
                gap = benchmark_margin - margin
                insights.append({
                    "type": "margin_gap",
                    "icon": "📊",
                    "title": f"Your margin ({margin:.0f}%) is {gap:.0f}% below {category} average ({benchmark_margin}%)",
                    "detail": f"Similar businesses in this category achieve {benchmark_margin}% margins.",
                    "action": f"Focus on reducing your highest expense or adding a ₹15-20 markup on low-price items.",
                    "priority": "high",
                })

    if revenue_kpi:
        daily_rev = revenue_kpi.get("current", 0)
        benchmark_rev = benchmarks["avg_daily_revenue"]
        if daily_rev < benchmark_rev * 0.7:
            insights.append({
                "type": "revenue_gap",
                "icon": "🎯",
                "title": f"Revenue (₹{_fmt_inr(daily_rev)}/day) is 30%+ below {category} average",
                "detail": f"Average {category} businesses in Tamil Nadu earn ₹{_fmt_inr(benchmark_rev)}/day.",
                "action": "Consider adding 2-3 high-demand items or extending working hours by 1 hour.",
                "priority": "medium",
            })

    return insights


def answer_business_question(
    question: str,
    kpis: list,
    logs: list,
    category: str,
    correlations: list = None,
    forecasts: list = None,
) -> dict:
    """
    Natural language Q&A about business data.
    Returns an answer with supporting data and recommendation.
    """
    question_lower = question.lower()
    
    # Build context summary
    revenue_kpi = _find_kpi(kpis, ["revenue", "sales", "income"])
    expense_kpi = _find_kpi(kpis, ["expense", "cost", "spend"])
    customer_kpi = _find_kpi(kpis, ["customer", "footfall", "visitor"])
    order_kpi = _find_kpi(kpis, ["order", "transaction", "bill"])

    # Compute stats from logs
    revenues = [float(l.get("revenue", 0) or 0) for l in logs if l.get("revenue")]
    days_of_week = {}
    for log in logs:
        try:
            date_str = log.get("date", "")
            if date_str:
                d = datetime.fromisoformat(str(date_str)[:10])
                day_name = d.strftime("%A")
                rev = float(log.get("revenue", 0) or 0)
                if day_name not in days_of_week:
                    days_of_week[day_name] = []
                days_of_week[day_name].append(rev)
        except Exception:
            pass

    day_averages = {day: sum(vals) / len(vals) for day, vals in days_of_week.items() if vals}

    if is_any_ai_available():
        # Use AI for sophisticated Q&A
        kpi_summary = "\n".join([
            f"- {k.get('label')}: current={k.get('current')}, change={k.get('change')}%, trend={k.get('trend')}"
            for k in kpis[:8]
        ])
        
        day_summary = "\n".join([
            f"- {day}: avg ₹{avg:,.0f}" for day, avg in sorted(day_averages.items(), key=lambda x: -x[1])
        ])

        prompt = f"""You are Yukti, an AI business advisor for Indian SMBs. Answer this question about the business data concisely and helpfully.

Business Category: {category}
Question: {question}

KPI Data:
{kpi_summary}

Sales by Day of Week:
{day_summary if day_summary else "Not enough data"}

Revenue stats: min=₹{min(revenues, default=0):,.0f}, max=₹{max(revenues, default=0):,.0f}, avg=₹{sum(revenues)/max(len(revenues),1):,.0f}

Rules:
1. Answer in 2-3 sentences max
2. Give ONE specific action recommendation
3. Use ₹ for currency, Indian number formatting
4. Be direct — tell them what to DO

Return JSON: {{"answer": "...", "highlight": "key number or stat", "action": "specific action", "confidence": "high/medium/low"}}"""

        try:
            text, _ = generate_ai_content(prompt)
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(text[start:end])
        except Exception as e:
            log.warning("AI Q&A failed: %s", e)

    # Rule-based fallback answers
    answer_data = {"confidence": "medium", "action": "Review your daily logs for more detail."}

    if any(w in question_lower for w in ["most profit", "best product", "top item", "highest margin"]):
        if revenue_kpi and expense_kpi:
            rev = revenue_kpi.get("current", 0)
            exp = expense_kpi.get("current", 0)
            margin = ((rev - exp) / rev * 100) if rev > 0 else 0
            answer_data["answer"] = f"Based on your overall data, your margin is {margin:.0f}%. Log individual product sales to identify top performers."
            answer_data["highlight"] = f"{margin:.0f}% margin"
            answer_data["action"] = "Start tracking individual product revenues in your daily log."
        else:
            answer_data["answer"] = "I need expense and revenue data to calculate product margins."
            answer_data["action"] = "Log both revenue and expenses daily to unlock this insight."

    elif any(w in question_lower for w in ["lowest", "worst day", "slow day", "bad day"]):
        if day_averages:
            worst_day = min(day_averages, key=day_averages.get)
            worst_avg = day_averages[worst_day]
            best_day = max(day_averages, key=day_averages.get)
            answer_data["answer"] = f"{worst_day} has your lowest average sales at ₹{worst_avg:,.0f}, compared to ₹{day_averages[best_day]:,.0f} on {best_day}."
            answer_data["highlight"] = f"{worst_day} — ₹{worst_avg:,.0f} avg"
            answer_data["action"] = f"Run a special {worst_day} combo or discount to boost slow-day sales."
        else:
            answer_data["answer"] = "I need more daily log entries (at least 2 weeks) to identify your slowest day."
            answer_data["action"] = "Keep logging daily and I'll identify patterns soon."

    elif any(w in question_lower for w in ["best day", "highest day", "busiest", "peak day"]):
        if day_averages:
            best_day = max(day_averages, key=day_averages.get)
            best_avg = day_averages[best_day]
            answer_data["answer"] = f"{best_day} is your best day with an average of ₹{best_avg:,.0f} in sales."
            answer_data["highlight"] = f"{best_day} — ₹{best_avg:,.0f}"
            answer_data["action"] = f"Make sure you're fully stocked and staffed every {best_day}."
        else:
            answer_data["answer"] = "Log more daily data to find your peak sales day."
            answer_data["action"] = "Log at least 2 weeks of data for day-of-week patterns."

    elif any(w in question_lower for w in ["revenue", "sales", "earning", "income"]):
        if revenue_kpi:
            answer_data["answer"] = f"Your current daily revenue is ₹{_fmt_inr(revenue_kpi.get('current', 0))}, which is {revenue_kpi.get('change', 0):+.0f}% vs your recent average."
            answer_data["highlight"] = f"₹{_fmt_inr(revenue_kpi.get('current', 0))}/day"
            answer_data["action"] = "To grow revenue by 10%, focus on increasing your average bill size by ₹50."
        
    elif any(w in question_lower for w in ["customer", "footfall", "visitor", "how many people"]):
        if customer_kpi:
            answer_data["answer"] = f"You're serving approximately {customer_kpi.get('current', 0):.0f} customers per day, {customer_kpi.get('change', 0):+.0f}% vs your average."
            answer_data["highlight"] = f"{customer_kpi.get('current', 0):.0f} customers/day"
            answer_data["action"] = "To increase footfall, try a WhatsApp broadcast to past customers with a limited-time offer."

    elif any(w in question_lower for w in ["profit", "margin", "take home", "earn"]):
        if revenue_kpi and expense_kpi:
            rev = revenue_kpi.get("current", 0)
            exp = expense_kpi.get("current", 0)
            profit = rev - exp
            margin = (profit / rev * 100) if rev > 0 else 0
            answer_data["answer"] = f"Your estimated daily profit is ₹{_fmt_inr(profit)} with a {margin:.0f}% margin (Revenue: ₹{_fmt_inr(rev)}, Expenses: ₹{_fmt_inr(exp)})."
            answer_data["highlight"] = f"₹{_fmt_inr(profit)}/day profit"
            answer_data["action"] = f"Monthly profit estimate: ₹{_fmt_inr(profit*30)}. Target 25%+ margin."
        else:
            answer_data["answer"] = "Log your expenses daily alongside revenue to calculate your actual profit."
            answer_data["action"] = "Add 'expenses' to your daily log to unlock profit tracking."

    else:
        answer_data["answer"] = f"Based on your data, revenue is ₹{_fmt_inr(revenue_kpi.get('current', 0)) if revenue_kpi else 'unknown'}/day with {customer_kpi.get('current', 0):.0f if customer_kpi else 'unknown'} customers."
        answer_data["action"] = "Log more specific data to answer this question better."

    return answer_data


def generate_weekly_digest(kpis: list, anomalies: list, forecasts: list, insights: list, logs: list) -> dict:
    """
    Generate a concise weekly business digest with the top actions for the week.
    """
    revenue_kpi = _find_kpi(kpis, ["revenue", "sales", "income"])
    customer_kpi = _find_kpi(kpis, ["customer", "footfall", "visitor"])
    expense_kpi = _find_kpi(kpis, ["expense", "cost", "spend"])

    revenues = [float(l.get("revenue", 0) or 0) for l in logs if l.get("revenue")]
    
    week_revenue = sum(revenues[-7:]) if len(revenues) >= 7 else sum(revenues)
    prev_week_revenue = sum(revenues[-14:-7]) if len(revenues) >= 14 else 0
    week_change = ((week_revenue - prev_week_revenue) / max(prev_week_revenue, 1) * 100) if prev_week_revenue > 0 else 0

    top_insight = insights[0] if insights else None
    
    trend_emoji = "📈" if week_change > 0 else "📉" if week_change < -5 else "➡️"
    trend_word = "Growing" if week_change > 5 else "Declining" if week_change < -5 else "Steady"

    # Top 3 actions for the week
    actions = []
    
    if revenue_kpi and revenue_kpi.get("change", 0) < -5:
        actions.append({
            "priority": 1,
            "action": "Run a WhatsApp promotion this week — sales are down.",
            "impact": "Could recover 10-15% of lost revenue",
        })
    
    if expense_kpi and revenue_kpi:
        rev = revenue_kpi.get("current", 0)
        exp = expense_kpi.get("current", 0)
        if rev > 0 and (exp / rev) > 0.6:
            actions.append({
                "priority": 2,
                "action": "Review your top 3 expenses — margins are tight.",
                "impact": "5% cost cut = ₹" + _fmt_inr(exp * 0.05) + "/day savings",
            })

    critical_anomalies = [a for a in anomalies if a.get("severity") == "critical"]
    if critical_anomalies:
        actions.append({
            "priority": 1,
            "action": f"Investigate the unusual pattern in {critical_anomalies[0].get('label', 'your data')}.",
            "impact": "Prevent data errors or catch a business problem early",
        })

    if len(actions) < 3 and top_insight:
        actions.append({
            "priority": 3,
            "action": top_insight.get("recommendation", "Review your business metrics."),
            "impact": "Long-term growth opportunity",
        })

    if len(actions) < 3:
        actions.append({
            "priority": 3,
            "action": "Log your data every evening for more accurate weekly insights.",
            "impact": "Unlock advanced predictions and alerts",
        })

    actions.sort(key=lambda x: x["priority"])

    return {
        "week_revenue": week_revenue,
        "week_change": round(week_change, 1),
        "trend_word": trend_word,
        "trend_emoji": trend_emoji,
        "top_insight_title": top_insight.get("title", "Keep up the momentum!") if top_insight else "Good work this week!",
        "actions": actions[:3],
        "alert_count": len([a for a in anomalies if a.get("severity") in ["critical", "high"]]),
    }


def generate_actionable_forecast_summary(forecasts: list, logs: list) -> list:
    """
    Convert forecast data into plain-language warnings and actions.
    """
    summaries = []
    revenues = [float(l.get("revenue", 0) or 0) for l in logs if l.get("revenue")]
    avg_daily_rev = sum(revenues) / max(len(revenues), 1)

    for fc in forecasts[:4]:
        label = fc.get("label", fc.get("column", "metric"))
        growth = fc.get("growthRate", 0)
        trend = fc.get("trend", "flat")
        predictions = fc.get("predictions", fc.get("forecast", []))
        next_val = predictions[0].get("value", predictions[0].get("predicted", 0)) if predictions else 0

        if trend == "downward" and growth < -10:
            # Calculate days until critical
            current = fc.get("historical", [{}])[-1].get("actual", 0) if fc.get("historical") else 0
            summaries.append({
                "column": fc.get("column", ""),
                "label": label,
                "type": "warning",
                "icon": "⚠️",
                "headline": f"{label} expected to drop {abs(growth):.0f}% next period",
                "detail": f"Projected value: {_fmt_val(next_val, label)}",
                "action": "Plan promotions or cost reductions NOW before the decline hits.",
                "urgency": "high",
            })
        elif trend == "upward" and growth > 15:
            summaries.append({
                "column": fc.get("column", ""),
                "label": label,
                "type": "opportunity",
                "icon": "🚀",
                "headline": f"{label} trending up {growth:.0f}% — capitalize on momentum",
                "detail": f"Next period forecast: {_fmt_val(next_val, label)}",
                "action": "Stock up and prepare for increased demand. Consider hiring temporary help.",
                "urgency": "medium",
            })
        elif trend == "flat":
            summaries.append({
                "column": fc.get("column", ""),
                "label": label,
                "type": "neutral",
                "icon": "➡️",
                "headline": f"{label} holding steady",
                "detail": f"Next period forecast: {_fmt_val(next_val, label)}",
                "action": "Try a new promotion or product to break out of the plateau.",
                "urgency": "low",
            })

    return summaries


# ── Helpers ──

def _find_kpi(kpis: list, keywords: list):
    for kpi in kpis:
        name = (kpi.get("label", "") + " " + kpi.get("column", "")).lower()
        if any(kw in name for kw in keywords):
            return kpi
    return None


def _fmt_inr(value) -> str:
    if value is None:
        return "?"
    num = float(value)
    if abs(num) >= 10_000_000:
        return f"{num / 10_000_000:.1f} Cr"
    if abs(num) >= 100_000:
        return f"{num / 100_000:.1f} L"
    if abs(num) >= 1_000:
        return f"{num / 1_000:.1f}K"
    return f"{num:,.0f}"


def _fmt_val(val, label: str) -> str:
    label_lower = label.lower()
    is_money = any(w in label_lower for w in ["revenue", "sales", "income", "expense", "profit", "cost"])
    if is_money:
        return f"₹{_fmt_inr(val)}"
    return f"{val:,.0f}"