#!/bin/bash

# Frontend Start Script

set -e

echo "🎨 Starting HRMS Frontend on port 9000..."

# Check if build exists
if [ ! -d "build" ]; then
    echo "Error: Build directory not found!"
    echo "Please run: yarn build"
    exit 1
fi

# Install serve if not present
if ! command -v serve &> /dev/null; then
    echo "Installing serve..."
    npm install -g serve
fi

echo "Starting frontend on port 9000"
serve -s build -l 9000
