# PeterAi - WhatsApp Bot with Admin Dashboard

A powerful WhatsApp bot built with **@whiskeysockets/baileys** that provides intelligent responses, credit-based payments, and a comprehensive admin dashboard. Supports both QR Code and Phone Number (Pairing Code) connection methods.

## 🚀 Features

### WhatsApp Integration
- **QR Code Connection**: Secure connection via QR code (refreshes every 15 seconds)
- **Pairing Code Connection**: Connect using phone number with 8-digit code
- **Auto-Reconnection**: Automatic reconnection on disconnection
- **Message Handling**: Support for text, images, videos, audio, and documents
- **Auto-Typing**: Show typing indicator while processing messages
- **Auto-Reaction**: Automatic emoji reactions to messages

### Admin Dashboard
- **Connection Management**: Monitor and manage WhatsApp connection status
- **User Management**: View, create, update, and delete users
- **Payment Tracking**: Monitor all payments and transactions
- **Activity Logs**: Detailed logs of all bot activities
- **Settings Management**: Configure bot behavior and pricing
- **Analytics**: View statistics and usage metrics

### Credit System
- **Flexible Pricing**: Configurable credit prices and packages
- **Subscription Plans**: Monthly subscription options
- **Usage Tracking**: Monitor credit consumption per user
- **Payment Integration**: Support for multiple payment methods

### AI Integration
- **Groq AI**: Powered by Groq's Llama model for intelligent responses
- **Multi-Language**: Support for Kiswahili and English
- **Context Awareness**: Maintains conversation context

### Database
- **PostgreSQL**: Reliable data persistence
- **User Profiles**: Store user information and preferences
- **Payment Records**: Track all transactions
- **Activity Logs**: Comprehensive audit trail
- **Settings Storage**: Centralized configuration management

## 📋 Prerequisites

- **Node.js**: v18+ (recommended v22+)
- **PostgreSQL**: v12+ database server
- **npm** or **pnpm**: Package manager
- **WhatsApp Account**: For connecting the bot
- **Modern Browser**: For admin dashboard access

## 🔧 Installation

### 1. Clone Repository

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

### 3. Database Setup

#### Create PostgreSQL Database

```bash
psql -U postgres
CREATE DATABASE peterai;
\c peterai
```

#### Import Schema

```bash
psql -U postgres -d peterai -f db.sql
```

### 4. Environment Configuration

Copy and configure `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/peterai

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# Bot Configuration
BOT_NAME=PeterAi
BOT_PHONE_NUMBER=

# AI Model
AI_MODEL=llama-3.3-70b-versatile

# Server
PORT=3000
NODE_ENV=production
```

### 5. Build Project

```bash
pnpm build
```

### 6. Start Server

#### Development

```bash
pnpm dev
```

#### Production

```bash
pnpm start
```

Server runs on `http://localhost:3000`

## 📱 WhatsApp Connection

### QR Code Method (Recommended)

1. Open Admin Dashboard: `http://localhost:3000/login`
2. Log in with admin credentials
3. Navigate to **Dashboard > Connect**
4. Click **"Get QR Code"**
5. Open WhatsApp on your phone
6. Go to **Settings > Linked Devices > Link a Device**
7. Scan the QR code
8. Confirm on your phone
9. Bot connects automatically

**Note**: QR codes refresh every 15 seconds for security.

### Phone Number Method

1. Open Admin Dashboard
2. Go to **Dashboard > Connect**
3. Switch to **"Phone Code"** tab
4. Enter phone number (e.g., +255712345678)
5. Click **"Get Connection Code"**
6. Open WhatsApp on your phone
7. Go to **Settings > Linked Devices > Link a Device > Link with Phone Number**
8. Enter the 8-digit code
9. Confirm on your phone
10. Bot connects automatically

## 📊 Database Schema

### users
```sql
- phone (VARCHAR, PRIMARY KEY)
- name (VARCHAR)
- credits (INTEGER)
- subscription_active (BOOLEAN)
- subscription_plan (VARCHAR)
- subscription_expires_at (TIMESTAMP)
- banned (BOOLEAN)
- joined_at (TIMESTAMP)
- last_active (TIMESTAMP)
- total_messages (INTEGER)
- total_spent (INTEGER)
```

### payments
```sql
- order_id (VARCHAR, PRIMARY KEY)
- phone (VARCHAR, FOREIGN KEY)
- amount (INTEGER)
- currency (VARCHAR)
- status (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### logs
```sql
- id (VARCHAR, PRIMARY KEY)
- phone (VARCHAR, FOREIGN KEY)
- user_name (VARCHAR)
- command (TEXT)
- message (TEXT)
- response (TEXT)
- type (VARCHAR)
- timestamp (TIMESTAMP)
```

### settings
```sql
- key (VARCHAR, PRIMARY KEY)
- value (TEXT)
```

## 🔌 API Endpoints

### Authentication
- `POST /api/admin/auth` - Admin login

### WhatsApp Connection
- `GET /api/connect/qr` - Get QR code
- `POST /api/connect/phone` - Get pairing code
- `GET /api/connect/status` - Check connection status
- `POST /api/connect/disconnect` - Disconnect WhatsApp

### User Management
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:phone` - Update user
- `DELETE /api/users/:phone` - Delete user

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create payment
- `PUT /api/payments/:orderId` - Update payment

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

### Logs
- `GET /api/logs` - Get logs

## 🛠️ Configuration

### Bot Settings

Edit settings through Admin Dashboard or directly in database:

```env
BOT_NAME=PeterAi
WELCOME_MESSAGE=Karibu PeterAi!
AI_SYSTEM_PROMPT=Wewe ni PeterAi...
CREDIT_PRICE=1000
CREDITS_PER_PACK=50
SUBSCRIPTION_PRICE=5000
MESSAGE_CREDIT_COST=1
IMAGE_CREDIT_COST=3
CURRENCY=TZS
MAX_MESSAGE_LENGTH=4096
AUTO_TYPING_ENABLED=true
AUTO_REACTION_ENABLED=true
```

## 🔒 Security

### Best Practices

1. **Change Default Credentials**: Always update admin username and password
2. **Use HTTPS**: Deploy with SSL/TLS in production
3. **Secure Database**: Use strong passwords and restrict access
4. **Environment Variables**: Never commit `.env` to version control
5. **Browser Agent**: Uses Chrome 119.0.0.0 for security
6. **QR Refresh**: QR codes refresh every 15 seconds to prevent unauthorized access
7. **Input Validation**: All inputs are validated and sanitized

### Database Security

- Prepared statements prevent SQL injection
- Connection pooling for efficient resource usage
- Row-level security can be implemented per requirements
- Encrypted password storage recommended

## 📈 Performance

- **Connection Pooling**: Efficient PostgreSQL connection management
- **Message Caching**: Last 1000 messages cached for quick access
- **Lazy Loading**: Native modules loaded only when needed
- **Database Indexing**: Optimized queries on frequently accessed columns

## 🚀 Deployment

### Using PM2

```bash
npm install -g pm2

pm2 start npm --name "peterai" -- start
pm2 save
pm2 startup
```

### Using Docker

```bash
docker build -t peterai .
docker run -p 3000:3000 --env-file .env peterai
```

### Using Heroku

```bash
heroku create peterai
heroku addons:create heroku-postgresql:standard-0
git push heroku main
```

## 🐛 Troubleshooting

### QR Code Not Appearing
- Check if server is running
- Verify PostgreSQL connection
- Check browser console for errors
- Try refreshing the page

### Connection Timeout
- Ensure WhatsApp is installed on phone
- Check internet connection on both devices
- Try disconnecting and reconnecting
- Clear browser cache

### Database Connection Error
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database and schema exist
- Check database user permissions

### QR Code Not Refreshing
- QR should refresh every 15 seconds automatically
- Click "Refresh QR Code" button if needed
- Check browser console for network errors

## 📝 Logs

### View Logs

**Through Admin Dashboard:**
- Go to **Dashboard > Logs**
- View all bot activity and errors

**Through Server:**
```bash
# Using PM2
pm2 logs peterai

# Using Docker
docker logs <container_id>
```

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Detailed deployment instructions
- [API Documentation](./API.md) - Complete API reference
- [Configuration Guide](./CONFIG.md) - All configuration options

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💬 Support

For issues, questions, or suggestions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review logs in Admin Dashboard
3. Check browser console for errors
4. Open an issue on GitHub

## 🎯 Roadmap

- [ ] Multi-language support expansion
- [ ] Advanced analytics dashboard
- [ ] Webhook integrations
- [ ] Message scheduling
- [ ] Group management features
- [ ] Media library
- [ ] Custom commands
- [ ] API rate limiting

## 👨‍💻 Author

**King-pe** - [GitHub](https://github.com/King-pe)

## 🙏 Acknowledgments

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [Next.js](https://nextjs.org/) - React framework
- [Groq](https://groq.com/) - AI inference
- [PostgreSQL](https://www.postgresql.org/) - Database

---

**Made with ❤️ for WhatsApp automation**
