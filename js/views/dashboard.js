/* ==========================================================================
   AccountiX — Executive Dashboard View
   ========================================================================== */

import { store } from '../store.js';
import { fmtMoney, fmtDate, todayStr, currentYM, daysBetween, esc } from '../utils/formatters.js';
import { sendWaMessage, WA_TEMPLATES } from '../utils/whatsapp.js';

export function renderDashboard() {
  const ym = currentYM();
  const m = store.monthStats(ym);
  const today = todayStr();

  const todaysTasks = store.state.tasks.filter(t => t.deadline === today && t.status !== 'Done');
  const paymentsDue = store.state.clients.filter(c => store.clientOutstanding(c.id).pending > 0);
  const renewals7 = store.state.packages.filter(p => {
    if (!p.endDate || p.status === 'Cancelled') return false;
    const d = daysBetween(today, p.endDate);
    return d >= 0 && d <= 7;
  });
  const pendingWork = store.state.tasks.filter(t => t.status !== 'Done');
  const todaysIncome = store.state.payments
    .filter(p => p.date === today)
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const todaysExpense = store.state.expenses
    .filter(e => e.date === today)
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  
  const presentStaff = store.state.attendance.filter(a => a.date === today && a.status === 'Present');
  const activeClients = store.state.clients.filter(c => c.status !== 'Inactive');

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">Executive Dashboard</h1>
        <p class="view-sub">${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · AccountiX Agency OS</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-signal" id="quickAddPaymentDashBtn">+ Record Payment</button>
        <button class="btn btn-ghost" id="quickAddExpenseDashBtn">+ Add Expense</button>
      </div>
    </div>

    <!-- Owner Realized Cash Profit Hero -->
    <div class="hero-earnings">
      <div class="hero-label">
        <span>⚡</span> This Month's Realized Cash Profit (Owner Earnings)
      </div>
      <div class="hero-value">${fmtMoney(m.profit)}</div>
      <div class="hero-sub">
        Calculated as <b>Real Cash Collected (${fmtMoney(m.received)})</b> minus <b>Actual Expenses & Payroll Paid (${fmtMoney(m.expenses)})</b>.
      </div>
      <div class="hero-stats-row">
        <div class="hero-stat-item">
          Total Collected<b>${fmtMoney(m.received)}</b>
        </div>
        <div class="hero-stat-item">
          Total Spent<b>${fmtMoney(m.expenses)}</b>
        </div>
        <div class="hero-stat-item">
          Pending Receivables<b>${fmtMoney(m.totalOutstanding)}</b>
        </div>
        <div class="hero-stat-item">
          Contracted Value<b>${fmtMoney(m.revenueBooked)}</b>
        </div>
      </div>
    </div>

    <!-- Today's Metric Cards -->
    <div class="section-label" style="font-size: 13px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Today's Operations</div>
    <div class="grid grid-4">
      <div class="card">
        <div class="stat-label">Today's Collections</div>
        <div class="stat-value good">${fmtMoney(todaysIncome)}</div>
        <div class="stat-footer">${store.state.payments.filter(p => p.date === today).length} receipts today</div>
      </div>
      <div class="card">
        <div class="stat-label">Today's Spend</div>
        <div class="stat-value ${todaysExpense > 0 ? 'danger' : ''}">${fmtMoney(todaysExpense)}</div>
        <div class="stat-footer">${store.state.expenses.filter(e => e.date === today).length} expenses logged</div>
      </div>
      <div class="card">
        <div class="stat-label">Renewals (≤7 Days)</div>
        <div class="stat-value ${renewals7.length > 0 ? 'amber' : ''}">${renewals7.length}</div>
        <div class="stat-footer">Clients up for renewal</div>
      </div>
      <div class="card">
        <div class="stat-label">Team Present</div>
        <div class="stat-value">${presentStaff.length} <span style="font-size: 16px; color: var(--muted);">/ ${store.state.staff.length}</span></div>
        <div class="stat-footer">${store.state.staff.length - presentStaff.length} off or unmarked</div>
      </div>
    </div>

    <!-- Today's Creative Activity Feed -->
    <div class="grid grid-2">
      <div class="card">
        <div class="card-title">
          <span>🎬 Content & Shoots Today</span>
          <button class="btn btn-ghost btn-sm" id="dashViewContentBtn">View Calendar</button>
        </div>
        ${renderTodayContentLog()}
      </div>

      <div class="card">
        <div class="card-title">
          <span>⚠️ Urgent Receivables (Top Outstanding)</span>
          <button class="btn btn-ghost btn-sm" id="dashViewMoneyBtn">View All</button>
        </div>
        ${renderTopOutstandingList()}
      </div>
    </div>

    <!-- Renewals Due Soon Table -->
    <div class="card">
      <div class="card-title">
        <span>🔄 Package Renewals (Next 14 Days)</span>
        <span class="pill pill-brand">Auto-alerted</span>
      </div>
      ${renderRenewalsTable(14)}
    </div>
  `;
}

function renderTodayContentLog() {
  const today = todayStr();
  const items = store.state.contentItems.filter(it => it.date === today);
  if (!items.length) {
    return `<div class="empty">No content or shoots scheduled for today.</div>`;
  }

  return `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      ${items.map(it => {
        const client = store.state.clients.find(c => c.id === it.clientId);
        const shooter = store.state.staff.find(s => s.id === it.shootById);
        const editor = store.state.staff.find(s => s.id === it.assignedStaffId);
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--canvas); border-radius: 9px; border: 1px solid var(--border);">
            <div>
              <div style="font-weight: 700; font-size: 13px; color: var(--ink);">${esc(it.topic || it.type)}</div>
              <div style="font-size: 11.5px; color: var(--brand-light);">${esc(client ? client.name : '—')} · <span style="color: var(--muted);">${it.type}</span></div>
            </div>
            <div style="text-align: right;">
              <span class="pill pill-brand">${it.status}</span>
              <div style="font-size: 10.5px; color: var(--muted); margin-top: 4px;">
                ${shooter ? `🎥 ${esc(shooter.name)}` : ''} ${editor ? `✂️ ${esc(editor.name)}` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderTopOutstandingList() {
  const rows = store.state.clients
    .map(c => ({ client: c, out: store.clientOutstanding(c.id) }))
    .filter(r => r.out.pending > 0)
    .sort((a, b) => b.out.pending - a.out.pending)
    .slice(0, 4);

  if (!rows.length) {
    return `<div class="empty">All client balances are fully cleared! 🎉</div>`;
  }

  return `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${rows.map(r => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--canvas); border-radius: 9px; border: 1px solid var(--border);">
          <div>
            <div style="font-weight: 700; font-size: 13px; color: var(--ink);">${esc(r.client.name)}</div>
            <div style="font-size: 11.5px; color: var(--muted);">${esc(r.client.company || '—')}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="mono" style="font-weight: 700; color: var(--danger); font-size: 13.5px;">${fmtMoney(r.out.pending)}</div>
            <button class="wa-btn" data-dash-wa-remind="${r.client.id}">Remind</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderRenewalsTable(days) {
  const today = todayStr();
  const rows = store.state.packages
    .filter(p => p.endDate && p.status !== 'Cancelled' && daysBetween(today, p.endDate) <= days)
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

  if (!rows.length) {
    return `<div class="empty">No packages renewing in the next ${days} days 🎉</div>`;
  }

  return `
    <div class="table-wrap" style="margin-bottom: 0;">
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Package / Scope</th>
            <th>Expiry Date</th>
            <th>Package Value</th>
            <th>Days Left</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(p => {
            const client = store.state.clients.find(c => c.id === p.clientId);
            const d = daysBetween(today, p.endDate);
            let pillClass = 'pill-gray';
            let label = `${d} days left`;
            if (d < 0) { pillClass = 'pill-red'; label = `Expired ${Math.abs(d)}d ago`; }
            else if (d === 0) { pillClass = 'pill-red'; label = 'Expires Today'; }
            else if (d <= 3) { pillClass = 'pill-amber'; label = `${d}d left`; }

            return `
              <tr>
                <td><b>${esc(client ? client.name : '—')}</b></td>
                <td>${esc(p.serviceType)}</td>
                <td>${fmtDate(p.endDate)}</td>
                <td class="mono">${fmtMoney(p.amount)}</td>
                <td><span class="pill ${pillClass}">${label}</span></td>
                <td>
                  ${client ? `
                    <button class="wa-btn" data-dash-wa-renew="${client.id}" data-pkg-service="${esc(p.serviceType)}" data-pkg-amount="${p.amount}" data-pkg-end="${p.endDate}">
                      WhatsApp Renewal
                    </button>
                  ` : '—'}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function attachDashboardEvents(app) {
  const pBtn = document.getElementById('quickAddPaymentDashBtn');
  if (pBtn) pBtn.onclick = () => app.openPaymentModal();

  const eBtn = document.getElementById('quickAddExpenseDashBtn');
  if (eBtn) eBtn.onclick = () => app.openExpenseModal();

  const cBtn = document.getElementById('dashViewContentBtn');
  if (cBtn) cBtn.onclick = () => app.navigate('content');

  const mBtn = document.getElementById('dashViewMoneyBtn');
  if (mBtn) mBtn.onclick = () => {
    store.state._moneyTab = 'outstanding';
    app.navigate('finance');
  };

  document.querySelectorAll('[data-dash-wa-remind]').forEach(el => {
    el.onclick = () => {
      const client = store.state.clients.find(c => c.id === el.dataset.dashWaRemind);
      if (!client) return;
      const out = store.clientOutstanding(client.id);
      const pkg = store.activePackage(client.id);
      const msg = WA_TEMPLATES.outstandingReminder(client.name, out.pending, pkg ? pkg.endDate : null, store.state.settings.agencyName);
      sendWaMessage(client.whatsapp || client.mobile, msg);
    };
  });

  document.querySelectorAll('[data-dash-wa-renew]').forEach(el => {
    el.onclick = () => {
      const client = store.state.clients.find(c => c.id === el.dataset.dashWaRenew);
      if (!client) return;
      const msg = WA_TEMPLATES.packageRenewal(
        client.name,
        el.dataset.pkgService,
        el.dataset.pkgAmount,
        el.dataset.pkgEnd,
        store.state.settings.agencyName
      );
      sendWaMessage(client.whatsapp || client.mobile, msg);
    };
  });
}
