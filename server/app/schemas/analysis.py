from pydantic import BaseModel, Field, field_validator
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

class LLMAnalysisResponse(BaseModel):
    """Schema for LLM analysis response with validation"""
    summary: str = Field(description="Executive summary of the startup (2-3 sentences)")
    strengths: List[str] = Field(description="List of key strengths identified")
    weaknesses: List[str] = Field(description="List of key weaknesses or risks")
    financial_highlights: dict = Field(description="Financial information including revenue_model, funding_status, market_size")
    recommendations: List[str] = Field(description="List of actionable recommendations")
    risk_assessment: Literal['Low', 'Medium', 'High'] = Field(description="Risk level: Low, Medium, or High")
    investment_score: int = Field(description="Investment score from 1-10", ge=0, le=10)  # Allow 0 for edge cases
    
    # Custom validator to handle edge cases
    @field_validator('investment_score')
    @classmethod
    def validate_investment_score(cls, v):
        """Ensure investment score is within valid range, adjusting if needed"""
        if v < 1:
            return 1  # Minimum score is 1
        elif v > 10:
            return 10  # Maximum score is 10
        return int(v)  # Ensure it's an integer
