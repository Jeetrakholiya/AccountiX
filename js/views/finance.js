/* ==========================================================================
   AccountiX — Financial Ledger, Expenses, Inflows & Cash Profit P&L View
   ========================================================================== */

import { store, EXPENSE_CATEGORIES, PAYMENT_MODES } from '../store.js';
import { uid, fmtMoney, fmtDate, todayStr, currentYM, esc } from '../utils/formatters.js';
import { sendWaMessage, WA_TEMPLATES } from '../utils/whatsapp.js';

export function renderFinance() {
  const currentTab = store.state._moneyTab || 'profit';

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">Financial Ledgers & Cash Engine</h1>
        <p class="view-sub">Realized Cashflow, Expense Controls & Accounts Receivable</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-signal" id="finAddPaymentBtn">+ Record Payment</button>
        <button class="btn btn-primary" id="finAddExpenseBtn">+ Log Expense</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <div class="tab ${currentTab === 'profit' ? 'active' : ''}" data-fin-tab="profit">
        <span>⚡</span> Cash Profit & Loss
      </div>
      <div class="tab ${currentTab === 'income' ? 'active' : ''}" data-fin-tab="income">
        <span>📥</span> Inflow Receipts (${store.state.payments.length})
      </div>
      <div class="tab ${currentTab === 'expenses' ? 'active' : ''}" data-fin-tab="expenses">
        <span>📤</span> Outflow Expenses (${store.state.expenses.length})
      </div>
      <div class="tab ${currentTab === 'outstanding' ? 'active' : ''}" data-fin-tab="outstanding">
        <span>⚠️</span> Receivables Recovery
      </div>
    </div>

    ${currentTab === 'profit' ? renderProfitPanel() : currentTab === 'income' ? renderIncomePanel() : currentTab === 'expenses' ? renderExpensesPanel() : renderOutstandingPanel()}
  `;
}

function renderProfitPanel() {
  const ym = currentYM();
  const m = store.monthStats(ym);

  // Group expenses by category
  const catMap = {};
  store.state.expenses
    .filter(e => store.inMonth(e.date, ym))
    .forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + (Number(e.amount) || 0);
    });

  const catRows = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  return `
    <div class="grid grid-3">
      <div class="card">
        <div class="stat-label">Real Cash Collected (This Month)</div>
        <div class="stat-value good">${fmtMoney(m.received)}</div>
        <div class="stat-footer">Money actually cleared in bank/cash</div>
      </div>
      <div class="card">
        <div class="stat-label">Total Outflows & Payroll</div>
        <div class="stat-value ${m.expenses > 0 ? 'danger' : ''}">${fmtMoney(m.expenses)}</div>
        <div class="stat-footer">Including ${fmtMoney(m.salaryExpenses)} payroll</div>
      </div>
      <div class="card" style="border-color: var(--brand);">
        <div class="stat-label">Realized Cash Profit (Owner Net)</div>
        <div class="stat-value" style="color: var(--signal);">${fmtMoney(m.profit)}</div>
        <div class="stat-footer">Net money retained in agency</div>
      </div>
    </div>

    <!-- Formula Panel -->
    <div class="grid grid-2">
      <div class="card">
        <div class="card-title">
          <span>🧾 Monthly P&L Ledger Breakdown (${ym})</span>
        </div>
        <div class="mono" style="font-size: 13.5px; line-height: 2.2; background: var(--canvas); padding: 18px; border-radius: 10px; border: 1px solid var(--border);">
          <div style="display:flex; justify-content:space-between;">
            <span>(+) Total Client Receipts</span>
            <span style="color:var(--signal); font-weight:700;">${fmtMoney(m.received)}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>(&minus;) Operations & Tools Spent</span>
            <span style="color:var(--danger);">${fmtMoney(m.expenses - m.salaryExpenses)}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>(&minus;) Staff & Freelancer Payroll</span>
            <span style="color:var(--danger);">${fmtMoney(m.salaryExpenses)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; border-top: 1px dashed var(--border); margin-top: 8px; padding-top: 8px; font-size: 15px; font-weight: 800;">
            <span style="color:var(--signal);">(=) Owner Realized Cash Earning</span>
            <span style="color:var(--signal); font-family:'Space Grotesk'; font-size:18px;">${fmtMoney(m.profit)}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>📊 Spend Distribution by Category</span>
        </div>
        ${catRows.length ? `
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${catRows.map(([cat, amount]) => `
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px;">
                  <span><b>${esc(cat)}</b></span>
                  <span class="mono">${fmtMoney(amount)} (${Math.round(amount / (m.expenses || 1) * 100)}%)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width: ${Math.min(100, Math.round(amount / (m.expenses || 1) * 100))}%; background: ${cat === 'Salary' ? 'var(--brand-light)' : 'var(--danger)'};"></div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `<div class="empty">No expenses logged for ${ym}.</div>`}
      </div>
    </div>
  `;
}

function renderIncomePanel() {
  const pays = store.state.payments.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (!pays.length) {
    return `<div class="card"><div class="empty">No payment receipts logged yet. Click "+ Record Payment".</div></div>`;
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date Received</th>
            <th>Client Account</th>
            <th>Payment Mode</th>
            <th>Amount Collected</th>
            <th>Notes</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${pays.map(p => {
            const c = store.state.clients.find(cl => cl.id === p.clientId);
            return `
              <tr>
                <td>${fmtDate(p.date)}</td>
                <td><b>${esc(c ? c.name : 'Unknown Client')}</b></td>
                <td><span class="pill pill-gray">${esc(p.mode || 'Cash')}</span></td>
                <td class="mono font-weight-bold" style="color:var(--signal); font-size:14px;">${fmtMoney(p.amount)}</td>
                <td>${esc(p.note || '—')}</td>
                <td>
                  ${c ? `<button class="wa-btn btn-sm" data-wa-receipt="${p.id}">WA Receipt</button>` : ''}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderExpensesPanel() {
  const exp = store.state.expenses.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (!exp.length) {
    return `<div class="card"><div class="empty">No expenses logged yet. Click "+ Log Expense".</div></div>`;
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date Spent</th>
            <th>Category</th>
            <th>Description / Note</th>
            <th>Payment Mode</th>
            <th>Amount Spent</th>
          </tr>
        </thead>
        <tbody>
          ${exp.map(e => `
            <tr>
              <td>${fmtDate(e.date)}</td>
              <td><span class="pill ${e.category === 'Salary' ? 'pill-brand' : 'pill-gray'}">${esc(e.category)}</span></td>
              <td>${esc(e.note || '—')}</td>
              <td>${esc(e.mode || 'UPI')}</td>
              <td class="mono font-weight-bold" style="color:var(--danger); font-size:14px;">${fmtMoney(e.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderOutstandingPanel() {
  const rows = store.state.clients
    .map(c => ({ client: c, out: store.clientOutstanding(c.id), pkg: store.activePackage(c.id) }))
    .filter(r => r.out.pending > 0)
    .sort((a, b) => b.out.pending - a.out.pending);

  const totalOutstanding = rows.reduce((s, r) => s + r.out.pending, 0);

  return `
    <div class="grid grid-3">
      <div class="card" style="border-color: var(--danger);">
        <div class="stat-label">Total Uncollected Accounts Receivable</div>
        <div class="stat-value danger">${fmtMoney(totalOutstanding)}</div>
        <div class="stat-footer">${rows.length} client accounts with overdue balance</div>
      </div>
    </div>

    ${rows.length ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Client / Business</th>
              <th>Total Billed</th>
              <th>Total Collected</th>
              <th>Pending Overdue</th>
              <th>Package End / Renewal</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>
                  <b>${esc(r.client.name)}</b>
                  <div style="font-size: 11.5px; color: var(--muted);">${esc(r.client.company || '')} ${r.client.mobile ? `· ${r.client.mobile}` : ''}</div>
                </td>
                <td class="mono">${fmtMoney(r.out.total)}</td>
                <td class="mono" style="color:var(--signal);">${fmtMoney(r.out.paid)}</td>
                <td class="mono font-weight-bold" style="color:var(--danger); font-size:14px;">${fmtMoney(r.out.pending)}</td>
                <td>${r.pkg ? fmtDate(r.pkg.endDate) : '—'}</td>
                <td>
                  <button class="wa-btn btn-sm" data-wa-remind-fin="${r.client.id}">
                    Send WhatsApp Reminder
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : `
      <div class="card">
        <div class="empty">All client balances are fully cleared! 🎉</div>
      </div>
    `}
  `;
}

export function openPaymentModal(app, preselectedClientId = null) {
  const html = `
    <div class="modal-header">
      <h3 class="modal-title">Record Client Payment</h3>
      <button class="modal-close" onclick="window.closeModal()">✕</button>
    </div>

    <div class="field">
      <label>Client Account *</label>
      <select id="f_pay_client" ${preselectedClientId ? 'disabled' : ''}>
        ${store.state.clients.map(c => `
          <option value="${c.id}" ${c.id === preselectedClientId ? 'selected' : ''}>
            ${esc(c.name)} (${esc(c.company || 'Individual')})
          </option>
        `).join('')}
      </select>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Amount Received (₹) *</label>
        <input type="number" id="f_pay_amount" placeholder="e.g. 35000" autofocus required />
      </div>
      <div class="field">
        <label>Date Received</label>
        <input type="date" id="f_pay_date" value="${todayStr()}" />
      </div>
    </div>

    <div class="field">
      <label>Payment Mode</label>
      <select id="f_pay_mode">
        ${PAYMENT_MODES.map(m => `<option>${m}</option>`).join('')}
      </select>
    </div>

    <div class="field">
      <label>Reference Note (Optional)</label>
      <input id="f_pay_note" placeholder="e.g. UPI Ref #9382103810 / 50% milestone" />
    </div>

    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
      <button class="btn btn-signal" id="savePaymentRecordBtn">Save & Record Payment</button>
    </div>
  `;

  app.showModal(html, 500);

  document.getElementById('savePaymentRecordBtn').onclick = () => {
    const clientId = preselectedClientId || document.getElementById('f_pay_client').value;
    const amount = Number(document.getElementById('f_pay_amount').value);
    if (!amount || amount <= 0) {
      app.toast('Enter a valid amount received');
      return;
    }

    const pkg = store.activePackage(clientId);
    const payId = uid('pay');
    const payDate = document.getElementById('f_pay_date').value;
    const payMode = document.getElementById('f_pay_mode').value;
    const payNote = document.getElementById('f_pay_note').value.trim();

    store.state.payments.push({
      id: payId,
      clientId,
      packageId: pkg ? pkg.id : null,
      amount,
      date: payDate,
      mode: payMode,
      note: payNote
    });

    store.save();
    window.closeModal();
    app.toast(`Recorded payment of ${fmtMoney(amount)}`);
    app.render();
  };
}

export function openExpenseModal(app) {
  const html = `
    <div class="modal-header">
      <h3 class="modal-title">Log Company Expense</h3>
      <button class="modal-close" onclick="window.closeModal()">✕</button>
    </div>

    <div class="field">
      <label>Expense Category *</label>
      <select id="f_exp_cat">
        ${EXPENSE_CATEGORIES.map(c => `<option>${c}</option>`).join('')}
      </select>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Amount Spent (₹) *</label>
        <input type="number" id="f_exp_amount" placeholder="e.g. 4500" autofocus required />
      </div>
      <div class="field">
        <label>Date</label>
        <input type="date" id="f_exp_date" value="${todayStr()}" />
      </div>
    </div>

    <div class="field">
      <label>Payment Mode</label>
      <select id="f_exp_mode">
        ${PAYMENT_MODES.map(m => `<option>${m}</option>`).join('')}
      </select>
    </div>

    <div class="field">
      <label>Description / Vendor Note</label>
      <input id="f_exp_note" placeholder="e.g. Studio Light Diffuser from Amazon" />
    </div>

    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="saveExpenseRecordBtn">Save Expense</button>
    </div>
  `;

  app.showModal(html, 500);

  document.getElementById('saveExpenseRecordBtn').onclick = () => {
    const amount = Number(document.getElementById('f_exp_amount').value);
    if (!amount || amount <= 0) {
      app.toast('Enter a valid expense amount');
      return;
    }

    store.state.expenses.push({
      id: uid('exp'),
      category: document.getElementById('f_exp_cat').value,
      amount,
      date: document.getElementById('f_exp_date').value,
      mode: document.getElementById('f_exp_mode').value,
      note: document.getElementById('f_exp_note').value.trim()
    });

    store.save();
    window.closeModal();
    app.toast(`Logged expense of ${fmtMoney(amount)}`);
    app.render();
  };
}

export function attachFinanceEvents(app) {
  document.querySelectorAll('[data-fin-tab]').forEach(el => {
    el.onclick = () => {
      store.state._moneyTab = el.dataset.finTab;
      app.render();
    };
  });

  const pBtn = document.getElementById('finAddPaymentBtn');
  if (pBtn) pBtn.onclick = () => openPaymentModal(app);

  const eBtn = document.getElementById('finAddExpenseBtn');
  if (eBtn) eBtn.onclick = () => openExpenseModal(app);

  document.querySelectorAll('[data-wa-receipt]').forEach(el => {
    el.onclick = () => {
      const pay = store.state.payments.find(p => p.id === el.dataset.waReceipt);
      if (!pay) return;
      const client = store.state.clients.find(c => c.id === pay.clientId);
      if (!client) return;
      const oNow = store.clientOutstanding(client.id);
      const msg = WA_TEMPLATES.paymentThanks(client.name, pay.amount, pay.date, oNow.pending, store.state.settings.agencyName);
      sendWaMessage(client.whatsapp || client.mobile, msg);
    };
  });

  document.querySelectorAll('[data-wa-remind-fin]').forEach(el => {
    el.onclick = () => {
      const client = store.state.clients.find(c => c.id === el.dataset.waRemindFin);
      if (!client) return;
      const out = store.clientOutstanding(client.id);
      const pkg = store.activePackage(client.id);
      const msg = WA_TEMPLATES.outstandingReminder(client.name, out.pending, pkg ? pkg.endDate : null, store.state.settings.agencyName);
      sendWaMessage(client.whatsapp || client.mobile, msg);
    };
  });
}
