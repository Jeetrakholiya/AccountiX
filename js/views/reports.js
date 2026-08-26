/* ==========================================================================
   AccountiX — Business Intelligence, Analytics & Data Export Center View
   ========================================================================== */

import { store } from '../store.js';
import { fmtMoney, fmtMonthYear, esc } from '../utils/formatters.js';
import { downloadJsonBackup, exportToCsv } from '../utils/export.js';

export function renderReports() {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return d.toISOString().slice(0, 7);
  }).reverse();

  const history = months.map(ym => ({
    ym,
    ...store.monthStats(ym)
  }));

  const maxReceived = Math.max(1, ...history.map(h => h.received));

  // Client Revenue Ranking (LTV)
  const clientRankings = store.state.clients.map(c => {
    const totalCollected = store.state.payments
      .filter(p => p.clientId === c.id)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalBilled = store.state.packages
      .filter(p => p.clientId === c.id)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return { client: c, totalCollected, totalBilled };
  }).sort((a, b) => b.totalCollected - a.totalCollected);

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">Business Analytics & Data Center</h1>
        <p class="view-sub">6-Month Financial Trajectory, Client Lifetime Value & Data Portability</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-signal" id="exportFullBackupBtn">⬇️ Download JSON Backup</button>
      </div>
    </div>

    <!-- 6 Months Trajectory Chart -->
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-title">
        <span>📈 6-Month Inflow, Outflow & Owner Realized Profit</span>
      </div>

      <div class="table-wrap" style="margin-bottom: 0;">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Real Collected</th>
              <th>Real Spent</th>
              <th>Owner Profit</th>
              <th style="width: 200px;">Cash Flow Volume</th>
            </tr>
          </thead>
          <tbody>
            ${history.map(h => `
              <tr>
                <td><b>${fmtMonthYear(h.ym)}</b></td>
                <td class="mono" style="color:var(--signal);">${fmtMoney(h.received)}</td>
                <td class="mono" style="color:var(--danger);">${fmtMoney(h.expenses)}</td>
                <td class="mono font-weight-bold" style="color: ${h.profit >= 0 ? 'var(--signal)' : 'var(--danger)'};">
                  ${fmtMoney(h.profit)}
                </td>
                <td>
                  <div class="progress-track" style="height: 10px;">
                    <div class="progress-fill" style="width: ${Math.min(100, Math.round(h.received / maxReceived * 100))}%; background: var(--signal);"></div>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Client LTV Ranking -->
    <div class="grid grid-2">
      <div class="card">
        <div class="card-title">
          <span>🏆 Top Clients by Realized Revenue (LTV)</span>
        </div>
        ${clientRankings.length ? `
          <div class="table-wrap" style="margin-bottom: 0;">
            <table>
              <thead><tr><th>Client</th><th>Total Paid</th><th>Total Contracted</th></tr></thead>
              <tbody>
                ${clientRankings.map(r => `
                  <tr>
                    <td><b>${esc(r.client.name)}</b><div style="font-size:11px; color:var(--muted);">${esc(r.client.company || '')}</div></td>
                    <td class="mono" style="color:var(--signal); font-weight:700;">${fmtMoney(r.totalCollected)}</td>
                    <td class="mono">${fmtMoney(r.totalBilled)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `<div class="empty">No client revenue data yet.</div>`}
      </div>

      <!-- Data Export & Import Center -->
      <div class="card">
        <div class="card-title">
          <span>💾 Data Backup & Portability Center</span>
        </div>
        <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">
          AccountiX saves your data locally with zero cloud dependencies. You can download one-click CSV spreadsheets or a full JSON database snapshot.
        </p>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button class="btn btn-ghost" id="exportClientsCsvBtn" style="justify-content: space-between;">
            <span>📊 Export Clients & Dues (CSV)</span>
            <span>⬇️</span>
          </button>
          <button class="btn btn-ghost" id="exportPaymentsCsvBtn" style="justify-content: space-between;">
            <span>📥 Export Payment Receipts (CSV)</span>
            <span>⬇️</span>
          </button>
          <button class="btn btn-ghost" id="exportExpensesCsvBtn" style="justify-content: space-between;">
            <span>📤 Export Expense Ledger (CSV)</span>
            <span>⬇️</span>
          </button>
          
          <div style="padding-top: 14px; margin-top: 6px; border-top: 1px solid var(--border);">
            <label style="display: block; font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: 8px;">
              Restore Database from JSON Backup
            </label>
            <input type="file" id="restoreBackupFileInput" accept=".json" style="font-size: 12px; color: var(--ink);" />
          </div>
        </div>
      </div>
    </div>
  `;
}

export function attachReportsEvents(app) {
  const bkBtn = document.getElementById('exportFullBackupBtn');
  if (bkBtn) {
    bkBtn.onclick = () => {
      const { view, _search, _salesTab, _workTab, _teamTab, _moneyTab, ...data } = store.state;
      downloadJsonBackup(data);
      app.toast('JSON Backup downloaded');
    };
  }

  const clCsvBtn = document.getElementById('exportClientsCsvBtn');
  if (clCsvBtn) {
    clCsvBtn.onclick = () => {
      const headers = ['ID', 'Client Name', 'Company', 'Mobile', 'WhatsApp', 'Status', 'Total Contracted', 'Total Paid', 'Pending Balance'];
      const rows = store.state.clients.map(c => {
        const out = store.clientOutstanding(c.id);
        return [c.id, c.name, c.company || '', c.mobile || '', c.whatsapp || '', c.status || '', out.total, out.paid, out.pending];
      });
      exportToCsv('AccountiX_Clients.csv', headers, rows);
      app.toast('Clients CSV exported');
    };
  }

  const pyCsvBtn = document.getElementById('exportPaymentsCsvBtn');
  if (pyCsvBtn) {
    pyCsvBtn.onclick = () => {
      const headers = ['Payment ID', 'Client Name', 'Amount', 'Date', 'Payment Mode', 'Note'];
      const rows = store.state.payments.map(p => {
        const c = store.state.clients.find(cl => cl.id === p.clientId);
        return [p.id, c ? c.name : 'Unknown', p.amount, p.date, p.mode || 'Cash', p.note || ''];
      });
      exportToCsv('AccountiX_Payments.csv', headers, rows);
      app.toast('Payments CSV exported');
    };
  }

  const exCsvBtn = document.getElementById('exportExpensesCsvBtn');
  if (exCsvBtn) {
    exCsvBtn.onclick = () => {
      const headers = ['Expense ID', 'Category', 'Amount', 'Date', 'Payment Mode', 'Note'];
      const rows = store.state.expenses.map(e => [e.id, e.category, e.amount, e.date, e.mode || '', e.note || '']);
      exportToCsv('AccountiX_Expenses.csv', headers, rows);
      app.toast('Expenses CSV exported');
    };
  }

  const rFileInput = document.getElementById('restoreBackupFileInput');
  if (rFileInput) {
    rFileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          if (confirm('Restore this database? This will overwrite your current workspace data.')) {
            Object.assign(store.state, parsed);
            store.save();
            app.toast('Database restored successfully');
            app.render();
          }
        } catch (err) {
          alert('Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    };
  }
}
