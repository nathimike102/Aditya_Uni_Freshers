# Aditya University Freshers Welcome 2025

A comprehensive ticket management system for university freshers events with admin controls and QR code scanning.

## 🚨 Security Setup

### Environment Variables

**CRITICAL**: Never commit your `.env` file to version control!

1. Copy `.env.example` to `.env`
2. Fill in your Firebase configuration
3. Set secure admin credentials:
   ```
   VITE_ADMIN_EMAIL=your_admin_email@domain.com
   VITE_ADMIN_PASSWORD=your_secure_password
   ```

### Admin Access

- Admin credentials are stored in environment variables only
- No hardcoded credentials in source code
- Change default admin credentials before production

## 🚀 Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables (see Security Setup above)

3. Start development server:
   ```bash
   npm run dev
   ```

## 📱 Features

### For Students

- Google OAuth login
- Access key validation
- Digital ticket generation with QR codes
- Real-time event information
- Mobile-friendly interface

### For Administrators

- Complete event management
- Access key generation and tracking
- QR code scanning with camera
- Real-time analytics
- Dress code management

## 🛡️ Security Features

- Environment variable configuration
- Admin-only access controls
- Secure key validation
- Database-stored access keys
- No exposed credentials in code
