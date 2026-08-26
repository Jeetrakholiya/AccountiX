/**
 * AccountiX Supabase Client & Cloud Synchronization Layer
 */

let supabaseClient = null;

export function getSupabaseCredentials() {
  const url = localStorage.getItem('accountix_supabase_url') || '';
  const key = localStorage.getItem('accountix_supabase_anon_key') || '';
  return { url: url.trim(), key: key.trim() };
}

export function setSupabaseCredentials(url, key) {
  localStorage.setItem('accountix_supabase_url', (url || '').trim());
  localStorage.setItem('accountix_supabase_anon_key', (key || '').trim());
  initSupabase();
}

export function initSupabase() {
  const { url, key } = getSupabaseCredentials();
  if (url && key && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseClient = window.supabase.createClient(url, key);
      return supabaseClient;
    } catch (e) {
      console.error('Supabase init failed', e);
      supabaseClient = null;
    }
  }
  supabaseClient = null;
  return null;
}

export function isSupabaseConnected() {
  return !!supabaseClient;
}

export async function testSupabaseConnection() {
  if (!supabaseClient) initSupabase();
  if (!supabaseClient) return { success: false, error: 'Missing Supabase URL or Anon Key' };

  try {
    const { data, error } = await supabaseClient
      .from('accountix_settings')
      .select('*')
      .limit(1);
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all agency data from Supabase
 */
export async function fetchAllFromSupabase() {
  if (!supabaseClient) initSupabase();
  if (!supabaseClient) return null;

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
      settingsRes
    ] = await Promise.all([
      supabaseClient.from('accountix_clients').select('*'),
      supabaseClient.from('accountix_staff').select('*'),
      supabaseClient.from('accountix_packages').select('*'),
      supabaseClient.from('accountix_payments').select('*'),
      supabaseClient.from('accountix_expenses').select('*'),
      supabaseClient.from('accountix_attendance').select('*'),
      supabaseClient.from('accountix_salary_payments').select('*'),
      supabaseClient.from('accountix_tasks').select('*'),
      supabaseClient.from('accountix_content').select('*'),
      supabaseClient.from('accountix_leads').select('*'),
      supabaseClient.from('accountix_service_catalog').select('*'),
      supabaseClient.from('accountix_settings').select('*').limit(1)
    ]);

    // Map DB snake_case columns back to State camelCase
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
      settings: settings || undefined
    };
  } catch (err) {
    console.error('Error fetching Supabase data:', err);
    return null;
  }
}

/**
 * Push local state to Supabase in bulk
 */
export async function pushAllToSupabase(state) {
  if (!supabaseClient) initSupabase();
  if (!supabaseClient) return { success: false, error: 'Supabase client not initialized' };

  try {
    // 1. Settings
    if (state.settings) {
      await supabaseClient.from('accountix_settings').upsert({
        id: 'primary_agency_settings',
        agency_name: state.settings.agencyName,
        tagline: state.settings.tagline,
        owner_name: state.settings.ownerName,
        phone: state.settings.phone,
        email: state.settings.email,
        currency_symbol: state.settings.currencySymbol,
        theme: state.settings.theme,
        updated_at: new Date().toISOString()
      });
    }

    // 2. Service Catalog
    if (state.serviceCatalog && state.serviceCatalog.length) {
      await supabaseClient.from('accountix_service_catalog').upsert(
        state.serviceCatalog.map(s => ({
          id: s.id,
          name: s.name,
          default_amount: s.defaultAmount,
          cycle: s.cycle,
          description: s.description
        }))
      );
    }

    // 3. Staff
    if (state.staff && state.staff.length) {
      await supabaseClient.from('accountix_staff').upsert(
        state.staff.map(s => ({
          id: s.id,
          name: s.name,
          role: s.role,
          phone: s.phone,
          base_salary: s.baseSalary,
          status: s.status
        }))
      );
    }

    // 4. Clients
    if (state.clients && state.clients.length) {
      await supabaseClient.from('accountix_clients').upsert(
        state.clients.map(c => ({
          id: c.id,
          name: c.name,
          company: c.company,
          mobile: c.mobile,
          whatsapp: c.whatsapp,
          instagram: c.instagram,
          status: c.status,
          created_at: c.createdAt || new Date().toISOString()
        }))
      );
    }

    // 5. Packages
    if (state.packages && state.packages.length) {
      await supabaseClient.from('accountix_packages').upsert(
        state.packages.map(p => ({
          id: p.id,
          client_id: p.clientId,
          service_type: p.serviceType,
          amount: p.amount,
          start_date: p.startDate,
          end_date: p.endDate,
          assigned_staff_id: p.assignedStaffId || null,
          status: p.status
        }))
      );
    }

    // 6. Payments
    if (state.payments && state.payments.length) {
      await supabaseClient.from('accountix_payments').upsert(
        state.payments.map(p => ({
          id: p.id,
          client_id: p.clientId,
          package_id: p.packageId || null,
          amount: p.amount,
          date: p.date,
          mode: p.mode,
          note: p.note
        }))
      );
    }

    // 7. Expenses
    if (state.expenses && state.expenses.length) {
      await supabaseClient.from('accountix_expenses').upsert(
        state.expenses.map(e => ({
          id: e.id,
          category: e.category,
          amount: e.amount,
          date: e.date,
          mode: e.mode,
          note: e.note,
          staff_id: e.staffId || null
        }))
      );
    }

    // 8. Attendance
    if (state.attendance && state.attendance.length) {
      await supabaseClient.from('accountix_attendance').upsert(
        state.attendance.map(a => ({
          id: a.id,
          staff_id: a.staffId,
          date: a.date,
          status: a.status,
          check_in: a.checkIn
        }))
      );
    }

    // 9. Salary Disbursements
    if (state.salaryPayments && state.salaryPayments.length) {
      await supabaseClient.from('accountix_salary_payments').upsert(
        state.salaryPayments.map(s => ({
          id: s.id,
          staff_id: s.staffId,
          month: s.month,
          base: s.base,
          incentive: s.incentive,
          advance: s.advance,
          deduction: s.deduction,
          final_payable: s.finalPayable,
          paid_on: s.paidOn
        }))
      );
    }

    // 10. Tasks
    if (state.tasks && state.tasks.length) {
      await supabaseClient.from('accountix_tasks').upsert(
        state.tasks.map(t => ({
          id: t.id,
          title: t.title,
          client_id: t.clientId || null,
          assigned_to: t.assignedTo || null,
          deadline: t.deadline,
          priority: t.priority,
          status: t.status
        }))
      );
    }

    // 11. Content
    if (state.contentItems && state.contentItems.length) {
      await supabaseClient.from('accountix_content').upsert(
        state.contentItems.map(c => ({
          id: c.id,
          client_id: c.clientId,
          date: c.date,
          type: c.type,
          topic: c.topic,
          shoot_by_id: c.shootById || null,
          assigned_staff_id: c.assignedStaffId || null,
          status: c.status,
          drive_link: c.driveLink,
          caption: c.caption
        }))
      );
    }

    // 12. Leads
    if (state.leads && state.leads.length) {
      await supabaseClient.from('accountix_leads').upsert(
        state.leads.map(l => ({
          id: l.id,
          name: l.name,
          business: l.business,
          phone: l.phone,
          service: l.service,
          budget: l.budget,
          follow_up_date: l.followUpDate,
          status: l.status,
          created_at: l.createdAt || new Date().toISOString()
        }))
      );
    }

    return { success: true };
  } catch (err) {
    console.error('Error pushing data to Supabase:', err);
    return { success: false, error: err.message };
  }
}
