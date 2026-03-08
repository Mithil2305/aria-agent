"""
Layer 6: AI Insight & Reasoning Engine
Generates human-readable insights, narratives, severity-ranked recommendations,
and business context from the full analytics pipeline output.
Optionally uses Google Gemini API for AI-powered strategy generation.
"""

import os
import json
from datetime import datetime


# ---------------------------------------------------------------------------
# Optional: AI integration (Gemini → Groq fallback)
# ---------------------------------------------------------------------------
from engine.ai_client import generate_ai_content, is_any_ai_available


def generate_insights(
    schema: dict,
    analytics: dict,
    predictions: dict,
    decisions: dict,
) -> dict:
    """Produce insights, narrative, and recommendations."""
    insights = []

    insights.extend(_kpi_insights(analytics.get("kpis", [])))
    insights.extend(_anomaly_insights(predictions.get("anomalies", [])))
    insights.extend(_forecast_insights(predictions.get("forecasts", [])))
    insights.extend(_correlation_insights(decisions.get("correlations", [])))
    insights.extend(_risk_insights(decisions.get("risk_scores", [])))
    insights.extend(_quality_insights(schema))
    insights.extend(_growth_strategy_insights(analytics, predictions, decisions))
    insights.extend(_revenue_opportunity_insights(analytics, predictions))

    # AI-powered strategy insights (Gemini)
    ai_insights = _gemini_strategy_insights(schema, analytics, predictions, decisions)
    if ai_insights:
        insights.extend(ai_insights)

    # Deduplicate by title
    seen = set()
    unique_insights = []
    for ins in insights:
        if ins["title"] not in seen:
            seen.add(ins["title"])
            unique_insights.append(ins)
    insights = unique_insights

    # Sort by severity weight then confidence
    severity_weight = {"critical": 4, "high": 3, "moderate": 2, "low": 1, "info": 0}
    insights.sort(
        key=lambda x: (severity_weight.get(x["severity"], 0), x["confidence"]),
        reverse=True,
    )

    # Limit to top 20
    insights = insights[:20]

    narrative = _build_narrative(schema, analytics, predictions, decisions, insights)

    severity_summary = {"critical": 0, "high": 0, "moderate": 0, "low": 0, "info": 0}
    for ins in insights:
        sev = ins["severity"]
        if sev in severity_summary:
            severity_summary[sev] += 1

    return {
        "insights": insights,
        "narrative": narrative,
        "severity_summary": severity_summary,
        "generated_at": datetime.utcnow().isoformat(),
    }


# ------------------------------------------------------------------ #
#  Insight generators                                                  #
# ------------------------------------------------------------------ #

def _kpi_insights(kpis: list) -> list:
    insights = []
    for kpi in kpis:
        name = kpi.get("label", kpi.get("column", ""))
        growth = kpi.get("change", kpi.get("growth", 0))
        significance = kpi.get("significance", 0)
        trend = kpi.get("trend", "stable")

        if abs(growth) > 15:
            severity = "high" if abs(growth) > 25 else "moderate"
            direction = "increase" if growth > 0 else "decrease"
            insights.append(_make_insight(
                title=f"Significant {direction} in {name}",
                description=(
                    f"{name} shows a {abs(growth):.1f}% {direction} over the analysis period. "
                    f"The trend is statistically {'significant' if significance > 0.7 else 'notable'} "
                    f"and warrants {'immediate' if abs(growth) > 25 else 'close'} attention."
                ),
                severity=severity,
                confidence=min(0.95, significance),
                category="trend",
                metric=name,
                recommendation=(
                    f"Investigate the root cause of the {direction} in {name}. "
                    + ("This positive trend should be reinforced." if growth > 0
                       else "Develop mitigation strategies to address this decline.")
                ),
            ))

        if kpi.get("volatility", 0) > 30:
            insights.append(_make_insight(
                title=f"High volatility in {name}",
                description=(
                    f"{name} exhibits a coefficient of variation of {kpi['volatility']:.1f}%, "
                    "indicating substantial instability that introduces forecasting risk."
                ),
                severity="moderate",
                confidence=0.85,
                category="risk",
                metric=name,
                recommendation=(
                    f"Identify the factors driving variability in {name} and consider "
                    "implementing stabilisation measures or tighter monitoring."
                ),
            ))

    return insights


def _anomaly_insights(anomalies: list) -> list:
    insights = []

    critical = [a for a in anomalies if a.get("severity") == "critical"]
    high = [a for a in anomalies if a.get("severity") == "high"]

    if critical:
        cols = list({a.get("label", a.get("column", "")) for a in critical})
        insights.append(_make_insight(
            title="Critical anomalies detected",
            description=(
                f"{len(critical)} critical anomalies detected across {', '.join(cols[:3])}. "
                "These represent extreme deviations that could indicate data quality issues "
                "or significant operational events."
            ),
            severity="critical",
            confidence=0.90,
            category="anomaly",
            metric=cols[0] if cols else None,
            recommendation=(
                "Immediately investigate critical anomalies to determine if they are "
                "genuine events or data errors. Implement alerting if not already in place."
            ),
        ))

    if high:
        cols = list({a.get("label", a.get("column", "")) for a in high})
        insights.append(_make_insight(
            title="Multiple high-severity anomalies",
            description=(
                f"{len(high)} high-severity anomalies found in {', '.join(cols[:3])}. "
                "These warrant review as part of regular monitoring."
            ),
            severity="high",
            confidence=0.85,
            category="anomaly",
            metric=cols[0] if cols else None,
            recommendation="Review anomalies in the context of business events and seasonality.",
        ))

    return insights


def _forecast_insights(forecasts: list) -> list:
    insights = []
    for fc in forecasts:
        name = fc.get("label", fc.get("column", ""))
        r2 = fc.get("r2", fc.get("r_squared", 0))
        forecast_points = fc.get("forecast", [])

        if not forecast_points:
            continue

        last_actual = fc.get("historical", [])
        if last_actual:
            last_val = last_actual[-1].get("actual", last_actual[-1].get("value", 0))
        else:
            last_val = 0

        end_val = forecast_points[-1].get("predicted", forecast_points[-1].get("value", 0)) if forecast_points else 0
        if last_val != 0:
            forecast_change = (end_val - last_val) / abs(last_val) * 100
        else:
            forecast_change = 0

        if abs(forecast_change) > 10:
            direction = "growth" if forecast_change > 0 else "decline"
            severity = "high" if abs(forecast_change) > 20 else "moderate"
            insights.append(_make_insight(
                title=f"Projected {direction} in {name}",
                description=(
                    f"Forecasting model (R²={r2:.2f}) projects a {abs(forecast_change):.1f}% "
                    f"{direction} in {name} over the forecast horizon. "
                    f"Model confidence is {'high' if r2 > 0.8 else 'moderate' if r2 > 0.5 else 'low'}."
                ),
                severity=severity,
                confidence=min(0.92, r2),
                category="forecast",
                metric=name,
                recommendation=(
                    f"{'Capitalise on' if forecast_change > 0 else 'Prepare for'} the projected "
                    f"{direction} in {name}. "
                    f"{'Consider scaling resources to meet expected demand.' if forecast_change > 0 else 'Develop contingency plans to mitigate impact.'}"
                ),
            ))

        if r2 < 0.4:
            insights.append(_make_insight(
                title=f"Low forecast confidence for {name}",
                description=(
                    f"The forecasting model for {name} has an R² of {r2:.2f}, indicating limited "
                    "predictive power. Forecasts should be interpreted with caution."
                ),
                severity="low",
                confidence=0.80,
                category="forecast",
                metric=name,
                recommendation=(
                    "Gather more historical data or consider external factors that may improve "
                    "forecast accuracy."
                ),
            ))

    return insights


def _correlation_insights(correlations: list) -> list:
    insights = []
    strong = [c for c in correlations if c.get("strength") == "strong" and c.get("is_significant")]

    for corr in strong[:5]:
        direction = corr["direction"]
        insights.append(_make_insight(
            title=f"Strong {direction} link: {corr['label1']} ↔ {corr['label2']}",
            description=(
                f"{corr['label1']} and {corr['label2']} have a strong {direction} correlation "
                f"(r = {corr['correlation']:.2f}, p = {corr['p_value']:.4f}). "
                "Changes in one metric likely accompany changes in the other."
            ),
            severity="moderate",
            confidence=0.88,
            category="correlation",
            metric=corr["col1"],
            recommendation=(
                f"Consider {corr['label1']} and {corr['label2']} together when making decisions. "
                "Optimising one may have a direct effect on the other."
            ),
        ))

    return insights


def _risk_insights(risk_scores: list) -> list:
    insights = []
    high_risk = [r for r in risk_scores if r["risk_level"] in ("critical", "high")]

    for risk in high_risk[:3]:
        insights.append(_make_insight(
            title=f"Elevated risk: {risk['label']}",
            description=(
                f"{risk['label']} has a composite risk score of {risk['risk_score']:.2f} "
                f"({risk['risk_level']}). Contributing factors: "
                f"volatility ({risk['volatility_component']:.0%}), "
                f"negative trend ({risk['trend_component']:.0%}), "
                f"outliers ({risk['outlier_component']:.0%})."
            ),
            severity=risk["risk_level"],
            confidence=0.82,
            category="risk",
            metric=risk["column"],
            recommendation=(
                f"Prioritise monitoring of {risk['label']} and address the dominant risk factor."
            ),
        ))

    return insights


def _quality_insights(schema: dict) -> list:
    insights = []
    quality = schema.get("data_quality", {})
    completeness = quality.get("overall_completeness", quality.get("completeness", 100))

    if completeness < 95:
        severity = "high" if completeness < 80 else "moderate"
        insights.append(_make_insight(
            title="Data completeness concern",
            description=(
                f"Overall data completeness is {completeness:.1f}%. "
                "Missing values may bias analytics and reduce forecast reliability."
            ),
            severity=severity,
            confidence=0.95,
            category="data_quality",
            metric=None,
            recommendation=(
                "Investigate missing data patterns. Consider imputation strategies or "
                "data pipeline improvements to increase completeness."
            ),
        ))

    return insights


# ------------------------------------------------------------------ #
#  Growth & Strategy Insights                                          #
# ------------------------------------------------------------------ #

def _growth_strategy_insights(analytics: dict, predictions: dict, decisions: dict) -> list:
    """Generate actionable growth and strategy insights from KPIs, forecasts, and correlations."""
    insights = []
    kpis = analytics.get("kpis", [])
    forecasts = predictions.get("forecasts", [])
    correlations = decisions.get("correlations", [])

    # Identify top growing KPIs as growth opportunities
    growing_kpis = sorted(
        [k for k in kpis if k.get("growth_rate", k.get("change", 0)) > 0],
        key=lambda k: k.get("growth_rate", k.get("change", 0)),
        reverse=True,
    )

    for kpi in growing_kpis[:3]:
        name = kpi.get("label", kpi.get("column", ""))
        growth = kpi.get("growth_rate", kpi.get("change", 0))
        current = kpi.get("current", kpi.get("mean", 0))
        insights.append(_make_insight(
            title=f"Accelerate growth in {name}",
            description=(
                f"{name} is already growing at {abs(growth):.1f}% "
                f"(current: {current:,.0f}). This positive momentum represents a "
                "strategic opportunity to double down with targeted investments."
            ),
            severity="moderate",
            confidence=0.85,
            category="growth",
            metric=name,
            recommendation=(
                f"Allocate additional resources to sustain {name} growth. "
                "Analyse what's driving this metric upward and replicate those conditions. "
                "Set a stretch target 15-20% above current trajectory."
            ),
        ))

    # Declining KPIs as improvement opportunities
    declining_kpis = sorted(
        [k for k in kpis if k.get("growth_rate", k.get("change", 0)) < -5],
        key=lambda k: k.get("growth_rate", k.get("change", 0)),
    )

    for kpi in declining_kpis[:2]:
        name = kpi.get("label", kpi.get("column", ""))
        decline = abs(kpi.get("growth_rate", kpi.get("change", 0)))
        insights.append(_make_insight(
            title=f"Recovery opportunity: {name}",
            description=(
                f"{name} has declined by {decline:.1f}%. Reversing this trend "
                "could significantly impact overall business performance."
            ),
            severity="high",
            confidence=0.82,
            category="opportunity",
            metric=name,
            recommendation=(
                f"Conduct root-cause analysis on the {name} decline. "
                "Implement a 30-day recovery plan with weekly checkpoints. "
                "Consider competitive benchmarking to identify gaps."
            ),
        ))

    # Forecast-based growth strategies
    positive_forecasts = [f for f in forecasts if f.get("growth_rate", 0) > 5]
    for fc in positive_forecasts[:2]:
        name = fc.get("label", fc.get("column", ""))
        growth = fc.get("growth_rate", 0)
        r2 = fc.get("r2", 0)
        insights.append(_make_insight(
            title=f"Capitalise on projected {name} growth",
            description=(
                f"Forecasting models project {growth:.1f}% growth in {name} "
                f"(model confidence: {r2*100:.0f}%). Proactive preparation can "
                "maximise returns from this projected uptrend."
            ),
            severity="moderate",
            confidence=min(0.90, r2),
            category="growth",
            metric=name,
            recommendation=(
                f"Pre-position inventory and staffing for the projected increase in {name}. "
                "Develop promotional campaigns timed to coincide with the growth window. "
                "Monitor weekly to confirm the trend materialises."
            ),
        ))

    # Correlation-based strategy (e.g. marketing → revenue link)
    strong_positive = [c for c in correlations
                       if c.get("strength") == "strong" and c.get("direction") == "positive"]
    for corr in strong_positive[:2]:
        col1 = corr.get("label1", corr.get("col1", ""))
        col2 = corr.get("label2", corr.get("col2", ""))
        r = corr.get("correlation", 0)
        insights.append(_make_insight(
            title=f"Strategic lever: {col1} drives {col2}",
            description=(
                f"A strong positive correlation (r={r:.2f}) exists between {col1} and {col2}. "
                f"Increasing {col1} is statistically likely to boost {col2}."
            ),
            severity="moderate",
            confidence=0.87,
            category="growth",
            metric=corr.get("col1", ""),
            recommendation=(
                f"Test a controlled increase in {col1} to measure the impact on {col2}. "
                "Start with a 10-15% uplift and track results over 2-4 weeks. "
                "Use A/B testing where possible for statistical rigour."
            ),
        ))

    # If no specific growth insights were generated, add generic ones
    if not insights and kpis:
        best_kpi = max(kpis, key=lambda k: k.get("current", k.get("mean", 0)), default=None)
        if best_kpi:
            name = best_kpi.get("label", best_kpi.get("column", ""))
            insights.append(_make_insight(
                title=f"Optimise your top metric: {name}",
                description=(
                    f"{name} is your strongest performing metric. Focus on protecting and "
                    "growing this key driver through systematic optimisation."
                ),
                severity="moderate",
                confidence=0.75,
                category="growth",
                metric=name,
                recommendation=(
                    f"Set up automated monitoring for {name}. Identify the top 3 factors "
                    "influencing it and create action plans for each. "
                    "Aim for a 10% improvement over the next quarter."
                ),
            ))

    return insights


def _revenue_opportunity_insights(analytics: dict, predictions: dict) -> list:
    """Generate revenue-specific opportunity insights."""
    insights = []
    kpis = analytics.get("kpis", [])
    forecasts = predictions.get("forecasts", [])

    # Find revenue-related KPIs
    revenue_kpis = [k for k in kpis if any(
        term in (k.get("label", k.get("column", ""))).lower()
        for term in ["revenue", "sales", "income", "profit", "earning"]
    )]

    for kpi in revenue_kpis[:2]:
        name = kpi.get("label", kpi.get("column", ""))
        current = kpi.get("current", kpi.get("mean", 0))
        growth = kpi.get("growth_rate", kpi.get("change", 0))

        if growth > 0:
            insights.append(_make_insight(
                title=f"Revenue momentum: {name} is growing",
                description=(
                    f"{name} shows {growth:.1f}% growth with a current value of "
                    f"${current:,.0f}. This positive trajectory can be amplified with "
                    "targeted strategies."
                ),
                severity="moderate",
                confidence=0.85,
                category="opportunity",
                metric=name,
                recommendation=(
                    "Focus on customer retention to compound growth. "
                    "Consider upselling/cross-selling to increase average transaction value. "
                    "Invest in the marketing channels with highest ROI."
                ),
            ))
        else:
            target_recovery = abs(growth) * 1.5
            insights.append(_make_insight(
                title=f"Revenue recovery plan needed for {name}",
                description=(
                    f"{name} shows a {abs(growth):.1f}% decline. "
                    f"A targeted recovery plan aiming for +{target_recovery:.1f}% could "
                    "restore and exceed previous performance levels."
                ),
                severity="high",
                confidence=0.80,
                category="opportunity",
                metric=name,
                recommendation=(
                    "Launch a promotional campaign to re-engage lapsed customers. "
                    "Review pricing strategy against competitors. "
                    "Analyse customer feedback for product/service improvements."
                ),
            ))

    # Basket size / order value opportunities
    basket_kpis = [k for k in kpis if any(
        term in (k.get("label", k.get("column", ""))).lower()
        for term in ["basket", "order", "transaction", "avg"]
    )]

    for kpi in basket_kpis[:1]:
        name = kpi.get("label", kpi.get("column", ""))
        current = kpi.get("current", kpi.get("mean", 0))
        insights.append(_make_insight(
            title=f"Increase average {name}",
            description=(
                f"Current {name} is ${current:,.2f}. Even a 5% improvement would "
                f"yield approximately ${current * 0.05:,.2f} additional per transaction."
            ),
            severity="moderate",
            confidence=0.80,
            category="opportunity",
            metric=name,
            recommendation=(
                "Implement bundle pricing or minimum-order incentives. "
                "Train staff on suggestive selling techniques. "
                "Use data to identify commonly paired products for cross-sell opportunities."
            ),
        ))

    return insights


def _gemini_strategy_insights(schema: dict, analytics: dict,
                               predictions: dict, decisions: dict) -> list:
    """Use AI (Gemini → Groq fallback) to generate business strategy insights."""
    if not is_any_ai_available():
        return []

    try:
        # Build a concise summary for the AI prompt
        kpis = analytics.get("kpis", [])
        forecasts = predictions.get("forecasts", [])
        correlations = decisions.get("correlations", [])

        kpi_summary = []
        for k in kpis[:8]:
            kpi_summary.append({
                "metric": k.get("label", k.get("column", "")),
                "current": round(k.get("current", k.get("mean", 0)), 2),
                "change_pct": round(k.get("growth_rate", k.get("change", 0)), 2),
                "trend": k.get("trend", "stable"),
            })

        forecast_summary = []
        for f in forecasts[:4]:
            forecast_summary.append({
                "metric": f.get("label", f.get("column", "")),
                "growth_rate": round(f.get("growth_rate", 0), 2),
                "confidence": round(f.get("r2", 0), 2),
                "trend": f.get("trend", "flat"),
            })

        prompt = f"""You are a senior business analyst. Based on the following business metrics data, generate exactly 3 actionable strategy recommendations.

KPI Performance:
{json.dumps(kpi_summary, indent=2)}

Forecast Projections:
{json.dumps(forecast_summary, indent=2)}

For each recommendation, provide:
1. A short title (5-10 words)
2. A description (2-3 sentences explaining the insight)
3. A specific recommendation (2-3 actionable sentences)
4. A severity: "high" for urgent items, "moderate" for important ones
5. A category: must be either "growth" or "opportunity"

Return ONLY a valid JSON array of objects with keys: title, description, recommendation, severity, category
No markdown, no explanation, just the JSON array."""

        text, provider = generate_ai_content(prompt)

        items = json.loads(text)
        insights = []
        for item in items[:3]:
            insights.append(_make_insight(
                title=item.get("title", "AI Strategy Recommendation"),
                description=item.get("description", ""),
                severity=item.get("severity", "moderate"),
                confidence=0.78,
                category=item.get("category", "growth"),
                metric=None,
                recommendation=item.get("recommendation", ""),
            ))
        return insights

    except Exception:
        # If all AI providers fail, return empty — the rule-based insights still work
        return []


# ------------------------------------------------------------------ #
#  Narrative                                                           #
# ------------------------------------------------------------------ #

def _build_narrative(schema, analytics, predictions, decisions, insights) -> str:
    """Generate a top-level executive summary paragraph."""
    parts = []
    col_count = len(schema.get("columns", []))
    row_count = schema.get("total_rows", schema.get("row_count", "—"))

    parts.append(
        f"Yukti analysed a dataset containing {col_count} features and {row_count} records."
    )

    kpis = analytics.get("kpis", [])
    if kpis:
        growing = [k for k in kpis if k.get("growth_rate", k.get("growth", 0)) > 5]
        declining = [k for k in kpis if k.get("growth_rate", k.get("growth", 0)) < -5]
        if growing:
            names = ", ".join(k.get("label", k.get("column", "")) for k in growing[:3])
            parts.append(f"Positive momentum was detected in {names}.")
        if declining:
            names = ", ".join(k.get("label", k.get("column", "")) for k in declining[:3])
            parts.append(f"Declining trends were observed in {names}.")

    anomalies = predictions.get("anomalies", [])
    critical_anomalies = [a for a in anomalies if a.get("severity") == "critical"]
    if critical_anomalies:
        parts.append(
            f"{len(critical_anomalies)} critical anomalies require immediate attention."
        )

    correlations = decisions.get("correlations", [])
    strong_corr = [c for c in correlations if c.get("strength") == "strong"]
    if strong_corr:
        parts.append(
            f"{len(strong_corr)} strong inter-metric correlations were identified, "
            "suggesting actionable dependencies."
        )

    severity_counts = {}
    for ins in insights:
        sev = ins["severity"]
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
    if severity_counts:
        breakdown = ", ".join(f"{v} {k}" for k, v in severity_counts.items() if v > 0)
        parts.append(f"In total, the system generated insights: {breakdown}.")

    return " ".join(parts)


# ------------------------------------------------------------------ #
#  Helper                                                              #
# ------------------------------------------------------------------ #

def _make_insight(
    title: str,
    description: str,
    severity: str,
    confidence: float,
    category: str,
    metric: str | None,
    recommendation: str,
) -> dict:
    return {
        "title": title,
        "description": description,
        "severity": severity,
        "confidence": round(confidence, 2),
        "category": category,
        "metric": metric,
        "recommendation": recommendation,
    }
