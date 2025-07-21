from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal, Union

class FinancialKPIs(BaseModel):
    revenue_model: str
    funding_status: str
    market_size: str
    revenue_projection_y1: Optional[Union[str, int, float]] = None
    revenue_projection_y3: Optional[Union[str, int, float]] = None
    burn_rate: Optional[Union[str, int, float]] = None
    runway_months: Optional[Union[str, int, float]] = None
    customer_acquisition_cost: Optional[Union[str, int, float]] = None
    lifetime_value: Optional[Union[str, int, float]] = None
    monthly_recurring_revenue: Optional[Union[str, int, float]] = None
    annual_recurring_revenue: Optional[Union[str, int, float]] = None

class BusinessKPIs(BaseModel):
    total_addressable_market: Optional[Union[str, int, float]] = None
    target_market_segment: Optional[str] = None
    competitive_advantage: List[str] = []
    key_partnerships: List[str] = []
    team_size: Optional[Union[str, int, float]] = None
    founders_experience: Optional[str] = None

class TractionKPIs(BaseModel):
    current_customers: Optional[Union[str, int, float]] = None
    paying_customers: Optional[Union[str, int, float]] = None
    monthly_recurring_revenue: Optional[Union[str, int, float]] = None
    growth_rate: Optional[Union[str, int, float]] = None
    user_engagement_metrics: Optional[str] = None
    product_development_stage: Optional[str] = None
    market_validation: Optional[str] = None

class AnalysisResult(BaseModel):
    startup_name: str
    executive_summary: str
    financial_kpis: FinancialKPIs
    business_kpis: BusinessKPIs
    traction_kpis: TractionKPIs
    recommendations: List[str]
    risk_assessment: Literal['Low', 'Medium', 'High']
    investment_score: int  # 1-10 scale
    market_opportunity_score: int  # 1-10 scale
    team_score: int  # 1-10 scale
    product_score: int  # 1-10 scale
    financial_health_score: int  # 1-10 scale

# Legacy support
class FinancialHighlights(BaseModel):
    revenue_model: str
    funding_status: str
    market_size: str

class AnalysisRequest(BaseModel):
    startup_name: str
    additional_context: Optional[str] = None

class LLMAnalysisResponse(BaseModel):
    """Enhanced schema for KPI-focused LLM analysis response"""
    executive_summary: str = Field(description="Brief executive summary in exactly 100 words or less, highlighting key business metrics and investment potential")
    
    # Financial KPIs
    financial_kpis: dict = Field(description="Financial metrics including revenue model, funding, projections, burn rate, CAC, LTV")
    
    # Business KPIs  
    business_kpis: dict = Field(description="Business metrics including market size, competitive advantage, team, partnerships")
    
    # Traction KPIs
    traction_kpis: dict = Field(description="Traction metrics including customers, MRR, growth rate, product stage")
    
    recommendations: List[str] = Field(description="List of specific, actionable recommendations for growth")
    risk_assessment: Literal['Low', 'Medium', 'High'] = Field(description="Overall risk level assessment")
    
    # Scoring metrics (1-10 scale)
    investment_score: int = Field(description="Overall investment attractiveness score (1-10)", ge=1, le=10)
    market_opportunity_score: int = Field(description="Market size and opportunity score (1-10)", ge=1, le=10)
    team_score: int = Field(description="Team quality and experience score (1-10)", ge=1, le=10)
    product_score: int = Field(description="Product/service quality and differentiation score (1-10)", ge=1, le=10)
    financial_health_score: int = Field(description="Financial projections and health score (1-10)", ge=1, le=10)
    
    @field_validator('investment_score', 'market_opportunity_score', 'team_score', 'product_score', 'financial_health_score')
    @classmethod
    def validate_scores(cls, v):
        """Ensure all scores are within valid range"""
        if v < 1:
            return 1
        elif v > 10:
            return 10
        return int(v)
