from pydantic import BaseModel
from typing import List, Optional, Literal

class FinancialHighlights(BaseModel):
    revenue_model: str
    funding_status: str
    market_size: str

class AnalysisResult(BaseModel):
    startup_name: str
    summary: str
    strengths: List[str]
    weaknesses: List[str]
    financial_highlights: FinancialHighlights
    recommendations: List[str]
    risk_assessment: Literal['Low', 'Medium', 'High']
    investment_score: int  # 1-10 scale

class AnalysisRequest(BaseModel):
    startup_name: str
    additional_context: Optional[str] = None
