"""
PDF utilities for text-to-PDF conversion and PDF text extraction
"""
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER
import PyPDF2
from pathlib import Path
import io
import re

def text_to_pdf(text: str, title: str = "Manual Submission") -> bytes:
    """
    Convert text to PDF format
    
    Args:
        text: The text content to convert
        title: Title for the PDF document
        
    Returns:
        bytes: PDF file content as bytes
    """
    # Create a BytesIO buffer to store PDF
    buffer = io.BytesIO()
    
    # Create the PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Create custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=12,
        alignment=TA_LEFT,
        leftIndent=0,
        firstLineIndent=0
    )
    
    # Build the document content
    story = []
    
    # Add title
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 12))
    
    # Process text - split by paragraphs and preserve formatting
    paragraphs = text.split('\n\n')
    
    for para in paragraphs:
        if para.strip():
            # Clean up the text and preserve line breaks within paragraphs
            cleaned_para = para.strip().replace('\n', '<br/>')
            # Escape XML characters for reportlab
            cleaned_para = (cleaned_para
                           .replace('&', '&amp;')
                           .replace('<br/>', '<br/>'))
            
            story.append(Paragraph(cleaned_para, body_style))
            story.append(Spacer(1, 6))
    
    # Build PDF
    doc.build(story)
    
    # Get the PDF content
    pdf_content = buffer.getvalue()
    buffer.close()
    
    return pdf_content

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text content from a PDF file
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        str: Extracted text content
    """
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

def is_manual_pdf(text: str) -> bool:
    """
    Check if extracted text appears to be from a manually created PDF
    by looking for patterns that suggest it was generated from our text-to-PDF utility
    
    Args:
        text: Extracted text from PDF
        
    Returns:
        bool: True if likely a manual PDF
    """
    # Simple heuristic - manual PDFs are more likely to have:
    # - Clean paragraph structure
    # - Less formatting artifacts
    # - Consistent line spacing
    
    # For now, we'll rely on the database flag, but this could be enhanced
    # to detect manual PDFs even without the flag
    return False

def clean_manual_text(text: str) -> str:
    """
    Clean text extracted from a manual PDF to restore original formatting
    
    Args:
        text: Raw text extracted from PDF
        
    Returns:
        str: Cleaned text suitable for editing
    """
    # Remove title if it's "Manual Submission"
    if text.startswith("Manual Submission"):
        text = text.replace("Manual Submission", "", 1).strip()
    
    # Clean up common PDF extraction artifacts
    text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
    text = text.replace(' \n', '\n')  # Fix line breaks
    text = text.replace('\n ', '\n')  # Fix line breaks
    
    # Restore paragraph breaks (this is a simple heuristic)
    text = re.sub(r'\n(?=[A-Z])', '\n\n', text)
    
    return text.strip()
