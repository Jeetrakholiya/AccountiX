/* ==========================================================================
   AccountiX — Main Application Controller & Router
   ========================================================================== */

import { store } from './store.js';
import { fmtMoney, fmtDate, todayStr, daysBetween, addMonths, esc, uid } from './utils/formatters.js';
import { sendWaMessage, WA_TEMPLATES } from './utils/whatsapp.js';

// View modules
import { renderDashboard, attachDashboardEvents } from './views/dashboard.js';
import { renderClients, attachClientsEvents, openNewClientModal, openClientProfileModal } from './views/clients.js';
import { renderContent, attachContentEvents, openContentModal } from './views/content.js';
import { renderSales, attachSalesEvents, openLeadModal } from './views/sales.js';
import { renderTeam, attachTeamEvents, openStaffModal, openPaySalaryModal } from './views/team.js';
import { renderFinance, attachFinanceEvents, openPaymentModal, openExpenseModal } from './views/finance.js';
import { renderReports, attachReportsEvents } from './views/reports.js';
import { renderSettings, attachSettingsEvents } from './views/settings.js';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>' },
  { id: 'clients', label: 'Clients', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="8" r="2.6"/><path d="M17 14c2.6 0 4.5 2 4.5 5"/></svg>' },
  { id: 'content', label: 'Content Studio', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 9l5 3-5 3V9z"/></svg>' },
  { id: 'sales', label: 'Sales CRM', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l6-6 4 4 8-8"/><path d="M21 2h-6M21 2v6"/></svg>' },
  { id: 'team', label: 'Team & Payroll', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="3.5"/><path d="M2 20c0-4 3-7 7-7s7 3 7 7"/><path d="M16 4.5c1.7.4 3 2 3 3.9 0 1.9-1.3 3.5-3 3.9M20 20c0-3-1.8-5.5-4.5-6.5"/></svg>' },
  { id: 'finance', label: 'Financials & Cash', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="13" rx="2.5"/><circle cx="12" cy="12.5" r="3"/><path d="M6 6V5a2 2 0 012-2h8a2 2 0 012 2v1"/></svg>' },
  { id: 'reports', label: 'Reports & Export', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>' },
  { id: 'settings', label: 'Settings', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 13a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6V19a2 2 0 11-4 0v-.2a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.9-2.9l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.6-1H5a2 2 0 110-4h.2a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.9-2.9l.1.1a1.7 1.7 0 001.9.3H11a1.7 1.7 0 001-1.6V3a2 2 0 114 0v.2a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.9 2.9l-.1.1a1.7 1.7 0 00-.3 1.9V11a1.7 1.7 0 001.6 1H21a2 2 0 110 4h-.2a1.7 1.7 0 00-1.6 1z"/></svg>' }
];

class App {
  constructor() {
    this.init();
  }

  async init() {
    window.closeModal = () => this.closeModal();

    await store.load();
    this.render();

    // Global Keybindings (Ctrl+K or Cmd+K)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) searchInput.focus();
      }
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerHTML = `<span>⚡</span> ${msg}`;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  showModal(html, width = 520) {
    let overlay = document.getElementById('overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'overlay';
      overlay.className = 'overlay';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div class="modal" style="max-width: ${width}px;">${html}</div>`;
    overlay.onclick = (e) => {
      if (e.target === overlay) this.closeModal();
    };
    overlay.classList.add('open');
  }

  closeModal() {
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.remove('open');
  }

  navigate(viewId) {
    store.state.view = viewId;
    store.state._search = '';
    this.render();
  }

  buildNotifications() {
    const today = todayStr();
    const notifs = [];

    // Renewals
    store.state.packages.forEach(p => {
      if (!p.endDate || p.status === 'Cancelled') return;
      const d = daysBetween(today, p.endDate);
      const c = store.state.clients.find(cl => cl.id === p.clientId);
      if (!c) return;
      if (d < 0) notifs.push({ type: 'Expired Package', text: `${c.name}'s package expired ${Math.abs(d)}d ago`, clientId: c.id, urgent: true });
      else if (d <= 7) notifs.push({ type: 'Renewal Due', text: `${c.name} renews in ${d} days`, clientId: c.id, urgent: true });
      else if (d <= 30) notifs.push({ type: 'Renewal Upcoming', text: `${c.name} renews in ${d} days`, clientId: c.id, urgent: false });
    });

    // Outstanding Dues
    store.state.clients.forEach(c => {
      const out = store.clientOutstanding(c.id);
      if (out.pending > 0) {
        notifs.push({ type: 'Payment Due', text: `${c.name} has ${fmtMoney(out.pending)} overdue`, clientId: c.id, urgent: true });
      }
    });

    // Tasks Overdue
    store.state.tasks.forEach(t => {
      if (t.status !== 'Done' && t.deadline && t.deadline < today) {
        notifs.push({ type: 'Task Overdue', text: `"${t.title}" is overdue`, urgent: true });
      }
    });

    // Approvals Pending
    store.state.contentItems.forEach(it => {
      if (it.status === 'Client Approval') {
        const c = store.state.clients.find(cl => cl.id === it.clientId);
        notifs.push({ type: 'Pending Approval', text: `${c ? c.name : 'Client'} deliverable awaiting approval`, urgent: false });
      }
    });

    return notifs;
  }

  openNotificationsModal() {
    const notifs = this.buildNotifications();
    const urgentCount = notifs.filter(n => n.urgent).length;

    const html = `
      <div class="modal-header">
        <h3 class="modal-title">Operational Alerts (${notifs.length})</h3>
        <button class="modal-close" onclick="window.closeModal()">✕</button>
      </div>

      ${notifs.length ? `
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 440px; overflow-y: auto;">
          ${notifs.map(n => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--canvas); border-radius: 9px; border: 1px solid var(--border);">
              <div>
                <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${n.urgent ? 'var(--danger)' : 'var(--brand-light)'};">
                  ${n.urgent ? '🔴 ' : '⚪ '}${n.type}
                </span>
                <div style="font-size: 13px; color: var(--ink); margin-top: 2px;">${esc(n.text)}</div>
              </div>
              ${n.clientId ? `<button class="btn btn-ghost btn-sm" data-notif-client="${n.clientId}">View</button>` : ''}
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="empty">All clear! No pending alerts or overdue items 🎉</div>
      `}

      <div class="modal-actions">
        <button class="btn btn-ghost" onclick="window.closeModal()">Close</button>
      </div>
    `;

    this.showModal(html, 500);

    document.querySelectorAll('[data-notif-client]').forEach(el => {
      el.onclick = () => {
        this.closeModal();
        openClientProfileModal(this, el.dataset.notifClient);
      };
    });
  }

  openQuickAddModal() {
    const html = `
      <div class="modal-header">
        <h3 class="modal-title">⚡ Quick Action</h3>
        <button class="modal-close" onclick="window.closeModal()">✕</button>
      </div>

      <div class="quickadd-grid">
        <div class="qa-card" data-quick="client">
          <span>🗂️</span> Client
        </div>
        <div class="qa-card" data-quick="payment">
          <span>📥</span> Payment
        </div>
        <div class="qa-card" data-quick="expense">
          <span>📤</span> Expense
        </div>
        <div class="qa-card" data-quick="content">
          <span>🎬</span> Shoot / Reel
        </div>
        <div class="qa-card" data-quick="lead">
          <span>📈</span> Sales Lead
        </div>
        <div class="qa-card" data-quick="task">
          <span>✅</span> Task
        </div>
        <div class="qa-card" data-quick="staff">
          <span>👥</span> Staff
        </div>
      </div>
    `;

    this.showModal(html, 480);

    document.querySelectorAll('[data-quick]').forEach(el => {
      el.onclick = () => {
        this.closeModal();
        const action = el.dataset.quick;
        setTimeout(() => {
          if (action === 'client') openNewClientModal(this);
          else if (action === 'payment') this.openPaymentModal();
          else if (action === 'expense') this.openExpenseModal();
          else if (action === 'content') openContentModal(this);
          else if (action === 'lead') openLeadModal(this);
          else if (action === 'task') this.openTaskModal();
          else if (action === 'staff') openStaffModal(this);
        }, 60);
      };
    });
  }

  openPaymentModal(clientId = null) {
    openPaymentModal(this, clientId);
  }

  openExpenseModal() {
    openExpenseModal(this);
  }

  openTaskModal(clientId = null) {
    const html = `
      <div class="modal-header">
        <h3 class="modal-title">Assign New Task</h3>
        <button class="modal-close" onclick="window.closeModal()">✕</button>
      </div>

      <div class="field">
        <label>Task Title *</label>
        <input id="f_tsk_title" placeholder="e.g. Schedule photoshoot for Friday" autofocus required />
      </div>

      <div class="field">
        <label>Client Account</label>
        <select id="f_tsk_client">
          <option value="">— None / Internal Agency Task —</option>
          ${store.state.clients.map(c => `
            <option value="${c.id}" ${c.id === clientId ? 'selected' : ''}>${esc(c.name)}</option>
          `).join('')}
        </select>
      </div>

      <div class="field-row">
        <div class="field">
          <label>Assign To (Staff)</label>
          <select id="f_tsk_staff">
            <option value="">— Unassigned —</option>
            ${store.state.staff.map(s => `
              <option value="${s.id}">${esc(s.name)} (${esc(s.role)})</option>
            `).join('')}
          </select>
        </div>
        <div class="field">
          <label>Deadline Date</label>
          <input type="date" id="f_tsk_deadline" value="${todayStr()}" />
        </div>
      </div>

      <div class="field">
        <label>Priority</label>
        <select id="f_tsk_priority">
          <option>Low</option>
          <option selected>Medium</option>
          <option>High</option>
        </select>
      </div>

      <div class="modal-actions">
        <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="saveTaskBtn">Assign Task</button>
      </div>
    `;

    this.showModal(html, 500);

    document.getElementById('saveTaskBtn').onclick = () => {
      const title = document.getElementById('f_tsk_title').value.trim();
      if (!title) {
        this.toast('Task title is required');
        return;
      }

      store.state.tasks.push({
        id: uid('tsk'),
        title,
        clientId: document.getElementById('f_tsk_client').value || null,
        assignedTo: document.getElementById('f_tsk_staff').value || null,
        deadline: document.getElementById('f_tsk_deadline').value,
        priority: document.getElementById('f_tsk_priority').value,
        status: 'To Do'
      });

      store.save();
      this.closeModal();
      this.toast('Task assigned');
      this.render();
    };
  }

  openRenewModal(clientId) {
    const last = store.activePackage(clientId);
    const client = store.state.clients.find(c => c.id === clientId);
    if (!client) return;

    const html = `
      <div class="modal-header">
        <h3 class="modal-title">Renew Client Retainer Package</h3>
        <button class="modal-close" onclick="window.closeModal()">✕</button>
      </div>

      <div class="card" style="background:var(--brand-soft); border-color:var(--brand); margin-bottom:14px;">
        <div style="font-size:12.5px; color:var(--ink); font-weight:600;">
          💡 Best practice: Request renewal confirmation & payment on WhatsApp before confirming the new cycle.
        </div>
        <button class="wa-btn btn-sm" id="waAskRenewModalBtn" style="margin-top:8px;">
          Send Renewal Prompt on WhatsApp
        </button>
      </div>

      <div class="field">
        <label>Service Package</label>
        <select id="f_rn_service">
          ${store.state.packages.map(p => p.serviceType).filter((v, i, a) => a.indexOf(v) === i).map(s => `
            <option ${last && s === last.serviceType ? 'selected' : ''}>${s}</option>
          `).join('')}
        </select>
      </div>

      <div class="field-row">
        <div class="field">
          <label>Cycle Start Date</label>
          <input type="date" id="f_rn_start" value="${todayStr()}" />
        </div>
        <div class="field">
          <label>Cycle End Date</label>
          <input type="date" id="f_rn_end" value="${addMonths(todayStr(), 1)}" />
        </div>
      </div>

      <div class="field">
        <label>Renewed Amount (₹)</label>
        <input type="number" id="f_rn_amount" value="${last ? last.amount : 35000}" required />
      </div>

      <div class="modal-actions">
        <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="saveRenewRecordBtn">Confirm Package Renewal</button>
      </div>
    `;

    this.showModal(html, 500);

    document.getElementById('waAskRenewModalBtn').onclick = () => {
      const msg = WA_TEMPLATES.packageRenewal(
        client.name,
        last ? last.serviceType : 'Social Media Retainer',
        last ? last.amount : 35000,
        addMonths(todayStr(), 1),
        store.state.settings.agencyName
      );
      sendWaMessage(client.whatsapp || client.mobile, msg);
    };

    document.getElementById('saveRenewRecordBtn').onclick = () => {
      store.state.packages.push({
        id: uid('pkg'),
        clientId,
        serviceType: document.getElementById('f_rn_service').value,
        amount: Number(document.getElementById('f_rn_amount').value) || 0,
        startDate: document.getElementById('f_rn_start').value,
        endDate: document.getElementById('f_rn_end').value,
        assignedStaffId: last ? last.assignedStaffId : '',
        status: 'Active'
      });

      store.save();
      this.closeModal();
      this.toast('Package renewed successfully');
      this.render();
    };
  }

  render() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const notifs = this.buildNotifications();
    const urgentCount = notifs.filter(n => n.urgent).length;
    const settings = store.state.settings;

    appEl.innerHTML = `
      <!-- Sidebar -->
      <div class="sidebar" id="sidebar">
        <div class="brand-badge">
          <div class="brand-icon">AX</div>
          <div>
            <div class="brand-title">${esc(settings.agencyName || 'AccountiX')}</div>
            <div class="brand-tagline">${esc(settings.tagline || 'Business OS')}</div>
          </div>
        </div>

        <div class="nav-section">
          ${NAV_ITEMS.map(n => `
            <div class="nav-item ${store.state.view === n.id ? 'active' : ''}" data-nav-id="${n.id}">
              ${n.icon}
              <span>${n.label}</span>
              ${n.id === 'clients' ? `<span class="nav-counter">${store.state.clients.length}</span>` : ''}
              ${n.id === 'sales' ? `<span class="nav-counter">${store.state.leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').length}</span>` : ''}
              ${n.id === 'content' ? `<span class="nav-counter">${store.state.contentItems.filter(i => i.status !== 'Uploaded/Posted').length}</span>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="sidebar-footer">
          <div class="owner-pill">
            <div class="owner-avatar">MD</div>
            <div class="owner-info">
              <div><b>Managing Director</b></div>
              <span>${esc(settings.agencyName || 'AccountiX')} Agency</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Overlay -->
      <div class="mobile-overlay" id="mobileOverlay"></div>

      <!-- Main Content Container -->
      <div class="main-content-wrapper">
        <!-- Topbar -->
        <div class="topbar">
          <div class="topbar-left">
            <button class="mobile-nav-toggle" id="mobileNavToggle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>

            <div class="search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
              <input id="globalSearch" placeholder="Search clients, leads, deliverables, tasks..." value="${esc(store.state._search || '')}" />
              <span class="cmd-shortcut">Ctrl+K</span>
            </div>
          </div>

          <div class="topbar-actions">
            <button class="btn-icon" id="notifBtn" title="Alerts & Reminders">
              🔔
              ${urgentCount > 0 ? `<span class="notif-dot">${urgentCount}</span>` : ''}
            </button>
            <button class="btn btn-primary" id="quickAddBtn">
              <span>⚡</span> Quick Add
            </button>
          </div>
        </div>

        <!-- Main Body -->
        <main id="mainContainer"></main>
      </div>

      <!-- Floating Action Button for Mobile -->
      <button class="fab" id="mobileFabBtn">➕</button>
    `;

    // Bind Global Topbar & Sidebar Events
    document.querySelectorAll('[data-nav-id]').forEach(el => {
      el.onclick = () => this.navigate(el.dataset.navId);
    });

    const notifBtn = document.getElementById('notifBtn');
    if (notifBtn) notifBtn.onclick = () => this.openNotificationsModal();

    const qBtn = document.getElementById('quickAddBtn');
    if (qBtn) qBtn.onclick = () => this.openQuickAddModal();

    const fabBtn = document.getElementById('mobileFabBtn');
    if (fabBtn) fabBtn.onclick = () => this.openQuickAddModal();

    const mobToggle = document.getElementById('mobileNavToggle');
    const mobOverlay = document.getElementById('mobileOverlay');
    const sidebar = document.getElementById('sidebar');

    if (mobToggle && sidebar && mobOverlay) {
      mobToggle.onclick = () => {
        sidebar.classList.toggle('open');
        mobOverlay.classList.toggle('open');
      };
      mobOverlay.onclick = () => {
        sidebar.classList.remove('open');
        mobOverlay.classList.remove('open');
      };
    }

    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
      searchInput.oninput = (e) => {
        store.state._search = e.target.value;
        this.renderMainContent();
      };
    }

    this.renderMainContent();
  }

  renderMainContent() {
    const main = document.getElementById('mainContainer');
    if (!main) return;

    // If active search query
    if (store.state._search && store.state._search.trim().length > 1) {
      main.innerHTML = this.renderSearchResults(store.state._search.trim());
      this.attachSearchEvents();
      return;
    }

    switch (store.state.view) {
      case 'dashboard':
        main.innerHTML = renderDashboard();
        attachDashboardEvents(this);
        break;
      case 'clients':
        main.innerHTML = renderClients();
        attachClientsEvents(this);
        break;
      case 'content':
        main.innerHTML = renderContent();
        attachContentEvents(this);
        break;
      case 'sales':
        main.innerHTML = renderSales();
        attachSalesEvents(this);
        break;
      case 'team':
        main.innerHTML = renderTeam();
        attachTeamEvents(this);
        break;
      case 'finance':
        main.innerHTML = renderFinance();
        attachFinanceEvents(this);
        break;
      case 'reports':
        main.innerHTML = renderReports();
        attachReportsEvents(this);
        break;
      case 'settings':
        main.innerHTML = renderSettings();
        attachSettingsEvents(this);
        break;
      default:
        main.innerHTML = renderDashboard();
        attachDashboardEvents(this);
    }
  }

  renderSearchResults(query) {
    const q = query.toLowerCase();
    const clients = store.state.clients.filter(c => (c.name + ' ' + (c.company || '')).toLowerCase().includes(q));
    const content = store.state.contentItems.filter(it => (it.topic + ' ' + it.type).toLowerCase().includes(q));
    const leads = store.state.leads.filter(l => (l.name + ' ' + (l.business || '')).toLowerCase().includes(q));
    const tasks = store.state.tasks.filter(t => t.title.toLowerCase().includes(q));

    return `
      <div class="view-header">
        <div>
          <h1 class="view-title">Search Results for "${esc(query)}"</h1>
          <p class="view-sub">Found ${clients.length + content.length + leads.length + tasks.length} matching items</p>
        </div>
      </div>

      <div class="section-label" style="font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: 8px;">Client Accounts (${clients.length})</div>
      <div class="table-wrap" style="margin-bottom: 20px;">
        <table>
          <tbody>
            ${clients.map(c => `
              <tr class="row-click" data-search-client="${c.id}">
                <td><b>${esc(c.name)}</b> — ${esc(c.company || '')}</td>
                <td style="text-align: right;"><button class="btn btn-ghost btn-sm">Open Profile</button></td>
              </tr>
            `).join('') || `<tr><td class="empty">No matching clients</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="section-label" style="font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: 8px;">Content & Creative Deliverables (${content.length})</div>
      <div class="table-wrap" style="margin-bottom: 20px;">
        <table>
          <tbody>
            ${content.map(it => `
              <tr>
                <td><b>${esc(it.topic || it.type)}</b></td>
                <td><span class="pill pill-brand">${it.status}</span></td>
                <td>${fmtDate(it.date)}</td>
              </tr>
            `).join('') || `<tr><td class="empty">No matching deliverables</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="section-label" style="font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: 8px;">Prospect Leads (${leads.length})</div>
      <div class="table-wrap" style="margin-bottom: 20px;">
        <table>
          <tbody>
            ${leads.map(l => `
              <tr>
                <td><b>${esc(l.name)}</b> (${esc(l.business || 'Individual')})</td>
                <td><span class="pill pill-gray">${l.status}</span></td>
                <td class="mono font-weight-bold">${l.budget ? fmtMoney(l.budget) : '—'}</td>
              </tr>
            `).join('') || `<tr><td class="empty">No matching leads</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }

  attachSearchEvents() {
    document.querySelectorAll('[data-search-client]').forEach(el => {
      el.onclick = () => openClientProfileModal(this, el.dataset.searchClient);
    });
  }
}

// Instantiate and start AccountiX
window.accountixApp = new App();
