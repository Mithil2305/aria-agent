import asyncio
import hashlib
import json
import os
from urllib.parse import quote_plus
from datetime import datetime
from typing import Any, Dict, List

import feedparser
import httpx
from bs4 import BeautifulSoup
from newspaper import Article

from models.schemas import NewsFeedResponse
from utils.cache import get_cache, set_cache

BBC_RSS_FEEDS = {
    "business": "https://feeds.bbci.co.uk/news/business/rss.xml",
    "technology": "https://feeds.bbci.co.uk/news/technology/rss.xml",
    "world": "https://feeds.bbci.co.uk/news/world/rss.xml",
}


class NewsService:
    def __init__(self) -> None:
        self.cache_ttl = int(os.getenv("NEWS_CACHE_TTL_SECONDS", "900"))
        self.max_articles = int(os.getenv("NEWS_FETCH_MAX_ARTICLES", "40"))

    async def get_curated_feed(self, uid: str, keywords: List[str]) -> Dict[str, Any]:
        cache_key = self._cache_key(uid, keywords)
        cached = await get_cache(cache_key)
        if cached:
            return json.loads(cached)

        raw_articles = await asyncio.gather(
            self._fetch_google_news(keywords),
            self._fetch_bbc_rss(),
            return_exceptions=True,
        )

        all_articles: List[Dict[str, Any]] = []
        for source_result in raw_articles:
            if isinstance(source_result, list):
                all_articles.extend(source_result)

        deduped = self._deduplicate(all_articles)[: self.max_articles]
        scored = self._score_relevance(deduped, keywords)
        top_articles = sorted(
            scored,
            key=lambda article: article.get("relevance_score", 0),
            reverse=True,
        )[:15]

        enriched = await self._enrich_articles(top_articles)
        analysis = await self._analyze_with_llm(enriched, keywords)

        payload = NewsFeedResponse(
            fetched_at=datetime.utcnow().isoformat(),
            articles=enriched,
            predictions=analysis.get("predictions", []),
            recommendations=analysis.get("recommendations", []),
            market_sentiment=analysis.get("market_sentiment", "neutral"),
            keywords_used=keywords,
        ).model_dump(mode="json")

        await set_cache(cache_key, json.dumps(payload), ttl=self.cache_ttl)
        return payload

    @staticmethod
    def _cache_key(uid: str, keywords: List[str]) -> str:
        keyword_hash = hashlib.md5(",".join(sorted(keywords)).encode("utf-8")).hexdigest()
        return f"news:{uid}:{keyword_hash}"

    async def _fetch_google_news(self, keywords: List[str]) -> List[Dict[str, Any]]:
        articles: List[Dict[str, Any]] = []
        async with httpx.AsyncClient(timeout=10.0) as client:
            for keyword in keywords[:5]:
                try:
                    query = quote_plus(keyword)
                    url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
                    response = await client.get(url)
                    feed = feedparser.parse(response.text)
                    for entry in feed.entries[:8]:
                        source = "Google News"
                        if entry.get("source"):
                            source = entry.get("source", {}).get("title", source)
                        articles.append(
                            {
                                "title": entry.get("title", ""),
                                "url": entry.get("link", ""),
                                "source": source,
                                "published": entry.get("published", ""),
                                "summary": BeautifulSoup(
                                    entry.get("summary", ""),
                                    "html.parser",
                                ).get_text()[:500],
                                "full_text": "",
                            }
                        )
                except Exception:
                    continue

        return articles

    async def _fetch_bbc_rss(self) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        async with httpx.AsyncClient(timeout=10.0) as client:
            for topic, url in BBC_RSS_FEEDS.items():
                try:
                    response = await client.get(url)
                    feed = feedparser.parse(response.text)
                    for entry in feed.entries[:10]:
                        results.append(
                            {
                                "title": entry.get("title", ""),
                                "url": entry.get("link", ""),
                                "source": f"BBC News ({topic})",
                                "published": entry.get("published", ""),
                                "summary": BeautifulSoup(
                                    entry.get("summary", ""),
                                    "html.parser",
                                ).get_text()[:500],
                                "full_text": "",
                            }
                        )
                except Exception:
                    continue

        return results

    async def _enrich_articles(self, articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        async def enrich(article: Dict[str, Any]) -> Dict[str, Any]:
            if not article.get("url"):
                article["full_text"] = article.get("summary", "")
                return article

            try:
                loop = asyncio.get_running_loop()
                parser = Article(article["url"])
                await asyncio.wait_for(loop.run_in_executor(None, parser.download), timeout=5.0)
                await loop.run_in_executor(None, parser.parse)
                article["full_text"] = (parser.text or "")[:3000]
            except Exception:
                article["full_text"] = article.get("summary", "")
            return article

        return await asyncio.gather(*(enrich(item) for item in articles))

    @staticmethod
    def _score_relevance(
        articles: List[Dict[str, Any]],
        keywords: List[str],
    ) -> List[Dict[str, Any]]:
        lowered = [word.lower() for word in keywords]
        for article in articles:
            title = str(article.get("title", "")).lower()
            text = f"{title} {str(article.get('summary', '')).lower()}"
            score = 0
            for word in lowered:
                if word in text:
                    score += 3 if word in title else 1
            article["relevance_score"] = score
        return articles

    async def _analyze_with_llm(
        self,
        articles: List[Dict[str, Any]],
        keywords: List[str],
    ) -> Dict[str, Any]:
        key = os.getenv("GEMINI_API_KEY")
        if not key:
            return self._fallback_analysis(articles)

        article_text = "\n\n".join(
            [
                f"[{index + 1}] {article.get('title', '')} ({article.get('source', '')})\n"
                f"{str(article.get('full_text') or article.get('summary') or '')[:500]}"
                for index, article in enumerate(articles[:10])
            ]
        )

        prompt = f"""You are a senior business analyst. Analyze the following news articles
in the context of: {', '.join(keywords)}.

ARTICLES:
{article_text}

Respond ONLY in valid JSON with this exact schema:
{{
  \"market_sentiment\": \"bullish|bearish|neutral\",
  \"predictions\": [
    {{
      \"title\": \"short prediction title\",
      \"detail\": \"2-3 sentence explanation\",
      \"impact_area\": \"supply_chain|pricing|demand|cash_flow|operations\",
      \"probability\": \"high|medium|low\",
      \"timeframe\": \"1_week|1_month|3_months|6_months\"
    }}
  ],
  \"recommendations\": [
    {{
      \"action\": \"specific action to take\",
      \"rationale\": \"why this action is recommended\",
      \"urgency\": \"immediate|this_week|this_month\",
      \"category\": \"procurement|pricing|marketing|operations|finance\"
    }}
  ]
}}

Provide 3-5 predictions and 3-5 recommendations. Be specific and actionable."""

        try:
            import google.generativeai as genai

            genai.configure(api_key=key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(None, model.generate_content, prompt)
            raw = (response.text or "").strip()
            if raw.startswith("```json"):
                raw = raw[7:]
            if raw.endswith("```"):
                raw = raw[:-3]
            parsed = json.loads(raw.strip())
            return {
                "market_sentiment": parsed.get("market_sentiment", "neutral"),
                "predictions": parsed.get("predictions", []),
                "recommendations": parsed.get("recommendations", []),
            }
        except Exception:
            return self._fallback_analysis(articles)

    @staticmethod
    def _deduplicate(articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        seen = set()
        unique = []
        for article in articles:
            title_key = str(article.get("title", "")).strip().lower()[:80]
            if not title_key or title_key in seen:
                continue
            seen.add(title_key)
            unique.append(article)
        return unique

    @staticmethod
    def _fallback_analysis(articles: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not articles:
            return {
                "market_sentiment": "neutral",
                "predictions": [],
                "recommendations": [],
            }

        top_source = articles[0].get("source", "market")
        return {
            "market_sentiment": "neutral",
            "predictions": [
                {
                    "title": "Watch near-term demand variation",
                    "detail": "Recent article mix suggests macro uncertainty. Track order velocity weekly and compare against baseline.",
                    "impact_area": "demand",
                    "probability": "medium",
                    "timeframe": "1_month",
                },
                {
                    "title": "Supply-side volatility remains possible",
                    "detail": f"Signals from {top_source} suggest procurement lead times may shift quickly.",
                    "impact_area": "supply_chain",
                    "probability": "medium",
                    "timeframe": "3_months",
                },
            ],
            "recommendations": [
                {
                    "action": "Create a 4-week rolling procurement plan",
                    "rationale": "Short planning cycles reduce exposure to sudden cost or lead-time movement.",
                    "urgency": "this_week",
                    "category": "procurement",
                },
                {
                    "action": "Run weekly margin sensitivity checks",
                    "rationale": "Proactive pricing review helps preserve contribution margins during market swings.",
                    "urgency": "this_week",
                    "category": "pricing",
                },
            ],
        }
