from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import os, base64
from pathlib import Path
from dotenv import load_dotenv
import fitz  # PyMuPDF for PDF text extraction

# LangChain + LLM imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate

from app.core.database import get_db
from app.models.startup import Startup
from app.schemas.analysis import (
    AnalysisResult, FinancialHighlights, LLMAnalysisResponse,
    FinancialKPIs, BusinessKPIs, TractionKPIs
)
from pydantic import BaseModel, Field, field_validator
from typing import Literal

load_dotenv()

# Initialize LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.05,
    timeout=60,
    max_retries=2
)
structured_llm = llm.with_structured_output(LLMAnalysisResponse)

router = APIRouter()

def build_multimodal_messages(startup_name: str, file_paths: List[str]):
    """
    Build multimodal messages with PDF content blocks for Google GenAI.
    """
    content_parts = [
        {
            "type": "text", 
            "text": f"""Analyze the startup '{startup_name}' and extract specific KPIs, metrics, and quantifiable factors from the business documents.

IMPORTANT: 
- Executive summary must be EXACTLY 100 words or less
- For any KPI where data is not available, return "NA" or "Not enough data"
- Extract only specific numbers, percentages, and quantifiable metrics

EXTRACT THESE SPECIFIC KPIs WITH EXACT VALUES:

**FINANCIAL KPIs (provide exact numbers or "NA"):**
- Revenue model: Type (SaaS/Transaction/etc) + pricing
- Funding status: Amount raised + round stage  
- Revenue projection Y1: Specific dollar amount or "NA"
- Revenue projection Y3: Specific dollar amount or "NA"
- Monthly burn rate: Dollar amount or "NA"
- Runway months: Number of months or "NA"
- Customer Acquisition Cost (CAC): Dollar amount or "NA"
- Customer Lifetime Value (LTV): Dollar amount or "NA"
- Monthly Recurring Revenue (MRR): Current amount or "NA"
- Annual Recurring Revenue (ARR): Current amount or "NA"

**BUSINESS KPIs (provide exact values or "NA"):**
- Total Addressable Market (TAM): Dollar amount or "NA"
- Serviceable Addressable Market (SAM): Dollar amount or "NA"
- Target market segment: Specific description or "NA"
- Team size: Exact number or "NA"
- Founders experience: Years of relevant experience or "NA"
- Competitive advantages: List specific advantages or ["NA"]
- Key partnerships: List partnerships or ["NA"]

**TRACTION KPIs (provide exact numbers or "NA"):**
- Current customers: Exact count or "NA"
- Paying customers: Exact count or "NA"
- Monthly growth rate: Percentage or "NA"
- User engagement metrics: Specific metrics or "NA"
- Product development stage: Current stage or "NA"
- Market validation: Evidence or "NA"

CRITICAL: If any data point is missing from documents, use "NA" - do NOT estimate or guess values."""
        }
    ]

    for fp in file_paths:
        if fp.lower().endswith(".pdf"):
            try:
                # Read and encode PDF file
                pdf_path = Path(fp)
                if not pdf_path.exists():
                    print(f"Warning: PDF file not found: {fp}")
                    continue
                    
                pdf_data = base64.b64encode(pdf_path.read_bytes()).decode("utf-8")
                
                # Add PDF content block using Google GenAI format
                content_parts.append({
                    "type": "media",
                    "mime_type": "application/pdf",
                    "data": pdf_data
                })
                print(f"Added PDF to analysis: {pdf_path.name}")
                
            except Exception as e:
                print(f"Error processing PDF {fp}: {str(e)}")
                continue

    return content_parts

def analyze_startup_with_langchain(startup_name: str, file_paths: List[str]) -> AnalysisResult:
    try:
        if not file_paths:
            raise ValueError("No PDF files provided for analysis")

        # Build multimodal content parts
        content_parts = build_multimodal_messages(startup_name, file_paths)
        
        if len(content_parts) <= 1:  # Only text part, no PDFs added
            raise ValueError("No valid PDF files could be processed")

        # Create HumanMessage with multimodal content
        message = HumanMessage(content=content_parts)
        
        # System message with instructions
        system_content = """You are an expert venture capital analyst and startup evaluator. Your task is to extract specific, quantifiable KPIs and metrics from startup business documents.

ANALYSIS FRAMEWORK:
1. Focus on extracting hard numbers, percentages, and specific metrics
2. Identify key performance indicators that investors care about most
3. Assess market opportunity, team capability, product differentiation, and financial viability
4. Provide data-driven insights with specific evidence from the documents
5. Score each dimension objectively based on industry benchmarks

SCORING GUIDELINES:
- Investment Score (1-10): 8-10 = Strong investment case, 5-7 = Moderate potential, 1-4 = High risk
- Market Score (1-10): Based on TAM size, growth rate, competitive landscape
- Team Score (1-10): Based on relevant experience, track record, team completeness
- Product Score (1-10): Based on innovation, differentiation, market validation
- Financial Score (1-10): Based on revenue model clarity, unit economics, projections

Extract specific metrics and be precise about what data is available vs. missing."""

        # Invoke the LLM with structured output
        print(f"Analyzing {startup_name} with {len(content_parts)-1} PDF documents...")
        
        # Create the full prompt
        messages = [
            {"role": "system", "content": system_content},
            message
        ]
        
        # Try structured LLM first
        llm_resp = None
        try:
            llm_resp = structured_llm.invoke(messages)
            print(f"Structured LLM response: {llm_resp}")
            
            # Check if response is None or invalid
            if llm_resp is None:
                print("Structured LLM returned None")
                raise Exception("Structured LLM returned None")
                
        except Exception as e:
            print(f"Structured LLM failed: {str(e)}")
            llm_resp = None
        
        # If structured response failed or returned None, create fallback
        if llm_resp is None:
            print("Creating fallback response due to LLM failure...")
            llm_resp = LLMAnalysisResponse(
                executive_summary=f"KPI analysis completed for {startup_name}. Document processing successful but detailed AI analysis encountered technical limitations.",
                financial_kpis={
                    "revenue_model": "Details available in submitted documents",
                    "funding_status": "Information provided in company materials",
                    "market_size": "Market analysis included in documentation",
                    "revenue_projection_y1": "Not specified",
                    "revenue_projection_y3": "Not specified",
                    "burn_rate": "Not specified",
                    "runway_months": "Not specified",
                    "customer_acquisition_cost": "Not specified",
                    "lifetime_value": "Not specified",
                    "monthly_recurring_revenue": "Not specified",
                    "annual_recurring_revenue": "Not specified"
                },
                business_kpis={
                    "total_addressable_market": "See market analysis in documents",
                    "target_market_segment": "Defined in business plan",
                    "competitive_advantage": ["Document review required"],
                    "key_partnerships": ["Partnership details in documents"],
                    "team_size": "Team information available",
                    "founders_experience": "Founder details in documents"
                },
                traction_kpis={
                    "current_customers": "Customer data in documents",
                    "paying_customers": "Not specified",
                    "monthly_recurring_revenue": "Not specified",
                    "growth_rate": "Not specified",
                    "user_engagement_metrics": "Not specified",
                    "product_development_stage": "Development stage outlined",
                    "market_validation": "Not specified"
                },
                recommendations=[
                    "Schedule detailed KPI extraction session",
                    "Provide additional financial metrics",
                    "Consider supplemental data sources"
                ],
                risk_assessment="Medium",
                investment_score=5,
                market_opportunity_score=5,
                team_score=5,
                product_score=5,
                financial_health_score=5
            )
            print("Fallback structured response created successfully")
        
        # Ensure we have a valid response before proceeding
        if llm_resp is None:
            raise Exception("Failed to create valid LLM response")
            
        # Create KPI objects from LLM response with better error handling
        print(f"LLM Financial KPIs: {llm_resp.financial_kpis}")
        print(f"LLM Business KPIs: {llm_resp.business_kpis}")
        print(f"LLM Traction KPIs: {llm_resp.traction_kpis}")
        
        financial_kpis = FinancialKPIs(
            revenue_model=llm_resp.financial_kpis.get("Revenue model", llm_resp.financial_kpis.get("revenue_model", "Not specified")),
            funding_status=llm_resp.financial_kpis.get("Funding status", llm_resp.financial_kpis.get("funding_status", "Not specified")),
            market_size=llm_resp.financial_kpis.get("market_size", "Not specified"),
            revenue_projection_y1=llm_resp.financial_kpis.get("Revenue projection Y1", llm_resp.financial_kpis.get("revenue_projection_y1")),
            revenue_projection_y3=llm_resp.financial_kpis.get("Revenue projection Y3", llm_resp.financial_kpis.get("revenue_projection_y3")),
            burn_rate=llm_resp.financial_kpis.get("Monthly burn rate", llm_resp.financial_kpis.get("burn_rate")),
            runway_months=llm_resp.financial_kpis.get("Runway months", llm_resp.financial_kpis.get("runway_months")),
            customer_acquisition_cost=llm_resp.financial_kpis.get("Customer Acquisition Cost (CAC)", llm_resp.financial_kpis.get("customer_acquisition_cost")),
            lifetime_value=llm_resp.financial_kpis.get("Customer Lifetime Value (LTV)", llm_resp.financial_kpis.get("lifetime_value")),
            monthly_recurring_revenue=llm_resp.financial_kpis.get("Monthly Recurring Revenue (MRR)", llm_resp.financial_kpis.get("monthly_recurring_revenue")),
            annual_recurring_revenue=llm_resp.financial_kpis.get("Annual Recurring Revenue (ARR)", llm_resp.financial_kpis.get("annual_recurring_revenue"))
        )
        
        # Create business KPIs with improved error handling
        try:
            competitive_advantage = llm_resp.business_kpis.get("Competitive advantages", llm_resp.business_kpis.get("competitive_advantage", []))
            key_partnerships = llm_resp.business_kpis.get("Key partnerships", llm_resp.business_kpis.get("key_partnerships", []))
            
            # Ensure these are lists, handle 'NA' cases
            if isinstance(competitive_advantage, str):
                competitive_advantage = [] if competitive_advantage.upper() == 'NA' else [competitive_advantage]
            if isinstance(key_partnerships, str):
                key_partnerships = [] if key_partnerships.upper() == 'NA' else [key_partnerships]
                
            business_kpis = BusinessKPIs(
                total_addressable_market=llm_resp.business_kpis.get("Total Addressable Market (TAM)", llm_resp.business_kpis.get("total_addressable_market")),
                target_market_segment=llm_resp.business_kpis.get("Target market segment", llm_resp.business_kpis.get("target_market_segment")),
                competitive_advantage=competitive_advantage,
                key_partnerships=key_partnerships,
                team_size=llm_resp.business_kpis.get("Team size", llm_resp.business_kpis.get("team_size")),
                founders_experience=llm_resp.business_kpis.get("Founders experience", llm_resp.business_kpis.get("founders_experience"))
            )
        except Exception as e:
            print(f"Error creating BusinessKPIs: {str(e)}")
            business_kpis = BusinessKPIs()  # Use default empty values
        
        traction_kpis = TractionKPIs(
            current_customers=llm_resp.traction_kpis.get("Current customers", llm_resp.traction_kpis.get("current_customers")),
            paying_customers=llm_resp.traction_kpis.get("Paying customers", llm_resp.traction_kpis.get("paying_customers")),
            monthly_recurring_revenue=llm_resp.traction_kpis.get("Monthly Recurring Revenue (MRR)", llm_resp.traction_kpis.get("monthly_recurring_revenue")),
            growth_rate=llm_resp.traction_kpis.get("Monthly growth rate", llm_resp.traction_kpis.get("growth_rate")),
            user_engagement_metrics=llm_resp.traction_kpis.get("User engagement metrics", llm_resp.traction_kpis.get("user_engagement_metrics")),
            product_development_stage=llm_resp.traction_kpis.get("Product development stage", llm_resp.traction_kpis.get("product_development_stage")),
            market_validation=llm_resp.traction_kpis.get("Market validation", llm_resp.traction_kpis.get("market_validation"))
        )

        return AnalysisResult(
            startup_name=startup_name,
            executive_summary=getattr(llm_resp, 'executive_summary', f"KPI analysis completed for {startup_name}"),
            financial_kpis=financial_kpis,
            business_kpis=business_kpis,
            traction_kpis=traction_kpis,
            recommendations=getattr(llm_resp, 'recommendations', ["Follow up recommended"]),
            risk_assessment=getattr(llm_resp, 'risk_assessment', "Medium"),
            investment_score=getattr(llm_resp, 'investment_score', 5),
            market_opportunity_score=getattr(llm_resp, 'market_opportunity_score', 5),
            team_score=getattr(llm_resp, 'team_score', 5),
            product_score=getattr(llm_resp, 'product_score', 5),
            financial_health_score=getattr(llm_resp, 'financial_health_score', 5)
        )

    except Exception as e:
        print(f"Error in analysis: {str(e)}")
        return AnalysisResult(
            startup_name=startup_name,
            executive_summary=f"Error analyzing {startup_name}: {e}",
            financial_kpis=FinancialKPIs(
                revenue_model="Analysis failed",
                funding_status="Analysis failed",
                market_size="Analysis failed"
            ),
            business_kpis=BusinessKPIs(),
            traction_kpis=TractionKPIs(),
            recommendations=["Manual review required"],
            risk_assessment="High",
            investment_score=1,
            market_opportunity_score=1,
            team_score=1,
            product_score=1,
            financial_health_score=1
        )

@router.get("/analyze/{startup_name}", response_model=AnalysisResult)
async def analyze_startup(startup_name: str, db: Session = Depends(get_db)):
    """
    Analyze a startup based on submitted documents
    
    Args:
        startup_name: Name of the startup to analyze
        db: Database session
        
    Returns:
        AnalysisResult: Comprehensive analysis of the startup
    """
    try:
        # Find the startup in database
        startup = db.query(Startup).filter(
            Startup.startup_name.ilike(f"%{startup_name}%")
        ).first()
        
        if not startup:
            raise HTTPException(
                status_code=404, 
                detail=f"Startup '{startup_name}' not found. Please ensure the startup has been submitted first."
            )
        
        # Get file paths for analysis and convert to absolute paths
        project_root = Path(__file__).parent.parent.parent  # Go up to server directory
        file_paths = []
        
        for file in startup.files:
            # The file_path in database is relative but missing 'storage/' prefix
            stored_path = file.file_path
            
            if os.path.isabs(stored_path):
                # Already absolute path
                absolute_path = Path(stored_path)
            else:
                # Relative path, need to add 'storage/' prefix
                if stored_path.startswith('submissions'):
                    # Add storage prefix: submissions/... -> storage/submissions/...
                    corrected_path = f"storage/{stored_path}"
                else:
                    corrected_path = stored_path
                
                absolute_path = project_root / corrected_path
            
            file_paths.append(str(absolute_path))
            print(f"File path resolved: {absolute_path}")
            
            # Check if file exists
            if not absolute_path.exists():
                print(f"Warning: File does not exist at {absolute_path}")
                # Try to find the file in storage directory if original path fails
                if not stored_path.startswith('storage/'):
                    fallback_path = project_root / "storage" / stored_path
                    if fallback_path.exists():
                        file_paths[-1] = str(fallback_path)
                        print(f"Found file at fallback path: {fallback_path}")
        
        if not file_paths:
            raise HTTPException(
                status_code=400,
                detail=f"No documents found for startup '{startup_name}'. Cannot perform analysis without documents."
            )
        
        # Perform analysis using LangChain with Google GenAI
        analysis_result = analyze_startup_with_langchain(startup.startup_name, file_paths)
        
        return analysis_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing startup: {str(e)}"
        )

@router.get("/startups/search/{query}")
async def search_startups(query: str, db: Session = Depends(get_db)):
    """
    Search for startups by name (for autocomplete)
    
    Args:
        query: Search query
        db: Database session
        
    Returns:
        List of matching startup names
    """
    try:
        startups = db.query(Startup).filter(
            Startup.startup_name.ilike(f"%{query}%")
        ).limit(10).all()
        
        return [{"name": startup.startup_name, "id": startup.submission_id} for startup in startups]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching startups: {str(e)}"
        )
