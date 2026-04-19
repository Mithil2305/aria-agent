from typing import List

from fastapi import APIRouter, Depends, Query, Request

from models.schemas import NewsCategoryResponse, NewsFeedResponse, NewsKeywordInput
from services.news_service import NewsService
from utils.auth import verify_firebase_token
from utils.rate_limit import enforce_rate_limit

router = APIRouter()


@router.get("/feed", response_model=NewsFeedResponse)
async def get_news_feed(
    request: Request,
    keywords: str = Query(
        ...,
        min_length=2,
        max_length=300,
        description="Comma-separated keywords, e.g. 'supply chain,inflation,interest rates'",
    ),
    user: dict = Depends(verify_firebase_token),
):
    """Return curated market news and AI recommendations for selected keywords."""
    await enforce_rate_limit("news_feed", user["uid"], limit=40, window_seconds=60)

    keyword_list: List[str] = [part.strip() for part in keywords.split(",") if part.strip()]
    validated = NewsKeywordInput(keywords=keyword_list)

    service = NewsService()
    result = await service.get_curated_feed(uid=user["uid"], keywords=validated.keywords)

    request.state.feature = "news_feed"
    return result


@router.get("/categories", response_model=NewsCategoryResponse)
async def get_news_categories(user: dict = Depends(verify_firebase_token)):
    """Return predefined business-relevant categories for quick keyword setup."""
    await enforce_rate_limit("news_categories", user["uid"], limit=100, window_seconds=60)
    return NewsCategoryResponse(
        categories=[
            "supply_chain",
            "inflation",
            "interest_rates",
            "geopolitics",
            "tech_sector",
            "consumer_spending",
            "energy_prices",
            "currency",
            "logistics",
        ]
    )
