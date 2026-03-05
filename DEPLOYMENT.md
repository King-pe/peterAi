# PeterAi - WhatsApp Bot Deployment Guide

## Overview

**PeterAi** is a powerful WhatsApp bot built with **@whiskeysockets/baileys** that supports both QR Code and Phone Number (Pairing Code) connection methods. The bot includes an Admin Dashboard for managing connections, users, payments, and settings.

## Key Features

- **QR Code Connection**: Scan QR code every 15 seconds for secure connection
- **Pairing Code Connection**: Use phone number to generate 8-digit pairing code
- **Admin Dashboard**: Full control over bot settings, users, and analytics
- **PostgreSQL Database**: Persistent data storage for users, payments, and logs
- **AI Integration**: Powered by Groq's Llama model for intelligent responses
- **Credit System**: Flexible credit-based payment model
- **Multi-language Support**: Kiswahili and English support

## Prerequisites

- **Node.js**: v18+ (recommended v22+)
- **PostgreSQL**: v12+ database server
- **npm** or **pnpm**: Package manager
- **WhatsApp Account**: For connecting the bot

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/King-pe/peterAi.git
cd peterAi
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3. Set Up PostgreSQL Database

#### Create Database

```bash
psql -U postgres
CREATE DATABASE peterai;
\c peterai
```

#### Import Database Schema

```bash
psql -U postgres -d peterai -f db.sql
```

Or manually run the SQL commands from `db.sql` file in your PostgreSQL client.

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and update with your configuration:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/peterai

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# WhatsApp Configuration
BOT_NAME=PeterAi
BOT_PHONE_NUMBER=

# AI Model
AI_MODEL=llama-3.3-70b-versatile

# Server
PORT=3000
NODE_ENV=production
```

### 5. Build the Project

```bash
pnpm build
# or
npm run build
```

### 6. Start the Server

#### Development Mode

```bash
pnpm dev
# or
npm run dev
```

The server will start on `http://localhost:3000`

#### Production Mode

```bash
pnpm start
# or
npm start
```

## Admin Dashboard Access

1. Navigate to `http://localhost:3000/login`
2. Log in with your admin credentials
3. Go to **Dashboard > Connect** to link WhatsApp

## WhatsApp Connection Methods

### Method 1: QR Code (Recommended)

1. Open Admin Dashboard
2. Go to **Connect** page
3. Click **"Get QR Code"**
4. Open WhatsApp on your phone
5. Go to **Settings > Linked Devices > Link a Device**
6. Scan the QR code with your phone
7. Confirm on your phone
8. The bot will connect automatically

**Note**: QR codes refresh every 15 seconds for security.

### Method 2: Phone Number (Pairing Code)

1. Open Admin Dashboard
2. Go to **Connect** page
3. Switch to **"Phone Code"** tab
4. Enter your phone number (e.g., +255712345678)
5. Click **"Get Connection Code"**
6. Open WhatsApp on your phone
7. Go to **Settings > Linked Devices > Link a Device > Link with Phone Number**
8. Enter the 8-digit code shown in the dashboard
9. Confirm on your phone
10. The bot will connect automatically

## Database Schema

The database includes the following tables:

### users
- `phone` (VARCHAR, PRIMARY KEY): User's phone number
- `name` (VARCHAR): User's name
- `credits` (INTEGER): Available credits
- `subscription_active` (BOOLEAN): Subscription status
- `subscription_plan` (VARCHAR): Subscription plan type
- `subscription_expires_at` (TIMESTAMP): Subscription expiration date
- `banned` (BOOLEAN): User ban status
- `joined_at` (TIMESTAMP): Account creation date
- `last_active` (TIMESTAMP): Last activity date
- `total_messages` (INTEGER): Total messages sent
- `total_spent` (INTEGER): Total amount spent

### payments
- `order_id` (VARCHAR, PRIMARY KEY): Payment order ID
- `phone` (VARCHAR, FOREIGN KEY): User's phone number
- `amount` (INTEGER): Payment amount
- `currency` (VARCHAR): Currency code
- `status` (VARCHAR): Payment status (pending, completed, failed)
- `created_at` (TIMESTAMP): Payment creation date
- `updated_at` (TIMESTAMP): Last update date

### logs
- `id` (VARCHAR, PRIMARY KEY): Log entry ID
- `phone` (VARCHAR, FOREIGN KEY): User's phone number
- `user_name` (VARCHAR): User's name
- `command` (TEXT): Command executed
- `message` (TEXT): User message
- `response` (TEXT): Bot response
- `type` (VARCHAR): Log type (command, error, etc.)
- `timestamp` (TIMESTAMP): Log creation date

### settings
- `key` (VARCHAR, PRIMARY KEY): Setting key
- `value` (TEXT): Setting value

## API Endpoints

### Authentication

- `POST /api/admin/auth` - Admin login

### WhatsApp Connection

- `GET /api/connect/qr` - Get QR code for connection
- `POST /api/connect/phone` - Get pairing code for phone number
- `GET /api/connect/status` - Check connection status
- `POST /api/connect/disconnect` - Disconnect WhatsApp

### User Management

- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:phone` - Update user
- `DELETE /api/users/:phone` - Delete user

### Payments

- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create new payment
- `PUT /api/payments/:orderId` - Update payment

### Settings

- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings

### Logs

- `GET /api/logs` - Get all logs

## Troubleshooting

### QR Code Not Appearing

1. Check if the server is running
2. Verify PostgreSQL database connection
3. Check browser console for errors
4. Try refreshing the page

### Connection Timeout

1. Ensure WhatsApp is installed on your phone
2. Check internet connection on both devices
3. Try disconnecting and reconnecting
4. Clear browser cache and try again

### Database Connection Error

1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Ensure database exists and schema is imported
4. Check database user permissions

### QR Code Not Refreshing

1. The QR code should refresh every 15 seconds automatically
2. If not refreshing, try clicking "Refresh QR Code" button
3. Check browser console for network errors

## Security Considerations

1. **Change Default Admin Credentials**: Always change the default admin username and password
2. **Use HTTPS**: Deploy with HTTPS in production
3. **Secure Database**: Use strong database passwords and restrict access
4. **Environment Variables**: Never commit `.env` file to version control
5. **Browser Agent**: The bot uses Chrome 119.0.0.0 as browser agent for security
6. **QR Refresh**: QR codes refresh every 15 seconds to prevent unauthorized access

## Performance Optimization

1. **Database Indexing**: Indexes are created on frequently queried columns
2. **Connection Pooling**: PostgreSQL connection pooling is configured
3. **Message Caching**: Last 1000 messages are cached for quick access
4. **Lazy Loading**: Native modules are loaded only when needed

## Deployment to Production

### Using Node.js (Recommended)

```bash
# Install PM2 for process management
npm install -g pm2

# Start the application
pm2 start npm --name "peterai" -- start

# Save PM2 configuration
pm2 save

# Enable PM2 startup on reboot
pm2 startup
```

### Using Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t peterai .
docker run -p 3000:3000 --env-file .env peterai
```

## Monitoring & Logs

Check application logs:

```bash
# Using PM2
pm2 logs peterai

# Using Docker
docker logs <container_id>
```

Access bot logs through Admin Dashboard:
- Go to **Dashboard > Logs** to view all bot activity

## Support & Troubleshooting

For issues or questions:

1. Check the logs in Admin Dashboard
2. Review browser console for client-side errors
3. Check server logs for backend errors
4. Verify database connection and schema

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please follow the existing code style and submit pull requests to the main repository.
