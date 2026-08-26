/* ==========================================================================
   AccountiX — Client 360° & Billing Ledger View
   ========================================================================== */

import { store, SERVICE_TYPES } from '../store.js';
import { uid, fmtMoney, fmtDate, todayStr, addMonths, esc } from '../utils/formatters.js';
import { sendWaMessage, WA_TEMPLATES } from '../utils/whatsapp.js';
import { printClientStatement } from '../utils/export.js';

export function renderClients() {
  const clients = store.state.clients.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">Client Directory & Ledgers</h1>
        <p class="view-sub">${clients.length} active and retained accounts</p>
      </div>
      <button class="btn btn-primary" id="newClientBtn">
        <span>+</span> Add Client
      </button>
    </div>

    ${clients.length ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Client / Business</th>
              <th>Active Scope</th>
              <th>Assigned Lead</th>
              <th>Total Billed</th>
              <th>Collected</th>
              <th>Pending Dues</th>
              <th>Renewal Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${clients.map(c => {
              const pkg = store.activePackage(c.id);
              const out = store.clientOutstanding(c.id);
              const assigned = pkg ? store.state.staff.find(s => s.id === pkg.assignedStaffId) : null;

              return `
                <tr class="row-click" data-open-client="${c.id}">
                  <td>
                    <div style="font-weight: 700; font-size: 13.5px; color: var(--ink);">${esc(c.name)}</div>
                    <div style="font-size: 11.5px; color: var(--muted);">${esc(c.company || '')} ${c.mobile ? `· ${c.mobile}` : ''}</div>
                  </td>
                  <td>${pkg ? esc(pkg.serviceType) : '<span style="color:var(--muted)">No active package</span>'}</td>
                  <td>${assigned ? esc(assigned.name) : '<span style="color:var(--muted)">—</span>'}</td>
                  <td class="mono font-weight-bold">${fmtMoney(out.total)}</td>
                  <td class="mono" style="color: var(--signal);">${fmtMoney(out.paid)}</td>
                  <td class="mono" style="color: ${out.pending > 0 ? 'var(--danger)' : 'var(--muted)'}; font-weight: ${out.pending > 0 ? '700' : 'normal'};">
                    ${fmtMoney(out.pending)}
                  </td>
                  <td>${pkg ? fmtDate(pkg.endDate) : '—'}</td>
                  <td>
                    <span class="pill ${c.status === 'Inactive' ? 'pill-gray' : c.status === 'On Hold' ? 'pill-amber' : 'pill-green'}">
                      ${c.status || 'Active'}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <button class="btn btn-ghost btn-sm" data-open-client="${c.id}">View Ledger</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : `
      <div class="card">
        <div class="empty">No clients found. Click "+ Add Client" to onboard your first agency client.</div>
      </div>
    `}
  `;
}

export function openClientProfileModal(app, clientId) {
  const c = store.state.clients.find(c => c.id === clientId);
  if (!c) return;

  const pkgs = store.state.packages.filter(p => p.clientId === clientId).sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
  const pays = store.state.payments.filter(p => p.clientId === clientId).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const tasks = store.state.tasks.filter(t => t.clientId === clientId);
  const out = store.clientOutstanding(clientId);

  const html = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
      <div>
        <h2 style="font-size: 20px; font-weight: 800; color: var(--ink); margin-bottom: 2px;">${esc(c.name)}</h2>
        <div style="font-size: 13px; color: var(--muted);">
          ${esc(c.company || '')} ${c.mobile ? `· 📞 ${c.mobile}` : ''} ${c.instagram ? `· 📸 ${c.instagram}` : ''}
        </div>
      </div>
      <div style="display: flex; gap: 6px;">
        <button class="btn btn-ghost btn-sm" id="printStatementBtn">📄 Statement PDF</button>
        <button class="modal-close" onclick="window.closeModal()">✕</button>
      </div>
    </div>

    <!-- Outstanding Financial Cards -->
    <div class="grid grid-3" style="margin-bottom: 16px;">
      <div class="card" style="padding: 14px 16px;">
        <div class="stat-label">Total Contracted</div>
        <div class="stat-value small">${fmtMoney(out.total)}</div>
      </div>
      <div class="card" style="padding: 14px 16px;">
        <div class="stat-label">Total Collected</div>
        <div class="stat-value small good">${fmtMoney(out.paid)}</div>
      </div>
      <div class="card" style="padding: 14px 16px;">
        <div class="stat-label">Pending Dues</div>
        <div class="stat-value small ${out.pending > 0 ? 'danger' : ''}">${fmtMoney(out.pending)}</div>
      </div>
    </div>

    <!-- Quick Action Bar -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px;">
      <button class="btn btn-signal btn-sm" id="clientAddPaymentBtn">+ Record Payment</button>
      <button class="btn btn-primary btn-sm" id="clientRenewBtn">🔄 Renew Package</button>
      <button class="btn btn-ghost btn-sm" id="clientAddTaskBtn">+ Assign Task</button>
      ${out.pending > 0 ? `
        <button class="wa-btn btn-sm" id="clientWaRemindBtn">
          WhatsApp Due Reminder (${fmtMoney(out.pending)})
        </button>
      ` : ''}
    </div>

    <!-- Packages Section -->
    <div class="section-label" style="font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: 8px;">Packages & Retainers</div>
    <div class="table-wrap" style="margin-bottom: 16px;">
      <table>
        <thead><tr><th>Service Package</th><th>Duration</th><th style="text-align:right;">Amount</th></tr></thead>
        <tbody>
          ${pkgs.map(p => `
            <tr>
              <td><b>${esc(p.serviceType)}</b></td>
              <td>${fmtDate(p.startDate)} → ${fmtDate(p.endDate)}</td>
              <td class="mono" style="text-align:right;">${fmtMoney(p.amount)}</td>
            </tr>
          `).join('') || `<tr><td colspan="3" class="empty">No packages attached.</td></tr>`}
        </tbody>
      </table>
    </div>

    <!-- Payments Section -->
    <div class="section-label" style="font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: 8px;">Payment History</div>
    <div class="table-wrap" style="margin-bottom: 16px;">
      <table>
        <thead><tr><th>Date</th><th>Mode</th><th>Amount</th><th>Action</th></tr></thead>
        <tbody>
          ${pays.map(p => `
            <tr>
              <td>${fmtDate(p.date)}</td>
              <td>${esc(p.mode || 'Cash')}</td>
              <td class="mono" style="color:var(--signal);">${fmtMoney(p.amount)}</td>
              <td>
                <button class="wa-btn btn-sm" data-wa-thanks-pay="${p.id}">
                  WA Receipt
                </button>
              </td>
            </tr>
          `).join('') || `<tr><td colspan="4" class="empty">No payments received yet.</td></tr>`}
        </tbody>
      </table>
    </div>

    <!-- Active Tasks Section -->
    <div class="section-label" style="font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: 8px;">Assigned Tasks</div>
    <div class="table-wrap" style="margin-bottom: 0;">
      <table>
        <thead><tr><th>Task</th><th>Deadline</th><th>Status</th></tr></thead>
        <tbody>
          ${tasks.map(t => `
            <tr>
              <td><b>${esc(t.title)}</b></td>
              <td>${fmtDate(t.deadline)}</td>
              <td><span class="pill pill-gray">${t.status}</span></td>
            </tr>
          `).join('') || `<tr><td colspan="3" class="empty">No active tasks.</td></tr>`}
        </tbody>
      </table>
    </div>

    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="window.closeModal()">Close</button>
    </div>
  `;

  app.showModal(html, 680);

  // Bind Actions inside Client Profile
  const prBtn = document.getElementById('printStatementBtn');
  if (prBtn) {
    prBtn.onclick = () => printClientStatement(c, pkgs, pays, out, store.state.settings);
  }

  const apBtn = document.getElementById('clientAddPaymentBtn');
  if (apBtn) apBtn.onclick = () => app.openPaymentModal(clientId);

  const rnBtn = document.getElementById('clientRenewBtn');
  if (rnBtn) rnBtn.onclick = () => app.openRenewModal(clientId);

  const atBtn = document.getElementById('clientAddTaskBtn');
  if (atBtn) atBtn.onclick = () => app.openTaskModal(clientId);

  const wrBtn = document.getElementById('clientWaRemindBtn');
  if (wrBtn) {
    wrBtn.onclick = () => {
      const pkg = store.activePackage(clientId);
      const msg = WA_TEMPLATES.outstandingReminder(c.name, out.pending, pkg ? pkg.endDate : null, store.state.settings.agencyName);
      sendWaMessage(c.whatsapp || c.mobile, msg);
    };
  }

  document.querySelectorAll('[data-wa-thanks-pay]').forEach(el => {
    el.onclick = () => {
      const pay = store.state.payments.find(p => p.id === el.dataset.waThanksPay);
      if (!pay) return;
      const oNow = store.clientOutstanding(clientId);
      const msg = WA_TEMPLATES.paymentThanks(c.name, pay.amount, pay.date, oNow.pending, store.state.settings.agencyName);
      sendWaMessage(c.whatsapp || c.mobile, msg);
    };
  });
}

export function openNewClientModal(app, prefill = {}) {
  const html = `
    <div class="modal-header">
      <h3 class="modal-title">New Client Onboarding</h3>
      <button class="modal-close" onclick="window.closeModal()">✕</button>
    </div>

    <div class="field">
      <label>Client / Brand Name *</label>
      <input id="f_client_name" value="${esc(prefill.name || '')}" placeholder="e.g. UrbanFit Sports" required autofocus />
    </div>

    <div class="field-row">
      <div class="field">
        <label>Company / Legal Entity</label>
        <input id="f_client_company" value="${esc(prefill.business || '')}" placeholder="e.g. UrbanFit Sports Pvt Ltd" />
      </div>
      <div class="field">
        <label>Mobile Number</label>
        <input id="f_client_mobile" value="${esc(prefill.phone || '')}" placeholder="e.g. 9898012345" />
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label>WhatsApp Number</label>
        <input id="f_client_wa" value="${esc(prefill.phone || '')}" placeholder="e.g. 9898012345" />
      </div>
      <div class="field">
        <label>Instagram Handle</label>
        <input id="f_client_insta" placeholder="e.g. @urbanfit" />
      </div>
    </div>

    <div class="section-label" style="font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; margin: 16px 0 8px 0;">Initial Package / Retainer</div>

    <div class="field">
      <label>Service Scope</label>
      <select id="f_client_service">
        ${SERVICE_TYPES.map(s => `<option ${s === prefill.service ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Start Date</label>
        <input type="date" id="f_client_start" value="${todayStr()}" />
      </div>
      <div class="field">
        <label>Renewal / End Date</label>
        <input type="date" id="f_client_end" value="${addMonths(todayStr(), 1)}" />
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Package Value (₹)</label>
        <input type="number" id="f_client_amount" value="${prefill.budget || 35000}" placeholder="35000" />
      </div>
      <div class="field">
        <label>Advance Received Now (₹)</label>
        <input type="number" id="f_client_received" value="0" placeholder="0" />
      </div>
    </div>

    <div class="field">
      <label>Assigned Account Lead / Specialist</label>
      <select id="f_client_staff">
        <option value="">— None —</option>
        ${store.state.staff.map(s => `<option value="${s.id}">${esc(s.name)} (${esc(s.role)})</option>`).join('')}
      </select>
    </div>

    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="saveNewClientBtn">Save & Onboard Client</button>
    </div>
  `;

  app.showModal(html, 560);

  document.getElementById('saveNewClientBtn').onclick = () => {
    const name = document.getElementById('f_client_name').value.trim();
    if (!name) {
      app.toast('Client name is required');
      return;
    }

    const clientId = uid('cl');
    const newClient = {
      id: clientId,
      name,
      company: document.getElementById('f_client_company').value.trim(),
      mobile: document.getElementById('f_client_mobile').value.trim(),
      whatsapp: document.getElementById('f_client_wa').value.trim(),
      instagram: document.getElementById('f_client_insta').value.trim(),
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    store.state.clients.push(newClient);

    const amount = Number(document.getElementById('f_client_amount').value) || 0;
    const pkgId = uid('pkg');
    store.state.packages.push({
      id: pkgId,
      clientId,
      serviceType: document.getElementById('f_client_service').value,
      amount,
      startDate: document.getElementById('f_client_start').value,
      endDate: document.getElementById('f_client_end').value,
      assignedStaffId: document.getElementById('f_client_staff').value,
      status: 'Active'
    });

    const received = Number(document.getElementById('f_client_received').value) || 0;
    if (received > 0) {
      store.state.payments.push({
        id: uid('pay'),
        clientId,
        packageId: pkgId,
        amount: received,
        date: todayStr(),
        mode: 'UPI (GPay / PhonePe / Paytm)',
        note: 'Initial retainer advance'
      });
    }

    store.save();
    window.closeModal();
    app.toast('Client onboarded successfully');
    app.render();
  };
}

export function attachClientsEvents(app) {
  const nBtn = document.getElementById('newClientBtn');
  if (nBtn) nBtn.onclick = () => openNewClientModal(app);

  document.querySelectorAll('[data-open-client]').forEach(el => {
    el.onclick = () => openClientProfileModal(app, el.dataset.openClient);
  });
}
