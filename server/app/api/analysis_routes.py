from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Tuple
import os
import base64
from pathlib import Path
import fitz  # PyMuPDF for PDF handling with images

# LangChain imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate

from app.core.database import get_db
from app.models.startup import Startup, StartupFile
from app.schemas.analysis import AnalysisResult, FinancialHighlights
from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator
from typing import List, Literal

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
# Initialize ChatGoogleGenAI with structured output
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.1,
    timeout=60,  # Add timeout to prevent hanging
    max_retries=2  # Built-in retry mechanism
)

# Create structured LLM with Pydantic output
structured_llm = llm.with_structured_output(LLMAnalysisResponse)

router = APIRouter()

def extract_pdf_content_and_images(file_path: str) -> Tuple[str, List[str]]:
    """
    Extract text content and images from PDF using PyMuPDF
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        Tuple of (text_content, list_of_base64_images)
    """
    try:
        print(f"Attempting to open PDF: {file_path}")
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise Exception(f"File does not exist: {file_path}")
        
        doc = fitz.open(file_path)
        text_content = ""
        images = []
        
        for page_num in range(doc.page_count):
            page = doc[page_num]
            
            # Extract text
            text_content += f"\n--- Page {page_num + 1} ---\n"
            text_content += page.get_text()
            
            # Extract images
            image_list = page.get_images()
            for img_index, img in enumerate(image_list):
                xref = img[0]
                pix = fitz.Pixmap(doc, xref)
                
                if pix.n - pix.alpha < 4:  # GRAY or RGB
                    img_data = pix.tobytes("png")
                    img_base64 = base64.b64encode(img_data).decode()
                    images.append(img_base64)
                pix = None
        
        doc.close()
        return text_content, images
        
    except Exception as e:
        raise Exception(f"Error extracting PDF content: {str(e)}")

def analyze_startup_with_langchain(startup_name: str, file_paths: List[str]) -> AnalysisResult:
    """
    Analyze startup using LangChain with Google GenAI
    
    Args:
        startup_name: Name of the startup
        file_paths: List of file paths to analyze
        
    Returns:
        AnalysisResult: Comprehensive analysis result
    """
    try:
        # Extract content from all PDF files
        all_text_content = ""
        all_images = []
        
        for file_path in file_paths:
            if file_path.lower().endswith('.pdf'):
                text, images = extract_pdf_content_and_images(file_path)
                all_text_content += f"\n\n=== Document: {Path(file_path).name} ===\n{text}"
                all_images.extend(images)
        
        # Check if we have any content to analyze
        if not all_text_content.strip():
            raise Exception("No readable content found in the provided documents")
        
        # Limit content length to avoid token limits
        if len(all_text_content) > 50000:  # Reasonable limit for Gemini
            all_text_content = all_text_content[:50000] + "\n[Content truncated due to length]"
            print("Content truncated due to length limitations")
        
        # Creat analysis prompt using ChatPromptTemplate
        analysis_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert venture capital analyst specializing in startup evaluation. 
            Analyze the provided startup documents thoroughly and provide a comprehensive analysis.
            
            Focus on:
            - Business model and market opportunity
            - Financial projections and metrics
            - Team and leadership
            - Technology and competitive advantage
            - Risks and challenges
            - Investment potential
            
            Be specific and data-driven in your analysis. Provide structured output as requested."""),
            
            ("human", """Please analyze the startup '{startup_name}' based on the following documents:
            
            DOCUMENT CONTENT:
            {document_content}
            
            Provide a comprehensive analysis with:
            - Executive summary (2-3 sentences)
            - Key strengths (specific strengths identified)
            - Key weaknesses/risks (specific concerns)
            - Financial highlights (revenue_model, funding_status, market_size)
            - Actionable recommendations
            - Risk assessment (Low/Medium/High)
            - Investment score (1-10, where 1=lowest potential, 10=highest potential, NEVER use 0)
            
            IMPORTANT: The investment_score must be an integer between 1 and 10. Do not use 0 or values above 10.""")
        ])
        
        # Format the prompt with actual data
        formatted_prompt = analysis_prompt.format_messages(
            startup_name=startup_name,
            document_content=all_text_content
        )
        
        # Debug logging
        print(f"Analyzing startup: {startup_name}")
        print(f"Document content length: {len(all_text_content)} characters")
        print(f"Number of formatted messages: {len(formatted_prompt)}")
        
        # Get structured analysis from LLM with retry logic
        max_retries = 3
        llm_response = None
        
        for attempt in range(max_retries):
            try:
                print(f"Attempt {attempt + 1}/{max_retries} to get LLM response...")
                llm_response = structured_llm.invoke(formatted_prompt)
                
                if llm_response is not None:
                    print(f"LLM response (attempt {attempt + 1}): {llm_response}")
                    break
                else:
                    print(f"LLM returned None on attempt {attempt + 1}")
                    if attempt < max_retries - 1:
                        continue
                        
            except Exception as e:
                print(f"Error on attempt {attempt + 1}: {str(e)}")
                if attempt < max_retries - 1:
                    continue
                else:
                    raise e
        
        # If all retries failed or returned None, create fallback response
        if llm_response is None:
            print("All LLM attempts failed or returned None, trying fallback approach...")
            
            # Try without structured output as fallback
            try:
                regular_response = llm.invoke(formatted_prompt)
                print(f"Fallback response content: {regular_response.content}")
                
                # Try to parse manually
                import json
                content = regular_response.content.strip()
                if content.startswith("```json"):
                    content = content.replace("```json", "").replace("```", "").strip()
                
                # Try to parse as JSON
                try:
                    parsed_data = json.loads(content)
                    # Create a mock structured response
                    class MockResponse:
                        def __init__(self, data):
                            self.summary = data.get("summary", "Analysis completed")
                            self.strengths = data.get("strengths", ["Analysis provided"])
                            self.weaknesses = data.get("weaknesses", ["Further review needed"])
                            self.financial_highlights = data.get("financial_highlights", {
                                "revenue_model": "See documents",
                                "funding_status": "See documents",
                                "market_size": "See documents"
                            })
                            self.recommendations = data.get("recommendations", ["Review recommended"])
                            self.risk_assessment = data.get("risk_assessment", "Medium")
                            self.investment_score = data.get("investment_score", 5)
                    
                    llm_response = MockResponse(parsed_data)
                    print("Successfully created fallback structured response")
                    
                except json.JSONDecodeError:
                    print("Could not parse JSON from fallback response")
                    raise Exception("LLM failed to generate parseable response")
                    
            except Exception as fallback_error:
                print(f"Fallback approach also failed: {str(fallback_error)}")
                raise Exception("Both structured and fallback LLM approaches failed")
        # The response is already a structured Pydantic object
        # Create AnalysisResult object
        financial_highlights = FinancialHighlights(
            revenue_model=llm_response.financial_highlights.get("revenue_model", "Not specified"),
            funding_status=llm_response.financial_highlights.get("funding_status", "Not specified"),
            market_size=llm_response.financial_highlights.get("market_size", "Not specified")
        )
        
        result = AnalysisResult(
            startup_name=startup_name,
            summary=llm_response.summary,
            strengths=llm_response.strengths,
            weaknesses=llm_response.weaknesses,
            financial_highlights=financial_highlights,
            recommendations=llm_response.recommendations,
            risk_assessment=llm_response.risk_assessment,
            investment_score=llm_response.investment_score
        )
        
        return result
        
    except Exception as e:
        # Return error analysis if something goes wrong
        return AnalysisResult(
            startup_name=startup_name,
            summary=f"Error analyzing {startup_name}: {str(e)}",
            strengths=["Unable to analyze due to technical error"],
            weaknesses=["Analysis failed - manual review required"],
            financial_highlights=FinancialHighlights(
                revenue_model="Analysis failed",
                funding_status="Analysis failed", 
                market_size="Analysis failed"
            ),
            recommendations=["Manual document review recommended"],
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
