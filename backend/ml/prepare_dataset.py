"""
ARIA — Dataset Preparation Pipeline
====================================
Reads all downloaded datasets from backend/datasets/ and converts them
into a single instruction-tuning JSONL file ready for LoRA fine-tuning.

Datasets processed:
  1. Rossmann Stores (train.csv + store.csv) — retail sales forecasting
  2. BigMart Sales (bigmart.csv) — item-level sales prediction
  3. M5 Forecasting (sales_train_validation.csv + calendar.csv + sell_prices.csv)
  4. FinQA (financial QA with numerical reasoning)
  5. GSM8K (grade-school math reasoning)
  6. Orca-Math (200K math word problems with CoT)
  7. OpenOrca (general instruction following — sampled)
  8. TabFact (table fact verification)
  9. NAB Anomaly Detection (time-series anomaly data)
  10. Online Retail (transaction-level retail data)

Output: backend/ml/data/aria_training.jsonl
"""

import os
import json
import csv
import random
import logging
from pathlib import Path
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("aria.prepare")

DATASETS_DIR = Path(__file__).parent.parent / "datasets"
OUTPUT_DIR = Path(__file__).parent / "data"
OUTPUT_FILE = OUTPUT_DIR / "aria_training.jsonl"

# ── Maximum samples per dataset (to keep balanced) ──
MAX_PER_DATASET = {
    "rossmann": 8000,
    "bigmart": 4000,
    "m5": 3000,
    "finqa": 6000,
    "gsm8k": 7000,
    "orca_math": 10000,
    "openorca": 5000,
    "tabfact": 4000,
    "anomaly": 2000,
    "online_retail": 3000,
}


def _write_jsonl(records: list[dict], label: str):
    """Append records to output JSONL with a source tag."""
    count = 0
    with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
        for rec in records:
            rec["source"] = label
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            count += 1
    log.info("  ✅ %s: %d records written", label, count)
    return count


# ═══════════════════════════════════════════════════════════════════
# 1. Rossmann Store Sales — daily store sales prediction
# ═══════════════════════════════════════════════════════════════════
def process_rossmann():
    log.info("📊 Processing Rossmann Store Sales…")
    import pandas as pd

    train = pd.read_csv(DATASETS_DIR / "train.csv", low_memory=False)
    store = pd.read_csv(DATASETS_DIR / "store.csv")
    merged = train.merge(store, on="Store", how="left")

    # Group by store — create weekly analysis tasks
    records = []
    stores = merged["Store"].unique()
    random.shuffle(list(stores))

    for store_id in stores[:800]:  # sample 800 stores
        store_data = merged[merged["Store"] == store_id].sort_values("Date").tail(14)
        if len(store_data) < 7:
            continue

        first_week = store_data.head(7)
        second_week = store_data.tail(7)

        avg_sales_w1 = first_week["Sales"].mean()
        avg_cust_w1 = first_week["Customers"].mean()
        avg_sales_w2 = second_week["Sales"].mean()
        avg_cust_w2 = second_week["Customers"].mean()
        promo_days = int(store_data["Promo"].sum())
        store_type = store_data["StoreType"].iloc[0]
        assortment = store_data["Assortment"].iloc[0]

        trend = ((avg_sales_w2 - avg_sales_w1) / max(avg_sales_w1, 1)) * 100

        data_text = (
            f"Store #{store_id} (Type: {store_type}, Assortment: {assortment})\n"
            f"Week 1 avg daily sales: ₹{avg_sales_w1:,.0f}, avg customers: {avg_cust_w1:.0f}\n"
            f"Week 2 avg daily sales: ₹{avg_sales_w2:,.0f}, avg customers: {avg_cust_w2:.0f}\n"
            f"Promotion days in 14-day period: {promo_days}/14\n"
            f"Revenue trend: {trend:+.1f}%"
        )

        if trend > 5:
            trend_analysis = f"Revenue is growing at {trend:.1f}%. The promotions (run on {promo_days} of 14 days) are driving results."
            recommendation = "Continue current promotion strategy. Increase stock of fast movers to avoid stockouts during high-traffic days."
        elif trend < -5:
            trend_analysis = f"Revenue declined {abs(trend):.1f}% from week 1 to week 2. Customer footfall also dropped."
            recommendation = "Investigate the decline. Consider flash discounts, WhatsApp offers, or new product displays to reverse the trend."
        else:
            trend_analysis = f"Revenue is stable ({trend:+.1f}% change). Consistent performance but no growth."
            recommendation = "Introduce combo deals or loyalty rewards to break the plateau. Test evening flash sales."

        records.append({
            "instruction": "Analyze this retail store's 2-week sales performance and provide actionable business recommendations.",
            "input": data_text,
            "output": (
                f"## Sales Analysis\n\n"
                f"### Trend\n{trend_analysis}\n\n"
                f"### Key Metrics\n"
                f"- Week 1 avg: ₹{avg_sales_w1:,.0f}/day ({avg_cust_w1:.0f} customers)\n"
                f"- Week 2 avg: ₹{avg_sales_w2:,.0f}/day ({avg_cust_w2:.0f} customers)\n"
                f"- Revenue per customer: ₹{avg_sales_w2/max(avg_cust_w2,1):.0f}\n"
                f"- Promo utilization: {promo_days}/14 days ({promo_days/14*100:.0f}%)\n\n"
                f"### Recommendations\n{recommendation}\n\n"
                f"### Next Week Forecast\n"
                f"Projected daily sales: ₹{avg_sales_w2 * (1 + trend/200):,.0f} based on current momentum."
            )
        })

        if len(records) >= MAX_PER_DATASET["rossmann"]:
            break

    return _write_jsonl(records, "rossmann_retail")


# ═══════════════════════════════════════════════════════════════════
# 2. BigMart Sales — item-level analysis
# ═══════════════════════════════════════════════════════════════════
def process_bigmart():
    log.info("📊 Processing BigMart Sales…")
    import pandas as pd

    df = pd.read_csv(DATASETS_DIR / "bigmart.csv")
    records = []

    # Group by outlet for store-level analysis
    for outlet_id, grp in df.groupby("Outlet_Identifier"):
        avg_sales = grp["Item_Outlet_Sales"].mean()
        top_items = grp.nlargest(5, "Item_Outlet_Sales")
        low_items = grp.nsmallest(5, "Item_Outlet_Sales")
        outlet_type = grp["Outlet_Type"].iloc[0]
        location = grp["Outlet_Location_Type"].iloc[0]
        outlet_size = grp["Outlet_Size"].iloc[0] if pd.notna(grp["Outlet_Size"].iloc[0]) else "Unknown"
        year = grp["Outlet_Establishment_Year"].iloc[0]

        top_text = "\n".join([
            f"  - {r['Item_Type']} ({r['Item_Identifier']}): ₹{r['Item_Outlet_Sales']:,.0f} (MRP ₹{r['Item_MRP']:,.0f})"
            for _, r in top_items.iterrows()
        ])
        low_text = "\n".join([
            f"  - {r['Item_Type']} ({r['Item_Identifier']}): ₹{r['Item_Outlet_Sales']:,.0f} (MRP ₹{r['Item_MRP']:,.0f})"
            for _, r in low_items.iterrows()
        ])

        data_text = (
            f"Outlet: {outlet_id} ({outlet_type}, {location}, Size: {outlet_size}, Est. {year})\n"
            f"Total items tracked: {len(grp)}\n"
            f"Average item sales: ₹{avg_sales:,.0f}\n\n"
            f"Top 5 selling items:\n{top_text}\n\n"
            f"Bottom 5 selling items:\n{low_text}"
        )

        records.append({
            "instruction": "Analyze this retail outlet's product performance and suggest inventory optimization strategies.",
            "input": data_text,
            "output": (
                f"## Outlet Analysis — {outlet_id}\n\n"
                f"### Overview\n"
                f"This {outlet_type} in {location} (established {year}) stocks {len(grp)} items "
                f"with average sales of ₹{avg_sales:,.0f} per item.\n\n"
                f"### Recommendations\n"
                f"1. **Double down on top sellers**: The top 5 items significantly outperform. "
                f"Ensure they are always in stock and prominently displayed.\n"
                f"2. **Review bottom performers**: Consider replacing or discounting the lowest 5 items. "
                f"They tie up shelf space and capital.\n"
                f"3. **Pricing strategy**: Items with high MRP but low sales may need promotional pricing. "
                f"Test bundle offers pairing top and slow movers.\n"
                f"4. **{'Expand floor space for high performers' if outlet_size == 'Small' else 'Optimize shelf layout to maximize high-seller visibility'}**."
            )
        })

    # Also create item-type level analyses
    for item_type, grp in df.groupby("Item_Type"):
        avg_sales = grp["Item_Outlet_Sales"].mean()
        avg_mrp = grp["Item_MRP"].mean()
        fat_dist = grp["Item_Fat_Content"].value_counts().to_dict()
        visibility = grp["Item_Visibility"].mean()

        records.append({
            "instruction": "Evaluate this product category's sales performance across all outlets and suggest improvements.",
            "input": (
                f"Category: {item_type}\n"
                f"Total items: {len(grp)}\n"
                f"Average sales: ₹{avg_sales:,.0f}\n"
                f"Average MRP: ₹{avg_mrp:,.0f}\n"
                f"Average shelf visibility: {visibility:.4f}\n"
                f"Fat content distribution: {fat_dist}"
            ),
            "output": (
                f"## Category Report: {item_type}\n\n"
                f"Average sales of ₹{avg_sales:,.0f} across {len(grp)} items.\n\n"
                f"### Insights\n"
                f"- Visibility score of {visibility:.4f} {'is low — increase shelf prominence' if visibility < 0.05 else 'is adequate'}.\n"
                f"- {'Low-fat variants dominate — consider adding regular options for variety' if fat_dist.get('Low Fat', 0) > fat_dist.get('Regular', 0) else 'Regular variants dominate — consider healthier alternatives'}.\n\n"
                f"### Actions\n"
                f"1. {'Increase MRP positioning with premium variants' if avg_mrp < 150 else 'Offer value packs to boost volume'}.\n"
                f"2. Run cross-promotion with complementary categories.\n"
                f"3. Test end-cap displays for 2 weeks and measure sales lift."
            )
        })

    random.shuffle(records)
    return _write_jsonl(records[:MAX_PER_DATASET["bigmart"]], "bigmart_retail")


# ═══════════════════════════════════════════════════════════════════
# 3. FinQA — Financial Numerical Reasoning
# ═══════════════════════════════════════════════════════════════════
def process_finqa():
    log.info("📊 Processing FinQA…")
    data = json.load(open(DATASETS_DIR / "FinQA-main" / "dataset" / "train.json", "r", encoding="utf-8"))

    records = []
    for entry in data:
        question = entry.get("qa", {}).get("question", "")
        answer = entry.get("qa", {}).get("answer", "")
        program = entry.get("qa", {}).get("program", "")
        pre_text = " ".join(entry.get("pre_text", [])[:3])
        table = entry.get("table_ori", [])

        if not question or not answer:
            continue

        # Format table as text
        table_text = ""
        if table:
            table_text = "\n".join([" | ".join(str(c) for c in row) for row in table[:8]])

        reasoning = f"Program: {program}" if program else ""

        records.append({
            "instruction": "Answer this financial analysis question using the provided data. Show your reasoning step by step.",
            "input": f"Context: {pre_text[:300]}\n\nTable:\n{table_text}\n\nQuestion: {question}",
            "output": (
                f"## Answer\n{answer}\n\n"
                f"### Reasoning\n{reasoning}\n\n"
                f"The answer is derived by analyzing the financial data in the table and applying "
                f"the appropriate calculation to extract the requested metric."
            )
        })

    random.shuffle(records)
    return _write_jsonl(records[:MAX_PER_DATASET["finqa"]], "finqa_reasoning")


# ═══════════════════════════════════════════════════════════════════
# 4. GSM8K — Math Word Problem Reasoning
# ═══════════════════════════════════════════════════════════════════
def process_gsm8k():
    log.info("📊 Processing GSM8K…")
    import pandas as pd

    df = pd.read_parquet(DATASETS_DIR / "gsm8k" / "main" / "train-00000-of-00001.parquet")
    records = []

    for _, row in df.iterrows():
        q = row["question"]
        a = row["answer"]

        # Reframe math problems as business analysis tasks where possible
        records.append({
            "instruction": "Solve this business math problem step by step. Show all calculations clearly.",
            "input": q,
            "output": f"## Solution\n\n{a}"
        })

    random.shuffle(records)
    return _write_jsonl(records[:MAX_PER_DATASET["gsm8k"]], "gsm8k_math")


# ═══════════════════════════════════════════════════════════════════
# 5. Orca-Math — 200K Math Word Problems with CoT
# ═══════════════════════════════════════════════════════════════════
def process_orca_math():
    log.info("📊 Processing Orca-Math…")
    import pandas as pd

    df = pd.read_parquet(DATASETS_DIR / "orca-math-word-problems-200k" / "data" / "train-00000-of-00001.parquet")

    # Sample first to avoid iterating 200K rows
    sample_size = min(len(df), MAX_PER_DATASET["orca_math"])
    df_sample = df.sample(n=sample_size, random_state=42)

    records = []
    for _, row in df_sample.iterrows():
        records.append({
            "instruction": "Solve this numerical reasoning problem. Explain your steps clearly.",
            "input": str(row["question"]),
            "output": str(row["answer"])
        })

    random.shuffle(records)
    return _write_jsonl(records[:MAX_PER_DATASET["orca_math"]], "orca_math")


# ═══════════════════════════════════════════════════════════════════
# 6. OpenOrca — General Instruction Following (sampled)
# ═══════════════════════════════════════════════════════════════════
def process_openorca():
    log.info("📊 Processing OpenOrca (sampled)…")
    import pandas as pd

    # Read in chunks to avoid memory issues (2.4GB file)
    records = []
    chunk_size = 10000
    total_read = 0

    for chunk in pd.read_csv(DATASETS_DIR / "OpenOrca" / "train.csv", chunksize=chunk_size):
        for _, row in chunk.iterrows():
            system_prompt = str(row.get("system_prompt", "")) if pd.notna(row.get("system_prompt")) else ""
            question = str(row.get("question", ""))
            response = str(row.get("response", ""))

            if not question or not response or len(response) < 20:
                continue

            # Filter for reasoning/analysis related prompts
            lower_q = question.lower()
            if any(kw in lower_q for kw in [
                "analyz", "calculat", "compar", "explain", "reason",
                "data", "number", "percent", "profit", "revenue",
                "cost", "sales", "budget", "financial", "business",
                "trend", "increase", "decrease", "average", "total",
                "recommend", "strategy", "improve", "optimiz"
            ]):
                instruction = system_prompt if system_prompt else "Answer the following question with detailed reasoning."
                records.append({
                    "instruction": instruction[:500],
                    "input": question[:1000],
                    "output": response[:2000]
                })

        total_read += len(chunk)
        if len(records) >= MAX_PER_DATASET["openorca"]:
            break
        if total_read >= 500000:  # Don't read more than 500K rows
            break

    random.shuffle(records)
    return _write_jsonl(records[:MAX_PER_DATASET["openorca"]], "openorca_reasoning")


# ═══════════════════════════════════════════════════════════════════
# 7. TabFact — Table Fact Verification
# ═══════════════════════════════════════════════════════════════════
def process_tabfact():
    log.info("📊 Processing TabFact…")

    data_file = DATASETS_DIR / "Table-Fact-Checking-master" / "collected_data" / "r1_training_all.json"
    data = json.load(open(data_file, "r", encoding="utf-8"))
    tables_dir = DATASETS_DIR / "Table-Fact-Checking-master" / "data" / "all_csv"

    records = []
    for csv_name, entry in list(data.items())[:MAX_PER_DATASET["tabfact"] * 2]:
        statements = entry[0] if isinstance(entry[0], list) else [entry[0]]
        labels = entry[1] if isinstance(entry[1], list) else [entry[1]]

        # Try to read the corresponding table
        table_text = ""
        table_path = tables_dir / csv_name if tables_dir.exists() else None
        if table_path and table_path.exists():
            try:
                with open(table_path, "r", encoding="utf-8", errors="ignore") as f:
                    reader = csv.reader(f)
                    rows = [row for row in reader][:8]
                    table_text = "\n".join([" | ".join(row) for row in rows])
            except Exception:
                pass

        for stmt, label in zip(statements, labels):
            if not stmt or not isinstance(stmt, str):
                continue
            verdict = "TRUE — This statement is supported by the data in the table." if label == 1 else "FALSE — This statement is NOT supported by the data in the table."

            records.append({
                "instruction": "Verify whether this statement is true or false based on the provided table data. Explain your reasoning.",
                "input": f"Table:\n{table_text}\n\nStatement: {stmt}",
                "output": (
                    f"## Verdict: {'✅ TRUE' if label == 1 else '❌ FALSE'}\n\n"
                    f"{verdict}\n\n"
                    f"To verify this, I examined the relevant rows and columns in the table "
                    f"and {'confirmed' if label == 1 else 'found the statement contradicts'} the data."
                )
            })

        if len(records) >= MAX_PER_DATASET["tabfact"]:
            break

    random.shuffle(records)
    return _write_jsonl(records[:MAX_PER_DATASET["tabfact"]], "tabfact_verification")


# ═══════════════════════════════════════════════════════════════════
# 8. NAB Anomaly Detection — Time-Series Anomaly Analysis
# ═══════════════════════════════════════════════════════════════════
def process_anomaly():
    log.info("📊 Processing NAB Anomaly Detection…")

    anomaly_dirs = [
        ("artificialWithAnomaly", True),
        ("artificialNoAnomaly", False),
        ("realAWSCloudwatch", True),
        ("realAdExchange", True),
        ("realTraffic", True),
        ("realTweets", True),
    ]

    records = []
    for dir_name, has_anomaly in anomaly_dirs:
        dir_path = DATASETS_DIR / dir_name
        if not dir_path.exists():
            continue

        for csv_file in dir_path.iterdir():
            if not csv_file.suffix == ".csv":
                continue

            try:
                with open(csv_file, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    rows = list(reader)

                if len(rows) < 20:
                    continue

                # Sample windows of 20 data points
                window_size = 20
                step = max(len(rows) // 10, window_size)

                for start in range(0, len(rows) - window_size, step):
                    window = rows[start:start + window_size]
                    values_key = [k for k in window[0].keys() if k.lower() != "timestamp" and k.lower() != "date"]
                    if not values_key:
                        continue

                    val_key = values_key[0]
                    values = [float(r[val_key]) for r in window if r.get(val_key)]
                    if not values or len(values) < 10:
                        continue

                    avg = sum(values) / len(values)
                    max_v = max(values)
                    min_v = min(values)
                    std_dev = (sum((v - avg) ** 2 for v in values) / len(values)) ** 0.5

                    # Check for anomalous spikes
                    anomalies = [v for v in values if abs(v - avg) > 2 * std_dev]

                    data_text = (
                        f"Source: {dir_name}/{csv_file.name}\n"
                        f"Window: {window[0].get('timestamp', start)} to {window[-1].get('timestamp', start+window_size)}\n"
                        f"Values (last 20 points): {', '.join(f'{v:.1f}' for v in values[:20])}\n"
                        f"Average: {avg:.1f}, Std Dev: {std_dev:.1f}\n"
                        f"Range: {min_v:.1f} - {max_v:.1f}"
                    )

                    if anomalies:
                        records.append({
                            "instruction": "Analyze this time-series data for anomalies. Identify any unusual patterns and explain their potential business impact.",
                            "input": data_text,
                            "output": (
                                f"## Anomaly Detection Report\n\n"
                                f"### ⚠️ Anomalies Detected: {len(anomalies)} points\n"
                                f"Anomalous values: {', '.join(f'{v:.1f}' for v in anomalies)}\n"
                                f"These are more than 2 standard deviations ({2*std_dev:.1f}) from the mean ({avg:.1f}).\n\n"
                                f"### Business Impact\n"
                                f"- If this represents revenue: Unexpected {'spike' if anomalies[0] > avg else 'drop'} of "
                                f"{abs(anomalies[0]-avg)/max(avg,1)*100:.0f}% from baseline.\n"
                                f"- Investigate root cause: promotion, weather, system error, or seasonal event.\n"
                                f"- Set alert threshold at ±{2*std_dev:.0f} to catch future anomalies early."
                            )
                        })
                    else:
                        records.append({
                            "instruction": "Analyze this time-series data for anomalies. Report on the stability of the metrics.",
                            "input": data_text,
                            "output": (
                                f"## Anomaly Detection Report\n\n"
                                f"### ✅ No Anomalies Detected\n"
                                f"All values are within normal range (mean ± 2σ = {avg:.1f} ± {2*std_dev:.1f}).\n\n"
                                f"### Stability Assessment\n"
                                f"- Coefficient of variation: {std_dev/max(avg,1)*100:.1f}% — {'Stable' if std_dev/max(avg,1) < 0.2 else 'Moderate variability'}.\n"
                                f"- Range spread: {max_v-min_v:.1f} ({(max_v-min_v)/max(avg,1)*100:.0f}% of mean).\n"
                                f"- Continue monitoring. Current performance is consistent."
                            )
                        })

                    if len(records) >= MAX_PER_DATASET["anomaly"]:
                        break
            except Exception:
                continue

        if len(records) >= MAX_PER_DATASET["anomaly"]:
            break

    random.shuffle(records)
    return _write_jsonl(records[:MAX_PER_DATASET["anomaly"]], "anomaly_detection")


# ═══════════════════════════════════════════════════════════════════
# 9. Custom ARIA Business Analysis Templates
# ═══════════════════════════════════════════════════════════════════
def process_aria_templates():
    """Generate synthetic instruction-tuning data specifically for ARIA's use case."""
    log.info("📊 Generating ARIA business analysis templates…")

    biz_types = ["Grocery Store", "Bakery", "Restaurant", "Pharmacy", "Supermarket", "Clothing Store", "Electronics Shop"]
    regions = ["Tamil Nadu", "Karnataka", "Maharashtra", "Delhi NCR", "Gujarat"]
    festivals = ["Pongal", "Deepavali", "Tamil New Year", "Navaratri", "Christmas", "Ramadan"]

    records = []
    random.seed(42)

    for _ in range(3000):
        biz = random.choice(biz_types)
        region = random.choice(regions)
        festival = random.choice(festivals)
        days = random.randint(7, 30)
        avg_rev = random.randint(3000, 80000)
        avg_cust = random.randint(20, 500)
        avg_orders = random.randint(15, 400)
        expenses = int(avg_rev * random.uniform(0.35, 0.75))
        waste_pct = round(random.uniform(0.5, 8.0), 1)
        trend_pct = round(random.uniform(-25, 30), 1)
        basket = round(avg_rev / max(avg_orders, 1), 0)

        data_text = (
            f"Business: {biz} in {region}\n"
            f"Period: Last {days} days\n"
            f"Average daily revenue: ₹{avg_rev:,}\n"
            f"Average daily customers: {avg_cust}\n"
            f"Average daily orders: {avg_orders}\n"
            f"Average daily expenses: ₹{expenses:,}\n"
            f"Expense ratio: {expenses/avg_rev*100:.0f}%\n"
            f"Average basket size: ₹{basket:,.0f}\n"
            f"Waste/shrinkage: {waste_pct}% of revenue\n"
            f"Revenue trend: {trend_pct:+.1f}%\n"
            f"Upcoming festival: {festival}"
        )

        # Generate analysis
        exp_ratio = expenses / avg_rev * 100
        if trend_pct > 10:
            trend_text = f"Strong growth at {trend_pct:+.1f}%. Your {biz.lower()} is outperforming. Reinvest in stock and marketing."
        elif trend_pct > 0:
            trend_text = f"Mild growth at {trend_pct:+.1f}%. Good trajectory but room for acceleration."
        elif trend_pct > -10:
            trend_text = f"Slight decline at {trend_pct:+.1f}%. Not alarming but needs attention before it becomes a trend."
        else:
            trend_text = f"Significant decline at {trend_pct:+.1f}%. Urgent action required — review pricing, promotions, and customer satisfaction."

        records.append({
            "instruction": f"Provide a comprehensive month-end business analysis for this {biz.lower()} with actionable recommendations.",
            "input": data_text,
            "output": (
                f"## 📊 Month-End Premium Analysis — {biz}\n\n"
                f"### Revenue Performance\n"
                f"{trend_text}\n"
                f"- Daily average: ₹{avg_rev:,} over {days} days\n"
                f"- Total estimated revenue: ₹{avg_rev*days:,}\n\n"
                f"### Profitability\n"
                f"- Expense ratio: {exp_ratio:.0f}% — {'⚠️ High, needs cost optimization' if exp_ratio > 60 else '✅ Healthy margins'}\n"
                f"- Estimated daily profit: ₹{avg_rev - expenses:,}\n"
                f"- Monthly profit projection: ₹{(avg_rev - expenses) * 30:,}\n\n"
                f"### Customer Insights\n"
                f"- {avg_cust} customers/day with ₹{basket:,.0f} average basket\n"
                f"- {'Upsell opportunity: train staff to suggest add-ons at ₹' + str(int(basket*0.15)) + ' per transaction' if basket < 500 else 'Good basket size. Focus on increasing footfall.'}\n\n"
                f"### Waste Management\n"
                f"- Waste at {waste_pct}% {'⚠️ exceeds 3% threshold — implement FIFO and evening discounts' if waste_pct > 3 else '✅ within acceptable range'}\n"
                f"- Potential savings: ₹{avg_rev * waste_pct/100 * 0.5:,.0f}/day by reducing waste by 50%\n\n"
                f"### Festival Strategy — {festival}\n"
                f"- Stock festival-specific items 2 weeks before\n"
                f"- Create themed offers and WhatsApp broadcasts\n"
                f"- Expected revenue boost: 15-30% during festival week\n\n"
                f"### Monthly Roadmap\n"
                f"**Week 1**: Audit stock, fix waste leakage, set ₹{int(avg_rev*1.1):,}/day target\n"
                f"**Week 2**: Launch combo deals, WhatsApp campaign with top sellers\n"
                f"**Week 3**: Distribute pamphlets, start loyalty programme\n"
                f"**Week 4**: Review metrics, plan {festival} stock orders, set next month's goals"
            )
        })

    random.shuffle(records)
    return _write_jsonl(records, "aria_business_templates")


# ═══════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════
def main():
    log.info("=" * 60)
    log.info("🚀 ARIA Dataset Preparation Pipeline")
    log.info("=" * 60)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Clear previous output
    if OUTPUT_FILE.exists():
        OUTPUT_FILE.unlink()
        log.info("🗑  Cleared previous output file")

    total = 0
    total += process_rossmann()
    total += process_bigmart()
    total += process_finqa()
    total += process_gsm8k()
    total += process_orca_math()
    total += process_openorca()
    total += process_tabfact()
    total += process_anomaly()
    total += process_aria_templates()

    log.info("=" * 60)
    log.info("✅ Dataset preparation complete!")
    log.info("   Total records: %d", total)
    log.info("   Output: %s", OUTPUT_FILE)
    log.info("   Size: %.1f MB", OUTPUT_FILE.stat().st_size / 1024 / 1024)
    log.info("=" * 60)


if __name__ == "__main__":
    main()
