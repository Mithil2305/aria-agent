"""
Report Generator – produces a PDF report using ReportLab.
Returns raw bytes so FastAPI can stream them as a file download.
"""

import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER


# Brand colours
BRAND_PRIMARY = HexColor("#6366f1")
BRAND_DARK = HexColor("#0f172a")
BRAND_MID = HexColor("#334155")
BRAND_LIGHT = HexColor("#e2e8f0")
WHITE = HexColor("#ffffff")
GREEN = HexColor("#22c55e")
RED = HexColor("#ef4444")
YELLOW = HexColor("#eab308")


def generate_pdf_report(
    filename: str,
    row_count: int,
    analysis: dict,
) -> bytes:
    """Build a complete PDF report and return as bytes."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        "BrandTitle", parent=styles["Title"],
        textColor=BRAND_PRIMARY, fontSize=22, spaceAfter=10,
    ))
    styles.add(ParagraphStyle(
        "SectionHead", parent=styles["Heading2"],
        textColor=BRAND_DARK, fontSize=14, spaceBefore=16, spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        "Body", parent=styles["Normal"],
        textColor=BRAND_MID, fontSize=10, leading=14,
    ))
    styles.add(ParagraphStyle(
        "Small", parent=styles["Normal"],
        textColor=BRAND_MID, fontSize=8, leading=10,
    ))

    story: list = []

    # ---- Title page ----
    story.append(Spacer(1, 40 * mm))
    story.append(Paragraph("ARIA Decision Intelligence Report", styles["BrandTitle"]))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        f"<b>Dataset:</b> {filename} &nbsp;|&nbsp; <b>Rows:</b> {row_count}", styles["Body"],
    ))
    story.append(Paragraph(
        f"<b>Generated:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles["Body"],
    ))
    story.append(Spacer(1, 10 * mm))

    # ---- Narrative ----
    narrative = analysis.get("insights", {}).get("narrative", "")
    if narrative:
        story.append(Paragraph("Executive Summary", styles["SectionHead"]))
        story.append(Paragraph(narrative, styles["Body"]))
        story.append(Spacer(1, 6 * mm))

    # ---- Schema overview ----
    schema = analysis.get("schema", {})
    if schema:
        story.append(Paragraph("Data Schema", styles["SectionHead"]))
        type_counts = schema.get("type_counts", {})
        quality = schema.get("data_quality", {})
        meta = (
            f"Columns: {len(schema.get('columns', []))} &nbsp;|&nbsp; "
            f"Numeric: {type_counts.get('numeric', 0)} &nbsp;|&nbsp; "
            f"Categorical: {type_counts.get('categorical', 0)} &nbsp;|&nbsp; "
            f"Temporal: {type_counts.get('temporal', 0)} &nbsp;|&nbsp; "
            f"Completeness: {quality.get('completeness', 0):.1f}%"
        )
        story.append(Paragraph(meta, styles["Body"]))
        story.append(Spacer(1, 4 * mm))

    # ---- KPI Table ----
    kpis = analysis.get("analytics", {}).get("kpis", [])
    if kpis:
        story.append(Paragraph("Key Performance Indicators", styles["SectionHead"]))
        header = ["Metric", "Current", "Mean", "Growth %", "Trend", "Significance"]
        data_rows = [header]
        for k in kpis:
            data_rows.append([
                k.get("label", k.get("column", "")),
                _fmt(k.get("current")),
                _fmt(k.get("mean")),
                f"{k.get('growth', 0):+.1f}%",
                k.get("trend", ""),
                f"{k.get('significance', 0):.0%}",
            ])
        story.append(_styled_table(data_rows))
        story.append(Spacer(1, 6 * mm))

    # ---- Anomalies ----
    anomalies = analysis.get("predictions", {}).get("anomalies", [])
    if anomalies:
        story.append(Paragraph("Anomaly Detection", styles["SectionHead"]))
        header = ["Metric", "Index", "Value", "Expected", "Deviation", "Severity"]
        data_rows = [header]
        for a in anomalies[:30]:
            data_rows.append([
                a.get("label", a.get("column", "")),
                str(a.get("index", "")),
                _fmt(a.get("value")),
                _fmt(a.get("expected")),
                f"{a.get('deviation', 0):.2f}σ",
                a.get("severity", ""),
            ])
        story.append(_styled_table(data_rows))
        story.append(Spacer(1, 6 * mm))

    # ---- Correlations ----
    correlations = analysis.get("decisions", {}).get("correlations", [])
    if correlations:
        story.append(Paragraph("Correlation Analysis", styles["SectionHead"]))
        header = ["Metric A", "Metric B", "r", "Strength", "Significant"]
        data_rows = [header]
        for c in correlations[:15]:
            data_rows.append([
                c.get("label1", ""),
                c.get("label2", ""),
                f"{c.get('correlation', 0):.3f}",
                c.get("strength", ""),
                "Yes" if c.get("is_significant") else "No",
            ])
        story.append(_styled_table(data_rows))
        story.append(Spacer(1, 6 * mm))

    # ---- Risk scores ----
    risks = analysis.get("decisions", {}).get("risk_scores", [])
    if risks:
        story.append(Paragraph("Risk Assessment", styles["SectionHead"]))
        header = ["Metric", "Score", "Level", "Volatility", "Trend", "Outlier"]
        data_rows = [header]
        for r in risks:
            data_rows.append([
                r.get("label", ""),
                f"{r.get('risk_score', 0):.2f}",
                r.get("risk_level", ""),
                f"{r.get('volatility_component', 0):.0%}",
                f"{r.get('trend_component', 0):.0%}",
                f"{r.get('outlier_component', 0):.0%}",
            ])
        story.append(_styled_table(data_rows))
        story.append(Spacer(1, 6 * mm))

    # ---- Insights ----
    insight_list = analysis.get("insights", {}).get("insights", [])
    if insight_list:
        story.append(PageBreak())
        story.append(Paragraph("AI Insights &amp; Recommendations", styles["SectionHead"]))
        for idx, ins in enumerate(insight_list, 1):
            severity_color = {
                "critical": RED,
                "high": YELLOW,
                "moderate": BRAND_PRIMARY,
                "low": BRAND_MID,
                "info": BRAND_LIGHT,
            }.get(ins.get("severity"), BRAND_MID)

            title = f"<font color='{severity_color}'>[{ins['severity'].upper()}]</font> {ins['title']}"
            story.append(Paragraph(title, styles["Body"]))
            story.append(Paragraph(ins.get("description", ""), styles["Small"]))
            rec = ins.get("recommendation", "")
            if rec:
                story.append(Paragraph(f"<i>→ {rec}</i>", styles["Small"]))
            story.append(Spacer(1, 3 * mm))

    # ---- Footer note ----
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph(
        "<i>Report generated by ARIA – Autonomous Decision Intelligence Agent</i>",
        styles["Small"],
    ))

    doc.build(story)
    return buf.getvalue()


# ---------- helpers ----------

def _fmt(val) -> str:
    if val is None:
        return "—"
    if isinstance(val, float):
        if abs(val) >= 1_000_000:
            return f"{val/1_000_000:,.1f}M"
        if abs(val) >= 1_000:
            return f"{val/1_000:,.1f}K"
        return f"{val:,.2f}"
    return str(val)


def _styled_table(data_rows: list) -> Table:
    """Return a branded Table with header styling."""
    col_count = len(data_rows[0])
    available_width = A4[0] - 4 * cm
    col_width = available_width / col_count

    table = Table(data_rows, colWidths=[col_width] * col_count)
    style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("TEXTCOLOR", (0, 1), (-1, -1), BRAND_MID),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.4, BRAND_LIGHT),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, HexColor("#f8fafc")]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ])
    table.setStyle(style)
    return table
