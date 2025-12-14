#!/bin/bash

# HRMS Production Deployment Script
# This script deploys the HRMS application to production

set -e  # Exit on error

echo "🚀 Starting HRMS Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if production env files exist
if [ ! -f "backend/.env.production" ]; then
    echo -e "${RED}Error: backend/.env.production not found!${NC}"
    echo "Please create it from backend/.env.example"
    exit 1
fi

if [ ! -f "frontend/.env.production" ]; then
    echo -e "${RED}Error: frontend/.env.production not found!${NC}"
    echo "Please create it from frontend/.env.example"
    exit 1
fi

echo -e "${GREEN}✓ Environment files found${NC}"

# Copy production env files
echo "📋 Setting up production environment..."
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env

echo -e "${GREEN}✓ Environment configured${NC}"

# Backend setup
echo "🔧 Setting up backend..."
cd backend

# Install Python dependencies
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "Installing Python dependencies..."
pip install -r requirements.txt --quiet

echo -e "${GREEN}✓ Backend dependencies installed${NC}"
cd ..

# Frontend setup
echo "🎨 Setting up frontend..."
cd frontend

# Install Node dependencies
echo "Installing Node dependencies..."
yarn install --frozen-lockfile

# Build frontend for production
echo "Building frontend for production..."
NODE_ENV=production yarn build

echo -e "${GREEN}✓ Frontend built successfully${NC}"
cd ..

echo ""
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Start backend: cd backend && ./start.sh"
echo "2. Start frontend: cd frontend && serve -s build -l 9000"
echo ""
echo "Or use PM2 for production:"
echo "  pm2 start ecosystem.config.js"
