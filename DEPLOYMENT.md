# CarIntel Admin Dashboard - Deployment Guide

## 🚀 Production Deployment Checklist

### 1. Environment Variables
Ensure these environment variables are set in your production environment (Vercel):

```bash
DATABASE_URL=postgresql://neondb_owner:npg_p1IJPygusA8w@ep-patient-mouse-a9tzeizd-pooler.gwc.azure.neon.tech/neondb?sslmode=require
JWT_SECRET=your-super-secure-jwt-secret-key-here
NODE_ENV=production
```

### 2. Database Initialization
After deployment, initialize the database schema:

```bash
# Call the initialization endpoint
curl -X POST https://carintel.nl/api/init-db
```

### 3. Create Admin User
Create the admin user for dashboard access:

```bash
# Create admin user
curl -X POST "https://carintel.nl/api/cleanup?action=create-admin"
```

### 4. Add Test Data (Optional)
For testing purposes, add some sample data:

```bash
# Create test data
curl -X POST "https://carintel.nl/api/cleanup?action=create-test-data"
```

## 📊 Admin Dashboard Features

### Statistics Overview
- **Total Users**: Count of all registered users
- **Active Users**: Users active in the last 7 days
- **Total Searches**: Combined logged-in and anonymous searches
- **Daily Searches**: Search count for today

### Data Visualization
- **Popular Kentekens**: Most searched license plates with frequency
- **Recent Users**: Latest user registrations
- **Search Activity Chart**: Visual representation of daily search activity
- **Database Statistics**: Storage usage and system info

### Access Control
- Admin role required for dashboard access
- JWT authentication for all admin endpoints
- Secure API endpoints with proper CORS configuration

## 🔧 API Endpoints

### Authentication
- `POST /api/auth?action=login` - User login
- `POST /api/auth?action=register` - User registration
- `POST /api/auth?action=verify` - Token verification

### Admin Endpoints
- `GET /api/auth?action=admin-stats` - Get dashboard statistics
- `GET /api/auth?action=admin-debug` - Debug information
- `GET /api/auth?action=admin-logs` - Activity logs

### Database Management
- `POST /api/init-db` - Initialize database schema
- `POST /api/cleanup?action=create-admin` - Create admin user
- `POST /api/cleanup?action=create-test-data` - Add test data
- `POST /api/cleanup?action=cleanup-old` - Clean old data

## 🔐 Admin Login Credentials

**Email**: `sanderhelmink@gmail.com`  
**Password**: `admin123!`  
**Role**: `admin`

> ⚠️ **Security Note**: Change the default admin password after first login in production!

## 📱 Usage Instructions

1. **Access Admin Dashboard**:
   - Navigate to `https://carintel.nl/admin`
   - Login with admin credentials
   - View comprehensive statistics and analytics

2. **Monitor System Health**:
   - Check user registration trends
   - Monitor search activity patterns
   - Review database performance metrics

3. **Data Management**:
   - View popular search terms
   - Track user engagement
   - Monitor system usage patterns

## 🛠️ Development

### Local Development
```bash
# Start development server
npm run dev

# Access admin dashboard
http://localhost:3001/admin
```

### Database Schema
The application uses PostgreSQL with these main tables:
- `users` - User accounts and authentication
- `activity_logs` - User activity tracking
- `anonymous_searches` - Anonymous search tracking
- `saved_searches` - User saved search collections
- `saved_vehicles` - Individual saved vehicles

### Performance Optimizations
- Database indexes on frequently queried columns
- Efficient queries with proper joins
- CORS configuration for security
- JWT token-based authentication

## 📈 Monitoring & Analytics

The admin dashboard provides insights into:
- User growth and retention
- Search behavior patterns
- Popular vehicle searches
- System performance metrics
- Database health and size

## 🔄 Maintenance

### Regular Tasks
- Monitor database size and performance
- Clean up old anonymous search data
- Review user activity logs
- Update security configurations

### Automated Cleanup
The system includes automated cleanup for:
- Anonymous searches older than 30 days
- Activity logs older than 90 days
- Saved searches older than 365 days

---

## 🚀 Ready for Production!

Your CarIntel admin dashboard is now fully configured and ready for production deployment with:

✅ Comprehensive statistics and analytics  
✅ Real-time database integration  
✅ Secure authentication system  
✅ Visual data representation  
✅ Performance optimizations  
✅ Automated data management  

The system is live and operational with real data from your Neon PostgreSQL database! 