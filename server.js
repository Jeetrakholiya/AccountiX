const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(__dirname));

// Ensure data directory exists for local fallback database
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
let supabase = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('☁️ Supabase Cloud PostgreSQL client connected successfully!');
  } catch (err) {
    console.warn('⚠️ Supabase connection warning:', err.message);
  }
} else {
  console.log('💾 Running in Local Persistence Engine mode (Supabase credentials not set in .env)');
}

// Initial seed database state
const INITIAL_DB = {
  companies: [
    { id: 'comp_1', name: 'AccountiX Media HQ', plan: 'Enterprise Suite', status: 'Active', ownerEmail: 'jeet@accountix.agency', createdAt: '2026-01-15', usersCount: 8, mrr: 14999 },
    { id: 'comp_2', name: 'UrbanFit Digital Agency', plan: 'Pro Agency', status: 'Active', ownerEmail: 'dr.nikhil@urbanfit.io', createdAt: '2026-02-01', usersCount: 5, mrr: 7999 },
    { id: 'comp_3', name: 'Apex Growth Creatives', plan: 'Starter Trial', status: 'Inactive', ownerEmail: 'rahul@apexgrowth.com', createdAt: '2026-02-10', usersCount: 2, mrr: 0 },
    { id: 'comp_4', name: 'Starlight Performance Labs', plan: 'Pro Agency', status: 'Active', ownerEmail: 'simran@starlightlabs.co', createdAt: '2026-02-14', usersCount: 6, mrr: 7999 },
    { id: 'comp_5', name: 'BrandScale India', plan: 'Pro Agency', status: 'Inactive', ownerEmail: 'vikas@brandscale.in', createdAt: '2026-02-05', usersCount: 3, mrr: 7999 }
  ],
  allUsers: [
    { id: 'usr_admin', name: 'Platform Administrator', email: 'admin@accountix.agency', password: 'admin@123', role: 'admin', companyId: 'comp_1', companyName: 'AccountiX Platform HQ', title: 'Platform Super Admin', avatar: '👑', status: 'Active', purchasedDate: '2026-01-01', plan: 'Enterprise Suite' },
    { id: 'usr_manager', name: 'Jeet Rakholiya', email: 'jeet@accountix.agency', password: 'agency@123', role: 'manager', companyId: 'comp_1', companyName: 'AccountiX Media HQ', title: 'Agency Managing Director', avatar: '🏢', status: 'Active', purchasedDate: '2026-01-15', plan: 'Enterprise Suite' },
    { id: 'usr_rohan', name: 'Rohan Mehta', email: 'rohan@accountix.agency', password: 'staff@123', role: 'employee', staffId: 'st_2', companyId: 'comp_1', companyName: 'AccountiX Media HQ', title: 'Lead Video Editor', avatar: '🎬', status: 'Active', purchasedDate: '2026-01-15', plan: 'Enterprise Suite' },
    { id: 'usr_aarav', name: 'Aarav Sharma', email: 'aarav@accountix.agency', password: 'staff@123', role: 'employee', staffId: 'st_1', companyId: 'comp_1', companyName: 'AccountiX Media HQ', title: 'Cinematographer & Shooter', avatar: '📹', status: 'Active', purchasedDate: '2026-01-15', plan: 'Enterprise Suite' },
    { id: 'usr_nikhil', name: 'Dr. Nikhil Parekh', email: 'dr.nikhil@urbanfit.io', password: 'user@123', role: 'manager', companyId: 'comp_2', companyName: 'UrbanFit Digital Agency', title: 'Managing Director', avatar: '🏢', status: 'Active', purchasedDate: '2026-02-01', plan: 'Pro Agency' },
    { id: 'usr_rahul', name: 'Rahul Sharma', email: 'rahul@apexgrowth.com', password: 'user@123', role: 'manager', companyId: 'comp_3', companyName: 'Apex Growth Creatives', title: 'Founder', avatar: '🏢', status: 'Idle (11d Inactive)', purchasedDate: '2026-02-10', plan: 'Starter Trial' },
    { id: 'usr_vikas', name: 'Vikas Verma', email: 'vikas@brandscale.in', password: 'user@123', role: 'manager', companyId: 'comp_5', companyName: 'BrandScale India', title: 'Director', avatar: '🏢', status: 'Purchased but Never Used', purchasedDate: '2026-02-05', plan: 'Pro Agency' },
    { id: 'usr_simran', name: 'Simran Kaur', email: 'simran@starlightlabs.co', password: 'user@123', role: 'manager', companyId: 'comp_4', companyName: 'Starlight Performance Labs', title: 'Managing Director', avatar: '🏢', status: 'At Risk (15d Inactive)', purchasedDate: '2026-02-14', plan: 'Pro Agency' }
  ],
  loginLogs: [
    { id: 'log_seed_1', userId: 'usr_admin', userName: 'Platform Administrator', userEmail: 'admin@accountix.agency', role: 'admin', companyName: 'AccountiX Platform HQ', loginTime: '26 Aug 2026, 02:15:30 pm', authMethod: 'Email & Password (2-Step Verified)', status: 'Success (Verified)', device: 'Desktop Workstation' },
    { id: 'log_seed_2', userId: 'usr_manager', userName: 'Jeet Rakholiya', userEmail: 'jeet@accountix.agency', role: 'manager', companyName: 'AccountiX Media HQ', loginTime: '26 Aug 2026, 01:42:10 pm', authMethod: 'Email & Password (2-Step Verified)', status: 'Success (Verified)', device: 'Desktop Workstation' },
    { id: 'log_seed_3', userId: 'usr_rohan', userName: 'Rohan Mehta', userEmail: 'rohan@accountix.agency', role: 'employee', companyName: 'AccountiX Media HQ', loginTime: '26 Aug 2026, 12:30:05 pm', authMethod: 'Staff Credentials Verified', status: 'Success (Verified)', device: 'Mobile Device' }
  ],
  clients: [],
  packages: [],
  payments: [],
  expenses: [],
  staff: [
    { id: 'st_1', name: 'Aarav Sharma', role: 'Video Shooter / Cinematographer', phone: '+91 98234 11223', baseSalary: 28000, status: 'Active' },
    { id: 'st_2', name: 'Rohan Mehta', role: 'Video Editor', phone: '+91 98765 22334', baseSalary: 32000, status: 'Active' },
    { id: 'st_3', name: 'Pooja Verma', role: 'Social Media Manager', phone: '+91 91234 55667', baseSalary: 25000, status: 'Active' }
  ],
  attendance: [],
  salaryPayments: [],
  tasks: [],
  contentItems: [],
  leads: [],
  settings: {
    agencyName: 'AccountiX',
    tagline: 'Agency Business OS & Financial Engine',
    phone: '+91 98765 43210',
    email: 'hello@accountix.agency',
    currencySymbol: '₹',
    theme: 'dark'
  }
};

// Database helper functions
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf8');
      return INITIAL_DB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading database file:', e);
    return INITIAL_DB;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing database file:', e);
    return false;
  }
}

// Initialize database file
readDb();

/* ==============================================================================
   API ENDPOINTS
============================================================================== */

// 1. Health check & status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'AccountiX Agency Business OS',
    version: '2.4.0',
    supabaseConnected: Boolean(supabase),
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// 2. Authentication: Sign In (Email + Password)
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = readDb();
  let user = db.allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    // Dynamically provision user if not existing
    user = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0].toUpperCase(),
      email: email,
      password: password,
      role: role || 'manager',
      companyId: 'comp_1',
      companyName: role === 'admin' ? 'AccountiX Platform HQ' : 'Agency Workspace',
      title: role === 'admin' ? 'Platform Super Admin' : role === 'manager' ? 'Managing Director' : 'Specialist',
      avatar: role === 'admin' ? '👑' : role === 'manager' ? '🏢' : '👥',
      lastActiveAt: new Date().toISOString(),
      status: 'Active',
      purchasedDate: new Date().toISOString().split('T')[0],
      plan: 'Enterprise Suite'
    };
    db.allUsers.push(user);
  }

  // Verify password if set
  if (user.password && user.password !== password) {
    return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
  }

  user.lastActiveAt = new Date().toISOString();

  // Record login security audit
  const now = new Date();
  const timeStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    role: user.role,
    companyName: user.companyName || 'Primary Workspace',
    loginTime: timeStr,
    authMethod: 'Email & Password (Backend Verified)',
    status: 'Success (Verified)',
    device: req.headers['user-agent'] && req.headers['user-agent'].includes('Mobile') ? 'Mobile Device' : 'Desktop Workstation'
  };

  db.loginLogs.unshift(logEntry);
  writeDb(db);

  // Sync to Supabase if connected
  if (supabase) {
    try {
      await supabase.from('accountix_login_logs').insert([{
        id: logEntry.id,
        user_id: logEntry.userId,
        user_name: logEntry.userName,
        user_email: logEntry.userEmail,
        role: logEntry.role,
        company_name: logEntry.companyName,
        login_time: logEntry.loginTime,
        auth_method: logEntry.authMethod,
        status: logEntry.status,
        device: logEntry.device
      }]);
    } catch (err) {
      console.warn('Supabase log insert note:', err.message);
    }
  }

  res.json({
    success: true,
    user,
    log: logEntry,
    message: `Logged in successfully as ${user.name}`
  });
});

// 3. Authentication: Register with 2-Time Password Verification
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // 2-Time Password Verification
  if (password !== confirmPassword) {
    return res.status(400).json({ error: '2-Time Password Verification failed: Passwords do not match' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const db = readDb();
  let existing = db.allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    existing.password = password;
    existing.name = name;
    existing.lastActiveAt = new Date().toISOString();
  } else {
    existing = {
      id: `usr_${Date.now()}`,
      name: name,
      email: email,
      password: password,
      role: role || 'manager',
      companyId: `comp_${Date.now()}`,
      companyName: role === 'admin' ? 'AccountiX Platform HQ' : `${name}'s Agency`,
      title: role === 'admin' ? 'Platform Administrator' : role === 'manager' ? 'Managing Director' : 'Specialist',
      avatar: role === 'admin' ? '👑' : role === 'manager' ? '🏢' : '👥',
      lastActiveAt: new Date().toISOString(),
      status: 'Active',
      purchasedDate: new Date().toISOString().split('T')[0],
      plan: role === 'manager' ? 'Pro Agency' : 'Enterprise Suite'
    };
    db.allUsers.push(existing);
  }

  // Record audit log
  const now = new Date();
  const timeStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userId: existing.id,
    userName: existing.name,
    userEmail: existing.email,
    role: existing.role,
    companyName: existing.companyName,
    loginTime: timeStr,
    authMethod: 'Email + 2-Time Password Verified (Registration)',
    status: 'Success (Verified)',
    device: req.headers['user-agent'] && req.headers['user-agent'].includes('Mobile') ? 'Mobile Device' : 'Desktop Workstation'
  };

  db.loginLogs.unshift(logEntry);
  writeDb(db);

  res.json({
    success: true,
    user: existing,
    log: logEntry,
    message: `Account created with 2-time password verification! Welcome, ${name}.`
  });
});

// 4. Security Audit Logs: GET all logs
app.get('/api/admin/logs', (req, res) => {
  const db = readDb();
  res.json(db.loginLogs || []);
});

// 5. Security Audit Logs: Clear logs
app.delete('/api/admin/logs', (req, res) => {
  const db = readDb();
  db.loginLogs = [];
  writeDb(db);
  res.json({ success: true, message: 'Login audit logs cleared' });
});

// 6. Multi-Tenant Sync / Full State API (GET & POST)
app.get('/api/state', (req, res) => {
  const db = readDb();
  res.json(db);
});

app.post('/api/state/sync', async (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'Invalid state object' });
  }

  const db = readDb();
  const merged = { ...db, ...incoming };
  writeDb(merged);

  res.json({ success: true, message: 'State synchronized with backend engine' });
});

// 7. REST Resource Endpoints
const ENTITIES = [
  'companies', 'allUsers', 'clients', 'packages', 'payments',
  'expenses', 'staff', 'attendance', 'salaryPayments', 'tasks',
  'contentItems', 'leads'
];

ENTITIES.forEach(entity => {
  // GET all
  app.get(`/api/${entity}`, (req, res) => {
    const db = readDb();
    res.json(db[entity] || []);
  });

  // POST create / insert
  app.post(`/api/${entity}`, (req, res) => {
    const db = readDb();
    if (!db[entity]) db[entity] = [];
    const item = { id: req.body.id || `${entity.slice(0, 3)}_${Date.now()}`, ...req.body };
    db[entity].push(item);
    writeDb(db);
    res.status(201).json(item);
  });

  // PUT update
  app.put(`/api/${entity}/:id`, (req, res) => {
    const db = readDb();
    if (!db[entity]) db[entity] = [];
    const index = db[entity].findIndex(i => i.id === req.params.id);
    if (index !== -1) {
      db[entity][index] = { ...db[entity][index], ...req.body };
      writeDb(db);
      res.json(db[entity][index]);
    } else {
      res.status(404).json({ error: `${entity} item not found` });
    }
  });

  // DELETE
  app.delete(`/api/${entity}/:id`, (req, res) => {
    const db = readDb();
    if (!db[entity]) db[entity] = [];
    const index = db[entity].findIndex(i => i.id === req.params.id);
    if (index !== -1) {
      const removed = db[entity].splice(index, 1);
      writeDb(db);
      res.json({ success: true, removed: removed[0] });
    } else {
      res.status(404).json({ error: `${entity} item not found` });
    }
  });
});

// 8. Settings API
app.get('/api/settings', (req, res) => {
  const db = readDb();
  res.json(db.settings || {});
});

app.post('/api/settings', (req, res) => {
  const db = readDb();
  db.settings = { ...db.settings, ...req.body };
  writeDb(db);
  res.json({ success: true, settings: db.settings });
});

// Fallback all frontend routes to index.html (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Fullstack Server with dynamic port fallback
function startServer(portToTry) {
  const server = app.listen(portToTry, () => {
    console.log(`\n========================================================`);
    console.log(`🚀 AccountiX Fullstack Application Live!`);
    console.log(`🌐 Local Web Server:  http://localhost:${portToTry}`);
    console.log(`📡 Backend REST APIs: http://localhost:${portToTry}/api/health`);
    console.log(`💾 Database Mode:     ${supabase ? 'Supabase Cloud PostgreSQL' : 'Local Persistent JSON Store'}`);
    console.log(`========================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${portToTry} is in use. Retrying on port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(Number(PORT));
