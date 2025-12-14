# Production Deployment Checklist

## Pre-Deployment

### 1. Environment Configuration ✅
- [ ] Copy `backend/.env.example` to `backend/.env.production`
- [ ] Update MongoDB URL in `backend/.env.production`
- [ ] Generate strong JWT secret key
- [ ] Update CORS origins with production URLs
- [ ] Copy `frontend/.env.example` to `frontend/.env.production`
- [ ] Update backend URL in `frontend/.env.production`

### 2. Security Review ✅
- [ ] Change all default passwords
- [ ] Generate secure JWT secret (minimum 32 characters)
- [ ] Review CORS settings (don't use `*` in production)
- [ ] Enable MongoDB IP whitelist
- [ ] Use strong database credentials

### 3. Server Preparation ✅
- [ ] Install Node.js 18+ and npm
- [ ] Install Python 3.10+
- [ ] Install PM2 globally
- [ ] Install serve globally
- [ ] Configure firewall (ports 9000, 9001)

### 4. Database Setup ✅
- [ ] MongoDB Atlas cluster is running
- [ ] Database user has proper permissions
- [ ] Connection string is correct
- [ ] Test connection from server

## Deployment

### 5. Code Deployment ✅
- [ ] Clone/pull latest code from git
- [ ] Review `.gitignore` (don't commit `.env` files)
- [ ] Verify all `.env.production` files are in place
- [ ] Run `./deploy.sh`

### 6. Application Start ✅
- [ ] Start with PM2: `pm2 start ecosystem.config.js`
- [ ] Verify backend is running: `pm2 logs hrms-backend`
- [ ] Verify frontend is running: `pm2 logs hrms-frontend`
- [ ] Save PM2 config: `pm2 save`
- [ ] Setup PM2 startup: `pm2 startup`

### 7. Verification ✅
- [ ] Test backend API: `http://103.142.175.170:9001/docs`
- [ ] Test frontend: `http://103.142.175.170:9000`
- [ ] Test login with admin credentials
- [ ] Create a test employee
- [ ] Apply for leave and test approval flow
- [ ] Test salary template creation
- [ ] Generate a test salary slip

## Post-Deployment

### 8. Monitoring Setup ✅
- [ ] Setup PM2 monitoring: `pm2 monit`
- [ ] Configure log rotation
- [ ] Setup health check endpoints
- [ ] Configure alerts (optional)

### 9. Backup Strategy ✅
- [ ] Configure MongoDB backups in Atlas
- [ ] Document backup restoration procedure
- [ ] Test backup restoration

### 10. Documentation ✅
- [ ] Document server credentials
- [ ] Document deployment process
- [ ] Document rollback procedure
- [ ] Share access with team

## Maintenance

### Regular Tasks
- [ ] **Weekly**: Check logs for errors
- [ ] **Weekly**: Review PM2 status and restarts
- [ ] **Monthly**: Update dependencies
- [ ] **Monthly**: Database cleanup (if needed)
- [ ] **Quarterly**: Security audit
- [ ] **Quarterly**: Performance optimization review

## Rollback Procedure

If deployment fails:

```bash
# 1. Stop current deployment
pm2 stop all

# 2. Checkout previous version
git checkout <previous-commit-hash>

# 3. Redeploy
./deploy.sh
pm2 restart all

# 4. Verify rollback
curl http://103.142.175.170:9001/api/health
```

## Emergency Contacts

- **Server Provider**: Utho Support
- **Database Provider**: MongoDB Atlas Support
- **DevOps Team**: [Add contact]
- **Developer Team**: [Add contact]

## Additional Security (Recommended)

### Setup Nginx Reverse Proxy with SSL

```nginx
# /etc/nginx/sites-available/hrms

server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:9001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Performance Optimization

### Enable Gzip Compression (Nginx)

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

### PM2 Clustering (if needed)

Update `ecosystem.config.js`:
```javascript
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'
```

## Notes

- Backend port: **9001**
- Frontend port: **9000**
- Server IP: **103.142.175.170**
- MongoDB: **MongoDB Atlas** (remote)
- Process Manager: **PM2**
