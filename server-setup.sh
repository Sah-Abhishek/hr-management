#!/bin/bash

# HRMS Server Initial Setup Script
# Run this script ONCE on a fresh Utho server to install all prerequisites

set -e

echo "🚀 HRMS Server Setup Script"
echo "=========================="
echo ""
echo "This script will install:"
echo "  - Node.js 18+"
echo "  - Python 3.10+"
echo "  - Yarn"
echo "  - PM2"
echo "  - serve"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

echo "📦 Installing Python 3 and pip..."
sudo apt install -y python3 python3-pip python3-venv

echo "📦 Installing Yarn..."
sudo npm install -g yarn

echo "📦 Installing PM2..."
sudo npm install -g pm2

echo "📦 Installing serve..."
sudo npm install -g serve

echo "🔥 Configuring firewall..."
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp
sudo ufw allow 22/tcp
sudo ufw --force enable

echo ""
echo -e "${GREEN}✅ Server setup complete!${NC}"
echo ""
echo "Installed versions:"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  Yarn: $(yarn --version)"
echo "  Python: $(python3 --version)"
echo "  PM2: $(pm2 --version)"
echo ""
echo "Next steps:"
echo "1. Clone your HRMS repository"
echo "2. Configure .env files"
echo "3. Run ./deploy.sh"
echo "4. Start with PM2"
echo ""
echo "See DEPLOYMENT.md for detailed instructions"
