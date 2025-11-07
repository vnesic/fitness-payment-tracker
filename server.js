const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const cron = require('node-cron');
const twilio = require('twilio');
const path = require('path');

const app = express();

// CORS configuration - Allow all origins in development, specific origins in production
const isDevelopment = process.env.NODE_ENV !== 'production';

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (isDevelopment) {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001'
    ].filter(Boolean); // Remove any undefined values
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      console.log('⚠️  CORS blocked origin:', origin);
      callback(null, true); // Allow anyway but log it
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize SQLite database
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'fitness_payments.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

// Create tables if they don't exist
function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      program_id INTEGER NOT NULL,
      payment_amount REAL NOT NULL,
      due_date INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (program_id) REFERENCES programs(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      payment_date DATE NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      due_date DATE NOT NULL,
      sms_sent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )
  `);
  
  console.log('Database tables initialized');
}

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let twilioClient;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  console.log('Twilio client initialized');
} else {
  console.log('Twilio not configured - running in mock mode');
}

// Send SMS function
async function sendSMS(to, message) {
  if (!twilioClient) {
    console.log('📱 MOCK SMS to:', to, '| Message:', message);
    return true;
  }
  
  try {
    await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: to
    });
    console.log('✅ SMS sent to:', to);
    return true;
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    return false;
  }
}

// Check for missed payments and send SMS (runs daily at 9 AM)
cron.schedule('0 9 * * *', async () => {
  console.log('🔍 Checking for missed payments...');
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  db.all(`
    SELECT p.id as payment_id, p.client_id, p.due_date, p.amount, p.sms_sent,
           c.name, c.phone
    FROM payments p
    JOIN clients c ON p.client_id = c.id
    WHERE p.status = 'pending' 
    AND p.due_date = ?
    AND p.sms_sent = 0
  `, [yesterday], async (err, rows) => {
    if (err) {
      console.error('Error checking missed payments:', err);
      return;
    }
    
    console.log(`Found ${rows.length} missed payments to process`);
    
    for (const row of rows) {
      const message = `Hi ${row.name}, this is a reminder that your payment of $${row.amount} was due yesterday. Please make your payment at your earliest convenience. Thank you!`;
      
      const sent = await sendSMS(row.phone, message);
      
      if (sent) {
        // Mark SMS as sent
        db.run('UPDATE payments SET sms_sent = 1 WHERE id = ?', [row.payment_id]);
        console.log(`✅ Processed payment reminder for ${row.name}`);
      }
    }
  });
});

// ===== API ROUTES =====

// Programs
app.get('/api/programs', (req, res) => {
  db.all('SELECT * FROM programs ORDER BY name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/programs', (req, res) => {
  const { name, price } = req.body;
  db.run('INSERT INTO programs (name, price) VALUES (?, ?)', [name, price], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ id: this.lastID, name, price });
    }
  });
});

app.delete('/api/programs/:id', (req, res) => {
  db.run('DELETE FROM programs WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ deleted: this.changes });
    }
  });
});

// Clients
app.get('/api/clients', (req, res) => {
  db.all(`
    SELECT c.*, p.name as program_name 
    FROM clients c
    JOIN programs p ON c.program_id = p.id
    ORDER BY c.name
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/clients', (req, res) => {
  const { name, phone, program_id, payment_amount, due_date } = req.body;
  
  db.run(
    'INSERT INTO clients (name, phone, program_id, payment_amount, due_date) VALUES (?, ?, ?, ?, ?)',
    [name, phone, program_id, payment_amount, due_date],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        // Create first payment record
        const clientId = this.lastID;
        const today = new Date();
        const dueDate = new Date(today.getFullYear(), today.getMonth(), due_date);
        
        db.run(
          'INSERT INTO payments (client_id, payment_date, amount, due_date, status) VALUES (?, ?, ?, ?, ?)',
          [clientId, today.toISOString().split('T')[0], payment_amount, dueDate.toISOString().split('T')[0], 'pending'],
          (err2) => {
            if (err2) {
              console.error('Error creating initial payment:', err2);
            }
          }
        );
        
        res.json({ id: clientId, name, phone, program_id, payment_amount, due_date });
      }
    }
  );
});

app.put('/api/clients/:id', (req, res) => {
  const { name, phone, program_id, payment_amount, due_date } = req.body;
  
  db.run(
    'UPDATE clients SET name = ?, phone = ?, program_id = ?, payment_amount = ?, due_date = ? WHERE id = ?',
    [name, phone, program_id, payment_amount, due_date, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ updated: this.changes });
      }
    }
  );
});

app.delete('/api/clients/:id', (req, res) => {
  db.run('DELETE FROM clients WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ deleted: this.changes });
    }
  });
});

// Payments
app.get('/api/payments', (req, res) => {
  db.all(`
    SELECT p.*, c.name as client_name, c.phone, pr.name as program_name
    FROM payments p
    JOIN clients c ON p.client_id = c.id
    JOIN programs pr ON c.program_id = pr.id
    ORDER BY p.due_date DESC
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.get('/api/payments/current-month', (req, res) => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  db.all(`
    SELECT p.*, c.name as client_name, c.phone, pr.name as program_name
    FROM payments p
    JOIN clients c ON p.client_id = c.id
    JOIN programs pr ON c.program_id = pr.id
    WHERE p.due_date BETWEEN ? AND ?
    ORDER BY p.due_date ASC
  `, [firstDay, lastDay], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.put('/api/payments/:id/mark-paid', (req, res) => {
  db.run(
    'UPDATE payments SET status = ?, payment_date = ? WHERE id = ?',
    ['paid', new Date().toISOString().split('T')[0], req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        // Get client info to create next month's payment
        db.get('SELECT * FROM payments WHERE id = ?', [req.params.id], (err2, payment) => {
          if (!err2 && payment) {
            db.get('SELECT * FROM clients WHERE id = ?', [payment.client_id], (err3, client) => {
              if (!err3 && client) {
                // Create next month's payment
                const nextDueDate = new Date(payment.due_date);
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                
                db.run(
                  'INSERT INTO payments (client_id, payment_date, amount, due_date, status) VALUES (?, ?, ?, ?, ?)',
                  [
                    client.id,
                    new Date().toISOString().split('T')[0],
                    client.payment_amount,
                    nextDueDate.toISOString().split('T')[0],
                    'pending'
                  ],
                  (err4) => {
                    if (err4) {
                      console.error('Error creating next payment:', err4);
                    }
                  }
                );
              }
            });
          }
        });
        
        res.json({ updated: this.changes });
      }
    }
  );
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  db.get(`
    SELECT 
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
      SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_received,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending
    FROM payments
    WHERE due_date BETWEEN ? AND ?
  `, [firstDay, lastDay], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(row);
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Twilio configured: ${twilioClient ? 'Yes' : 'No (mock mode)'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
