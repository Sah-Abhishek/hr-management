# HRMS - Human Resource Management System

A comprehensive full-stack HRMS application built with FastAPI, React, and MongoDB.

## Features

- 👥 **Employee Management**: Complete employee database with hierarchical structure
- 📝 **Leave Management**: Multi-level approval workflow (Employee → Manager → Admin)
- 💰 **Payroll System**: Automated salary calculations with detailed salary slips
- 📊 **Reports**: Leave reports, attendance tracking, CSV exports
- 🏢 **Multi-Organization**: Support for multiple organizations
- 📧 **Notifications**: Email and WhatsApp notifications
- 💼 **Salary Templates**: Standardized salary structure across employees
- 🎁 **Comp-Off**: Compensatory leave management

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- Shadcn UI Components
- React Router v6
- Axios

### Backend
- FastAPI (Python)
- MongoDB (Motor - Async driver)
- JWT Authentication
- Pydantic for validation

### Deployment
- PM2 Process Manager
- Nginx (recommended for production)

## Quick Start

### Development

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd hrms
   ```

2. **Backend setup**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   # Update .env with your MongoDB URL
   uvicorn server:app --reload --port 8001
   ```

3. **Frontend setup**
   ```bash
   cd frontend
   yarn install
   cp .env.example .env
   # Update .env with backend URL
   yarn start
   ```

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions.

## Project Structure

```
hrms/
├── backend/
│   ├── server.py           # Main FastAPI application
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example       # Environment variables template
│   └── start.sh           # Backend start script
├── frontend/
│   ├── src/
│   │   ├── pages/         # React pages
│   │   ├── components/    # Reusable components
│   │   └── lib/          # Utilities (API, auth)
│   ├── package.json       # Node dependencies
│   ├── .env.example      # Environment variables template
│   └── start.sh          # Frontend start script
├── ecosystem.config.js    # PM2 configuration
├── deploy.sh             # Deployment script
└── DEPLOYMENT.md         # Deployment guide
```

## Environment Variables

### Backend (.env)

```env
PORT=9001
MONGO_URL=<your-mongodb-url>
DB_NAME=hrms_production
JWT_SECRET_KEY=<your-secret-key>
CORS_ORIGINS=http://your-domain:9000
```

### Frontend (.env)

```env
REACT_APP_BACKEND_URL=http://your-domain:9001
NODE_ENV=production
```

## Default Users

After deployment, seed data includes:
- **Admin**: test.admin@example.com / password123
- **Manager**: test.manager@example.com / password123

⚠️ Change these credentials in production!

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://your-domain:9001/docs`
- ReDoc: `http://your-domain:9001/redoc`

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.
