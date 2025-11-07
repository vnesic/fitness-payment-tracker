# 💪 Fitness Payment Tracker - Full Stack Application

A complete payment tracking system for fitness studios with automated SMS reminders for missed payments.

## 🌐 Live Demo

- **Frontend:** Will be deployed on Vercel
- **Backend:** Will be deployed on Railway

## 🚀 Features

- ✅ Track client payments monthly
- ✅ Automated SMS reminders (1 day after missed payment)
- ✅ Multiple fitness programs support
- ✅ Beautiful responsive dashboard
- ✅ Mobile-friendly design
- ✅ "System's fault" automated reminders

## 📁 Project Structure

```
fitness-tracker-deploy/
├── server.js              # Backend API server
├── package.json           # Backend dependencies
├── .gitignore            # Git ignore rules
├── README.md             # This file
├── DEPLOYMENT.md         # Detailed deployment guide
└── frontend/
    ├── src/
    │   ├── App.js        # Main React component
    │   ├── App.css       # Styles
    │   ├── components/   # React components
    │   └── ...
    ├── public/
    ├── package.json      # Frontend dependencies
    └── vercel.json       # Vercel configuration
```

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- SQLite database
- Twilio SMS API
- node-cron (scheduled tasks)

**Frontend:**
- React 18
- Responsive CSS
- Fetch API

## 📦 Local Development

### Prerequisites
- Node.js 18+ installed
- Twilio account (free tier works)
- Git installed

### Backend Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your Twilio credentials
# TWILIO_ACCOUNT_SID=your_sid_here
# TWILIO_AUTH_TOKEN=your_token_here
# TWILIO_PHONE_NUMBER=+1234567890

# Start server
npm start
```

Backend runs on `http://localhost:3001`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend runs on `http://localhost:3000`

## 🚀 Deployment

### Quick Deploy (Recommended)

#### 1. Deploy Backend to Railway

1. Push code to GitHub (see below)
2. Go to [Railway.app](https://railway.app)
3. Sign up with GitHub
4. Click "New Project" → "Deploy from GitHub repo"
5. Select your repository
6. Railway auto-detects Node.js
7. Add environment variables in Railway dashboard:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `FRONTEND_URL` (your Vercel URL, add later)
8. Deploy! 🎉

Railway will give you a URL like: `https://your-app.up.railway.app`

#### 2. Deploy Frontend to Vercel

1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Set Root Directory to `frontend`
6. Add environment variable:
   - Name: `REACT_APP_API_URL`
   - Value: `https://your-railway-app.up.railway.app/api`
7. Deploy! 🎉

Vercel will give you a URL like: `https://your-app.vercel.app`

#### 3. Update Railway with Frontend URL

Go back to Railway → Environment Variables → Add:
- Name: `FRONTEND_URL`
- Value: `https://your-app.vercel.app`

Done! Your app is live! 🚀

### Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Fitness Payment Tracker"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/fitness-payment-tracker.git
git branch -M main
git push -u origin main
```

## 📝 Environment Variables

### Backend (.env)

```env
# Required for SMS functionality
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Optional
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

```env
REACT_APP_API_URL=http://localhost:3001/api
```

For production, set `REACT_APP_API_URL` to your Railway backend URL.

## 💰 Costs

- **Application:** FREE
- **Twilio SMS:** ~$0.0075 per SMS (free trial includes $15)
- **Railway:** FREE tier (500 hours/month) or $5/month
- **Vercel:** FREE
- **GitHub:** FREE

**Total:** Essentially FREE for small studios!

## 📚 Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
- [API Documentation](#api-endpoints) - API reference

## 🔐 Security Notes

- Never commit `.env` files
- Use environment variables for all secrets
- Backend validates all inputs
- CORS properly configured
- Use HTTPS in production (auto with Railway/Vercel)

## 🐛 Troubleshooting

### Backend won't start
- Check Node.js version: `node --version` (need 18+)
- Verify all dependencies installed: `npm install`
- Check PORT is not in use

### Frontend can't connect to backend
- Verify `REACT_APP_API_URL` is set correctly
- Check CORS settings in server.js
- Ensure backend is running

### SMS not sending
- Verify Twilio credentials
- Check phone number format (+1234567890)
- Check Twilio console for errors
- Ensure you have Twilio credits

## 📞 Support

For issues or questions:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md)
- Review Twilio docs: https://www.twilio.com/docs
- Railway docs: https://docs.railway.app
- Vercel docs: https://vercel.com/docs

## 📄 License

MIT License - Free to use and modify!

## 🙏 Credits

Built with ❤️ for fitness studio owners who want to automate payment tracking.

---

## API Endpoints

### Programs
- `GET /api/programs` - List all programs
- `POST /api/programs` - Create program
- `DELETE /api/programs/:id` - Delete program

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Payments
- `GET /api/payments` - List all payments
- `GET /api/payments/current-month` - Current month payments
- `PUT /api/payments/:id/mark-paid` - Mark payment as paid

### Dashboard
- `GET /api/dashboard/stats` - Get monthly statistics

### Health
- `GET /health` - Health check endpoint

---

**Ready to deploy? Follow the steps above or check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions!** 🚀
