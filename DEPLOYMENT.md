# HRMS Production Deployment Guide

## Server Configuration

- **Server IP**: 103.142.175.170
- **Backend Port**: 9001
- **Frontend Port**: 9000
- **Database**: MongoDB Atlas

## Prerequisites

Ensure the following are installed on your Utho server:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Yarn
npm install -g yarn

# Install Python 3.10+
sudo apt install -y python3 python3-pip python3-venv

# Install PM2 (Process Manager)
npm install -g pm2

# Install serve (for frontend)
npm install -g serve
```

## Deployment Steps

### 1. Clone Repository

```bash
cd /var/www  # or your preferred directory
git clone <your-repo-url> hrms
cd hrms
```

### 2. Configure Environment Variables

#### Backend Configuration

```bash
cp backend/.env.example backend/.env.production
nano backend/.env.production
```

Update the following values:
```env
PORT=9001
HOST=0.0.0.0
MONGO_URL=mongodb+srv://bheemprakash_db_user:epEW9Jrv@human.z2u4awy.mongodb.net/?appName=human
DB_NAME=hrms_production
JWT_SECRET_KEY=<generate-a-strong-secret-key>
CORS_ORIGINS=http://103.142.175.170:9000,http://103.142.175.170
FRONTEND_URL=http://103.142.175.170:9000
BACKEND_URL=http://103.142.175.170:9001
```

#### Frontend Configuration

```bash
cp frontend/.env.example frontend/.env.production
nano frontend/.env.production
```

Update:
```env
REACT_APP_BACKEND_URL=http://103.142.175.170:9001
NODE_ENV=production
```

### 3. Run Deployment Script

```bash
chmod +x deploy.sh
./deploy.sh
```

This script will:
- Validate environment files
- Install backend dependencies
- Install frontend dependencies
- Build frontend for production

### 4. Start Application with PM2

```bash
# Create logs directory
mkdir -p logs

# Start both frontend and backend
pm2 start ecosystem.config.js

# View status
pm2 status

# View logs
pm2 logs

# Monitor
pm2 monit
```

### 5. Save PM2 Configuration

```bash
# Save current PM2 processes
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command it outputs
```

## Manual Start (Alternative)

If you prefer not to use PM2:

### Start Backend

```bash
cd backend
chmod +x start.sh
./start.sh
```

### Start Frontend (in another terminal)

```bash
cd frontend
chmod +x start.sh
./start.sh
```

## Firewall Configuration

Ensure ports are open:

```bash
# Ubuntu/Debian
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp
sudo ufw status
```

## Access Application

- **Frontend**: http://103.142.175.170:9000
- **Backend API**: http://103.142.175.170:9001/api
- **API Docs**: http://103.142.175.170:9001/docs

## Default Login Credentials

After deployment, create an admin user or use existing:
- **Email**: test.admin@example.com
- **Password**: password123

⚠️ **IMPORTANT**: Change default credentials immediately in production!

## PM2 Commands Reference

```bash
# Start applications
pm2 start ecosystem.config.js

# Stop applications
pm2 stop all

# Restart applications
pm2 restart all

# Delete from PM2
pm2 delete all

# View logs
pm2 logs hrms-backend
pm2 logs hrms-frontend

# Monitor
pm2 monit

# Show detailed info
pm2 show hrms-backend
```

## Updating Application

```bash
# Pull latest changes
git pull origin main

# Redeploy
./deploy.sh

# Restart with PM2
pm2 restart all
```

## Troubleshooting

### Backend not starting

```bash
# Check logs
pm2 logs hrms-backend

# Check if port is in use
sudo lsof -i :9001

# Check MongoDB connection
cd backend
source venv/bin/activate
python3 -c "from motor.motor_asyncio import AsyncIOMotorClient; import os; from dotenv import load_dotenv; load_dotenv('.env'); print('Testing MongoDB connection...'); client = AsyncIOMotorClient(os.environ['MONGO_URL']); print('Connected!')"
```

### Frontend not building

```bash
# Check Node version (should be 18+)
node --version

# Clean and rebuild
cd frontend
rm -rf node_modules build
yarn install
yarn build
```

### CORS Issues

Ensure `CORS_ORIGINS` in `backend/.env` includes your frontend URL:
```
CORS_ORIGINS=http://103.142.175.170:9000
```

## Security Recommendations

1. **Change JWT Secret**: Generate a strong secret key
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Use HTTPS**: Configure Nginx/Apache as reverse proxy with SSL

3. **Firewall**: Only allow necessary ports

4. **Database**: Use strong passwords, enable IP whitelist in MongoDB Atlas

5. **Backup**: Regular database backups

6. **Updates**: Keep system and dependencies updated

## Support

For issues, check logs:
- Backend: `pm2 logs hrms-backend`
- Frontend: `pm2 logs hrms-frontend`
- System: `/var/log/syslog`
