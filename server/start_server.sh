#!/bin/bash

# Start the FastAPI server
echo "Starting Our Big Company FastAPI server..."
echo "Make sure you have installed the requirements with: pip install -r requirements.txt"
echo ""

# Set PYTHONPATH to current directory
export PYTHONPATH="${PYTHONPATH}:."

# Start uvicorn server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
