#!/bin/bash

# Backend Start Script

set -e

echo "🚀 Starting HRMS Backend on port 9001..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found!"
    echo "Please copy .env.production to .env or create it from .env.example"
    exit 1
fi

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Error: Virtual environment not found!"
    echo "Run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Get PORT from .env or use default
PORT=$(grep -E '^PORT=' .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "9001")
HOST=$(grep -E '^HOST=' .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "0.0.0.0")

echo "Starting server on ${HOST}:${PORT}"

# Start uvicorn
uvicorn server:app --host "${HOST}" --port "${PORT}" --reload
