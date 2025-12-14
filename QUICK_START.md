# HRMS Production Deployment - Quick Start Guide

## 🎯 Deployment Target

- **Server IP**: 103.142.175.170
- **Backend**: http://103.142.175.170:9001
- **Frontend**: http://103.142.175.170:9000
- **Database**: MongoDB Atlas (Remote)

---

## 🚀 One-Command Deployment

### Step 1: Initial Server Setup (First Time Only)

```bash
# SSH into your Utho server
ssh root@103.142.175.170

# Run server setup script
wget https://your-repo-url/server-setup.sh
chmod +x server-setup.sh
./server-setup.sh
```

### Step 2: Deploy Application

```bash
# Clone repository
cd /var/www
git clone <your-repo-url> hrms
cd hrms

# Copy environment files (already configured for production)
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env

# Deploy (installs dependencies and builds)
./deploy.sh

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the command it outputs
```

### Step 3: Verify Deployment

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs

# Test backend
curl http://103.142.175.170:9001/health

# Test frontend in browser
# Navigate to: http://103.142.175.170:9000
```

---

## 📋 What's Pre-Configured

### Backend (.env.production)
```env
PORT=9001
HOST=0.0.0.0
MONGO_URL=mongodb+srv://bheemprakash_db_user:epEW9Jrv@human.z2u4awy.mongodb.net/?appName=human
DB_NAME=hrms_production
JWT_SECRET_KEY=<CHANGE-THIS-IN-PRODUCTION>
CORS_ORIGINS=http://103.142.175.170:9000,http://103.142.175.170
FRONTEND_URL=http://103.142.175.170:9000
BACKEND_URL=http://103.142.175.170:9001
```

### Frontend (.env.production)
```env
REACT_APP_BACKEND_URL=http://103.142.175.170:9001
NODE_ENV=production
```

---

## ⚠️ Important Security Steps

### 1. Change JWT Secret Key

```bash
# Generate a secure key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Update backend/.env
nano backend/.env
# Replace JWT_SECRET_KEY with generated key
```

### 2. Change Default Admin Password

After first login:
1. Login with: test.admin@example.com / password123
2. Go to Profile → Change Password
3. Set a strong password

---

## 🔄 Common Operations

### View Logs
```bash
pm2 logs                    # All logs
pm2 logs hrms-backend      # Backend only
pm2 logs hrms-frontend     # Frontend only
```

### Restart Services
```bash
pm2 restart all            # Restart both
pm2 restart hrms-backend   # Backend only
pm2 restart hrms-frontend  # Frontend only
```

### Stop Services
```bash
pm2 stop all
```

### Update Application
```bash
cd /var/www/hrms
git pull origin main
./deploy.sh
pm2 restart all
```

---

## 🧪 Test URLs

Once deployed, test these URLs:

1. **Backend Health**: http://103.142.175.170:9001/health
2. **API Docs**: http://103.142.175.170:9001/docs
3. **Frontend**: http://103.142.175.170:9000
4. **Login**: http://103.142.175.170:9000 (test.admin@example.com / password123)

---

## 📊 Monitoring

### Check Status
```bash
pm2 status     # Process status
pm2 monit      # Real-time monitoring
pm2 info hrms-backend  # Detailed info
```

### Check Resources
```bash
# CPU and Memory
pm2 status

# Disk space
df -h

# Network connections
netstat -tulpn | grep :900
```

---

## 🆘 Troubleshooting

### Backend not starting?
```bash
# Check logs
pm2 logs hrms-backend --lines 50

# Check if port is in use
sudo lsof -i :9001

# Test MongoDB connection
cd /var/www/hrms/backend
source venv/bin/activate
python3 -c "from pymongo import MongoClient; client = MongoClient('mongodb+srv://bheemprakash_db_user:epEW9Jrv@human.z2u4awy.mongodb.net/?appName=human'); print('MongoDB Connected!')"
```

### Frontend not loading?
```bash
# Check logs
pm2 logs hrms-frontend --lines 50

# Verify build exists
ls -la /var/www/hrms/frontend/build

# Rebuild if needed
cd /var/www/hrms/frontend
yarn build
pm2 restart hrms-frontend
```

### CORS errors?
Update `backend/.env`:
```env
CORS_ORIGINS=http://103.142.175.170:9000,http://103.142.175.170
```
Then: `pm2 restart hrms-backend`

---

## 📁 Important Files

```
/var/www/hrms/
├── backend/.env              # Backend configuration (create from .env.production)
├── frontend/.env             # Frontend configuration (create from .env.production)
├── ecosystem.config.js       # PM2 configuration
├── deploy.sh                 # Deployment script
├── DEPLOYMENT.md             # Detailed deployment guide
└── PRODUCTION_CHECKLIST.md   # Pre-deployment checklist
```

---

## 🎓 Training Resources

### Default Credentials
- **Admin**: test.admin@example.com / password123
- **Manager**: test.manager@example.com / password123

### Test the System
1. Login as admin
2. Add a new employee
3. Configure leave policy
4. Apply for leave as employee
5. Approve as manager/admin
6. Generate salary slips
7. Create salary templates

---

## 📞 Support

For detailed deployment instructions: See **DEPLOYMENT.md**
For production checklist: See **PRODUCTION_CHECKLIST.md**
For code updates: `git pull && ./deploy.sh && pm2 restart all`

---

## ✅ Deployment Complete!

Your HRMS is now running at:
- 🌐 **Frontend**: http://103.142.175.170:9000
- 🔧 **Backend**: http://103.142.175.170:9001
- 📚 **API Docs**: http://103.142.175.170:9001/docs

**Next Steps:**
1. Change JWT secret key ⚠️
2. Change default admin password ⚠️
3. Test all features
4. Setup regular backups
5. Configure monitoring
