from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

class Startup(Base):
    __tablename__ = "startups"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    startup_name = Column(String, nullable=False)
    submitter_name = Column(String, nullable=False)
    status = Column(String, default="submitted")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to files
    files = relationship("StartupFile", back_populates="startup", cascade="all, delete-orphan")

class StartupFile(Base):
    __tablename__ = "startup_files"
    
    id = Column(Integer, primary_key=True, index=True)
    startup_id = Column(Integer, ForeignKey("startups.id"), nullable=False)
    original_name = Column(String, nullable=False)
    saved_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(BigInteger, nullable=False)
    content_type = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship to startup
    startup = relationship("Startup", back_populates="files")
