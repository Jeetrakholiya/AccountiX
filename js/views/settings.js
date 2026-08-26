/* ==========================================================================
   AccountiX — Settings & Agency Configuration View
   ========================================================================== */

import { store, SERVICE_TYPES, EXPENSE_CATEGORIES, PAYMENT_MODES, CONTENT_TYPES, STAFF_ROLES } from '../store.js';
import { esc } from '../utils/formatters.js';

export function renderSettings() {
  const s = store.state.settings;

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">Settings & Agency Configuration</h1>
        <p class="view-sub">Branding, Currency, Work Presets & Workspace Data</p>
      </div>
    </div>

    <!-- Agency Identity -->
    <div class="card" style="margin-bottom: 20px;">
      <div class="card-title">
        <span>🏢 Agency Profile & Brand Identity</span>
      </div>

      <div class="field-row">
        <div class="field">
          <label>Agency Name</label>
          <input id="f_set_name" value="${esc(s.agencyName || 'AccountiX')}" />
        </div>
        <div class="field">
          <label>Tagline / Motto</label>
          <input id="f_set_tag" value="${esc(s.tagline || 'Agency Business OS & Financial Engine')}" />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label>Official Phone / WhatsApp</label>
          <input id="f_set_phone" value="${esc(s.phone || '+91 98765 43210')}" />
        </div>
        <div class="field">
          <label>Official Email</label>
          <input id="f_set_email" value="${esc(s.email || 'hello@accountix.agency')}" />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label>Theme Mode</label>
          <select id="f_set_theme">
            <option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>Dark Luxury (Default)</option>
            <option value="light" ${s.theme === 'light' ? 'selected' : ''}>Crisp Light</option>
          </select>
        </div>
        <div class="field">
          <label>Currency Symbol</label>
          <input id="f_set_currency" value="${esc(s.currencySymbol || '₹')}" />
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
        <button class="btn btn-primary" id="saveAgencyProfileBtn">Save Agency Profile</button>
      </div>
    </div>

    <!-- Presets Reference -->
    <div class="grid grid-2">
      <div class="card">
        <div class="card-title"><span>📦 Supported Service Presets</span></div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${SERVICE_TYPES.map(sv => `<span class="pill pill-brand">${esc(sv)}</span>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-title"><span>🎬 Deliverable Types</span></div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${CONTENT_TYPES.map(ct => `<span class="pill pill-gray">${esc(ct)}</span>`).join('')}
        </div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card-title"><span>🧾 Expense Categories</span></div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${EXPENSE_CATEGORIES.map(ec => `<span class="pill pill-gray">${esc(ec)}</span>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-title"><span>💳 Payment Modes</span></div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${PAYMENT_MODES.map(pm => `<span class="pill pill-gray">${esc(pm)}</span>`).join('')}
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="card" style="border-color: var(--danger); margin-top: 20px;">
      <div class="card-title">
        <span style="color: var(--danger);">⚠️ Danger Zone / Data Management</span>
      </div>
      <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">
        Reset all workspace data or reload sample agency mock data.
      </p>

      <div style="display: flex; gap: 10px;">
        <button class="btn btn-danger-ghost" id="wipeAllDataBtn">Wipe All Workspace Data</button>
        <button class="btn btn-ghost" id="reseedMockDataBtn">Reload Sample Agency Data</button>
      </div>
    </div>
  `;
}

export function attachSettingsEvents(app) {
  const saveBtn = document.getElementById('saveAgencyProfileBtn');
  if (saveBtn) {
    saveBtn.onclick = () => {
      const theme = document.getElementById('f_set_theme').value;
      store.state.settings = {
        agencyName: document.getElementById('f_set_name').value.trim() || 'AccountiX',
        tagline: document.getElementById('f_set_tag').value.trim() || 'Agency Business OS',
        phone: document.getElementById('f_set_phone').value.trim(),
        email: document.getElementById('f_set_email').value.trim(),
        currencySymbol: document.getElementById('f_set_currency').value.trim() || '₹',
        theme
      };

      document.documentElement.setAttribute('data-theme', theme);
      store.save();
      app.toast('Settings saved');
      app.render();
    };
  }

  const wipeBtn = document.getElementById('wipeAllDataBtn');
  if (wipeBtn) {
    wipeBtn.onclick = () => {
      if (confirm('Are you sure you want to erase ALL clients, tasks, payments and team data? This cannot be undone.')) {
        store.resetAll();
        app.toast('All data cleared');
        app.render();
      }
    };
  }

  const reseedBtn = document.getElementById('reseedMockDataBtn');
  if (reseedBtn) {
    reseedBtn.onclick = () => {
      if (confirm('Reload realistic sample agency data?')) {
        store.resetAll();
        store.seedInitialData();
        app.toast('Sample data loaded');
        app.render();
      }
    };
  }
}
