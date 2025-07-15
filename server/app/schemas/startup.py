from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class StartupFileBase(BaseModel):
    original_name: str
    file_size: int
    content_type: Optional[str] = None

class StartupFileCreate(StartupFileBase):
    saved_name: str
    file_path: str

class StartupFile(StartupFileBase):
    id: int
    saved_name: str
    file_path: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class StartupBase(BaseModel):
    startup_name: str
    submitter_name: str

class StartupCreate(StartupBase):
    pass

class Startup(StartupBase):
    id: int
    submission_id: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    files: List[StartupFile] = []
    
    class Config:
        from_attributes = True

class StartupSummary(BaseModel):
    id: int
    submission_id: str
    startup_name: str
    submitter_name: str
    status: str
    created_at: datetime
    files_count: int
    
    class Config:
        from_attributes = True
