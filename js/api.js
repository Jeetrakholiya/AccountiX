/**
 * AccountiX Fullstack API Client Module
 * Communicates with the Express Backend REST APIs (/api/...)
 * Gracefully synchronizes with Supabase Cloud Database & Local Cache
 */

const API_BASE = window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:5000';

const AccountiX_API = {
  // Check backend server health
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend API connection note (using client persistence):', err.message);
      return { status: 'fallback', supabaseConnected: false };
    }
  },

  // Auth: Sign In with Email & Password
  async login(email, password, role = 'manager') {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      return data;
    } catch (err) {
      console.warn('Backend login fallback:', err.message);
      return null;
    }
  },

  // Auth: Register with 2-Time Password Verification
  async register(name, email, password, confirmPassword, role = 'manager') {
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      return data;
    } catch (err) {
      console.warn('Backend registration fallback:', err.message);
      return null;
    }
  },

  // Security Audit Logs: Fetch all
  async getAuditLogs() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/logs`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend logs fallback:', err.message);
      return null;
    }
  },

  // Security Audit Logs: Clear
  async clearAuditLogs() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/logs`, { method: 'DELETE' });
      return await res.json();
    } catch (err) {
      console.warn('Backend clear logs fallback:', err.message);
      return null;
    }
  },

  // Sync entire state with Backend Persistent Database
  async syncState(state) {
    try {
      const res = await fetch(`${API_BASE}/api/state/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // Fetch complete state from Backend
  async fetchState() {
    try {
      const res = await fetch(`${API_BASE}/api/state`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      return null;
    }
  }
};

window.AccountiX_API = AccountiX_API;
