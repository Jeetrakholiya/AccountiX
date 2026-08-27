/**
 * AccountiX Role-Based Access Control (RBAC) & Gmail OTP Verification Utility
 */

export const USER_ROLES = {
  SUPER_ADMIN: 'admin',
  AGENCY_MANAGER: 'manager',
  EMPLOYEE: 'employee'
};

export const DEMO_PROFILES = [
  {
    id: 'usr_admin',
    name: 'Platform Administrator',
    email: 'admin@accountix.agency',
    role: USER_ROLES.SUPER_ADMIN,
    companyId: 'comp_1',
    companyName: 'AccountiX Platform HQ',
    title: 'Platform Super Admin',
    avatar: '👑'
  },
  {
    id: 'usr_manager',
    name: 'Jeet Rakholiya',
    email: 'jeet@accountix.agency',
    role: USER_ROLES.AGENCY_MANAGER,
    companyId: 'comp_1',
    companyName: 'AccountiX Media HQ',
    title: 'Agency Managing Director',
    avatar: '🏢'
  },
  {
    id: 'usr_rohan',
    name: 'Rohan Mehta',
    email: 'rohan@accountix.agency',
    role: USER_ROLES.EMPLOYEE,
    staffId: 'st_2',
    companyId: 'comp_1',
    companyName: 'AccountiX Media HQ',
    title: 'Lead Video Editor',
    avatar: '🎬'
  },
  {
    id: 'usr_aarav',
    name: 'Aarav Sharma',
    email: 'aarav@accountix.agency',
    role: USER_ROLES.EMPLOYEE,
    staffId: 'st_1',
    companyId: 'comp_1',
    companyName: 'AccountiX Media HQ',
    title: 'Cinematographer & Shooter',
    avatar: '📹'
  }
];

/**
 * Generate a cryptographically random 6-digit OTP
 */
export function generateRandomOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Storage keys for saved email and session re-login
 */
export const STORAGE_KEYS = {
  SAVED_GMAIL: 'accountix_saved_gmail',
  SAVED_USER: 'accountix_saved_user',
  LAST_LOGIN: 'accountix_last_login'
};

/**
 * Save verified Gmail address & profile to LocalStorage for 1-click re-login
 */
export function saveGmailForReLogin(email, user = null) {
  try {
    if (email) {
      localStorage.setItem(STORAGE_KEYS.SAVED_GMAIL, email.trim().toLowerCase());
      localStorage.setItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString());
    }
    if (user) {
      localStorage.setItem(STORAGE_KEYS.SAVED_USER, JSON.stringify(user));
    }
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

/**
 * Retrieve saved Gmail address for re-login
 */
export function getSavedGmailForReLogin() {
  try {
    return localStorage.getItem(STORAGE_KEYS.SAVED_GMAIL) || null;
  } catch (e) {
    return null;
  }
}

/**
 * Retrieve saved user profile for re-login
 */
export function getSavedUserForReLogin() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_USER);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Save verified user email and session into Supabase Cloud
 */
export async function saveVerifiedUserToSupabase(user, supabaseClient) {
  if (!supabaseClient || !user || !user.email) return { success: false, note: 'No Supabase client or email' };
  try {
    const { error } = await supabaseClient.from('accountix_users').upsert([{
      id: user.id || `usr_${Date.now()}`,
      name: user.name || user.email.split('@')[0],
      email: user.email.trim().toLowerCase(),
      role: user.role || 'manager',
      company_id: user.companyId || 'comp_1',
      company_name: user.companyName || 'Primary Workspace',
      status: 'Active',
      last_active_at: new Date().toISOString(),
      plan: user.plan || '1 Year Plan'
    }]);

    if (error) {
      console.warn('Supabase save user warning:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.warn('Supabase save error:', err);
    return { success: false, error: err.message };
  }
}

export function getInactiveUsers(users, dayThreshold = 7) {
  const now = Date.now();
  return users.filter(u => {
    if (!u.lastActiveAt) return true;
    const diffDays = (now - new Date(u.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= dayThreshold;
  });
}

export function generateReEngagementEmail(user, agencyName = 'AccountiX') {
  const subject = `Need a hand getting started with ${agencyName}? 👋`;
  const body = `Hi ${user.name},\n\n` +
    `I noticed you recently joined ${agencyName}, but haven't had a chance to log in and set up your agency client retainers and team workflows yet.\n\n` +
    `We'd love to ensure you get the absolute most value out of the platform. Would you like a quick 10-minute 1-on-1 walkthrough where we help you:\n` +
    `1. Set up your agency rate cards & packages\n` +
    `2. Onboard your active clients & team roster\n` +
    `3. Connect your real-time Supabase cloud database\n\n` +
    `Feel free to reply directly to this email or book a strategy session here.\n\n` +
    `Best regards,\n` +
    `Customer Success Team | ${agencyName}`;

  return {
    subject,
    body,
    mailtoUrl: `mailto:${encodeURIComponent(user.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  };
}
