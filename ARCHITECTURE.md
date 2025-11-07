# 🏗️ System Architecture & Data Flow

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FITNESS PAYMENT TRACKER                  │
│                  Automated SMS Reminder System                │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │ ◄────► │   Backend    │ ◄────► │   Twilio     │
│   (Vercel)   │  API   │  (Railway)   │  SMS   │   (SMS API)  │
└──────────────┘         └──────────────┘         └──────────────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   SQLite     │
                         │  Database    │
                         └──────────────┘
```

---

## Component Breakdown

### Frontend (React on Vercel)
```
User Interface
├── Dashboard (Payment overview)
├── Clients Management
├── Programs Management
└── Payment History

Hosted on: Vercel (Free)
Technology: React 18, CSS3
Access: https://your-app.vercel.app
```

### Backend (Node.js on Railway)
```
API Server + Automation
├── Express API (REST endpoints)
├── SQLite Database (local storage)
├── Cron Scheduler (daily 9 AM checks)
└── Twilio Integration (SMS sending)

Hosted on: Railway (Free/Pro)
Technology: Node.js 18, Express, node-cron
Access: https://your-app.up.railway.app
```

### SMS Service (Twilio)
```
Third-party SMS API
├── Account SID (authentication)
├── Auth Token (security)
└── Phone Number (sender ID)

Cost: ~$0.0075 per SMS
Free trial: $15 credit
```

---

## Data Flow Diagrams

### 1. Adding a Client

```
User (Studio Owner)
    │
    ▼
[Frontend Form]
    │
    │ HTTPS POST /api/clients
    ▼
[Backend API]
    │
    ├─► [Save to SQLite]
    │   └─► clients table
    │
    └─► [Create Payment Record]
        └─► payments table (status: pending)
            │
            ▼
        [Response 200 OK]
            │
            ▼
        [Frontend Updates]
```

### 2. Automated SMS Flow

```
┌──────────────────────────────────────────────────────────┐
│  Daily at 9:00 AM (Cron Scheduler)                       │
└──────────────────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Check Database       │
        │  for Missed Payments  │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Find payments where: │
        │  - status = pending   │
        │  - due_date = yesterday│
        │  - sms_sent = 0       │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  For each payment:    │
        │  1. Format message    │
        │  2. Call Twilio API   │
        │  3. Send SMS          │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Update Database      │
        │  sms_sent = 1         │
        └───────────────────────┘
                    │
                    ▼
            [Client Receives SMS]
```

### 3. Marking Payment as Paid

```
User Clicks "Mark Paid"
    │
    ▼
[Frontend]
    │
    │ PUT /api/payments/:id/mark-paid
    ▼
[Backend API]
    │
    ├─► [Update Current Payment]
    │   └─► status = 'paid'
    │       payment_date = today
    │
    └─► [Create Next Month Payment]
        └─► New record with:
            - client_id (same)
            - amount (same)
            - due_date (next month)
            - status = 'pending'
            - sms_sent = 0
            │
            ▼
        [Response 200 OK]
            │
            ▼
        [Frontend Refreshes Data]
```

---

## Database Schema

### Table: programs
```sql
┌────┬─────────────────┬────────┬─────────────┐
│ id │      name       │ price  │ created_at  │
├────┼─────────────────┼────────┼─────────────┤
│ 1  │ Personal Train. │ 150.00 │ 2024-11-... │
│ 2  │ Group Classes   │  99.00 │ 2024-11-... │
│ 3  │ Yoga            │  79.00 │ 2024-11-... │
└────┴─────────────────┴────────┴─────────────┘
```

### Table: clients
```sql
┌────┬────────────┬──────────────┬────────────┬────────────┬──────────┐
│ id │    name    │    phone     │ program_id │ payment_   │ due_date │
│    │            │              │            │ amount     │          │
├────┼────────────┼──────────────┼────────────┼────────────┼──────────┤
│ 1  │ John Doe   │ +1234567890  │     1      │   150.00   │    5     │
│ 2  │ Jane Smith │ +1987654321  │     2      │    99.00   │   10     │
└────┴────────────┴──────────────┴────────────┴────────────┴──────────┘

due_date = Day of month (1-31)
```

### Table: payments
```sql
┌────┬───────────┬──────────────┬────────┬─────────┬────────────┬──────────┐
│ id │ client_id │ payment_date │ amount │ status  │  due_date  │ sms_sent │
├────┼───────────┼──────────────┼────────┼─────────┼────────────┼──────────┤
│ 1  │     1     │  2024-11-07  │ 150.00 │ paid    │ 2024-11-05 │    0     │
│ 2  │     1     │  2024-11-07  │ 150.00 │ pending │ 2024-12-05 │    0     │
│ 3  │     2     │  2024-11-01  │  99.00 │ pending │ 2024-11-10 │    0     │
└────┴───────────┴──────────────┴────────┴─────────┴────────────┴──────────┘

status: 'pending' | 'paid'
sms_sent: 0 (not sent) | 1 (sent)
```

---

## API Endpoints

### Programs API
```
GET    /api/programs              → List all programs
POST   /api/programs              → Create new program
DELETE /api/programs/:id          → Delete program
```

### Clients API
```
GET    /api/clients               → List all clients
POST   /api/clients               → Create new client
PUT    /api/clients/:id           → Update client
DELETE /api/clients/:id           → Delete client
```

### Payments API
```
GET    /api/payments               → List all payments
GET    /api/payments/current-month → Current month only
PUT    /api/payments/:id/mark-paid → Mark as paid + create next
```

### Dashboard API
```
GET    /api/dashboard/stats       → Monthly statistics
```

### Health Check
```
GET    /health                    → System health status
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. HTTPS Encryption (TLS)                              │
│     └─► All data encrypted in transit                   │
│                                                          │
│  2. CORS Protection                                      │
│     └─► Only allowed origins can access API             │
│                                                          │
│  3. Environment Variables                                │
│     └─► Secrets not in code                             │
│                                                          │
│  4. No Password Storage                                  │
│     └─► Payment tracking only, no CC processing         │
│                                                          │
│  5. Twilio Authentication                                │
│     └─► Account SID + Auth Token                        │
│                                                          │
│  6. Input Validation                                     │
│     └─► Server-side checks on all inputs                │
│                                                          │
└─────────────────────────────────────────────────────────┘

Environment Variables (Hidden):
├── TWILIO_ACCOUNT_SID     ← Never in code
├── TWILIO_AUTH_TOKEN      ← Never in code
├── TWILIO_PHONE_NUMBER    ← Never in code
└── DATABASE_PATH          ← Configurable
```

---

## Deployment Architecture

### Development Environment
```
Laptop/Desktop
├── Frontend → localhost:3000
├── Backend  → localhost:3001
└── Database → ./fitness_payments.db
```

### Production Environment
```
Internet
    │
    ├─► Vercel (Global CDN)
    │   └─► React Frontend (Static Files)
    │       └─► https://your-app.vercel.app
    │
    └─► Railway (Cloud Server)
        └─► Node.js Backend + SQLite
            └─► https://your-app.up.railway.app
                │
                └─► Twilio API (SMS)
                    └─► SMS to clients
```

### Communication Flow
```
Browser
    │ HTTPS
    ▼
Vercel CDN (Frontend)
    │ HTTPS API Calls
    ▼
Railway Server (Backend)
    │ HTTPS API Calls
    ▼
Twilio API (SMS)
    │ SMS Protocol
    ▼
Client's Phone
```

---

## Automation Architecture

### Cron Scheduler
```
┌──────────────────────────────────────────────┐
│  node-cron Module                             │
├──────────────────────────────────────────────┤
│                                               │
│  Schedule: '0 9 * * *'                       │
│  Translation: "At 9:00 AM every day"         │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │  Cron Expression Breakdown:            │  │
│  │  0  → Minute (0-59)                    │  │
│  │  9  → Hour (0-23)                      │  │
│  │  *  → Day of month (any)               │  │
│  │  *  → Month (any)                      │  │
│  │  *  → Day of week (any)                │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  Execution:                                   │
│  ├─► Query database                          │
│  ├─► Find missed payments                    │
│  ├─► Send SMS via Twilio                     │
│  └─► Update database                         │
│                                               │
└──────────────────────────────────────────────┘
```

### Alternative Schedules
```
Every hour:        '0 * * * *'
Every 30 minutes:  '*/30 * * * *'
Twice daily:       '0 9,18 * * *'  (9 AM and 6 PM)
Weekdays only:     '0 9 * * 1-5'   (9 AM Mon-Fri)
```

---

## Scaling Architecture

### Current Capacity
```
Railway Free Tier:
├── 500 hours/month (enough for 24/7)
├── 512 MB RAM
├── 1 GB disk
└── Suitable for: 1-100 clients

Vercel Free Tier:
├── 100 GB bandwidth/month
├── Unlimited requests
└── Suitable for: 1-1000+ users
```

### Growth Path
```
0-100 clients → Free tier
    │
    ▼
100-500 clients → Railway Hobby ($5/mo)
    │
    ▼
500+ clients → Railway Pro ($20/mo)
                + PostgreSQL
                + Backup strategy
```

---

## Data Flow: Complete User Journey

### Onboarding
```
1. Studio owner deploys app
2. Sets up Twilio credentials
3. Adds fitness programs
4. Adds clients
5. System ready!
```

### Monthly Cycle
```
Day 1: Payment due
    │
    ▼
Day 1 at 9 PM: Client hasn't paid yet
    │
    ▼
Day 2 at 9 AM: Automated check
    │
    ├─► Found missed payment
    ├─► Send SMS to client
    └─► Mark SMS as sent
    │
    ▼
Day 2 at 10 AM: Client receives SMS
    │
    ▼
Day 3: Client makes payment
    │
    ▼
Day 3: Studio owner marks as "Paid"
    │
    ├─► Current payment marked paid
    └─► Next month payment auto-created
    │
    ▼
Next month: Cycle repeats
```

---

## Error Handling Architecture

### Frontend Errors
```
Network Error
    │
    ▼
[Try-Catch Block]
    │
    ├─► Log to console
    ├─► Show user-friendly message
    └─► Retry button
```

### Backend Errors
```
Database Error / Twilio Error
    │
    ▼
[Error Handling Middleware]
    │
    ├─► Log to Railway logs
    ├─► Return proper HTTP status
    └─► Send error response
```

### SMS Errors
```
Twilio API Failure
    │
    ▼
[SMS Send Function]
    │
    ├─► Catch error
    ├─► Log details
    ├─► Don't mark as sent
    └─► Retry next day
```

---

## Monitoring & Logging

### What Gets Logged
```
Backend (Railway Logs):
├── API requests
├── Database operations
├── SMS sending status
├── Cron job execution
├── Errors and exceptions
└── Health check pings

Frontend (Vercel Logs):
├── Build process
├── Page loads
├── API call failures
└── Console errors
```

### How to Access
```
Railway:
1. Dashboard → Project
2. Deployments → Latest
3. View Logs

Vercel:
1. Dashboard → Project
2. Functions → Logs
3. Filter by time
```

---

## Backup Strategy

### What to Backup
```
Critical Data:
└── fitness_payments.db (SQLite database)
    ├── All clients
    ├── All programs
    └── All payment history
```

### Backup Methods
```
Manual:
1. Railway → Data tab
2. Download database file
3. Store in Google Drive/Dropbox

Automated (Advanced):
1. Create backup endpoint
2. Schedule with GitHub Actions
3. Upload to cloud storage
```

---

**This architecture provides:**
✅ Scalability (starts free, grows as needed)
✅ Reliability (cloud hosting)
✅ Security (encrypted, no stored secrets)
✅ Automation (cron scheduling)
✅ Simplicity (easy to understand)

**Perfect for fitness studios of any size!** 💪
