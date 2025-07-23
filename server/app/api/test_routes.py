"""
Test endpoint for file validation
"""

from fastapi import APIRouter, File, UploadFile, Form
from typing import List
from app.core.file_validator import file_validator

router = APIRouter()

@router.post("/test-validation")
async def test_file_validation(
    startup_name: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    Test endpoint to validate files without saving them
    """
    try:
        validation_result = file_validator.validate_files(files, startup_name)
        
        return {
            "validation_result": validation_result,
            "message": "Validation completed successfully" if validation_result['is_valid'] else "Validation failed",
            "summary": {
                "total_files": len(files),
                "valid_files": len([f for f in validation_result.get('file_analyses', []) if f.get('is_financial', False)]),
                "files_with_warnings": len([f for f in validation_result.get('file_analyses', []) if not f.get('startup_consistent', True)])
            }
        }
    
    except Exception as e:
        return {
            "error": str(e),
            "message": "Validation test failed"
        }
