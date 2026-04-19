# Yukti — Feature Implementation Guide

> **Stack:** React + Vite (Frontend) · FastAPI (Backend) · Firebase Auth + Firestore · Gemini / Anthropic / Groq AI APIs  
> **Repo:** https://github.com/Mithil2305/yukti  
> **Author:** Implementation guide auto-generated from repo analysis + feature specification  
> **Version:** 1.0.0

---

## Table of Contents

1. [Prerequisites & Environment Setup](#1-prerequisites--environment-setup)
2. [Architecture Overview](#2-architecture-overview)
3. [Feature 1 — News-Based Market Intelligence Engine](#3-feature-1--news-based-market-intelligence-engine)
4. [Feature 2 — Early Warning System](#4-feature-2--early-warning-system)
5. [Feature 3 — What-If Scenario Simulator](#5-feature-3--what-if-scenario-simulator)
6. [Feature 4 — Natural Language Query Copilot](#6-feature-4--natural-language-query-copilot)
7. [Feature 5 — Action Tracker Tied to Insights](#7-feature-5--action-tracker-tied-to-insights)
8. [Feature 6 — Explainable Insights Panel](#8-feature-6--explainable-insights-panel)
9. [Cross-Feature Security Hardening](#9-cross-feature-security-hardening)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment Checklist](#11-deployment-checklist)

---

## 1. Prerequisites & Environment Setup

### 1.1 Backend Dependencies

Add these to `backend/requirements.txt`:

```txt
# --- Existing (keep) ---
fastapi
uvicorn[standard]
firebase-admin
python-dotenv
google-generativeai
anthropic
groq

# --- Feature 1: News Intelligence ---
pygooglenews==0.1.2
feedparser==6.0.11
newspaper3k==0.2.8
lxml_html_clean          # required by newspaper3k on Python 3.12+
httpx==0.27.0            # async HTTP for BBC/News crawl
beautifulsoup4==4.12.3
aiohttp==3.9.5

# --- Feature 2: Early Warning ---
pandas==2.2.2
scikit-learn==1.5.0
statsmodels==0.14.2

# --- Feature 3: Scenario Simulator ---
numpy==1.26.4

# --- Features 4–6: LLM / Explainability ---
# (already covered by generativeai / anthropic / groq above)

# --- Shared: caching / async ---
redis==5.0.4
celery==5.4.0
tenacity==8.3.0          # retry logic for external APIs
pydantic==2.7.1          # already likely present via fastapi
```

Install:

```bash
cd backend
pip install -r requirements.txt --break-system-packages
# or inside your venv:
pip install -r requirements.txt
```

### 1.2 Frontend Dependencies

```bash
cd frontend
npm install \
  recharts \
  @tanstack/react-query \
  zustand \
  date-fns \
  react-markdown \
  remark-gfm \
  lucide-react \
  @radix-ui/react-tooltip \
  @radix-ui/react-dialog \
  @radix-ui/react-progress \
  @radix-ui/react-badge \
  clsx \
  tailwind-merge
```

### 1.3 Environment Variables

**`backend/.env`** (never commit this file):

```env
# Core
YUKTI_CORS_ALLOW_ORIGINS=http://localhost:5173,https://your-prod-domain.com
YUKTI_ALLOWED_HOSTS=localhost,127.0.0.1,your-prod-domain.com
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json

# AI Providers
GEMINI_API_KEY=your_gemini_key
ANTHROPIC_API_KEY=your_anthropic_key
GROQ_API_KEY=your_groq_key

# Feature 1 — News
NEWS_CACHE_TTL_SECONDS=900          # 15 minutes
NEWS_FETCH_MAX_ARTICLES=40
BBC_RSS_BASE=https://feeds.bbci.co.uk/news

# Feature 2 — Early Warning
EWS_CASH_CRUNCH_DAYS_THRESHOLD=30
EWS_EXPENSE_GROWTH_THRESHOLD=0.20   # 20% MoM

# Redis (for caching/background tasks)
REDIS_URL=redis://localhost:6379/0
```

**`frontend/.env.local`**:

```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## 2. Architecture Overview

```
frontend/
  src/
    features/
      news/             ← Feature 1
      early-warning/    ← Feature 2
      scenario/         ← Feature 3
      copilot/          ← Feature 4
      action-tracker/   ← Feature 5
      explainability/   ← Feature 6
    components/
      shared/
    store/              ← Zustand global state
    hooks/              ← React Query hooks per feature
    api/                ← Axios/fetch wrappers to backend

backend/
  routers/
    news.py             ← Feature 1
    alerts.py           ← Feature 2
    scenario.py         ← Feature 3
    copilot.py          ← Feature 4
    actions.py          ← Feature 5
    insights.py         ← Feature 6
  services/
    news_service.py
    ews_service.py
    scenario_service.py
    copilot_service.py
    action_service.py
    explainer_service.py
  models/
    schemas.py          ← Pydantic models for all features
  utils/
    cache.py
    auth.py             ← Firebase token verification
    rate_limit.py
  main.py               ← register routers here
```

### Adding Routers to `main.py`

```python
# backend/main.py — add these imports and includes

from routers import news, alerts, scenario, copilot, actions, insights

app.include_router(news.router,     prefix="/api/news",     tags=["news"])
app.include_router(alerts.router,   prefix="/api/alerts",   tags=["alerts"])
app.include_router(scenario.router, prefix="/api/scenario", tags=["scenario"])
app.include_router(copilot.router,  prefix="/api/copilot",  tags=["copilot"])
app.include_router(actions.router,  prefix="/api/actions",  tags=["actions"])
app.include_router(insights.router, prefix="/api/insights", tags=["insights"])
```

### Auth Middleware (shared by ALL features)

```python
# backend/utils/auth.py
import firebase_admin
from firebase_admin import auth as firebase_auth
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """Verify Firebase ID token. Raises 401 on invalid/expired tokens."""
    try:
        decoded = firebase_auth.verify_id_token(credentials.credentials)
        return decoded
    except firebase_admin.exceptions.FirebaseError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

# Usage in any router:
# from utils.auth import verify_firebase_token
# @router.get("/endpoint")
# async def endpoint(user=Depends(verify_firebase_token)):
#     uid = user["uid"]
```

---

## 3. Feature 1 — News-Based Market Intelligence Engine

### 3.1 Overview

Fetches business/market news from multiple sources (Google News via `pygooglenews`, BBC RSS, general crawl), extracts the most relevant articles for the user's business context, and passes them to an LLM to produce structured predictions and recommendations.

### 3.2 Backend — `backend/routers/news.py`

```python
from fastapi import APIRouter, Depends, Query, BackgroundTasks
from utils.auth import verify_firebase_token
from services.news_service import NewsService

router = APIRouter()

@router.get("/feed")
async def get_news_feed(
    keywords: str = Query(..., description="Comma-separated keywords, e.g. 'LPS,semiconductor,supply chain'"),
    background_tasks: BackgroundTasks = None,
    user: dict = Depends(verify_firebase_token)
):
    """
    Returns curated news articles + LLM-generated predictions/recommendations.
    Results are cached per keyword set for NEWS_CACHE_TTL_SECONDS.
    """
    svc = NewsService()
    result = await svc.get_curated_feed(
        uid=user["uid"],
        keywords=[k.strip() for k in keywords.split(",")],
    )
    return result

@router.get("/categories")
async def get_news_categories(user: dict = Depends(verify_firebase_token)):
    """Returns predefined business-relevant news categories."""
    return {
        "categories": [
            "supply_chain", "inflation", "interest_rates",
            "geopolitics", "tech_sector", "consumer_spending",
            "energy_prices", "currency", "logistics"
        ]
    }
```

### 3.3 Backend — `backend/services/news_service.py`

````python
import os
import json
import asyncio
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional

import httpx
from pygooglenews import GoogleNews
import feedparser
from newspaper import Article
from bs4 import BeautifulSoup

from utils.cache import get_cache, set_cache

# BBC RSS feeds mapped to business-relevant topics
BBC_RSS_FEEDS = {
    "business":  "https://feeds.bbci.co.uk/news/business/rss.xml",
    "technology":"https://feeds.bbci.co.uk/news/technology/rss.xml",
    "world":     "https://feeds.bbci.co.uk/news/world/rss.xml",
}

class NewsService:
    def __init__(self):
        self.gn = GoogleNews(lang="en", country="US")
        self.cache_ttl = int(os.getenv("NEWS_CACHE_TTL_SECONDS", 900))
        self.max_articles = int(os.getenv("NEWS_FETCH_MAX_ARTICLES", 40))

    # ------------------------------------------------------------------
    # PUBLIC ENTRY POINT
    # ------------------------------------------------------------------
    async def get_curated_feed(self, uid: str, keywords: List[str]) -> dict:
        cache_key = f"news:{hashlib.md5(','.join(sorted(keywords)).encode()).hexdigest()}"
        cached = await get_cache(cache_key)
        if cached:
            return json.loads(cached)

        # 1. Fetch from all sources concurrently
        raw_articles = await asyncio.gather(
            self._fetch_google_news(keywords),
            self._fetch_bbc_rss(),
            return_exceptions=True
        )

        all_articles: List[dict] = []
        for result in raw_articles:
            if isinstance(result, list):
                all_articles.extend(result)

        # 2. Deduplicate by title similarity
        articles = self._deduplicate(all_articles)[:self.max_articles]

        # 3. Score relevance
        scored = self._score_relevance(articles, keywords)
        top_articles = sorted(scored, key=lambda x: x["relevance_score"], reverse=True)[:15]

        # 4. Extract full text for top articles (async, with timeout)
        enriched = await self._enrich_articles(top_articles)

        # 5. LLM analysis
        analysis = await self._analyze_with_llm(enriched, keywords)

        result = {
            "fetched_at": datetime.utcnow().isoformat(),
            "articles": enriched,
            "predictions": analysis.get("predictions", []),
            "recommendations": analysis.get("recommendations", []),
            "market_sentiment": analysis.get("market_sentiment", "neutral"),
            "keywords_used": keywords,
        }

        await set_cache(cache_key, json.dumps(result), ttl=self.cache_ttl)
        return result

    # ------------------------------------------------------------------
    # SOURCE FETCHERS
    # ------------------------------------------------------------------
    async def _fetch_google_news(self, keywords: List[str]) -> List[dict]:
        articles = []
        loop = asyncio.get_event_loop()
        for keyword in keywords[:5]:  # cap to avoid rate limits
            try:
                # pygooglenews is synchronous — run in executor
                search_result = await loop.run_in_executor(
                    None, lambda kw=keyword: self.gn.search(kw, when="7d")
                )
                entries = search_result.get("entries", [])
                for entry in entries[:8]:
                    articles.append({
                        "title":   entry.get("title", ""),
                        "url":     entry.get("link", ""),
                        "source":  entry.get("source", {}).get("title", "Google News"),
                        "published": entry.get("published", ""),
                        "summary": entry.get("summary", ""),
                        "full_text": "",
                    })
            except Exception:
                pass  # silently skip failed keyword searches
        return articles

    async def _fetch_bbc_rss(self) -> List[dict]:
        articles = []
        async with httpx.AsyncClient(timeout=10.0) as client:
            for topic, url in BBC_RSS_FEEDS.items():
                try:
                    response = await client.get(url)
                    feed = feedparser.parse(response.text)
                    for entry in feed.entries[:10]:
                        articles.append({
                            "title":   entry.get("title", ""),
                            "url":     entry.get("link", ""),
                            "source":  f"BBC News ({topic})",
                            "published": entry.get("published", ""),
                            "summary": BeautifulSoup(
                                entry.get("summary", ""), "html.parser"
                            ).get_text()[:500],
                            "full_text": "",
                        })
                except Exception:
                    pass
        return articles

    # ------------------------------------------------------------------
    # ENRICHMENT
    # ------------------------------------------------------------------
    async def _enrich_articles(self, articles: List[dict]) -> List[dict]:
        """Fetch full article text using newspaper3k (async with timeout)."""
        async def fetch_one(article: dict) -> dict:
            try:
                loop = asyncio.get_event_loop()
                a = Article(article["url"])
                await asyncio.wait_for(
                    loop.run_in_executor(None, a.download),
                    timeout=5.0
                )
                await loop.run_in_executor(None, a.parse)
                article["full_text"] = a.text[:3000]  # cap tokens
            except Exception:
                article["full_text"] = article.get("summary", "")
            return article

        return await asyncio.gather(*[fetch_one(a) for a in articles])

    # ------------------------------------------------------------------
    # RELEVANCE SCORING
    # ------------------------------------------------------------------
    def _score_relevance(self, articles: List[dict], keywords: List[str]) -> List[dict]:
        keywords_lower = [k.lower() for k in keywords]
        for article in articles:
            text = (article["title"] + " " + article["summary"]).lower()
            score = sum(3 if kw in article["title"].lower() else 1
                        for kw in keywords_lower if kw in text)
            article["relevance_score"] = score
        return articles

    # ------------------------------------------------------------------
    # LLM ANALYSIS
    # ------------------------------------------------------------------
    async def _analyze_with_llm(self, articles: List[dict], keywords: List[str]) -> dict:
        """
        Sends article summaries to Gemini and asks for structured
        market predictions + recommendations in JSON.
        """
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-1.5-flash")

        article_text = "\n\n".join([
            f"[{i+1}] {a['title']} ({a['source']})\n{a['full_text'][:500]}"
            for i, a in enumerate(articles[:10])
        ])

        prompt = f"""You are a senior business analyst. Analyze the following news articles
in the context of: {', '.join(keywords)}.

ARTICLES:
{article_text}

Respond ONLY in valid JSON with this exact schema:
{{
  "market_sentiment": "bullish|bearish|neutral",
  "predictions": [
    {{
      "title": "short prediction title",
      "detail": "2-3 sentence explanation",
      "impact_area": "supply_chain|pricing|demand|cash_flow|operations",
      "probability": "high|medium|low",
      "timeframe": "1_week|1_month|3_months|6_months"
    }}
  ],
  "recommendations": [
    {{
      "action": "specific action to take",
      "rationale": "why this action is recommended",
      "urgency": "immediate|this_week|this_month",
      "category": "procurement|pricing|marketing|operations|finance"
    }}
  ]
}}

Provide 3-5 predictions and 3-5 recommendations. Be specific and actionable."""

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, model.generate_content, prompt)
            raw = response.text.strip().lstrip("```json").rstrip("```").strip()
            return json.loads(raw)
        except Exception as e:
            return {
                "market_sentiment": "neutral",
                "predictions": [],
                "recommendations": [],
                "_error": str(e)
            }

    # ------------------------------------------------------------------
    # DEDUPLICATION
    # ------------------------------------------------------------------
    def _deduplicate(self, articles: List[dict]) -> List[dict]:
        seen_titles = set()
        unique = []
        for a in articles:
            title_key = a["title"][:60].lower().strip()
            if title_key not in seen_titles:
                seen_titles.add(title_key)
                unique.append(a)
        return unique
````

### 3.4 Backend — `backend/utils/cache.py`

```python
import os
import json
from typing import Optional
import redis.asyncio as aioredis

_redis: Optional[aioredis.Redis] = None

async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            os.getenv("REDIS_URL", "redis://localhost:6379/0"),
            decode_responses=True
        )
    return _redis

async def get_cache(key: str) -> Optional[str]:
    r = await get_redis()
    return await r.get(key)

async def set_cache(key: str, value: str, ttl: int = 900):
    r = await get_redis()
    await r.setex(key, ttl, value)

async def delete_cache(key: str):
    r = await get_redis()
    await r.delete(key)
```

> **Note:** If you don't want to run Redis, replace `cache.py` with a simple in-memory TTL dict for development:
>
> ```python
> import time
> _store: dict = {}
> async def get_cache(key):
>     item = _store.get(key)
>     if item and item["expires"] > time.time():
>         return item["value"]
>     return None
> async def set_cache(key, value, ttl=900):
>     _store[key] = {"value": value, "expires": time.time() + ttl}
> async def delete_cache(key):
>     _store.pop(key, None)
> ```

### 3.5 Frontend — `frontend/src/features/news/`

**`NewsIntelligence.jsx`** (main page component):

```jsx
// frontend/src/features/news/NewsIntelligence.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchNewsFeed } from "../../api/newsApi";
import NewsFeedCard from "./NewsFeedCard";
import PredictionCard from "./PredictionCard";
import RecommendationCard from "./RecommendationCard";
import SentimentBadge from "./SentimentBadge";
import KeywordSelector from "./KeywordSelector";

export default function NewsIntelligence() {
	const [keywords, setKeywords] = useState(["supply chain", "inflation"]);

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ["newsFeed", keywords],
		queryFn: () => fetchNewsFeed(keywords),
		staleTime: 1000 * 60 * 15, // 15 minutes
		retry: 2,
	});

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Market Intelligence</h1>
				{data && <SentimentBadge sentiment={data.market_sentiment} />}
			</div>

			<KeywordSelector value={keywords} onChange={setKeywords} />

			{isLoading && <LoadingState />}
			{error && <ErrorState message={error.message} onRetry={refetch} />}

			{data && (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Left: News Articles */}
					<div className="lg:col-span-1 space-y-3">
						<h2 className="font-semibold text-gray-700">News Sources</h2>
						{data.articles.map((article, i) => (
							<NewsFeedCard key={i} article={article} />
						))}
					</div>

					{/* Right: Predictions + Recommendations */}
					<div className="lg:col-span-2 space-y-6">
						<section>
							<h2 className="font-semibold text-gray-700 mb-3">
								AI Predictions
							</h2>
							<div className="space-y-3">
								{data.predictions.map((p, i) => (
									<PredictionCard key={i} prediction={p} />
								))}
							</div>
						</section>
						<section>
							<h2 className="font-semibold text-gray-700 mb-3">
								Recommendations
							</h2>
							<div className="space-y-3">
								{data.recommendations.map((r, i) => (
									<RecommendationCard key={i} recommendation={r} />
								))}
							</div>
						</section>
					</div>
				</div>
			)}
		</div>
	);
}

function LoadingState() {
	return (
		<div className="flex items-center space-x-3 text-gray-500 py-12 justify-center">
			<span className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500" />
			<span>Fetching latest market news...</span>
		</div>
	);
}

function ErrorState({ message, onRetry }) {
	return (
		<div className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-center">
			<span className="text-red-700 text-sm">{message}</span>
			<button onClick={onRetry} className="text-blue-600 text-sm underline">
				Retry
			</button>
		</div>
	);
}
```

**`frontend/src/api/newsApi.js`**:

```javascript
import { getAuth } from "firebase/auth";

const BASE_URL = import.meta.env.VITE_API_URL;

async function getAuthHeaders() {
	const user = getAuth().currentUser;
	if (!user) throw new Error("Not authenticated");
	const token = await user.getIdToken();
	return {
		"Content-Type": "application/json",
		Authorization: `Bearer ${token}`,
	};
}

export async function fetchNewsFeed(keywords) {
	const headers = await getAuthHeaders();
	const params = new URLSearchParams({ keywords: keywords.join(",") });
	const res = await fetch(`${BASE_URL}/api/news/feed?${params}`, { headers });
	if (!res.ok) throw new Error(`News API error: ${res.status}`);
	return res.json();
}
```

---

## 4. Feature 2 — Early Warning System

### 4.1 Overview

Monitors business metrics stored in Firestore (revenue, expenses, cash, inventory, customer counts), runs statistical anomaly detection, and generates severity-tiered alerts with suggested remediation actions.

### 4.2 Backend — `backend/routers/alerts.py`

```python
from fastapi import APIRouter, Depends, Body
from utils.auth import verify_firebase_token
from services.ews_service import EWSService
from models.schemas import MetricsPayload

router = APIRouter()

@router.post("/evaluate")
async def evaluate_warnings(
    metrics: MetricsPayload = Body(...),
    user: dict = Depends(verify_firebase_token)
):
    """
    Accepts the latest business metrics and returns active alerts.
    Called by frontend after each dashboard refresh.
    """
    svc = EWSService()
    alerts = await svc.evaluate(uid=user["uid"], metrics=metrics.dict())
    return {"alerts": alerts, "evaluated_at": __import__("datetime").datetime.utcnow().isoformat()}

@router.get("/active")
async def get_active_alerts(user: dict = Depends(verify_firebase_token)):
    """Retrieves currently active (unresolved) alerts for the user from Firestore."""
    svc = EWSService()
    return await svc.get_active_alerts(uid=user["uid"])

@router.post("/dismiss/{alert_id}")
async def dismiss_alert(alert_id: str, user: dict = Depends(verify_firebase_token)):
    svc = EWSService()
    await svc.dismiss_alert(uid=user["uid"], alert_id=alert_id)
    return {"status": "dismissed"}
```

### 4.3 Backend — `backend/models/schemas.py` (EWS section)

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date

class MonthlyMetric(BaseModel):
    month: str          # "2024-01", "2024-02", etc.
    revenue: float
    expenses: float
    cash_balance: float
    inventory_value: float
    customer_count: int
    cogs: float = 0.0

class MetricsPayload(BaseModel):
    history: List[MonthlyMetric] = Field(..., min_items=2)
    current: MonthlyMetric
    monthly_burn_rate: Optional[float] = None   # avg monthly cash out
    accounts_receivable: Optional[float] = None
    accounts_payable: Optional[float] = None
```

### 4.4 Backend — `backend/services/ews_service.py`

```python
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any

import numpy as np
import pandas as pd
from firebase_admin import firestore

SEVERITY_LEVELS = ["critical", "high", "medium", "low"]

class EWSService:
    def __init__(self):
        self.db = firestore.client()
        self.cash_threshold_days = int(os.getenv("EWS_CASH_CRUNCH_DAYS_THRESHOLD", 30))
        self.expense_growth_threshold = float(os.getenv("EWS_EXPENSE_GROWTH_THRESHOLD", 0.20))

    async def evaluate(self, uid: str, metrics: Dict) -> List[Dict]:
        alerts = []
        current = metrics["current"]
        history = metrics.get("history", [])

        # --- CHECK 1: Cash Crunch Risk ---
        burn = metrics.get("monthly_burn_rate") or self._calc_avg_burn(history)
        if burn and burn > 0:
            runway_days = (current["cash_balance"] / burn) * 30
            if runway_days < self.cash_threshold_days:
                severity = "critical" if runway_days < 14 else "high" if runway_days < 21 else "medium"
                alerts.append(self._build_alert(
                    alert_type="cash_crunch",
                    severity=severity,
                    title=f"Cash Runway: ~{int(runway_days)} days",
                    detail=f"At current burn rate of ₹{burn:,.0f}/month, cash reserves will last approximately {int(runway_days)} days.",
                    actions=[
                        "Immediately review discretionary expenses",
                        "Accelerate outstanding accounts receivable collections",
                        "Contact your bank about a short-term credit facility",
                        "Pause non-essential capex",
                    ],
                    metrics={"runway_days": runway_days, "monthly_burn": burn}
                ))

        # --- CHECK 2: Expense Growth Spike ---
        if len(history) >= 2:
            prev_exp = history[-2]["expenses"]
            curr_exp = current["expenses"]
            if prev_exp > 0:
                growth = (curr_exp - prev_exp) / prev_exp
                if growth > self.expense_growth_threshold:
                    severity = "critical" if growth > 0.4 else "high" if growth > 0.3 else "medium"
                    alerts.append(self._build_alert(
                        alert_type="expense_spike",
                        severity=severity,
                        title=f"Expenses up {growth*100:.1f}% MoM",
                        detail=f"Monthly expenses grew from ₹{prev_exp:,.0f} to ₹{curr_exp:,.0f}, a {growth*100:.1f}% increase.",
                        actions=[
                            "Run an expense category breakdown report immediately",
                            "Identify the top 3 expense categories driving growth",
                            "Verify no duplicate or erroneous vendor payments",
                            "Set a spending freeze for non-committed budgets",
                        ],
                        metrics={"growth_pct": growth, "previous": prev_exp, "current": curr_exp}
                    ))

        # --- CHECK 3: Revenue Decline ---
        if len(history) >= 3:
            rev_series = [m["revenue"] for m in history[-3:]] + [current["revenue"]]
            if all(rev_series[i] >= rev_series[i+1] for i in range(len(rev_series)-1)):
                alerts.append(self._build_alert(
                    alert_type="revenue_decline",
                    severity="high",
                    title="Revenue declining for 3+ consecutive months",
                    detail="Revenue has fallen each month for the past 3 months.",
                    actions=[
                        "Conduct an urgent customer churn analysis",
                        "Review sales pipeline conversion rates",
                        "Survey recent churned customers",
                        "Evaluate current pricing vs. market",
                    ],
                    metrics={"revenue_series": rev_series}
                ))

        # --- CHECK 4: Inventory Risk ---
        if len(history) >= 2:
            inv_change = current["inventory_value"] - history[-1]["inventory_value"]
            revenue_change = current["revenue"] - history[-1]["revenue"]
            # Inventory growing while revenue falls = accumulation risk
            if inv_change > 0 and revenue_change < 0:
                alerts.append(self._build_alert(
                    alert_type="inventory_accumulation",
                    severity="medium",
                    title="Inventory building up while revenue declines",
                    detail=f"Inventory increased by ₹{inv_change:,.0f} while revenue fell by ₹{abs(revenue_change):,.0f}.",
                    actions=[
                        "Review demand forecasts against current stock levels",
                        "Pause or reduce purchase orders",
                        "Consider a promotional campaign to move existing stock",
                        "Check for slow-moving or near-expiry SKUs",
                    ],
                    metrics={"inv_change": inv_change, "revenue_change": revenue_change}
                ))

        # --- CHECK 5: Churn Spike ---
        if len(history) >= 2 and current["customer_count"] > 0:
            prev_count = history[-1]["customer_count"]
            curr_count = current["customer_count"]
            churn_rate = (prev_count - curr_count) / max(prev_count, 1)
            if churn_rate > 0.05:  # >5% monthly churn
                severity = "critical" if churn_rate > 0.15 else "high" if churn_rate > 0.10 else "medium"
                alerts.append(self._build_alert(
                    alert_type="churn_spike",
                    severity=severity,
                    title=f"Customer churn at {churn_rate*100:.1f}% this month",
                    detail=f"Lost {prev_count - curr_count} customers ({churn_rate*100:.1f}% churn rate).",
                    actions=[
                        "Launch immediate exit survey to churned customers",
                        "Identify top 20% customers at risk using engagement data",
                        "Fast-track customer success check-ins",
                        "Review recent product/service changes or pricing shifts",
                    ],
                    metrics={"churn_rate": churn_rate, "lost_customers": prev_count - curr_count}
                ))

        # Persist to Firestore
        await self._save_alerts(uid, alerts)
        return alerts

    def _calc_avg_burn(self, history: List[Dict]) -> float:
        if not history:
            return 0.0
        burns = [m["expenses"] for m in history[-3:] if m.get("expenses")]
        return float(np.mean(burns)) if burns else 0.0

    def _build_alert(self, alert_type, severity, title, detail, actions, metrics=None) -> Dict:
        return {
            "id": str(uuid.uuid4()),
            "type": alert_type,
            "severity": severity,
            "title": title,
            "detail": detail,
            "suggested_actions": actions,
            "metrics": metrics or {},
            "created_at": datetime.utcnow().isoformat(),
            "dismissed": False,
        }

    async def _save_alerts(self, uid: str, alerts: List[Dict]):
        batch = self.db.batch()
        col = self.db.collection("users").document(uid).collection("alerts")
        # Clear previous auto-generated alerts older than 30 days
        for alert in alerts:
            doc_ref = col.document(alert["id"])
            batch.set(doc_ref, alert)
        batch.commit()

    async def get_active_alerts(self, uid: str) -> List[Dict]:
        col = self.db.collection("users").document(uid).collection("alerts")
        docs = col.where("dismissed", "==", False).order_by(
            "created_at", direction=firestore.Query.DESCENDING
        ).limit(50).stream()
        return [doc.to_dict() for doc in docs]

    async def dismiss_alert(self, uid: str, alert_id: str):
        self.db.collection("users").document(uid).collection("alerts") \
            .document(alert_id).update({"dismissed": True})
```

### 4.5 Frontend — `frontend/src/features/early-warning/`

**`AlertsPanel.jsx`**:

```jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchActiveAlerts, dismissAlert } from "../../api/alertsApi";
import {
	Bell,
	AlertTriangle,
	AlertCircle,
	Info,
	CheckCircle,
} from "lucide-react";

const SEVERITY_CONFIG = {
	critical: {
		icon: AlertCircle,
		color: "text-red-600",
		bg: "bg-red-50",
		border: "border-red-300",
		label: "Critical",
	},
	high: {
		icon: AlertTriangle,
		color: "text-orange-600",
		bg: "bg-orange-50",
		border: "border-orange-300",
		label: "High",
	},
	medium: {
		icon: Bell,
		color: "text-yellow-600",
		bg: "bg-yellow-50",
		border: "border-yellow-300",
		label: "Medium",
	},
	low: {
		icon: Info,
		color: "text-blue-600",
		bg: "bg-blue-50",
		border: "border-blue-300",
		label: "Low",
	},
};

export default function AlertsPanel() {
	const qc = useQueryClient();
	const { data, isLoading } = useQuery({
		queryKey: ["activeAlerts"],
		queryFn: fetchActiveAlerts,
		refetchInterval: 1000 * 60 * 5, // refresh every 5 min
	});

	const dismiss = useMutation({
		mutationFn: dismissAlert,
		onSuccess: () => qc.invalidateQueries({ queryKey: ["activeAlerts"] }),
	});

	const alerts = data?.alerts ?? [];
	const sortOrder = { critical: 0, high: 1, medium: 2, low: 3 };
	const sorted = [...alerts].sort(
		(a, b) => sortOrder[a.severity] - sortOrder[b.severity],
	);

	if (isLoading)
		return <div className="animate-pulse h-24 bg-gray-100 rounded-lg" />;

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h2 className="font-bold text-lg flex items-center gap-2">
					<Bell className="w-5 h-5" /> Early Warnings
				</h2>
				<span className="text-sm text-gray-500">{sorted.length} active</span>
			</div>

			{sorted.length === 0 && (
				<div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
					<CheckCircle className="w-5 h-5" />
					<span>All metrics look healthy. No active warnings.</span>
				</div>
			)}

			{sorted.map((alert) => (
				<AlertCard
					key={alert.id}
					alert={alert}
					onDismiss={() => dismiss.mutate(alert.id)}
				/>
			))}
		</div>
	);
}

function AlertCard({ alert, onDismiss }) {
	const {
		icon: Icon,
		color,
		bg,
		border,
		label,
	} = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.low;

	return (
		<div className={`rounded-lg border ${border} ${bg} p-4 space-y-3`}>
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center gap-2">
					<Icon className={`w-5 h-5 ${color} shrink-0`} />
					<div>
						<span className={`text-xs font-semibold uppercase ${color}`}>
							{label}
						</span>
						<p className="font-semibold text-gray-800 text-sm">{alert.title}</p>
					</div>
				</div>
				<button
					onClick={onDismiss}
					className="text-gray-400 hover:text-gray-600 text-xs"
				>
					Dismiss
				</button>
			</div>
			<p className="text-sm text-gray-600">{alert.detail}</p>
			<div>
				<p className="text-xs font-semibold text-gray-500 mb-1">
					Suggested Actions:
				</p>
				<ul className="space-y-1">
					{alert.suggested_actions.map((action, i) => (
						<li
							key={i}
							className="text-xs text-gray-700 flex items-start gap-2"
						>
							<span className="mt-0.5 text-gray-400">→</span> {action}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
```

---

## 5. Feature 3 — What-If Scenario Simulator

### 5.1 Overview

Users define parameter changes (price, ad spend, headcount, COGS, etc.) and the simulator projects their impact on revenue, gross margin, and cash flow using a deterministic financial model + LLM commentary.

### 5.2 Backend — `backend/routers/scenario.py`

```python
from fastapi import APIRouter, Depends, Body
from utils.auth import verify_firebase_token
from services.scenario_service import ScenarioService
from models.schemas import ScenarioRequest

router = APIRouter()

@router.post("/simulate")
async def simulate_scenario(
    request: ScenarioRequest = Body(...),
    user: dict = Depends(verify_firebase_token)
):
    """Run a what-if simulation and return projected financials + LLM commentary."""
    svc = ScenarioService()
    result = await svc.simulate(uid=user["uid"], request=request.dict())
    return result
```

### 5.3 Backend — `backend/models/schemas.py` (Scenario section)

```python
class ScenarioChange(BaseModel):
    parameter: str      # "price", "ad_spend", "cogs", "headcount", "units_sold"
    change_type: str    # "percent" | "absolute"
    value: float        # e.g. 5.0 for +5%, -15.0 for -15%

class ScenarioRequest(BaseModel):
    base_metrics: MonthlyMetric
    changes: List[ScenarioChange]
    projection_months: int = Field(default=3, ge=1, le=12)
    avg_selling_price: float = Field(..., gt=0)
    units_sold_per_month: float = Field(..., gt=0)
```

### 5.4 Backend — `backend/services/scenario_service.py`

```python
import os
import json
import asyncio
import numpy as np
from typing import List, Dict, Any

class ScenarioService:

    async def simulate(self, uid: str, request: Dict) -> Dict:
        base = request["base_metrics"]
        changes = request["changes"]
        months = request["projection_months"]
        asp = request["avg_selling_price"]
        units = request["units_sold_per_month"]

        # --- Apply changes to parameters ---
        sim_price = asp
        sim_units = units
        sim_cogs_rate = base["cogs"] / max(base["revenue"], 1)
        sim_fixed_expenses = base["expenses"] - base["cogs"]
        sim_ad_spend = 0.0  # assumed part of expenses

        for change in changes:
            delta = change["value"] / 100 if change["change_type"] == "percent" else change["value"]
            multiplier = 1 + delta if change["change_type"] == "percent" else None
            if change["parameter"] == "price":
                sim_price = sim_price * multiplier if multiplier else sim_price + delta
            elif change["parameter"] == "units_sold":
                sim_units = sim_units * multiplier if multiplier else sim_units + delta
            elif change["parameter"] == "ad_spend":
                sim_ad_spend = (sim_ad_spend * multiplier if multiplier else sim_ad_spend + delta)
            elif change["parameter"] == "cogs":
                sim_cogs_rate = sim_cogs_rate * multiplier if multiplier else sim_cogs_rate + delta / base["revenue"]
            elif change["parameter"] == "headcount":
                # assume each headcount unit = 80k/year salary
                sim_fixed_expenses += delta * (80000 / 12)

        # --- Project monthly ---
        projections = []
        cash = base["cash_balance"]
        for m in range(1, months + 1):
            revenue = sim_price * sim_units
            cogs = revenue * sim_cogs_rate
            gross_profit = revenue - cogs
            total_expenses = sim_fixed_expenses + sim_ad_spend + cogs
            net_profit = revenue - total_expenses
            cash += net_profit

            projections.append({
                "month": m,
                "revenue":        round(revenue, 2),
                "cogs":           round(cogs, 2),
                "gross_profit":   round(gross_profit, 2),
                "gross_margin":   round((gross_profit / max(revenue, 1)) * 100, 1),
                "expenses":       round(total_expenses, 2),
                "net_profit":     round(net_profit, 2),
                "cash_balance":   round(cash, 2),
            })

        # --- Baseline for comparison ---
        base_revenue = asp * units
        base_cogs = base_revenue * (base["cogs"] / max(base["revenue"], 1))
        baseline = {
            "revenue":      round(base_revenue, 2),
            "gross_profit": round(base_revenue - base_cogs, 2),
            "gross_margin": round(((base_revenue - base_cogs) / max(base_revenue, 1)) * 100, 1),
            "net_profit":   round(base_revenue - base["expenses"], 2),
        }

        # --- Delta summary ---
        final_month = projections[-1]
        delta_summary = {
            "revenue_delta_pct":   round((final_month["revenue"] - baseline["revenue"]) / max(baseline["revenue"], 1) * 100, 1),
            "margin_delta_pts":    round(final_month["gross_margin"] - baseline["gross_margin"], 1),
            "net_profit_delta":    round(final_month["net_profit"] - baseline["net_profit"], 2),
            "cash_balance_final":  final_month["cash_balance"],
        }

        # --- LLM Commentary ---
        commentary = await self._generate_commentary(changes, projections, baseline, delta_summary)

        return {
            "baseline": baseline,
            "projections": projections,
            "delta_summary": delta_summary,
            "commentary": commentary,
            "changes_applied": changes,
        }

    async def _generate_commentary(self, changes, projections, baseline, delta) -> str:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-1.5-flash")

        changes_str = "; ".join([
            f"{c['parameter']} {'+' if c['value'] > 0 else ''}{c['value']}{'%' if c['change_type'] == 'percent' else ' units'}"
            for c in changes
        ])

        prompt = f"""A business owner is testing a scenario: {changes_str}

Baseline: Revenue ₹{baseline['revenue']:,.0f}, Net Profit ₹{baseline['net_profit']:,.0f}, Margin {baseline['gross_margin']}%
Projected (month {len(projections)}): Revenue change {delta['revenue_delta_pct']:+.1f}%, Margin change {delta['margin_delta_pts']:+.1f}pts, Net profit change ₹{delta['net_profit_delta']:+,.0f}

Write a 3-4 sentence plain English commentary:
1. What the simulation shows
2. Key trade-offs to be aware of
3. One specific actionable recommendation

Be concise and specific. No generic business clichés."""

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, model.generate_content, prompt)
            return response.text.strip()
        except Exception:
            return "Unable to generate commentary. Please review the projected numbers directly."
```

### 5.5 Frontend — `frontend/src/features/scenario/ScenarioSimulator.jsx`

```jsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { runScenario } from "../../api/scenarioApi";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import { PlusCircle, Trash2, Play } from "lucide-react";

const PARAMETERS = [
	{ value: "price", label: "Selling Price" },
	{ value: "units_sold", label: "Units Sold / Month" },
	{ value: "ad_spend", label: "Ad Spend" },
	{ value: "cogs", label: "Cost of Goods Sold" },
	{ value: "headcount", label: "Headcount" },
];

export default function ScenarioSimulator({
	baseMetrics,
	avgPrice,
	unitsPerMonth,
}) {
	const [changes, setChanges] = useState([
		{ parameter: "price", change_type: "percent", value: 5 },
	]);
	const [months, setMonths] = useState(3);

	const simulate = useMutation({
		mutationFn: (payload) => runScenario(payload),
	});

	const addChange = () =>
		setChanges([
			...changes,
			{ parameter: "price", change_type: "percent", value: 0 },
		]);

	const removeChange = (i) => setChanges(changes.filter((_, idx) => idx !== i));

	const updateChange = (i, field, value) =>
		setChanges(
			changes.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)),
		);

	const handleRun = () => {
		simulate.mutate({
			base_metrics: baseMetrics,
			changes,
			projection_months: months,
			avg_selling_price: avgPrice,
			units_sold_per_month: unitsPerMonth,
		});
	};

	const result = simulate.data;

	return (
		<div className="space-y-6 p-6">
			<h1 className="text-2xl font-bold">What-If Scenario Simulator</h1>

			{/* Parameter Changes */}
			<div className="bg-white border rounded-xl p-5 space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="font-semibold">Define Changes</h2>
					<button
						onClick={addChange}
						className="flex items-center gap-1 text-blue-600 text-sm hover:underline"
					>
						<PlusCircle className="w-4 h-4" /> Add Parameter
					</button>
				</div>

				{changes.map((change, i) => (
					<div key={i} className="flex items-center gap-3 flex-wrap">
						<select
							value={change.parameter}
							onChange={(e) => updateChange(i, "parameter", e.target.value)}
							className="border rounded px-2 py-1 text-sm"
						>
							{PARAMETERS.map((p) => (
								<option key={p.value} value={p.value}>
									{p.label}
								</option>
							))}
						</select>

						<select
							value={change.change_type}
							onChange={(e) => updateChange(i, "change_type", e.target.value)}
							className="border rounded px-2 py-1 text-sm"
						>
							<option value="percent">% Change</option>
							<option value="absolute">Absolute Change</option>
						</select>

						<input
							type="number"
							value={change.value}
							onChange={(e) =>
								updateChange(i, "value", parseFloat(e.target.value) || 0)
							}
							className="border rounded px-2 py-1 text-sm w-24"
							placeholder="e.g. 5"
						/>
						<span className="text-sm text-gray-500">
							{change.change_type === "percent" ? "%" : "units/₹"}
						</span>

						<button
							onClick={() => removeChange(i)}
							className="text-red-400 hover:text-red-600"
						>
							<Trash2 className="w-4 h-4" />
						</button>
					</div>
				))}

				<div className="flex items-center gap-3">
					<label className="text-sm text-gray-600">Project for</label>
					<select
						value={months}
						onChange={(e) => setMonths(Number(e.target.value))}
						className="border rounded px-2 py-1 text-sm"
					>
						{[1, 2, 3, 6, 12].map((m) => (
							<option key={m} value={m}>
								{m} month{m > 1 ? "s" : ""}
							</option>
						))}
					</select>

					<button
						onClick={handleRun}
						disabled={simulate.isPending}
						className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
					>
						<Play className="w-4 h-4" />
						{simulate.isPending ? "Simulating…" : "Run Simulation"}
					</button>
				</div>
			</div>

			{/* Results */}
			{result && (
				<div className="space-y-5">
					{/* Delta Cards */}
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
						<DeltaCard
							label="Revenue Impact"
							value={`${result.delta_summary.revenue_delta_pct > 0 ? "+" : ""}${result.delta_summary.revenue_delta_pct}%`}
							positive={result.delta_summary.revenue_delta_pct >= 0}
						/>
						<DeltaCard
							label="Margin Change"
							value={`${result.delta_summary.margin_delta_pts > 0 ? "+" : ""}${result.delta_summary.margin_delta_pts} pts`}
							positive={result.delta_summary.margin_delta_pts >= 0}
						/>
						<DeltaCard
							label="Net Profit Change"
							value={`₹${(result.delta_summary.net_profit_delta / 1000).toFixed(1)}K`}
							positive={result.delta_summary.net_profit_delta >= 0}
						/>
						<DeltaCard
							label="Cash Balance (End)"
							value={`₹${(result.delta_summary.cash_balance_final / 1000).toFixed(1)}K`}
							positive={result.delta_summary.cash_balance_final >= 0}
						/>
					</div>

					{/* Chart */}
					<div className="bg-white border rounded-xl p-5">
						<h3 className="font-semibold mb-4">Projection Chart</h3>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={result.projections}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" tickFormatter={(v) => `M${v}`} />
								<YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
								<Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
								<Legend />
								<Line
									type="monotone"
									dataKey="revenue"
									stroke="#3B82F6"
									strokeWidth={2}
									name="Revenue"
								/>
								<Line
									type="monotone"
									dataKey="gross_profit"
									stroke="#10B981"
									strokeWidth={2}
									name="Gross Profit"
								/>
								<Line
									type="monotone"
									dataKey="net_profit"
									stroke="#F59E0B"
									strokeWidth={2}
									name="Net Profit"
								/>
								<Line
									type="monotone"
									dataKey="cash_balance"
									stroke="#6366F1"
									strokeWidth={2}
									strokeDasharray="5 5"
									name="Cash"
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>

					{/* Commentary */}
					{result.commentary && (
						<div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
							<h3 className="font-semibold text-blue-800 mb-2">
								AI Commentary
							</h3>
							<p className="text-blue-900 text-sm leading-relaxed">
								{result.commentary}
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function DeltaCard({ label, value, positive }) {
	return (
		<div className="bg-white border rounded-xl p-4">
			<p className="text-xs text-gray-500">{label}</p>
			<p
				className={`text-xl font-bold ${positive ? "text-green-600" : "text-red-600"}`}
			>
				{value}
			</p>
		</div>
	);
}
```

---

## 6. Feature 4 — Natural Language Query Copilot

### 6.1 Overview

A conversational interface where users ask plain-English questions about their business data. The backend retrieves the relevant Firestore metrics, constructs a data-rich context, calls the LLM, and returns both an explanation and optional chart spec.

### 6.2 Backend — `backend/routers/copilot.py`

```python
from fastapi import APIRouter, Depends, Body
from utils.auth import verify_firebase_token
from services.copilot_service import CopilotService
from models.schemas import CopilotQuery

router = APIRouter()

@router.post("/query")
async def query_copilot(
    query: CopilotQuery = Body(...),
    user: dict = Depends(verify_firebase_token)
):
    svc = CopilotService()
    return await svc.answer(uid=user["uid"], question=query.question, history=query.history)
```

### 6.3 Backend — `backend/models/schemas.py` (Copilot section)

```python
class CopilotMessage(BaseModel):
    role: str      # "user" | "assistant"
    content: str

class CopilotQuery(BaseModel):
    question: str
    history: List[CopilotMessage] = []
```

### 6.4 Backend — `backend/services/copilot_service.py`

````python
import os
import json
import asyncio
from typing import List, Dict

from firebase_admin import firestore

class CopilotService:

    def __init__(self):
        self.db = firestore.client()

    async def answer(self, uid: str, question: str, history: List[Dict]) -> Dict:
        # 1. Retrieve user's recent metrics from Firestore
        metrics_context = await self._fetch_metrics_context(uid)

        # 2. Build conversation messages
        system_prompt = f"""You are Yukti's AI Copilot — a senior business analyst embedded in a financial intelligence dashboard.

You have access to the following business metrics for this user:
{metrics_context}

Your job is to:
1. Answer the user's question accurately using their real data
2. Identify the root cause if asked about a decline/change
3. Provide 1-2 specific next actions
4. If a chart would help, include a `chart_spec` JSON block

Always respond in this JSON format:
{{
  "answer": "plain english explanation referencing actual numbers",
  "next_actions": ["action 1", "action 2"],
  "chart_spec": {{           // OPTIONAL - include only if a chart adds value
    "type": "line|bar|pie",
    "title": "chart title",
    "x_key": "field name for x axis",
    "y_keys": ["field1", "field2"],
    "data": [ {{ ... }} ]    // the actual data array to render
  }}
}}"""

        messages = [
            {"role": m.role, "content": m.content}
            for m in (history[-6:] if len(history) > 6 else history)  # last 6 turns
        ] + [{"role": "user", "content": question}]

        # 3. Call LLM
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-1.5-pro",
                                      system_instruction=system_prompt)

        loop = asyncio.get_event_loop()

        gemini_msgs = []
        for m in messages:
            gemini_msgs.append({
                "role": "user" if m["role"] == "user" else "model",
                "parts": [m["content"]]
            })

        try:
            chat = model.start_chat(history=gemini_msgs[:-1])
            response = await loop.run_in_executor(
                None,
                lambda: chat.send_message(gemini_msgs[-1]["parts"][0])
            )
            raw = response.text.strip().lstrip("```json").rstrip("```").strip()
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = {"answer": response.text, "next_actions": [], "chart_spec": None}
        except Exception as e:
            parsed = {"answer": f"I encountered an error: {str(e)}", "next_actions": [], "chart_spec": None}

        return {
            "question": question,
            "answer": parsed.get("answer", ""),
            "next_actions": parsed.get("next_actions", []),
            "chart_spec": parsed.get("chart_spec"),
        }

    async def _fetch_metrics_context(self, uid: str) -> str:
        """Retrieves last 6 months of metrics from Firestore and formats as text."""
        try:
            col = self.db.collection("users").document(uid).collection("metrics")
            docs = col.order_by("month", direction=firestore.Query.DESCENDING).limit(6).stream()
            records = [doc.to_dict() for doc in docs]
            records.reverse()
            if not records:
                return "No historical metrics available yet."
            lines = ["Month | Revenue | Expenses | Cash | Customers | Gross Margin"]
            for r in records:
                rev = r.get("revenue", 0)
                exp = r.get("expenses", 0)
                margin = round((rev - r.get("cogs", 0)) / max(rev, 1) * 100, 1)
                lines.append(
                    f"{r.get('month')} | ₹{rev:,.0f} | ₹{exp:,.0f} | "
                    f"₹{r.get('cash_balance', 0):,.0f} | "
                    f"{r.get('customer_count', 0)} | {margin}%"
                )
            return "\n".join(lines)
        except Exception:
            return "Unable to retrieve metrics context."
````

### 6.5 Frontend — `frontend/src/features/copilot/CopilotChat.jsx`

```jsx
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryCopilot } from "../../api/copilotApi";
import ReactMarkdown from "react-markdown";
import {
	BarChart,
	Bar,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { Send, Sparkles } from "lucide-react";

const SUGGESTED_QUESTIONS = [
	"Why did profit fall last month?",
	"What are my biggest expense categories?",
	"How is my cash runway looking?",
	"Which month had the best gross margin?",
	"What's my revenue growth trend?",
];

export default function CopilotChat() {
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const bottomRef = useRef(null);

	const query = useMutation({
		mutationFn: ({ question, history }) => queryCopilot(question, history),
		onSuccess: (data) => {
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: data.answer,
					next_actions: data.next_actions,
					chart_spec: data.chart_spec,
				},
			]);
		},
	});

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSend = (q = input.trim()) => {
		if (!q) return;
		const userMsg = { role: "user", content: q };
		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		query.mutate({
			question: q,
			history: messages.map((m) => ({ role: m.role, content: m.content })),
		});
	};

	return (
		<div className="flex flex-col h-full max-h-[80vh]">
			<div className="flex items-center gap-2 p-4 border-b">
				<Sparkles className="w-5 h-5 text-purple-500" />
				<h2 className="font-bold text-lg">Copilot</h2>
				<span className="text-xs text-gray-400">
					Ask anything about your business
				</span>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.length === 0 && (
					<div className="space-y-2">
						<p className="text-sm text-gray-500">Try asking:</p>
						{SUGGESTED_QUESTIONS.map((q, i) => (
							<button
								key={i}
								onClick={() => handleSend(q)}
								className="block text-left w-full text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-2"
							>
								{q}
							</button>
						))}
					</div>
				)}

				{messages.map((msg, i) => (
					<div
						key={i}
						className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
					>
						<div
							className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm
              ${
								msg.role === "user"
									? "bg-blue-600 text-white rounded-br-sm"
									: "bg-gray-100 text-gray-800 rounded-bl-sm"
							}`}
						>
							<ReactMarkdown>{msg.content}</ReactMarkdown>

							{msg.next_actions?.length > 0 && (
								<div className="mt-3 border-t border-gray-200 pt-2 space-y-1">
									<p className="text-xs font-semibold text-gray-500">
										Next Actions:
									</p>
									{msg.next_actions.map((a, j) => (
										<p key={j} className="text-xs text-gray-700">
											→ {a}
										</p>
									))}
								</div>
							)}

							{msg.chart_spec && <ChartRenderer spec={msg.chart_spec} />}
						</div>
					</div>
				))}

				{query.isPending && (
					<div className="flex justify-start">
						<div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
							<span className="flex gap-1">
								{[0, 1, 2].map((i) => (
									<span
										key={i}
										className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
										style={{ animationDelay: `${i * 0.15}s` }}
									/>
								))}
							</span>
						</div>
					</div>
				)}

				<div ref={bottomRef} />
			</div>

			{/* Input */}
			<div className="p-4 border-t flex gap-2">
				<input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
					placeholder="Ask a question about your business…"
					className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<button
					onClick={() => handleSend()}
					disabled={!input.trim() || query.isPending}
					className="bg-blue-600 text-white rounded-xl px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
				>
					<Send className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}

function ChartRenderer({ spec }) {
	if (!spec?.data?.length) return null;
	const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

	if (spec.type === "bar")
		return (
			<div className="mt-3">
				<p className="text-xs font-semibold mb-2">{spec.title}</p>
				<ResponsiveContainer width="100%" height={200}>
					<BarChart data={spec.data}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey={spec.x_key} tick={{ fontSize: 10 }} />
						<YAxis tick={{ fontSize: 10 }} />
						<Tooltip />
						{spec.y_keys.map((k, i) => (
							<Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} />
						))}
					</BarChart>
				</ResponsiveContainer>
			</div>
		);

	if (spec.type === "line")
		return (
			<div className="mt-3">
				<p className="text-xs font-semibold mb-2">{spec.title}</p>
				<ResponsiveContainer width="100%" height={200}>
					<LineChart data={spec.data}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey={spec.x_key} tick={{ fontSize: 10 }} />
						<YAxis tick={{ fontSize: 10 }} />
						<Tooltip />
						{spec.y_keys.map((k, i) => (
							<Line
								key={k}
								dataKey={k}
								stroke={COLORS[i % COLORS.length]}
								strokeWidth={2}
								dot={false}
							/>
						))}
					</LineChart>
				</ResponsiveContainer>
			</div>
		);

	if (spec.type === "pie")
		return (
			<div className="mt-3">
				<p className="text-xs font-semibold mb-2">{spec.title}</p>
				<ResponsiveContainer width="100%" height={200}>
					<PieChart>
						<Pie
							data={spec.data}
							dataKey={spec.y_keys[0]}
							nameKey={spec.x_key}
							cx="50%"
							cy="50%"
							outerRadius={80}
						>
							{spec.data.map((_, i) => (
								<Cell key={i} fill={COLORS[i % COLORS.length]} />
							))}
						</Pie>
						<Tooltip />
					</PieChart>
				</ResponsiveContainer>
			</div>
		);

	return null;
}
```

---

## 7. Feature 5 — Action Tracker Tied to Insights

### 7.1 Overview

Every insight, recommendation, or alert can be "converted" into a tracked action with owner, due date, status, and expected impact. Actions are stored in Firestore and updated in real time.

### 7.2 Firestore Schema

```
users/{uid}/actions/{actionId}
  - id: string
  - title: string
  - description: string
  - source_type: "alert" | "recommendation" | "copilot" | "manual"
  - source_id: string          # ID of alert/recommendation that generated this
  - owner: string              # name or email
  - due_date: timestamp
  - status: "todo" | "in_progress" | "done" | "skipped"
  - expected_impact: string    # free text e.g. "Reduce cash burn by 15%"
  - expected_impact_value: float  # optional numeric
  - actual_impact: string
  - created_at: timestamp
  - updated_at: timestamp
  - priority: "high" | "medium" | "low"
```

### 7.3 Backend — `backend/routers/actions.py`

```python
from fastapi import APIRouter, Depends, Body, Path
from typing import Optional
from utils.auth import verify_firebase_token
from services.action_service import ActionService
from models.schemas import ActionCreate, ActionUpdate

router = APIRouter()

@router.post("/")
async def create_action(
    payload: ActionCreate = Body(...),
    user: dict = Depends(verify_firebase_token)
):
    svc = ActionService()
    action = await svc.create(uid=user["uid"], payload=payload.dict())
    return action

@router.get("/")
async def list_actions(
    status: Optional[str] = None,
    user: dict = Depends(verify_firebase_token)
):
    svc = ActionService()
    return await svc.list(uid=user["uid"], status_filter=status)

@router.patch("/{action_id}")
async def update_action(
    action_id: str = Path(...),
    payload: ActionUpdate = Body(...),
    user: dict = Depends(verify_firebase_token)
):
    svc = ActionService()
    return await svc.update(uid=user["uid"], action_id=action_id, payload=payload.dict(exclude_none=True))

@router.delete("/{action_id}")
async def delete_action(
    action_id: str = Path(...),
    user: dict = Depends(verify_firebase_token)
):
    svc = ActionService()
    await svc.delete(uid=user["uid"], action_id=action_id)
    return {"deleted": True}
```

### 7.4 Backend — `backend/models/schemas.py` (Actions section)

```python
from datetime import datetime

class ActionCreate(BaseModel):
    title: str
    description: str = ""
    source_type: str = "manual"   # "alert"|"recommendation"|"copilot"|"manual"
    source_id: str = ""
    owner: str = ""
    due_date: Optional[datetime] = None
    expected_impact: str = ""
    expected_impact_value: Optional[float] = None
    priority: str = "medium"

class ActionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    owner: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None       # "todo"|"in_progress"|"done"|"skipped"
    expected_impact: Optional[str] = None
    actual_impact: Optional[str] = None
    priority: Optional[str] = None
```

### 7.5 Backend — `backend/services/action_service.py`

```python
import uuid
from datetime import datetime
from typing import Optional, List, Dict
from firebase_admin import firestore

class ActionService:
    def __init__(self):
        self.db = firestore.client()

    def _col(self, uid: str):
        return self.db.collection("users").document(uid).collection("actions")

    async def create(self, uid: str, payload: Dict) -> Dict:
        action_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        doc = {
            "id":          action_id,
            "status":      "todo",
            "created_at":  now,
            "updated_at":  now,
            **payload,
        }
        self._col(uid).document(action_id).set(doc)
        return doc

    async def list(self, uid: str, status_filter: Optional[str] = None) -> List[Dict]:
        q = self._col(uid)
        if status_filter:
            q = q.where("status", "==", status_filter)
        docs = q.order_by("created_at", direction=firestore.Query.DESCENDING).limit(100).stream()
        return [d.to_dict() for d in docs]

    async def update(self, uid: str, action_id: str, payload: Dict) -> Dict:
        payload["updated_at"] = datetime.utcnow().isoformat()
        ref = self._col(uid).document(action_id)
        ref.update(payload)
        return ref.get().to_dict()

    async def delete(self, uid: str, action_id: str):
        self._col(uid).document(action_id).delete()
```

### 7.6 Frontend — `frontend/src/features/action-tracker/ActionTracker.jsx`

```jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	fetchActions,
	createAction,
	updateAction,
	deleteAction,
} from "../../api/actionsApi";
import {
	CheckCircle2,
	Clock,
	AlertCircle,
	SkipForward,
	Plus,
	Pencil,
} from "lucide-react";

const STATUS_CONFIG = {
	todo: {
		label: "To Do",
		icon: Clock,
		color: "text-gray-500",
		bg: "bg-gray-100",
	},
	in_progress: {
		label: "In Progress",
		icon: AlertCircle,
		color: "text-blue-600",
		bg: "bg-blue-100",
	},
	done: {
		label: "Done",
		icon: CheckCircle2,
		color: "text-green-600",
		bg: "bg-green-100",
	},
	skipped: {
		label: "Skipped",
		icon: SkipForward,
		color: "text-gray-400",
		bg: "bg-gray-50",
	},
};

const COLUMNS = ["todo", "in_progress", "done", "skipped"];

export default function ActionTracker() {
	const qc = useQueryClient();
	const [showCreateModal, setShowCreateModal] = useState(false);

	const { data } = useQuery({
		queryKey: ["actions"],
		queryFn: () => fetchActions(),
	});
	const actions = data?.actions ?? [];

	const updateMutation = useMutation({
		mutationFn: ({ id, updates }) => updateAction(id, updates),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["actions"] }),
	});

	const deleteMutation = useMutation({
		mutationFn: deleteAction,
		onSuccess: () => qc.invalidateQueries({ queryKey: ["actions"] }),
	});

	const moveAction = (id, newStatus) =>
		updateMutation.mutate({ id, updates: { status: newStatus } });

	const byStatus = (status) => actions.filter((a) => a.status === status);

	return (
		<div className="p-6 space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Action Tracker</h1>
				<button
					onClick={() => setShowCreateModal(true)}
					className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
				>
					<Plus className="w-4 h-4" /> New Action
				</button>
			</div>

			{/* Kanban Board */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{COLUMNS.map((status) => {
					const { label, icon: Icon, color, bg } = STATUS_CONFIG[status];
					return (
						<div key={status} className="bg-gray-50 rounded-xl p-3 space-y-2">
							<div
								className={`flex items-center gap-2 ${color} font-semibold text-sm`}
							>
								<Icon className="w-4 h-4" /> {label}
								<span className="ml-auto bg-white rounded-full px-2 py-0.5 text-xs text-gray-500">
									{byStatus(status).length}
								</span>
							</div>

							{byStatus(status).map((action) => (
								<ActionCard
									key={action.id}
									action={action}
									onMove={moveAction}
									onDelete={() => deleteMutation.mutate(action.id)}
								/>
							))}
						</div>
					);
				})}
			</div>

			{showCreateModal && (
				<CreateActionModal
					onClose={() => setShowCreateModal(false)}
					onCreate={(payload) => {
						createAction(payload).then(() => {
							qc.invalidateQueries({ queryKey: ["actions"] });
							setShowCreateModal(false);
						});
					}}
				/>
			)}
		</div>
	);
}

function ActionCard({ action, onMove, onDelete }) {
	const isOverdue =
		action.due_date &&
		new Date(action.due_date) < new Date() &&
		action.status !== "done";
	const priorityColor = {
		high: "border-l-red-500",
		medium: "border-l-yellow-400",
		low: "border-l-gray-300",
	};

	return (
		<div
			className={`bg-white rounded-lg border-l-4 ${priorityColor[action.priority] || "border-l-gray-300"} p-3 shadow-sm space-y-2`}
		>
			<p className="text-sm font-medium text-gray-800 leading-tight">
				{action.title}
			</p>

			{action.owner && (
				<p className="text-xs text-gray-500">👤 {action.owner}</p>
			)}
			{action.due_date && (
				<p
					className={`text-xs ${isOverdue ? "text-red-600 font-semibold" : "text-gray-400"}`}
				>
					📅 {new Date(action.due_date).toLocaleDateString()}
					{isOverdue && " — Overdue"}
				</p>
			)}
			{action.expected_impact && (
				<p className="text-xs text-green-700 bg-green-50 rounded px-2 py-0.5">
					↑ {action.expected_impact}
				</p>
			)}

			{/* Status Change Buttons */}
			<div className="flex gap-1 flex-wrap pt-1">
				{Object.entries(STATUS_CONFIG)
					.filter(([s]) => s !== action.status)
					.map(([s, cfg]) => (
						<button
							key={s}
							onClick={() => onMove(action.id, s)}
							className="text-xs text-gray-500 hover:text-gray-800 border rounded px-1.5 py-0.5"
						>
							→ {cfg.label}
						</button>
					))}
				<button
					onClick={onDelete}
					className="text-xs text-red-400 hover:text-red-600 ml-auto"
				>
					Delete
				</button>
			</div>
		</div>
	);
}

function CreateActionModal({ onClose, onCreate }) {
	const [form, setForm] = useState({
		title: "",
		description: "",
		owner: "",
		due_date: "",
		expected_impact: "",
		priority: "medium",
		source_type: "manual",
	});

	const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

	return (
		<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
			<div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
				<h2 className="font-bold text-lg">Create Action</h2>

				{[
					{ label: "Title *", key: "title", type: "text" },
					{ label: "Description", key: "description", type: "text" },
					{ label: "Owner", key: "owner", type: "text" },
					{ label: "Due Date", key: "due_date", type: "date" },
					{ label: "Expected Impact", key: "expected_impact", type: "text" },
				].map(({ label, key, type }) => (
					<div key={key}>
						<label className="text-xs text-gray-500 block mb-1">{label}</label>
						<input
							type={type}
							value={form[key]}
							onChange={(e) => set(key, e.target.value)}
							className="w-full border rounded-lg px-3 py-2 text-sm"
						/>
					</div>
				))}

				<div>
					<label className="text-xs text-gray-500 block mb-1">Priority</label>
					<select
						value={form.priority}
						onChange={(e) => set("priority", e.target.value)}
						className="w-full border rounded-lg px-3 py-2 text-sm"
					>
						<option value="high">High</option>
						<option value="medium">Medium</option>
						<option value="low">Low</option>
					</select>
				</div>

				<div className="flex gap-3 pt-2">
					<button
						onClick={onClose}
						className="flex-1 border rounded-lg py-2 text-sm"
					>
						Cancel
					</button>
					<button
						onClick={() => form.title && onCreate(form)}
						className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm"
					>
						Create
					</button>
				</div>
			</div>
		</div>
	);
}
```

### 7.7 Wiring: Convert Alert → Action

Add this button to the `AlertCard` component (Feature 2):

```jsx
// Inside AlertCard, add:
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAction } from "../../api/actionsApi";

// ...inside component:
const qc = useQueryClient();
const convertToAction = useMutation({
	mutationFn: createAction,
	onSuccess: () => qc.invalidateQueries({ queryKey: ["actions"] }),
});

// ...in JSX:
<button
	onClick={() =>
		convertToAction.mutate({
			title: alert.title,
			description: alert.detail,
			source_type: "alert",
			source_id: alert.id,
			priority:
				alert.severity === "critical"
					? "high"
					: alert.severity === "high"
						? "high"
						: "medium",
			expected_impact: alert.suggested_actions[0] || "",
			source_type: "alert",
		})
	}
	className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
>
	+ Add to Actions
</button>;
```

---

## 8. Feature 6 — Explainable Insights Panel

### 8.1 Overview

For every AI-generated insight, recommendation, or prediction, this panel shows: the model's reasoning, which signals drove the recommendation, confidence score, and supporting data evidence.

### 8.2 Backend — `backend/routers/insights.py`

```python
from fastapi import APIRouter, Depends, Body
from utils.auth import verify_firebase_token
from services.explainer_service import ExplainerService
from models.schemas import InsightExplainRequest

router = APIRouter()

@router.post("/explain")
async def explain_insight(
    request: InsightExplainRequest = Body(...),
    user: dict = Depends(verify_firebase_token)
):
    svc = ExplainerService()
    return await svc.explain(uid=user["uid"], request=request.dict())
```

### 8.3 Backend — `backend/models/schemas.py` (Insights section)

```python
class InsightExplainRequest(BaseModel):
    insight_text: str           # The recommendation/prediction text
    insight_type: str           # "recommendation"|"prediction"|"alert"
    supporting_metrics: Optional[Dict[str, Any]] = None  # the raw metrics that triggered it
```

### 8.4 Backend — `backend/services/explainer_service.py`

````python
import os
import json
import asyncio
from typing import Dict

class ExplainerService:

    async def explain(self, uid: str, request: Dict) -> Dict:
        insight = request["insight_text"]
        insight_type = request["insight_type"]
        metrics = request.get("supporting_metrics", {})

        metrics_str = json.dumps(metrics, indent=2) if metrics else "No metrics provided."

        prompt = f"""You are an AI explainability engine. A business intelligence system generated this {insight_type}:

"{insight}"

The raw metrics/signals that contributed to this insight:
{metrics_str}

Respond ONLY in valid JSON:
{{
  "plain_explanation": "2-3 sentence plain English explanation of WHY this insight was generated",
  "confidence_score": 0.85,     // float between 0.0 and 1.0
  "confidence_rationale": "Why this confidence level was assigned",
  "top_signals": [
    {{
      "signal_name": "e.g. Cash Runway",
      "signal_value": "e.g. 18 days",
      "contribution": "how this signal contributed",
      "weight": "high|medium|low"
    }}
  ],
  "assumptions_made": ["assumption 1", "assumption 2"],
  "what_could_change_this": "What data or change would alter this recommendation",
  "alternative_interpretation": "An alternative way to read the same data"
}}"""

        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-1.5-flash")
        loop = asyncio.get_event_loop()

        try:
            response = await loop.run_in_executor(None, model.generate_content, prompt)
            raw = response.text.strip().lstrip("```json").rstrip("```").strip()
            return json.loads(raw)
        except Exception as e:
            return {
                "plain_explanation": insight,
                "confidence_score": 0.5,
                "confidence_rationale": "Unable to compute",
                "top_signals": [],
                "assumptions_made": [],
                "what_could_change_this": "",
                "alternative_interpretation": "",
                "_error": str(e)
            }
````

### 8.5 Frontend — `frontend/src/features/explainability/ExplainPanel.jsx`

```jsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { explainInsight } from "../../api/insightsApi";
import { Info, ChevronDown, ChevronUp, Brain } from "lucide-react";

export default function ExplainButton({
	insightText,
	insightType,
	supportingMetrics,
}) {
	const [open, setOpen] = useState(false);
	const [explanation, setExplanation] = useState(null);

	const explain = useMutation({
		mutationFn: () =>
			explainInsight(insightText, insightType, supportingMetrics),
		onSuccess: (data) => {
			setExplanation(data);
			setOpen(true);
		},
	});

	return (
		<div>
			<button
				onClick={() => (explanation ? setOpen(!open) : explain.mutate())}
				className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
			>
				<Brain className="w-3.5 h-3.5" />
				{explain.isPending ? "Analyzing…" : "Why this?"}
				{explanation &&
					(open ? (
						<ChevronUp className="w-3 h-3" />
					) : (
						<ChevronDown className="w-3 h-3" />
					))}
			</button>

			{open && explanation && (
				<div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-4 text-sm">
					{/* Confidence */}
					<div className="flex items-center gap-3">
						<span className="text-xs text-gray-500">Confidence</span>
						<div className="flex-1 bg-gray-200 rounded-full h-2">
							<div
								className="bg-indigo-500 h-2 rounded-full transition-all"
								style={{ width: `${explanation.confidence_score * 100}%` }}
							/>
						</div>
						<span className="text-xs font-semibold text-indigo-700">
							{Math.round(explanation.confidence_score * 100)}%
						</span>
					</div>

					{/* Plain Explanation */}
					<p className="text-gray-700 leading-relaxed">
						{explanation.plain_explanation}
					</p>

					{/* Top Signals */}
					{explanation.top_signals?.length > 0 && (
						<div>
							<p className="text-xs font-semibold text-gray-500 mb-2">
								Key Signals
							</p>
							<div className="space-y-1">
								{explanation.top_signals.map((sig, i) => (
									<div
										key={i}
										className="flex items-start gap-2 bg-white rounded-lg p-2 border border-indigo-100"
									>
										<span
											className={`text-xs font-bold mt-0.5 ${
												sig.weight === "high"
													? "text-red-500"
													: sig.weight === "medium"
														? "text-yellow-500"
														: "text-gray-400"
											}`}
										>
											{sig.weight === "high"
												? "●●●"
												: sig.weight === "medium"
													? "●●○"
													: "●○○"}
										</span>
										<div>
											<span className="font-medium text-gray-700">
												{sig.signal_name}:{" "}
											</span>
											<span className="text-indigo-700 font-semibold">
												{sig.signal_value}
											</span>
											<p className="text-gray-500 text-xs">
												{sig.contribution}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Assumptions */}
					{explanation.assumptions_made?.length > 0 && (
						<details className="cursor-pointer">
							<summary className="text-xs font-semibold text-gray-500">
								Assumptions Made
							</summary>
							<ul className="mt-2 space-y-1">
								{explanation.assumptions_made.map((a, i) => (
									<li key={i} className="text-xs text-gray-600">
										• {a}
									</li>
								))}
							</ul>
						</details>
					)}

					{/* What Could Change This */}
					{explanation.what_could_change_this && (
						<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
							<p className="text-xs font-semibold text-yellow-700">
								What could change this insight:
							</p>
							<p className="text-xs text-yellow-800 mt-1">
								{explanation.what_could_change_this}
							</p>
						</div>
					)}

					{/* Alternative Interpretation */}
					{explanation.alternative_interpretation && (
						<p className="text-xs text-gray-500 italic">
							Alternative view: {explanation.alternative_interpretation}
						</p>
					)}
				</div>
			)}
		</div>
	);
}
```

Add `<ExplainButton>` to any insight-bearing component, e.g. `RecommendationCard`:

```jsx
// Inside RecommendationCard:
import ExplainButton from "../explainability/ExplainPanel";

// ...in JSX:
<ExplainButton
	insightText={recommendation.action}
	insightType="recommendation"
	supportingMetrics={{
		rationale: recommendation.rationale,
		urgency: recommendation.urgency,
	}}
/>;
```

---

## 9. Cross-Feature Security Hardening

### 9.1 Firestore Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only access their own subcollections
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny all by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 9.2 Backend Rate Limiting

```python
# backend/utils/rate_limit.py
import time
from collections import defaultdict
from fastapi import HTTPException, Request

_request_log: dict = defaultdict(list)
WINDOW = 60       # seconds
MAX_REQUESTS = 30 # per window per user

def check_rate_limit(uid: str):
    now = time.time()
    _request_log[uid] = [t for t in _request_log[uid] if now - t < WINDOW]
    if len(_request_log[uid]) >= MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again shortly.")
    _request_log[uid].append(now)
```

Add to any AI-powered endpoint:

```python
from utils.rate_limit import check_rate_limit

@router.post("/simulate")
async def simulate_scenario(request: ScenarioRequest, user: dict = Depends(verify_firebase_token)):
    check_rate_limit(user["uid"])
    ...
```

### 9.3 Input Validation

```python
# In all schemas — add field length caps to prevent prompt injection
class CopilotQuery(BaseModel):
    question: str = Field(..., max_length=1000, strip_whitespace=True)
    history: List[CopilotMessage] = Field(default=[], max_items=20)

class ScenarioChange(BaseModel):
    parameter: str = Field(..., pattern="^(price|units_sold|ad_spend|cogs|headcount)$")
    change_type: str = Field(..., pattern="^(percent|absolute)$")
    value: float = Field(..., ge=-100, le=1000)
```

### 9.4 API Key Security

Never expose API keys to the frontend. All LLM calls must go through the FastAPI backend. The frontend only receives Firebase tokens. Backend loads keys from `.env`, never from request parameters.

### 9.5 News URL Safety

```python
# In news_service.py — validate URLs before fetching
from urllib.parse import urlparse

ALLOWED_SCHEMES = {"http", "https"}
BLOCKED_DOMAINS = {"localhost", "127.0.0.1", "0.0.0.0", "169.254.169.254"}

def is_safe_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        return (parsed.scheme in ALLOWED_SCHEMES and
                parsed.hostname not in BLOCKED_DOMAINS and
                not parsed.hostname.startswith("10.") and
                not parsed.hostname.startswith("192.168."))
    except Exception:
        return False
```

---

## 10. Testing Strategy

### 10.1 Backend Unit Tests

```bash
pip install pytest pytest-asyncio httpx
```

Create `backend/tests/test_ews.py`:

```python
import pytest
from services.ews_service import EWSService

@pytest.mark.asyncio
async def test_cash_crunch_detection():
    svc = EWSService()
    metrics = {
        "current": {
            "month": "2024-06",
            "revenue": 100000, "expenses": 80000, "cash_balance": 25000,
            "inventory_value": 20000, "customer_count": 100, "cogs": 40000
        },
        "history": [
            {"month": "2024-05", "revenue": 120000, "expenses": 75000,
             "cash_balance": 50000, "inventory_value": 20000, "customer_count": 105, "cogs": 40000}
        ],
        "monthly_burn_rate": 30000,
    }
    # Monkey-patch Firestore to avoid real calls
    svc._save_alerts = lambda uid, alerts: None
    alerts = await svc.evaluate(uid="test_user", metrics=metrics)
    types = [a["type"] for a in alerts]
    assert "cash_crunch" in types
    cash_alert = next(a for a in alerts if a["type"] == "cash_crunch")
    assert cash_alert["severity"] in ["critical", "high", "medium"]
```

### 10.2 Frontend Tests

```bash
npm install -D vitest @testing-library/react @testing-library/user-event
```

Sample test `frontend/src/features/early-warning/__tests__/AlertsPanel.test.jsx`:

```jsx
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AlertsPanel from "../AlertsPanel";

vi.mock("../../../api/alertsApi", () => ({
	fetchActiveAlerts: vi.fn().mockResolvedValue({
		alerts: [
			{
				id: "1",
				type: "cash_crunch",
				severity: "critical",
				title: "Cash Runway: 12 days",
				detail: "Low cash.",
				suggested_actions: ["Reduce expenses"],
				dismissed: false,
			},
		],
	}),
	dismissAlert: vi.fn(),
}));

test("renders critical alert with correct severity", async () => {
	const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	render(
		<QueryClientProvider client={qc}>
			<AlertsPanel />
		</QueryClientProvider>,
	);
	expect(await screen.findByText("Cash Runway: 12 days")).toBeInTheDocument();
	expect(screen.getByText("Critical")).toBeInTheDocument();
});
```

---

## 11. Deployment Checklist

### Pre-Deployment

- [ ] All `.env` files are in `.gitignore` — never committed
- [ ] Firebase service account JSON is mounted as a secret (not baked into image)
- [ ] Firestore rules deployed: `firebase deploy --only firestore:rules`
- [ ] Redis instance provisioned (Upstash or Railway recommended for hobby tier)
- [ ] All `requirements.txt` packages pinned to exact versions
- [ ] CORS `YUKTI_CORS_ALLOW_ORIGINS` set to production domain only

### Backend Startup Order

1. Redis must be running before backend starts (or fall back to in-memory cache)
2. Firebase Admin SDK initialized before first request
3. Check: `GET /healthz` returns `{"status": "ok"}`

Add healthcheck to `main.py`:

```python
@app.get("/healthz")
async def healthcheck():
    return {"status": "ok", "timestamp": __import__("datetime").datetime.utcnow().isoformat()}
```

### Production Environment

```bash
# Start backend (production)
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 --proxy-headers

# Build frontend
cd frontend && npm run build
# Deploy dist/ to Vercel / Netlify / Firebase Hosting
```

### Environment Variable Summary

| Variable                         | Required       | Description                   |
| -------------------------------- | -------------- | ----------------------------- |
| `GEMINI_API_KEY`                 | Yes            | Google Gemini API key         |
| `ANTHROPIC_API_KEY`              | Optional       | Fallback LLM                  |
| `GROQ_API_KEY`                   | Optional       | Fallback LLM                  |
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes            | Firebase service account path |
| `REDIS_URL`                      | Recommended    | Cache backend                 |
| `NEWS_CACHE_TTL_SECONDS`         | Optional       | Default: 900                  |
| `EWS_CASH_CRUNCH_DAYS_THRESHOLD` | Optional       | Default: 30                   |
| `VITE_API_URL`                   | Yes (frontend) | Backend base URL              |

---

_End of Implementation Guide — Yukti v1.0_

> **Note on `pygooglenews`:** Google News RSS is unofficial and rate-limited. Always cache aggressively (≥15 min TTL) and implement exponential backoff via the `tenacity` library on retries. For production scale, consider adding NewsAPI.org as a paid fallback.
