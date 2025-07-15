from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Use SQLite as fallback if PostgreSQL is not available
    database_url: str = "sqlite:///./storage/our_big_company.db"
    # Uncomment the line below when PostgreSQL is set up:
    # database_url: str = "postgresql://postgres:password@localhost/our_big_company_db"
    
    class Config:
        env_file = ".env"
        extra = "allow"  # Allow extra fields from .env file

settings = Settings()

# Create SQLAlchemy engine
# For SQLite, we need to add check_same_thread=False
if settings.database_url.startswith("sqlite"):
    engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(settings.database_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
