@echo off
echo Starting Our Big Company FastAPI server...
echo Make sure you have installed the requirements with: pip install -r requirements.txt
echo.

cd /d "%~dp0"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
