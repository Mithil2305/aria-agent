from typing import List, Literal

from pydantic import BaseModel, Field, field_validator


class NewsArticle(BaseModel):
    title: str = Field(..., min_length=3, max_length=300)
    url: str = Field(..., min_length=8, max_length=1000)
    source: str = Field(default="Unknown", max_length=120)
    published: str = Field(default="")
    summary: str = Field(default="", max_length=4000)
    full_text: str = Field(default="", max_length=12000)
    relevance_score: int = Field(default=0, ge=0)


class NewsPrediction(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    detail: str = Field(..., min_length=10, max_length=1000)
    impact_area: Literal["supply_chain", "pricing", "demand", "cash_flow", "operations"]
    probability: Literal["high", "medium", "low"]
    timeframe: Literal["1_week", "1_month", "3_months", "6_months"]


class NewsRecommendation(BaseModel):
    action: str = Field(..., min_length=3, max_length=240)
    rationale: str = Field(..., min_length=10, max_length=1000)
    urgency: Literal["immediate", "this_week", "this_month"]
    category: Literal["procurement", "pricing", "marketing", "operations", "finance"]


class NewsFeedResponse(BaseModel):
    fetched_at: str
    market_sentiment: Literal["bullish", "bearish", "neutral"] = "neutral"
    keywords_used: List[str] = Field(default_factory=list)
    articles: List[NewsArticle] = Field(default_factory=list)
    predictions: List[NewsPrediction] = Field(default_factory=list)
    recommendations: List[NewsRecommendation] = Field(default_factory=list)


class NewsCategoryResponse(BaseModel):
    categories: List[str]


class NewsKeywordInput(BaseModel):
    keywords: List[str] = Field(..., min_length=1, max_length=10)

    @field_validator("keywords")
    @classmethod
    def normalize_keywords(cls, value: List[str]) -> List[str]:
        cleaned = [part.strip().lower() for part in value if part and part.strip()]
        deduped = list(dict.fromkeys(cleaned))
        if not deduped:
            raise ValueError("At least one keyword is required")
        if len(deduped) > 10:
            raise ValueError("Maximum 10 keywords are allowed")
        for keyword in deduped:
            if len(keyword) > 64:
                raise ValueError("Each keyword must be 64 characters or fewer")
            if not all(ch.isalnum() or ch in {" ", "-", "_", "/", "&"} for ch in keyword):
                raise ValueError("Keywords may only contain letters, numbers, spaces, and - _ / &")
        return deduped


class MonthlyMetric(BaseModel):
    month: str = Field(..., min_length=7, max_length=7)
    revenue: float
    expenses: float
    cash_balance: float
    inventory_value: float
    customer_count: int
    cogs: float = 0.0


class MetricsPayload(BaseModel):
    history: List[MonthlyMetric] = Field(..., min_length=2, max_length=24)
    current: MonthlyMetric
    monthly_burn_rate: float | None = None
    accounts_receivable: float | None = None
    accounts_payable: float | None = None
