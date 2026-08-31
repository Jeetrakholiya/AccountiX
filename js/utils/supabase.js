/**
 * AccountiX Supabase Client & PostgreSQL Persistent Storage Layer
 * 
 * Features:
 * - Supabase Auth (Sign Up, Sign In, Google OAuth, Session Restoration)
 * - Row Level Security (RLS) with auth.uid() enforcement
 * - Direct Real-Time CRUD on PostgreSQL tables (Single Source of Truth)
 * - Universal user_data Table & AccountiX Business OS Entities
 */

let supabaseClient = null;

export const SUPABASE_STORAGE_KEYS = {
  URL: 'accountix_supabase_url',
  ANON_KEY: 'accountix_supabase_anon_key'
};

/**
 * Retrieve stored Supabase URL and Anon Key
 */
export function getSupabaseCredentials() {
  const url = localStorage.getItem(SUPABASE_STORAGE_KEYS.URL) || '';
  const key = localStorage.getItem(SUPABASE_STORAGE_KEYS.ANON_KEY) || '';
  return { url: url.trim(), key: key.trim() };
}

/**
 * Update Supabase credentials and re-initialize client
 */
export function setSupabaseCredentials(url, key) {
  localStorage.setItem(SUPABASE_STORAGE_KEYS.URL, (url || '').trim());
  localStorage.setItem(SUPABASE_STORAGE_KEYS.ANON_KEY, (key || '').trim());
  return initSupabase();
}

/**
 * Initialize Supabase JS Client with session persistence
 */
export function initSupabase() {
  const { url, key } = getSupabaseCredentials();
  if (url && key && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseClient = window.supabase.createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      return supabaseClient;
    } catch (e) {
      console.error('Supabase client initialization failed:', e);
      supabaseClient = null;
    }
  }
  supabaseClient = null;
  return null;
}

export function getSupabaseClient() {
  if (!supabaseClient) initSupabase();
  return supabaseClient;
}

export function isSupabaseConnected() {
  return !!getSupabaseClient();
}

/**
 * Test Supabase PostgreSQL connection
 */
export async function testSupabaseConnection() {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Missing Supabase URL or Anon Key' };

  try {
    const { data, error } = await client
      .from('user_data')
      .select('id')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      // If user_data doesn't exist yet, try settings table
      const fallback = await client.from('accountix_settings').select('id').limit(1);
      if (fallback.error) return { success: false, error: fallback.error.message };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ==============================================================================
 * AUTHENTICATION HELPERS
 * ============================================================================== */

/**
 * Get the currently authenticated Supabase user
 */
export async function getAuthenticatedUser() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch (e) {
    return null;
  }
}

/**
 * Listen for Supabase Auth state & session changes
 */
export function onAuthStateChange(callback) {
  const client = getSupabaseClient();
  if (!client) return { unsubscribe: () => {} };
  
  const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
    if (typeof callback === 'function') {
      callback(event, session);
    }
  });
  return subscription;
}

/**
 * Sign In with Email & Password
 */
export async function signInWithPassword(email, password) {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not connected' };
  
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    if (error) return { success: false, error: error.message };
    return { success: true, user: data.user, session: data.session };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Sign Up with Email, Password & User Metadata
 */
export async function signUpWithEmail(email, password, metadata = {}) {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not connected' };

  try {
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: metadata.name || email.split('@')[0],
          role: metadata.role || 'manager',
          ...metadata
        }
      }
    });
    if (error) return { success: false, error: error.message };
    return { success: true, user: data.user, session: data.session };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Sign Out from Supabase Session
 */
export async function signOutSupabase() {
  const client = getSupabaseClient();
  if (!client) return { success: true };
  try {
    const { error } = await client.auth.signOut();
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/* ==============================================================================
 * UNIVERSAL user_data CRUD OPERATIONS (With RLS)
 * ============================================================================== */

/**
 * Fetch all user_data records belonging to the authenticated user
 */
export async function fetchUserData() {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not connected', data: [] };

  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'User not authenticated', data: [] };

  try {
    const { data, error } = await client
      .from('user_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: err.message, data: [] };
  }
}

/**
 * Insert a new record into user_data with the authenticated user ID
 */
export async function insertUserData({ title, content }) {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not connected' };

  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'User not authenticated' };

  try {
    const { data, error } = await client
      .from('user_data')
      .insert({
        user_id: user.id,
        title: title || '',
        content: content || '',
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data ? data[0] : null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Update an existing user_data record by ID
 */
export async function updateUserData(recordId, { title, content }) {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not connected' };

  try {
    const { data, error } = await client
      .from('user_data')
      .update({
        title,
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data ? data[0] : null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete a user_data record by ID
 */
export async function deleteUserData(recordId) {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not connected' };

  try {
    const { error } = await client
      .from('user_data')
      .delete()
      .eq('id', recordId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ==============================================================================
 * COMPLETE ACCOUNTIX MULTI-TABLE PERSISTENCE LAYER (With RLS)
 * ============================================================================== */

/**
 * Fetch all application tables from Supabase for the authenticated user
 */
export async function fetchAllFromSupabase() {
  const client = getSupabaseClient();
  if (!client) return null;

  const user = await getAuthenticatedUser();
  if (!user) return null;

  try {
    const [
      clientsRes,
      staffRes,
      packagesRes,
      paymentsRes,
      expensesRes,
      attendanceRes,
      salariesRes,
      tasksRes,
      contentRes,
      leadsRes,
      catalogRes,
      settingsRes,
      userDataRes
    ] = await Promise.all([
      client.from('accountix_clients').select('*').order('created_at', { ascending: false }),
      client.from('accountix_staff').select('*').order('created_at', { ascending: false }),
      client.from('accountix_packages').select('*').order('created_at', { ascending: false }),
      client.from('accountix_payments').select('*').order('created_at', { ascending: false }),
      client.from('accountix_expenses').select('*').order('created_at', { ascending: false }),
      client.from('accountix_attendance').select('*').order('created_at', { ascending: false }),
      client.from('accountix_salary_payments').select('*').order('created_at', { ascending: false }),
      client.from('accountix_tasks').select('*').order('created_at', { ascending: false }),
      client.from('accountix_content').select('*').order('created_at', { ascending: false }),
      client.from('accountix_leads').select('*').order('created_at', { ascending: false }),
      client.from('accountix_service_catalog').select('*').order('created_at', { ascending: false }),
      client.from('accountix_settings').select('*').limit(1),
      client.from('user_data').select('*').order('created_at', { ascending: false })
    ]);

    const clients = (clientsRes.data || []).map(c => ({
      id: c.id,
      name: c.name,
      company: c.company,
      mobile: c.mobile,
      whatsapp: c.whatsapp,
      instagram: c.instagram,
      status: c.status,
      createdAt: c.created_at
    }));

    const staff = (staffRes.data || []).map(s => ({
      id: s.id,
      name: s.name,
      role: s.role,
      phone: s.phone,
      baseSalary: Number(s.base_salary) || 0,
      status: s.status
    }));

    const packages = (packagesRes.data || []).map(p => ({
      id: p.id,
      clientId: p.client_id,
      serviceType: p.service_type,
      amount: Number(p.amount) || 0,
      startDate: p.start_date,
      endDate: p.end_date,
      assignedStaffId: p.assigned_staff_id,
      status: p.status
    }));

    const payments = (paymentsRes.data || []).map(p => ({
      id: p.id,
      clientId: p.client_id,
      packageId: p.package_id,
      amount: Number(p.amount) || 0,
      date: p.date,
      mode: p.mode,
      note: p.note
    }));

    const expenses = (expensesRes.data || []).map(e => ({
      id: e.id,
      category: e.category,
      amount: Number(e.amount) || 0,
      date: e.date,
      mode: e.mode,
      note: e.note,
      staffId: e.staff_id
    }));

    const attendance = (attendanceRes.data || []).map(a => ({
      id: a.id,
      staffId: a.staff_id,
      date: a.date,
      status: a.status,
      checkIn: a.check_in
    }));

    const salaryPayments = (salariesRes.data || []).map(s => ({
      id: s.id,
      staffId: s.staff_id,
      month: s.month,
      base: Number(s.base) || 0,
      incentive: Number(s.incentive) || 0,
      advance: Number(s.advance) || 0,
      deduction: Number(s.deduction) || 0,
      finalPayable: Number(s.final_payable) || 0,
      paidOn: s.paid_on
    }));

    const tasks = (tasksRes.data || []).map(t => ({
      id: t.id,
      title: t.title,
      clientId: t.client_id,
      assignedTo: t.assigned_to,
      deadline: t.deadline,
      priority: t.priority,
      status: t.status
    }));

    const contentItems = (contentRes.data || []).map(c => ({
      id: c.id,
      clientId: c.client_id,
      date: c.date,
      type: c.type,
      topic: c.topic,
      shootById: c.shoot_by_id,
      assignedStaffId: c.assigned_staff_id,
      status: c.status,
      driveLink: c.drive_link,
      caption: c.caption
    }));

    const leads = (leadsRes.data || []).map(l => ({
      id: l.id,
      name: l.name,
      business: l.business,
      phone: l.phone,
      service: l.service,
      budget: Number(l.budget) || 0,
      followUpDate: l.follow_up_date,
      status: l.status,
      createdAt: l.created_at
    }));

    const serviceCatalog = (catalogRes.data || []).map(s => ({
      id: s.id,
      name: s.name,
      defaultAmount: Number(s.default_amount) || 0,
      cycle: s.cycle,
      description: s.description
    }));

    let settings = null;
    if (settingsRes.data && settingsRes.data.length) {
      const st = settingsRes.data[0];
      settings = {
        agencyName: st.agency_name,
        tagline: st.tagline,
        ownerName: st.owner_name,
        phone: st.phone,
        email: st.email,
        currencySymbol: st.currency_symbol,
        theme: st.theme
      };
    }

    const userData = (userDataRes.data || []).map(u => ({
      id: u.id,
      title: u.title,
      content: u.content,
      createdAt: u.created_at,
      updatedAt: u.updated_at
    }));

    return {
      clients,
      staff,
      packages,
      payments,
      expenses,
      attendance,
      salaryPayments,
      tasks,
      contentItems,
      leads,
      serviceCatalog: serviceCatalog.length ? serviceCatalog : undefined,
      settings: settings || undefined,
      userData
    };
  } catch (err) {
    console.error('Error fetching Supabase data:', err);
    return null;
  }
}

/**
 * Generic insert entity helper with user_id enforcement
 */
export async function insertEntity(tableName, payload) {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not connected' };

  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'User not authenticated' };

  try {
    const { data, error } = await client
      .from(tableName)
      .insert({
        ...payload,
        user_id: user.id,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data ? data[0] : null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Generic update entity helper
 */
export async function updateEntity(tableName, recordId, updates) {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not connected' };

  try {
    const { data, error } = await client
      .from(tableName)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .select();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data ? data[0] : null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Generic delete entity helper
 */
export async function deleteEntity(tableName, recordId) {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client not connected' };

  try {
    const { error } = await client
      .from(tableName)
      .delete()
      .eq('id', recordId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
