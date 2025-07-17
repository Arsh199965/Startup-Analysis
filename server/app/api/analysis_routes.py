from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import os, base64
from pathlib import Path
from dotenv import load_dotenv

# LangChain + LLM imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate

from app.core.database import get_db
from app.models.startup import Startup
from app.schemas.analysis import AnalysisResult, FinancialHighlights
from pydantic import BaseModel, Field, field_validator
from typing import Literal

load_dotenv()

# Pydantic schema for structured LLM output
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

# Initialize LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.1,
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
            "text": f"""Please analyze the startup '{startup_name}' based on the attached PDF documents.
            
            Provide a comprehensive analysis including:
            - Executive summary (2-3 sentences)
            - Key strengths and weaknesses
            - Financial highlights (revenue model, funding status, market size)
            - Investment recommendations
            - Risk assessment (Low/Medium/High)
            - Investment score (1-10, where 1=lowest potential, 10=highest potential)
            
            Focus on business model, market opportunity, financial projections, team, technology, and competitive advantage."""
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
        system_content = """You are an expert venture capital analyst specializing in startup evaluation. 
        Analyze the provided startup documents thoroughly and provide a comprehensive analysis.
        
        Focus on:
        - Business model and market opportunity
        - Financial projections and metrics
        - Team and leadership
        - Technology and competitive advantage
        - Risks and challenges
        - Investment potential
        
        Be specific and data-driven in your analysis. Provide structured output as requested."""

        # Invoke the LLM with structured output
        print(f"Analyzing {startup_name} with {len(content_parts)-1} PDF documents...")
        
        # Create the full prompt
        messages = [
            {"role": "system", "content": system_content},
            message
        ]
        
        llm_resp = structured_llm.invoke(messages)
        
        # Create financial highlights object
        fh = FinancialHighlights(
            revenue_model=llm_resp.financial_highlights.get("revenue_model", "Not specified"),
            funding_status=llm_resp.financial_highlights.get("funding_status", "Not specified"),
            market_size=llm_resp.financial_highlights.get("market_size", "Not specified")
        )

        return AnalysisResult(
            startup_name=startup_name,
            summary=llm_resp.summary,
            strengths=llm_resp.strengths,
            weaknesses=llm_resp.weaknesses,
            financial_highlights=fh,
            recommendations=llm_resp.recommendations,
            risk_assessment=llm_resp.risk_assessment,
            investment_score=llm_resp.investment_score
        )

    except Exception as e:
        print(f"Error in analysis: {str(e)}")
        return AnalysisResult(
            startup_name=startup_name,
            summary=f"Error analyzing {startup_name}: {e}",
            strengths=["Analysis failed due to technical error"],
            weaknesses=["Analysis failed - manual review required"],
            financial_highlights=FinancialHighlights("Failed", "Failed", "Failed"),
            recommendations=["Manual review required"],
            risk_assessment="High",
            investment_score=1
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
