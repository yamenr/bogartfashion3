# Bogart Fashion Website - Setup Guide

A modern online fashion brand website built with React frontend and Node.js backend.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - Install via [XAMPP](https://www.apachefriends.org/) or standalone
- **Git** - [Download here](https://git-scm.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/yamenr/bogartfashion3.git
cd bogartfashion3
```

### 2. Database Setup

#### Option A: Using XAMPP (Recommended for Windows)
1. Download and install [XAMPP](https://www.apachefriends.org/)
2. Start XAMPP Control Panel
3. Start Apache and MySQL services
4. Open phpMyAdmin: `http://localhost/phpmyadmin`
5. Create new database: `bogartfashion2`
6. Import the database schema:
   - Click on your new database
   - Go to "Import" tab
   - Choose file: `bogartfashion.sql`
   - Click "Go" to import

#### Option B: Standalone MySQL
1. Install MySQL Server
2. Create database: `CREATE DATABASE bogartfashion2;`
3. Import schema: `mysql -u root -p bogartfashion2 < bogartfashion.sql`

### 3. Environment Configuration

#### Backend Configuration
1. Navigate to `backend/` folder
2. Copy `env.example` to `env.config`:
   ```bash
   cp env.example env.config
   ```
3. Edit `env.config` with your database credentials:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=bogartfashion2
   DB_PORT=3306
   
   # JWT Secret
   JWT_SECRET=your-secret-key-here
   
   # Email Configuration (Gmail)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-gmail-app-password
   ```

#### Email Setup (Required for Contact Form & Password Reset)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use this app password in `EMAIL_PASS`

### 4. Install Dependencies

#### Backend Dependencies
```bash
cd backend
npm install
```

#### Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4.5. Create Required Directories

```bash
# Create uploads directory for images and files
mkdir backend/uploads
mkdir backend/uploads/invoices

# Optional: Add sample product images
# Copy any image file to backend/uploads/ and rename it to match product images
# Example: copy sample.jpg backend/uploads/denim-jacket.jpg
```

**⚠️ Important:** Without the `backend/uploads/` directory:
- Product images won't display (showing broken image icons)
- Profile picture updates will fail
- Invoice generation will fail
- File uploads won't work

### 5. Start the Application

#### Option A: Use the Batch Script (Windows)
```bash
# From the root directory
.\run-servers.bat
```

#### Option B: Manual Start
```bash
# Terminal 1 - Backend (Port 3001)
cd backend
npm start

# Terminal 2 - Frontend (Port 3000)
cd frontend
npm start
```

### 6. Access the Website
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:3306

## 🔧 Configuration Details

### Ports Used
- **Frontend**: 3000
- **Backend API**: 3001
- **MySQL**: 3306
- **Apache**: 80 (if using XAMPP)

### Database Tables
The application uses these main tables:
- `users` - User accounts and authentication
- `products` - Product catalog
- `categories` - Product categories
- `orders` - Customer orders
- `contact_messages` - Contact form submissions
- `settings` - Application settings

### Email Features
- Contact form notifications
- Password reset emails
- Order confirmation emails

## 🐛 Troubleshooting

### Common Issues

#### 1. "Port already in use" Error
```bash
# Windows - Find process using port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill process by PID
taskkill /PID <process_id> /F
```

#### 2. Database Connection Failed
- Verify MySQL is running
- Check database credentials in `env.config`
- Ensure database `bogartfashion2` exists
- Verify port 3306 is correct

#### 3. Email Not Sending
- Check Gmail app password is correct
- Verify 2FA is enabled on Gmail
- Check `EMAIL_USER` and `EMAIL_PASS` in `env.config`

#### 4. Frontend Can't Connect to Backend
- Ensure backend is running on port 3001
- Check proxy configuration in `frontend/src/setupProxy.js`
- Verify no firewall blocking the connection

### Reset Everything
```bash
# Stop all servers
# Delete node_modules and reinstall
cd backend && rmdir /s node_modules && npm install
cd ../frontend && rmdir /s node_modules && npm install

# Restart servers
.\run-servers.bat
```

## 📁 Project Structure

```
bogartfashion3/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Authentication middleware
│   │   └── utils/          # Utility functions
│   ├── env.config          # Environment variables
│   └── server.js           # Main server file
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context
│   │   └── utils/          # Frontend utilities
│   └── public/             # Static assets
├── bogartfashion.sql       # Database schema
└── run-servers.bat         # Windows startup script
```

## 🚀 Deployment

### Production Considerations
- Use environment variables for sensitive data
- Set up proper SSL certificates
- Configure production database
- Use PM2 or similar for process management
- Set up proper logging and monitoring

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Check the console logs for error messages
4. Ensure all environment variables are set correctly

## 📝 License

This project is proprietary software. All rights reserved.

---

**Happy Coding! 🎉** 