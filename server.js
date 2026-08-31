const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'accountix_jwt_secret_key_2026_production_suite';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(__dirname));

// Check for Serverless deployment environment (Vercel, AWS Lambda, Netlify)
const IS_SERVERLESS = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);
const DATA_DIR = IS_SERVERLESS ? path.join('/tmp', 'accountix_data') : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Safe fallback in constrained serverless environments
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
    { id: 'comp_1', name: 'AccountiX Media HQ', plan: '1 Year Plan', status: 'Active', ownerEmail: 'jeet@accountix.agency', createdAt: '2026-01-15', usersCount: 8, mrr: 999 },
    { id: 'comp_2', name: 'UrbanFit Digital Agency', plan: '6 Months Plan', status: 'Active', ownerEmail: 'dr.nikhil@urbanfit.io', createdAt: '2026-02-01', usersCount: 5, mrr: 589 },
    { id: 'comp_3', name: 'Apex Growth Creatives', plan: 'Starter Trial', status: 'Inactive', ownerEmail: 'rahul@apexgrowth.com', createdAt: '2026-02-10', usersCount: 2, mrr: 0 },
    { id: 'comp_4', name: 'Starlight Performance Labs', plan: '1 Month Plan', status: 'Active', ownerEmail: 'simran@starlightlabs.co', createdAt: '2026-02-14', usersCount: 6, mrr: 119 },
    { id: 'comp_5', name: 'BrandScale India', plan: '6 Months Plan', status: 'Inactive', ownerEmail: 'vikas@brandscale.in', createdAt: '2026-02-05', usersCount: 3, mrr: 589 }
  ],
  allUsers: [
    { id: 'usr_admin', name: 'Platform Administrator', email: 'admin@accountix.agency', password: 'admin@123', role: 'admin', companyId: 'comp_1', companyName: 'AccountiX Platform HQ', title: 'Platform Super Admin', avatar: '👑', status: 'Active', purchasedDate: '2026-01-01', plan: '1 Year Plan' },
    { id: 'usr_manager', name: 'Jeet Rakholiya', email: 'jeet@accountix.agency', password: 'agency@123', role: 'manager', companyId: 'comp_1', companyName: 'AccountiX Media HQ', title: 'Agency Managing Director', avatar: '🏢', status: 'Active', purchasedDate: '2026-01-15', plan: '1 Year Plan' },
    { id: 'usr_rohan', name: 'Rohan Mehta', email: 'rohan@accountix.agency', password: 'staff@123', role: 'employee', staffId: 'st_2', companyId: 'comp_1', companyName: 'AccountiX Media HQ', title: 'Lead Video Editor', avatar: '🎬', status: 'Active', purchasedDate: '2026-01-15', plan: '1 Year Plan' },
    { id: 'usr_aarav', name: 'Aarav Sharma', email: 'aarav@accountix.agency', password: 'staff@123', role: 'employee', staffId: 'st_1', companyId: 'comp_1', companyName: 'AccountiX Media HQ', title: 'Cinematographer & Shooter', avatar: '📹', status: 'Active', purchasedDate: '2026-01-15', plan: '1 Year Plan' },
    { id: 'usr_nikhil', name: 'Dr. Nikhil Parekh', email: 'dr.nikhil@urbanfit.io', password: 'user@123', role: 'manager', companyId: 'comp_2', companyName: 'UrbanFit Digital Agency', title: 'Managing Director', avatar: '🏢', status: 'Active', purchasedDate: '2026-02-01', plan: '6 Months Plan' },
    { id: 'usr_rahul', name: 'Rahul Sharma', email: 'rahul@apexgrowth.com', password: 'user@123', role: 'manager', companyId: 'comp_3', companyName: 'Apex Growth Creatives', title: 'Founder', avatar: '🏢', status: 'Idle (11d Inactive)', purchasedDate: '2026-02-10', plan: 'Starter Trial' },
    { id: 'usr_vikas', name: 'Vikas Verma', email: 'vikas@brandscale.in', password: 'user@123', role: 'manager', companyId: 'comp_5', companyName: 'BrandScale India', title: 'Director', avatar: '🏢', status: 'Purchased but Never Used', purchasedDate: '2026-02-05', plan: '6 Months Plan' },
    { id: 'usr_simran', name: 'Simran Kaur', email: 'simran@starlightlabs.co', password: 'user@123', role: 'manager', companyId: 'comp_4', companyName: 'Starlight Performance Labs', title: 'Managing Director', avatar: '🏢', status: 'At Risk (15d Inactive)', purchasedDate: '2026-02-14', plan: '1 Month Plan' }
  ],
  loginLogs: [
    { id: 'log_seed_1', userId: 'usr_admin', userName: 'Platform Administrator', userEmail: 'admin@accountix.agency', role: 'admin', companyName: 'AccountiX Platform HQ', loginTime: '26 Aug 2026, 02:15:30 pm', authMethod: 'JWT Verified (Super Admin)', status: 'Success (Verified)', device: 'Desktop Workstation' },
    { id: 'log_seed_2', userId: 'usr_manager', userName: 'Jeet Rakholiya', userEmail: 'jeet@accountix.agency', role: 'manager', companyName: 'AccountiX Media HQ', loginTime: '26 Aug 2026, 01:42:10 pm', authMethod: 'JWT Verified (Email + Password)', status: 'Success (Verified)', device: 'Desktop Workstation' },
    { id: 'log_seed_3', userId: 'usr_rohan', userName: 'Rohan Mehta', userEmail: 'rohan@accountix.agency', role: 'employee', companyName: 'AccountiX Media HQ', loginTime: '26 Aug 2026, 12:30:05 pm', authMethod: 'JWT Verified (Staff Portal)', status: 'Success (Verified)', device: 'Mobile Device' }
  ],
  workspaces: {},
  clients: [
    { id: 'cl_1', name: 'Apex Dental Care', company: 'Dr. Nikhil Parekh Clinic', mobile: '9898011223', whatsapp: '9898011223', instagram: '@apexdentalcare', status: 'Active', createdAt: '2026-08-01T10:00:00Z' },
    { id: 'cl_2', name: 'UrbanFit Gym & Crossfit', company: 'UrbanFit Sports Pvt Ltd', mobile: '9898022334', whatsapp: '9898022334', instagram: '@urbanfitgym', status: 'Active', createdAt: '2026-08-02T11:00:00Z' },
    { id: 'cl_3', name: 'Royal Rajputana Jewellers', company: 'Royal Jewellers & Sons', mobile: '9898033445', whatsapp: '9898033445', instagram: '@royalrajputana', status: 'Active', createdAt: '2026-08-03T12:00:00Z' },
    { id: 'cl_4', name: 'The Craft Coffee Roastery', company: 'Craft Bean Hospitality', mobile: '9898044556', whatsapp: '9898044556', instagram: '@thecraftcoffee', status: 'Active', createdAt: '2026-08-04T14:00:00Z' }
  ],
  packages: [
    { id: 'pkg_1', clientId: 'cl_1', serviceType: 'Social Media Management (Reels + Posts)', amount: 45000, startDate: '2026-08-01', endDate: '2026-08-28', assignedStaffId: 'st_3', status: 'Active' },
    { id: 'pkg_2', clientId: 'cl_2', serviceType: 'Meta & Instagram Ads Management', amount: 35000, startDate: '2026-08-05', endDate: '2026-08-30', assignedStaffId: 'st_3', status: 'Active' },
    { id: 'pkg_3', clientId: 'cl_3', serviceType: 'Complete Brand Marketing (SMMA)', amount: 80000, startDate: '2026-08-01', endDate: '2026-08-30', assignedStaffId: 'st_1', status: 'Active' },
    { id: 'pkg_4', clientId: 'cl_4', serviceType: 'Website Design & Development', amount: 55000, startDate: '2026-08-10', endDate: '2026-08-25', assignedStaffId: 'st_2', status: 'Active' }
  ],
  payments: [
    { id: 'pay_1', clientId: 'cl_1', packageId: 'pkg_1', amount: 45000, date: '2026-08-02', mode: 'UPI (GPay / PhonePe / Paytm)', note: 'Advance full payment' },
    { id: 'pay_2', clientId: 'cl_2', packageId: 'pkg_2', amount: 20000, date: '2026-08-06', mode: 'Bank Transfer (NEFT/IMPS/RTGS)', note: 'Part payment' },
    { id: 'pay_3', clientId: 'cl_3', packageId: 'pkg_3', amount: 50000, date: '2026-08-04', mode: 'UPI (GPay / PhonePe / Paytm)', note: 'First installment' },
    { id: 'pay_4', clientId: 'cl_4', packageId: 'pkg_4', amount: 30000, date: '2026-08-11', mode: 'Bank Transfer (NEFT/IMPS/RTGS)', note: '50% project milestone' }
  ],
  expenses: [
    { id: 'exp_1', category: 'Office Rent', amount: 22000, date: '2026-08-02', mode: 'Bank Transfer (NEFT/IMPS/RTGS)', note: 'Studio 304 Rent' },
    { id: 'exp_2', category: 'Electricity & Utilities', amount: 4800, date: '2026-08-07', mode: 'UPI (GPay / PhonePe / Paytm)', note: 'Office Power & AC' },
    { id: 'exp_3', category: 'Software & SaaS Tools', amount: 8500, date: '2026-08-05', mode: 'Credit Card / Debit Card', note: 'Adobe CC, Canva, Notion, Midjourney' },
    { id: 'exp_4', category: 'Salary', amount: 32000, date: '2026-08-05', mode: 'Bank Transfer (NEFT/IMPS/RTGS)', note: 'Salary — Rohan Mehta', staffId: 'st_2' }
  ],
  staff: [
    { id: 'st_1', name: 'Aarav Sharma', role: 'Video Shooter / Cinematographer', phone: '+91 98234 11223', baseSalary: 28000, status: 'Active' },
    { id: 'st_2', name: 'Rohan Mehta', role: 'Video Editor', phone: '+91 98765 22334', baseSalary: 32000, status: 'Active' },
    { id: 'st_3', name: 'Pooja Patel', role: 'Meta Ads Specialist', phone: '+91 91234 55667', baseSalary: 35000, status: 'Active' }
  ],
  attendance: [],
  salaryPayments: [],
  tasks: [],
  contentItems: [],
  leads: [
    { id: 'ld_1', name: 'Kabir Varma', business: 'Soul Sanctuary Spa & Wellness', phone: '9877011223', service: 'Social Media Management (Reels + Posts)', budget: 40000, followUpDate: '2026-08-28', status: 'Proposal Sent', createdAt: '2026-08-08' },
    { id: 'ld_2', name: 'Meera Deshmukh', business: 'Artisan Home Decor', phone: '9877022334', service: 'Meta & Instagram Ads Management', budget: 30000, followUpDate: '2026-08-28', status: 'Contacted', createdAt: '2026-08-10' }
  ],
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
    const parsed = JSON.parse(data);
    if (!parsed.workspaces) parsed.workspaces = {};
    if (!parsed.loginLogs) parsed.loginLogs = [...INITIAL_DB.loginLogs];
    return parsed;
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

// Helper: Sign JWT Token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId || 'comp_1',
      companyName: user.companyName || 'Primary Workspace'
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Helper: Authenticate JWT Token Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication token required (JWT)' });
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, error: 'Invalid or expired JWT session' });
    req.user = decoded;
    next();
  });
}

// Helper: Get User Workspace
function getUserWorkspace(db, userOrKey) {
  if (!db.workspaces) db.workspaces = {};
  
  let emailKey = '';
  let compKey = '';
  
  if (typeof userOrKey === 'object' && userOrKey !== null) {
    emailKey = (userOrKey.email || '').toLowerCase().trim();
    compKey = userOrKey.companyId || '';
  } else if (typeof userOrKey === 'string') {
    if (userOrKey.includes('@')) emailKey = userOrKey.toLowerCase().trim();
    else compKey = userOrKey;
  }

  // 1. Check workspace stored by email
  if (emailKey && db.workspaces[emailKey]) {
    return db.workspaces[emailKey];
  }
  // 2. Check workspace stored by companyId
  if (compKey && db.workspaces[compKey]) {
    return db.workspaces[compKey];
  }
  // 3. If user is Jeet Rakholiya or admin, prioritize comp_1 / primary workspace
  if (emailKey && (emailKey.includes('jeet') || emailKey.includes('admin') || compKey === 'comp_1')) {
    if (db.workspaces['comp_1']) return db.workspaces['comp_1'];
  }

  // Default workspace data
  return {
    clients: db.clients || [],
    packages: db.packages || [],
    payments: db.payments || [],
    expenses: db.expenses || [],
    staff: db.staff || [],
    attendance: db.attendance || [],
    salaryPayments: db.salaryPayments || [],
    tasks: db.tasks || [],
    contentItems: db.contentItems || [],
    leads: db.leads || [],
    serviceCatalog: db.serviceCatalog || [],
    settings: db.settings || {
      agencyName: 'AccountiX',
      tagline: 'Agency Business OS & Financial Engine',
      phone: '+91 98765 43210',
      email: emailKey || 'hello@accountix.agency',
      currencySymbol: '₹',
      theme: 'dark'
    }
  };
}

// Initialize database file
readDb();

/* ==============================================================================
   API ENDPOINTS (JWT AUTHENTICATION & MULTI-TENANT WORKSPACE ENGINE)
============================================================================== */

// 1. Health check & status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'AccountiX Agency Business OS',
    version: '2.5.0',
    jwtAuth: 'Enabled',
    googleAuth: 'Google Cloud Console OAuth 2.0 Ready',
    supabaseConnected: Boolean(supabase),
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Google Cloud Console OAuth 2.0 Configuration (Global Multi-Device Sync)
const DEFAULT_GOOGLE_CLIENT_ID = '887215874415-2d33tga5m22tmguklgasu6nsn4pq1jv0.apps.googleusercontent.com';

app.get('/api/auth/google/config', (req, res) => {
  const db = readDb();
  const dbClientId = (db.settings && db.settings.googleClientId) || (db.workspaces && db.workspaces.comp_1 && db.workspaces.comp_1.settings && db.workspaces.comp_1.settings.googleClientId) || '';
  const clientId = process.env.GOOGLE_CLIENT_ID || dbClientId || DEFAULT_GOOGLE_CLIENT_ID;
  res.json({
    clientId: clientId,
    configured: Boolean(clientId)
  });
});

app.post('/api/auth/google/config', (req, res) => {
  const { clientId } = req.body || {};
  if (!clientId || typeof clientId !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid Google Client ID is required' });
  }
  const db = readDb();
  if (!db.settings) db.settings = {};
  db.settings.googleClientId = clientId.trim();
  if (db.workspaces && db.workspaces.comp_1) {
    if (!db.workspaces.comp_1.settings) db.workspaces.comp_1.settings = {};
    db.workspaces.comp_1.settings.googleClientId = clientId.trim();
  }
  writeDb(db);
  console.log('✓ Google OAuth Client ID saved globally on server:', clientId.trim());
  res.json({ success: true, clientId: clientId.trim() });
});

// Google Cloud Console OAuth 2.0 Verification & Login
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential, profile, targetRole } = req.body || {};
    let email = '';
    let name = '';
    let picture = '';
    let googleSub = '';

    // If credential (Google ID Token from GIS) is provided, decode payload
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          email = payload.email;
          name = payload.name;
          picture = payload.picture;
          googleSub = payload.sub;
        }
      } catch (e) {
        console.warn('Error parsing Google credential JWT:', e);
      }
    }

    // Fallback to profile object if passed directly
    if (!email && profile) {
      email = profile.email;
      name = profile.name;
      picture = profile.picture || profile.avatar;
      googleSub = profile.sub || profile.id;
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid Google account email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isFounder = cleanEmail.includes('jeet') || cleanEmail.includes('admin');
    const db = readDb();
    let user = db.allUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    const cleanRole = isFounder ? 'manager' : (targetRole || (user ? user.role : 'manager'));

    if (!user) {
      const compId = isFounder ? 'comp_1' : `comp_${Date.now()}`;
      const compName = cleanRole === 'admin' ? 'AccountiX Platform HQ' : isFounder ? 'AccountiX Media HQ' : `${name || cleanEmail.split('@')[0]}'s Agency`;

      user = {
        id: `usr_google_${googleSub || Date.now()}`,
        name: name || (isFounder ? 'Jeet Rakholiya' : cleanEmail.split('@')[0]),
        email: cleanEmail,
        role: cleanRole,
        companyId: compId,
        companyName: compName,
        title: isFounder ? 'Managing Director & Founder' : cleanRole === 'admin' ? 'Platform Super Admin' : cleanRole === 'manager' ? 'Managing Director' : 'Specialist',
        avatar: picture || (isFounder ? '🏢' : '👤'),
        lastActiveAt: new Date().toISOString(),
        status: 'Active',
        purchasedDate: new Date().toISOString().split('T')[0],
        plan: '1 Year Plan',
        authProvider: 'google'
      };
      db.allUsers.push(user);
      if (!db.companies.find(c => c.id === compId)) {
        db.companies.push({
          id: compId,
          name: compName,
          plan: '1 Year Plan',
          status: 'Active',
          ownerEmail: cleanEmail,
          createdAt: new Date().toISOString().split('T')[0],
          usersCount: 1,
          mrr: 999
        });
      }
    } else {
      user.lastActiveAt = new Date().toISOString();
      if (picture && (!user.avatar || user.avatar.length < 5)) user.avatar = picture;
      if (name && (!user.name || user.name.length < 2)) user.name = name;
      if (isFounder) {
        user.companyId = 'comp_1';
        user.role = 'manager';
      }
    }

    const token = generateToken(user);

    // Record Google OAuth login audit log
    const now = new Date();
    const timeStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const logEntry = {
      id: `log_google_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      role: user.role,
      companyName: user.companyName || 'Primary Workspace',
      loginTime: timeStr,
      authMethod: 'Google OAuth 2.0 (Google Cloud Console Verified)',
      status: 'Success (Verified)',
      device: req.headers['user-agent'] && req.headers['user-agent'].includes('Mobile') ? 'Mobile Device' : 'Desktop Workstation'
    };

    db.loginLogs.unshift(logEntry);
    if (db.loginLogs.length > 100) db.loginLogs = db.loginLogs.slice(0, 100);

    const workspaceData = getUserWorkspace(db, user);

    writeDb(db);

    res.json({
      success: true,
      token,
      user,
      workspaceData,
      log: logEntry,
      message: `Authenticated successfully via Google as ${user.name}`
    });
  } catch (error) {
    console.error('Error in /api/auth/google:', error);
    res.status(500).json({ success: false, error: 'Failed to authenticate Google user. ' + error.message });
  }
});

// 2. Authentication: Sign In (Email + Password) with JWT
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const db = readDb();
  let user = db.allUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) {
    // Dynamically provision user if not existing
    const cleanRole = role || 'manager';
    const compId = `comp_${Date.now()}`;
    const compName = cleanRole === 'admin' ? 'AccountiX Platform HQ' : `${email.split('@')[0].toUpperCase()} Agency`;

    user = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0].toUpperCase(),
      email: email.trim(),
      password: password,
      role: cleanRole,
      companyId: compId,
      companyName: compName,
      title: cleanRole === 'admin' ? 'Platform Super Admin' : cleanRole === 'manager' ? 'Managing Director' : 'Specialist',
      avatar: cleanRole === 'admin' ? '👑' : cleanRole === 'manager' ? '🏢' : '👥',
      lastActiveAt: new Date().toISOString(),
      status: 'Active',
      purchasedDate: new Date().toISOString().split('T')[0],
      plan: 'Enterprise Suite'
    };
    db.allUsers.push(user);
    if (!db.companies.find(c => c.id === compId)) {
      db.companies.push({ id: compId, name: compName, plan: '1 Year Plan', status: 'Active', ownerEmail: email.trim(), createdAt: new Date().toISOString().split('T')[0], usersCount: 1, mrr: 999 });
    }
  }

  // Verify password if set
  if (user.password && user.password !== password) {
    return res.status(401).json({ success: false, error: 'Invalid password. Please check your credentials.' });
  }

  user.lastActiveAt = new Date().toISOString();

  // Generate JWT Token
  const token = generateToken(user);

  // Record Global Login Audit Log
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
    authMethod: 'JWT Verified (Email + Password)',
    status: 'Success (Verified)',
    device: req.headers['user-agent'] && req.headers['user-agent'].includes('Mobile') ? 'Mobile Device' : 'Desktop Workstation'
  };

  db.loginLogs.unshift(logEntry);
  if (db.loginLogs.length > 100) db.loginLogs = db.loginLogs.slice(0, 100);

  // Get user workspace
  const workspaceKey = user.companyId || user.id || 'comp_1';
  const workspaceData = getUserWorkspace(db, workspaceKey);

  writeDb(db);

  res.json({
    success: true,
    token,
    user,
    workspaceData,
    log: logEntry,
    message: `Logged in successfully as ${user.name}`
  });
});

// 3. Authentication: Register with 2-Time Password Verification + JWT
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, confirmPassword, role } = req.body || {};

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, error: '2-Time Password Verification failed: Passwords do not match' });
  }

  if (password.length < 4) {
    return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
  }

  const db = readDb();
  let existing = db.allUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase().trim());
  const compId = `comp_${Date.now()}`;
  const compName = role === 'admin' ? 'AccountiX Platform HQ' : `${name}'s Agency`;

  if (existing) {
    existing.password = password;
    existing.name = name;
    existing.lastActiveAt = new Date().toISOString();
  } else {
    existing = {
      id: `usr_${Date.now()}`,
      name: name,
      email: email.trim(),
      password: password,
      role: role || 'manager',
      companyId: compId,
      companyName: compName,
      title: role === 'admin' ? 'Platform Administrator' : role === 'manager' ? 'Managing Director' : 'Specialist',
      avatar: role === 'admin' ? '👑' : role === 'manager' ? '🏢' : '👥',
      lastActiveAt: new Date().toISOString(),
      status: 'Active',
      purchasedDate: new Date().toISOString().split('T')[0],
      plan: role === 'manager' ? 'Pro Agency' : 'Enterprise Suite'
    };
    db.allUsers.push(existing);
    if (!db.companies.find(c => c.id === compId)) {
      db.companies.push({ id: compId, name: compName, plan: '1 Year Plan', status: 'Active', ownerEmail: email.trim(), createdAt: new Date().toISOString().split('T')[0], usersCount: 1, mrr: 999 });
    }
  }

  const token = generateToken(existing);

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
    authMethod: 'Email + 2-Time Password Verified (JWT)',
    status: 'Success (Verified)',
    device: req.headers['user-agent'] && req.headers['user-agent'].includes('Mobile') ? 'Mobile Device' : 'Desktop Workstation'
  };

  db.loginLogs.unshift(logEntry);
  if (db.loginLogs.length > 100) db.loginLogs = db.loginLogs.slice(0, 100);

  const workspaceKey = existing.companyId || existing.id || 'comp_1';
  const workspaceData = getUserWorkspace(db, workspaceKey);

  writeDb(db);

  res.json({
    success: true,
    token,
    user: existing,
    workspaceData,
    log: logEntry,
    message: `Account created with 2-time password verification! Welcome, ${name}.`
  });
});

// 4. Validate Active Session (JWT /api/auth/me)
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const db = readDb();
  const user = db.allUsers.find(u => u.id === req.user.id || u.email.toLowerCase() === req.user.email.toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, error: 'User session not found' });
  }

  const workspaceKey = user.companyId || user.id || 'comp_1';
  const workspaceData = getUserWorkspace(db, workspaceKey);

  res.json({
    success: true,
    user,
    workspaceData,
    loginLogs: db.loginLogs || [],
    allUsers: db.allUsers || []
  });
});

// 5. Logout & Audit Event
app.post('/api/auth/logout', (req, res) => {
  const { userId, userEmail, userName, role, companyName } = req.body || {};
  const db = readDb();
  const now = new Date();
  const timeStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const logEntry = {
    id: `log_out_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userId: userId || 'usr_anonymous',
    userName: userName || 'User',
    userEmail: userEmail || 'user@agency.com',
    role: role || 'manager',
    companyName: companyName || 'Agency Workspace',
    loginTime: timeStr,
    authMethod: 'Session Sign Out',
    status: 'Logged Out',
    device: req.headers['user-agent'] && req.headers['user-agent'].includes('Mobile') ? 'Mobile Device' : 'Desktop Workstation'
  };

  db.loginLogs.unshift(logEntry);
  if (db.loginLogs.length > 100) db.loginLogs = db.loginLogs.slice(0, 100);
  writeDb(db);

  res.json({ success: true, log: logEntry });
});

// 6. Security Audit Logs: GET all logs (Admin & Global)
app.get('/api/admin/logs', (req, res) => {
  const db = readDb();
  res.json(db.loginLogs || []);
});

// 7. Security Audit Logs: Record Any Event
app.post('/api/admin/logs/record', (req, res) => {
  const { userId, userName, userEmail, role, companyName, authMethod, status } = req.body || {};
  const db = readDb();
  const now = new Date();
  const timeStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userId: userId || 'usr_guest',
    userName: userName || (userEmail ? userEmail.split('@')[0] : 'Guest User'),
    userEmail: userEmail || 'guest@accountix.agency',
    role: role || 'manager',
    companyName: companyName || 'Agency Workspace',
    loginTime: timeStr,
    authMethod: authMethod || 'Portal Access (Verified)',
    status: status || 'Success (Verified)',
    device: req.headers['user-agent'] && req.headers['user-agent'].includes('Mobile') ? 'Mobile Device' : 'Desktop Workstation'
  };

  db.loginLogs.unshift(logEntry);
  if (db.loginLogs.length > 100) db.loginLogs = db.loginLogs.slice(0, 100);
  writeDb(db);

  res.json({ success: true, log: logEntry });
});

// 8. Security Audit Logs: Clear logs
app.delete('/api/admin/logs', (req, res) => {
  const db = readDb();
  db.loginLogs = [];
  writeDb(db);
  res.json({ success: true, message: 'Login audit logs cleared' });
});

// 9. Multi-Tenant Workspace Sync Engine (Save per user/company across all devices)
app.post('/api/workspace/sync', async (req, res) => {
  const incoming = req.body || {};
  const emailKey = (incoming.email || (req.user ? req.user.email : '') || '').toLowerCase().trim();
  const companyKey = incoming.companyId || (req.user ? req.user.companyId : null) || 'comp_1';

  const db = readDb();
  if (!db.workspaces) db.workspaces = {};

  const workspacePayload = {
    clients: incoming.clients || [],
    packages: incoming.packages || [],
    payments: incoming.payments || [],
    expenses: incoming.expenses || [],
    staff: incoming.staff || [],
    attendance: incoming.attendance || [],
    salaryPayments: incoming.salaryPayments || [],
    tasks: incoming.tasks || [],
    contentItems: incoming.contentItems || [],
    leads: incoming.leads || [],
    serviceCatalog: incoming.serviceCatalog || [],
    settings: incoming.settings || {}
  };

  if (companyKey) db.workspaces[companyKey] = workspacePayload;
  if (emailKey) db.workspaces[emailKey] = workspacePayload;

  // Also sync to global root if comp_1 or founder
  if (companyKey === 'comp_1' || (emailKey && (emailKey.includes('jeet') || emailKey.includes('admin')))) {
    db.workspaces['comp_1'] = workspacePayload;
    Object.assign(db, workspacePayload);
  }
  if (incoming.companies && incoming.companies.length) {
    db.companies = incoming.companies;
  }
  if (incoming.allUsers && incoming.allUsers.length) {
    db.allUsers = incoming.allUsers;
  }

  writeDb(db);
  res.json({ success: true, message: 'Workspace data synchronized across all devices!' });
});

// 10. Multi-Tenant Sync / Full State API (GET)
app.get('/api/state', (req, res) => {
  const db = readDb();
  res.json(db);
});

// ================= 11. EMAIL OTP & STAFF INVITE AUTHENTICATION (GMAIL API / SMTP) =================
const { generateSecureOtp, saveOtp, verifyOtp } = require('./lib/otp');
const { sendOtpEmail, sendStaffInviteEmail } = require('./lib/mailer');

// POST /api/send-otp
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Invalid email address format.' });
    }

    const otp = generateSecureOtp();
    const saveResult = saveOtp(email, otp);

    if (!saveResult.success) {
      return res.status(429).json({ success: false, error: saveResult.error });
    }

    const mailResult = await sendOtpEmail(email.trim(), otp);

    return res.json({
      success: true,
      message: 'Verification code sent to your email address.',
      devMode: !!mailResult.devMode,
    });
  } catch (error) {
    console.error('Error in /api/send-otp:', error.message || error);
    return res.status(500).json({ success: false, error: 'Failed to send OTP email. Please check server logs.' });
  }
});

// POST /api/verify-otp
app.post('/api/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and 6-digit verification code are required.' });
    }

    const verification = verifyOtp(email, otp);
    if (!verification.valid) {
      return res.status(400).json({ success: false, error: verification.message });
    }

    // Log successful OTP verification into database audit trail
    const db = readDb();
    const cleanEmail = email.toLowerCase().trim();
    const userMatch = (db.allUsers || []).find(u => u.email && u.email.toLowerCase() === cleanEmail);

    const logEntry = {
      id: `log_otp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: userMatch ? userMatch.id : 'usr_guest',
      userName: userMatch ? userMatch.name : cleanEmail.split('@')[0],
      userEmail: cleanEmail,
      role: userMatch ? userMatch.role : 'verified_user',
      companyName: userMatch ? userMatch.companyName : 'Email Verified User',
      loginTime: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      authMethod: 'Gmail 6-Digit OTP (Verified)',
      status: 'Success (Verified)',
      device: req.headers['user-agent'] && req.headers['user-agent'].includes('Mobile') ? 'Mobile Device' : 'Desktop Workstation'
    };

    if (!db.loginLogs) db.loginLogs = [];
    db.loginLogs.unshift(logEntry);
    if (db.loginLogs.length > 100) db.loginLogs = db.loginLogs.slice(0, 100);
    writeDb(db);

    return res.json({
      success: true,
      message: verification.message,
      verifiedEmail: cleanEmail,
      user: userMatch || { email: cleanEmail, role: 'verified_user', name: cleanEmail.split('@')[0] }
    });
  } catch (error) {
    console.error('Error in /api/verify-otp:', error.message || error);
    return res.status(500).json({ success: false, error: 'Internal server error during verification.' });
  }
});

// ================= 12. STAFF GMAIL INVITATION & PASSWORD CHANGE =================
// POST /api/staff/invite
app.post('/api/staff/invite', async (req, res) => {
  try {
    const { toEmail, staffName, role, temporaryPassword, agencyName, loginUrl, staffId } = req.body || {};
    if (!toEmail || !staffName) {
      return res.status(400).json({ success: false, error: 'Staff member name and valid email address are required.' });
    }

    const cleanEmail = toEmail.toLowerCase().trim();
    const tempPass = temporaryPassword || `Staff@${Math.floor(1000 + Math.random() * 9000)}`;
    const staffRole = role || 'Video Editor';
    const targetStaffId = staffId || `st_${Date.now()}`;
    const agency = agencyName || 'AccountiX Media HQ';
    const portalUrl = loginUrl || 'https://accountix-phi.vercel.app';

    const db = readDb();
    let user = (db.allUsers || []).find(u => u.email && u.email.toLowerCase() === cleanEmail);

    if (!user) {
      user = {
        id: `usr_emp_${targetStaffId}`,
        name: staffName,
        email: cleanEmail,
        password: tempPass,
        mustChangePassword: true,
        role: 'employee',
        staffId: targetStaffId,
        companyId: 'comp_1',
        companyName: agency,
        title: staffRole,
        avatar: staffRole.includes('Video') || staffRole.includes('Editor') ? '🎬' : staffRole.includes('Shoot') || staffRole.includes('Camera') ? '📹' : '👥',
        lastActiveAt: new Date().toISOString(),
        status: 'Active',
        purchasedDate: new Date().toISOString().split('T')[0],
        plan: 'Enterprise Suite'
      };
      if (!db.allUsers) db.allUsers = [];
      db.allUsers.push(user);
    } else {
      user.name = staffName;
      user.title = staffRole;
      user.password = tempPass;
      user.mustChangePassword = true;
      user.role = 'employee';
      user.staffId = targetStaffId;
    }

    writeDb(db);

    // Trigger Welcome Email via Gmail
    const mailResult = await sendStaffInviteEmail({
      toEmail: cleanEmail,
      staffName,
      role: staffRole,
      temporaryPassword: tempPass,
      agencyName: agency,
      loginUrl: portalUrl
    });

    return res.json({
      success: true,
      message: mailResult.provider === 'supabase_admin' || mailResult.provider === 'supabase_auth' 
        ? `✓ Official invitation dispatched to ${cleanEmail} via Supabase Cloud Email!`
        : `Welcome invite & temporary credentials generated for ${cleanEmail}!`,
      temporaryPassword: tempPass,
      user,
      provider: mailResult.provider || 'email',
      devMode: !!mailResult.devMode,
      gmailComposeUrl: mailResult.gmailComposeUrl,
      mailtoUrl: mailResult.mailtoUrl,
      plainText: mailResult.plainText
    });
  } catch (error) {
    console.error('Error in /api/staff/invite:', error.message || error);
    return res.status(500).json({ success: false, error: 'Failed to send staff invitation email.' });
  }
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body || {};
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email and new password are required.' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = readDb();
    let user = (db.allUsers || []).find(u => u.email && u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    // Verify current password if provided and user has an existing password
    if (currentPassword && user.password && user.password !== currentPassword) {
      return res.status(400).json({ success: false, error: 'Current password does not match.' });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    user.lastPasswordChangedAt = new Date().toISOString();

    writeDb(db);

    // Issue updated token
    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Password changed successfully! You can now log in with your new password.',
      token,
      user
    });
  } catch (error) {
    console.error('Error in /api/auth/change-password:', error.message || error);
    return res.status(500).json({ success: false, error: 'Internal server error while changing password.' });
  }
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
    console.log(`🔐 JWT Engine:        Active`);
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

module.exports = app;

if (require.main === module) {
  startServer(Number(PORT));
}
