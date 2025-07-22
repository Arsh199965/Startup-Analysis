import os
import aiofiles
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List
import uuid
from datetime import datetime
import json
from sqlalchemy.orm import Session
from pathlib import Path

from app.core.database import get_db
from app.models.startup import Startup, StartupFile
from app.schemas.startup import Startup as StartupSchema, StartupSummary
from app.core.file_validator import file_validator

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
    Submit startup information with supporting documents (up to 3 files)
    """
    try:
        # Validate file count
        if len(files) > 3:
            raise HTTPException(
                status_code=400,
                detail="Maximum 3 files allowed per startup submission"
            )
        
        if len(files) == 0:
            raise HTTPException(
                status_code=400,
                detail="At least 1 file is required for startup submission"
            )
        
        # Validate files for financial content and relevance
        validation_result = file_validator.validate_files(files, startup_name)
        
        if not validation_result['is_valid']:
            error_details = {
                "message": "File validation failed",
                "errors": validation_result['errors'],
                "warnings": validation_result['warnings'],
                "file_analyses": validation_result['file_analyses']
            }
            raise HTTPException(
                status_code=422,
                detail=error_details
            )
        
        # If there are warnings but validation passed, we'll include them in response
        validation_warnings = validation_result.get('warnings', [])
        
        # Check if startup with same name already exists
        existing_startup = db.query(Startup).filter(
            Startup.startup_name.ilike(startup_name.strip())
        ).first()
        
        if existing_startup:
            raise HTTPException(
                status_code=409,
                detail=f"Startup with name '{startup_name}' already exists. Use the 'Add Files to Existing Startup' feature to add more documents."
            )
        
        # Generate unique submission ID
        submission_id = str(uuid.uuid4())
        
        # Create startup record in database
        db_startup = Startup(
            submission_id=submission_id,
            startup_name=startup_name.strip(),
            submitter_name=submitter_name.strip(),
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

@router.post("/add-files/{startup_name}")
async def add_files_to_startup(
    startup_name: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Add files to an existing startup (up to 3 total files)
    """
    try:
        # Find existing startup
        startup = db.query(Startup).filter(
            Startup.startup_name.ilike(f"%{startup_name.strip()}%")
        ).first()
        
        if not startup:
            raise HTTPException(
                status_code=404,
                detail=f"Startup '{startup_name}' not found. Please check the name and try again."
            )
        
        # Check current file count
        current_file_count = len(startup.files)
        new_file_count = len(files)
        total_files = current_file_count + new_file_count
        
        if total_files > 3:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot add {new_file_count} files. Startup '{startup.startup_name}' already has {current_file_count} files. Maximum 3 files allowed per startup."
            )
        
        if new_file_count == 0:
            raise HTTPException(
                status_code=400,
                detail="At least 1 file is required"
            )
        
        # Validate new files for financial content and relevance
        validation_result = file_validator.validate_files(files, startup.startup_name)
        
        if not validation_result['is_valid']:
            error_details = {
                "message": "File validation failed",
                "errors": validation_result['errors'],
                "warnings": validation_result['warnings'],
                "file_analyses": validation_result['file_analyses']
            }
            raise HTTPException(
                status_code=422,
                detail=error_details
            )
        
        # If there are warnings but validation passed, we'll include them in response
        validation_warnings = validation_result.get('warnings', [])
        
        # Get submission directory
        submission_dir = os.path.join(SUBMISSIONS_DIR, startup.submission_id)
        os.makedirs(submission_dir, exist_ok=True)
        
        # Save new files
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
                    startup_id=startup.id,
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
        db.refresh(startup)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Successfully added {len(saved_files)} files to '{startup.startup_name}'",
                "startup_name": startup.startup_name,
                "total_files": len(startup.files),
                "newly_added_files": len(saved_files),
                "files_added": saved_files
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error adding files to startup: {str(e)}"
        )

@router.get("/startup/{startup_name}/files")
async def get_startup_files(startup_name: str, db: Session = Depends(get_db)):
    """
    Get file information for a specific startup
    """
    try:
        startup = db.query(Startup).filter(
            Startup.startup_name.ilike(f"%{startup_name.strip()}%")
        ).first()
        
        if not startup:
            raise HTTPException(
                status_code=404,
                detail=f"Startup '{startup_name}' not found"
            )
        
        file_info = []
        for file in startup.files:
            file_info.append({
                "id": file.id,
                "original_name": file.original_name,
                "file_size": file.file_size,
                "content_type": file.content_type,
                "created_at": file.created_at.isoformat()
            })
        
        return {
            "startup_name": startup.startup_name,
            "total_files": len(startup.files),
            "files": file_info,
            "can_add_more": len(startup.files) < 3
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving startup files: {str(e)}"
        )

@router.get("/search-startups/{query}")
async def search_startups_by_name(query: str, db: Session = Depends(get_db)):
    """
    Search for startups by name (for autocomplete in add files page)
    """
    try:
        if len(query.strip()) < 2:
            return []
        
        startups = db.query(Startup).filter(
            Startup.startup_name.ilike(f"%{query.strip()}%")
        ).limit(10).all()
        
        results = []
        for startup in startups:
            results.append({
                "startup_name": startup.startup_name,
                "submitter_name": startup.submitter_name,
                "submission_id": startup.submission_id,
                "current_files": len(startup.files),
                "can_add_more": len(startup.files) < 3,
                "created_at": startup.created_at.isoformat()
            })
        
        return results
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching startups: {str(e)}"
        )

@router.delete("/startup/{startup_name}/file/{file_id}")
async def delete_startup_file(startup_name: str, file_id: int, db: Session = Depends(get_db)):
    """
    Delete a specific file from a startup
    """
    try:
        # Find the startup
        startup = db.query(Startup).filter(
            Startup.startup_name.ilike(f"%{startup_name.strip()}%")
        ).first()
        
        if not startup:
            raise HTTPException(
                status_code=404,
                detail=f"Startup '{startup_name}' not found"
            )
        
        # Find the specific file
        file_to_delete = db.query(StartupFile).filter(
            StartupFile.id == file_id,
            StartupFile.startup_id == startup.id
        ).first()
        
        if not file_to_delete:
            raise HTTPException(
                status_code=404,
                detail="File not found or does not belong to this startup"
            )
        
        # Check if this is the last file (prevent deleting all files)
        if len(startup.files) <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete the last remaining file. At least 1 file must remain for analysis."
            )
        
        # Delete the physical file from storage
        file_path = Path(file_to_delete.file_path)
        if file_path.exists():
            try:
                file_path.unlink()  # Delete the file
                print(f"Deleted physical file: {file_path}")
            except Exception as e:
                print(f"Warning: Could not delete physical file {file_path}: {str(e)}")
                # Continue with database deletion even if physical file deletion fails
        else:
            print(f"Warning: Physical file not found at {file_path}")
        
        # Delete the file record from database
        original_name = file_to_delete.original_name
        db.delete(file_to_delete)
        db.commit()
        
        # Refresh startup to get updated file count
        db.refresh(startup)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Successfully deleted '{original_name}' from '{startup.startup_name}'",
                "deleted_file": original_name,
                "remaining_files": len(startup.files),
                "can_add_more": len(startup.files) < 3
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting file: {str(e)}"
        )

@router.get("/startup/{startup_name}/details")
async def get_startup_details(startup_name: str, db: Session = Depends(get_db)):
    """
    Get comprehensive startup details including file information
    """
    try:
        startup = db.query(Startup).filter(
            Startup.startup_name.ilike(f"%{startup_name.strip()}%")
        ).first()
        
        if not startup:
            raise HTTPException(
                status_code=404,
                detail=f"Startup '{startup_name}' not found"
            )
        
        file_details = []
        for file in startup.files:
            file_details.append({
                "id": file.id,
                "original_name": file.original_name,
                "file_size": file.file_size,
                "file_size_mb": round(file.file_size / (1024 * 1024), 2),
                "content_type": file.content_type,
                "created_at": file.created_at.isoformat()
            })
        
        return {
            "startup_id": startup.id,
            "submission_id": startup.submission_id,
            "startup_name": startup.startup_name,
            "submitter_name": startup.submitter_name,
            "status": startup.status,
            "created_at": startup.created_at.isoformat(),
            "updated_at": startup.updated_at.isoformat() if startup.updated_at else None,
            "total_files": len(startup.files),
            "files": file_details,
            "can_add_more": len(startup.files) < 3,
            "can_delete": len(startup.files) > 1
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving startup details: {str(e)}"
        )
