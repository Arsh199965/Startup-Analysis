import os
import aiofiles
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List
import uuid
from datetime import datetime
import json
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.startup import Startup, StartupFile
from app.schemas.startup import Startup as StartupSchema, StartupSummary

router = APIRouter()

# Create directories
UPLOAD_DIR = "storage/uploads"
SUBMISSIONS_DIR = "storage/submissions"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(SUBMISSIONS_DIR, exist_ok=True)

@router.post("/submit-startup", response_model=StartupSchema)
async def submit_startup(
    startup_name: str = Form(...),
    submitter_name: str = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Submit startup information with supporting documents
    """
    try:
        # Generate unique submission ID
        submission_id = str(uuid.uuid4())
        
        # Create startup record in database
        db_startup = Startup(
            submission_id=submission_id,
            startup_name=startup_name,
            submitter_name=submitter_name,
            status="submitted"
        )
        db.add(db_startup)
        db.commit()
        db.refresh(db_startup)
        
        # Create submission directory
        submission_dir = os.path.join(SUBMISSIONS_DIR, submission_id)
        os.makedirs(submission_dir, exist_ok=True)
        
        # Save uploaded files
        saved_files = []
        for file in files:
            if file.filename:
                # Generate safe filename
                file_extension = os.path.splitext(file.filename)[1]
                safe_filename = f"{uuid.uuid4()}{file_extension}"
                file_path = os.path.join(submission_dir, safe_filename)
                
                # Save file
                async with aiofiles.open(file_path, 'wb') as f:
                    content = await file.read()
                    await f.write(content)
                
                # Create file record in database
                db_file = StartupFile(
                    startup_id=db_startup.id,
                    original_name=file.filename,
                    saved_name=safe_filename,
                    file_path=file_path,
                    file_size=len(content),
                    content_type=file.content_type
                )
                db.add(db_file)
                
                saved_files.append({
                    "original_name": file.filename,
                    "saved_name": safe_filename,
                    "size": len(content),
                    "content_type": file.content_type
                })
        
        # Commit file records
        db.commit()
        
        # Create submission metadata (keep for backward compatibility)
        submission_data = {
            "submission_id": submission_id,
            "startup_name": startup_name,
            "submitter_name": submitter_name,
            "timestamp": db_startup.created_at.isoformat(),
            "files": saved_files,
            "status": "submitted"
        }
        
        # Save submission metadata
        metadata_path = os.path.join(submission_dir, "metadata.json")
        async with aiofiles.open(metadata_path, 'w') as f:
            await f.write(json.dumps(submission_data, indent=2))
        
        # Refresh the startup to include files
        db.refresh(db_startup)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Startup submission received successfully!",
                "submission_id": submission_id,
                "timestamp": db_startup.created_at.isoformat(),
                "files_received": len(saved_files),
                "database_id": db_startup.id
            }
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error processing submission: {str(e)}"
        )

@router.get("/submissions/{submission_id}", response_model=StartupSchema)
async def get_submission(submission_id: str, db: Session = Depends(get_db)):
    """
    Get submission details by ID
    """
    try:
        # Query database for startup by submission_id
        startup = db.query(Startup).filter(Startup.submission_id == submission_id).first()
        
        if not startup:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        return startup
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving submission: {str(e)}")

@router.get("/submissions", response_model=List[StartupSummary])
async def list_submissions(db: Session = Depends(get_db)):
    """
    List all submissions (for admin use)
    """
    try:
        # Query all startups from database
        startups = db.query(Startup).order_by(Startup.created_at.desc()).all()
        
        # Convert to summary format
        submissions = []
        for startup in startups:
            submissions.append(StartupSummary(
                id=startup.id,
                submission_id=startup.submission_id,
                startup_name=startup.startup_name,
                submitter_name=startup.submitter_name,
                status=startup.status,
                created_at=startup.created_at,
                files_count=len(startup.files)
            ))
        
        return submissions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing submissions: {str(e)}")

@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """
    Get submission statistics
    """
    try:
        total_submissions = db.query(Startup).count()
        total_files = db.query(StartupFile).count()
        recent_submissions = db.query(Startup).filter(
            Startup.created_at >= datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        ).count()
        
        return {
            "total_submissions": total_submissions,
            "total_files": total_files,
            "recent_submissions_today": recent_submissions,
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting statistics: {str(e)}")
