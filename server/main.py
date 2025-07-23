from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.core.database import engine, Base
from app.api.startup_routes import router as startup_router
from app.api.analysis_routes import router as analysis_router
from app.api.test_routes import router as test_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Our Big Company Startup Submission API",
    description="API for submitting startup information and documents",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(startup_router, prefix="/api", tags=["startups"])
app.include_router(analysis_router, prefix="/api", tags=["analysis"])
app.include_router(test_router, prefix="/api/test", tags=["testing"])

@app.get("/")
async def root():
    return {"message": "Our Big Company's Startup Submission API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
