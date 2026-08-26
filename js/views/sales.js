/* ==========================================================================
   AccountiX — Sales CRM & Pipeline View
   ========================================================================== */

import { store, SERVICE_TYPES, LEAD_STAGES } from '../store.js';
import { uid, fmtMoney, fmtDate, todayStr, esc } from '../utils/formatters.js';
import { sendWaMessage, WA_TEMPLATES } from '../utils/whatsapp.js';
import { openNewClientModal } from './clients.js';

export function renderSales() {
  const currentTab = store.state._salesTab || 'pipeline';
  const leads = store.state.leads.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const totalPipelineValue = leads
    .filter(l => l.status !== 'Lost' && l.status !== 'Won')
    .reduce((s, l) => s + (Number(l.budget) || 0), 0);

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">Sales CRM & Lead Pipeline</h1>
        <p class="view-sub">Active Pipeline Value: <b class="mono" style="color:var(--signal);">${fmtMoney(totalPipelineValue)}</b></p>
      </div>
      <button class="btn btn-primary" id="newLeadBtn">
        <span>+</span> Add Lead
      </button>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <div class="tab ${currentTab === 'pipeline' ? 'active' : ''}" data-sales-tab="pipeline">
        <span>📊</span> Pipeline Stages
      </div>
      <div class="tab ${currentTab === 'table' ? 'active' : ''}" data-sales-tab="table">
        <span>📋</span> All Leads Table
      </div>
    </div>

    ${currentTab === 'pipeline' ? renderPipelineBoard(leads) : renderLeadsTable(leads)}
  `;
}

function renderPipelineBoard(leads) {
  return `
    <div class="kanban-board">
      ${LEAD_STAGES.map(stage => {
        const stageLeads = leads.filter(l => l.status === stage);
        const stageValue = stageLeads.reduce((s, l) => s + (Number(l.budget) || 0), 0);

        return `
          <div class="kanban-column">
            <div class="kanban-header">
              <div>
                <span>${stage}</span>
                <div style="font-size: 11px; font-weight: normal; color: var(--muted); font-family: 'JetBrains Mono';">
                  ${fmtMoney(stageValue)}
                </div>
              </div>
              <span class="nav-counter">${stageLeads.length}</span>
            </div>
            <div class="kanban-cards-wrap">
              ${stageLeads.map(l => `
                <div class="kanban-card" data-edit-lead="${l.id}">
                  <div class="kanban-card-title">${esc(l.name)}</div>
                  <div class="kanban-card-client">${esc(l.business || 'Individual Lead')}</div>
                  <div style="font-size: 11.5px; color: var(--muted); margin-bottom: 6px;">${esc(l.service || 'General Marketing')}</div>
                  <div class="kanban-card-meta">
                    <span class="mono" style="font-weight: 700; color: var(--ink);">${l.budget ? fmtMoney(l.budget) : '—'}</span>
                    <span>${l.followUpDate ? `📅 ${fmtDate(l.followUpDate)}` : ''}</span>
                  </div>
                  <div style="display: flex; gap: 6px; margin-top: 8px;">
                    ${l.phone ? `<button class="wa-btn btn-sm" style="flex: 1; justify-content: center;" data-wa-lead="${l.id}">WhatsApp</button>` : ''}
                    ${l.status !== 'Won' ? `<button class="btn btn-signal btn-sm" data-convert-lead="${l.id}">Convert</button>` : ''}
                  </div>
                </div>
              `).join('') || `<div class="empty" style="padding: 20px 0; font-size: 12px;">No leads</div>`}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderLeadsTable(leads) {
  if (!leads.length) {
    return `<div class="card"><div class="empty">No leads recorded yet. Click "+ Add Lead" to get started.</div></div>`;
  }

  const today = todayStr();

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Prospect Name</th>
            <th>Business Entity</th>
            <th>Target Service</th>
            <th>Estimated Budget</th>
            <th>Follow-up Due</th>
            <th>Pipeline Stage</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${leads.map(l => {
            const isDue = l.followUpDate && l.followUpDate <= today && l.status !== 'Won' && l.status !== 'Lost';

            return `
              <tr>
                <td>
                  <b>${esc(l.name)}</b>
                  <div style="font-size: 11.5px; color: var(--muted);">${esc(l.phone || '')}</div>
                </td>
                <td>${esc(l.business || '—')}</td>
                <td>${esc(l.service || '—')}</td>
                <td class="mono font-weight-bold">${l.budget ? fmtMoney(l.budget) : '—'}</td>
                <td style="color: ${isDue ? 'var(--danger)' : 'inherit'}; font-weight: ${isDue ? '700' : 'normal'};">
                  ${l.followUpDate ? fmtDate(l.followUpDate) : '—'}
                  ${isDue ? '<span class="pill pill-red" style="margin-left: 4px; font-size: 9.5px;">Due</span>' : ''}
                </td>
                <td>
                  <select class="status-select" data-update-lead-status="${l.id}" style="padding: 5px 8px; font-size: 12px; border-radius: 6px;">
                    ${LEAD_STAGES.map(s => `<option ${s === l.status ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    ${l.phone ? `<button class="wa-btn btn-sm" data-wa-lead="${l.id}">WA Followup</button>` : ''}
                    ${l.status !== 'Won' ? `<button class="btn btn-signal btn-sm" data-convert-lead="${l.id}">Convert</button>` : '<span class="pill pill-green">Converted</span>'}
                    <button class="btn btn-ghost btn-sm" data-edit-lead="${l.id}">Edit</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function openLeadModal(app, leadId = null) {
  const lead = leadId ? store.state.leads.find(l => l.id === leadId) : {};

  const html = `
    <div class="modal-header">
      <h3 class="modal-title">${leadId ? 'Edit Prospect Lead' : 'Add New Prospect Lead'}</h3>
      <button class="modal-close" onclick="window.closeModal()">✕</button>
    </div>

    <div class="field">
      <label>Contact / Decision Maker Name *</label>
      <input id="f_ld_name" value="${esc(lead.name || '')}" placeholder="e.g. Dr. Rajesh Khanna" required autofocus />
    </div>

    <div class="field-row">
      <div class="field">
        <label>Business / Brand Name</label>
        <input id="f_ld_business" value="${esc(lead.business || '')}" placeholder="e.g. Khanna Eye Hospital" />
      </div>
      <div class="field">
        <label>Phone / WhatsApp</label>
        <input id="f_ld_phone" value="${esc(lead.phone || '')}" placeholder="e.g. 9898012345" />
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Service Interested</label>
        <select id="f_ld_service">
          ${SERVICE_TYPES.map(s => `<option ${s === lead.service ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Estimated Monthly Budget (₹)</label>
        <input type="number" id="f_ld_budget" value="${lead.budget || ''}" placeholder="40000" />
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Follow-up Date</label>
        <input type="date" id="f_ld_followup" value="${lead.followUpDate || todayStr()}" />
      </div>
      <div class="field">
        <label>Pipeline Stage</label>
        <select id="f_ld_stage">
          ${LEAD_STAGES.map(st => `<option ${st === lead.status ? 'selected' : ''}>${st}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="field">
      <label>Meeting Notes / Requirements</label>
      <textarea id="f_ld_notes" rows="2" placeholder="Key goals, timeline, and client budget notes...">${esc(lead.notes || '')}</textarea>
    </div>

    <div class="modal-actions">
      ${leadId ? `<button class="btn btn-danger-ghost" id="deleteLeadBtn" style="margin-right:auto;">Delete</button>` : ''}
      <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="saveLeadBtn">Save Lead</button>
    </div>
  `;

  app.showModal(html, 560);

  document.getElementById('saveLeadBtn').onclick = () => {
    const name = document.getElementById('f_ld_name').value.trim();
    if (!name) {
      app.toast('Contact name is required');
      return;
    }

    if (leadId) {
      const l = store.state.leads.find(i => i.id === leadId);
      if (l) {
        l.name = name;
        l.business = document.getElementById('f_ld_business').value.trim();
        l.phone = document.getElementById('f_ld_phone').value.trim();
        l.service = document.getElementById('f_ld_service').value;
        l.budget = Number(document.getElementById('f_ld_budget').value) || 0;
        l.followUpDate = document.getElementById('f_ld_followup').value;
        l.status = document.getElementById('f_ld_stage').value;
        l.notes = document.getElementById('f_ld_notes').value.trim();
      }
    } else {
      store.state.leads.push({
        id: uid('ld'),
        name,
        business: document.getElementById('f_ld_business').value.trim(),
        phone: document.getElementById('f_ld_phone').value.trim(),
        service: document.getElementById('f_ld_service').value,
        budget: Number(document.getElementById('f_ld_budget').value) || 0,
        followUpDate: document.getElementById('f_ld_followup').value,
        status: document.getElementById('f_ld_stage').value,
        notes: document.getElementById('f_ld_notes').value.trim(),
        createdAt: new Date().toISOString()
      });
    }

    store.save();
    window.closeModal();
    app.toast(leadId ? 'Lead updated' : 'Lead created');
    app.render();
  };

  const delBtn = document.getElementById('deleteLeadBtn');
  if (delBtn) {
    delBtn.onclick = () => {
      if (confirm('Delete this lead?')) {
        store.state.leads = store.state.leads.filter(l => l.id !== leadId);
        store.save();
        window.closeModal();
        app.toast('Lead removed');
        app.render();
      }
    };
  }
}

export function attachSalesEvents(app) {
  document.querySelectorAll('[data-sales-tab]').forEach(el => {
    el.onclick = () => {
      store.state._salesTab = el.dataset.salesTab;
      app.render();
    };
  });

  const nBtn = document.getElementById('newLeadBtn');
  if (nBtn) nBtn.onclick = () => openLeadModal(app);

  document.querySelectorAll('[data-edit-lead]').forEach(el => {
    el.onclick = (e) => {
      if (e.target.closest('button') || e.target.closest('select')) return;
      openLeadModal(app, el.dataset.editLead);
    };
  });

  document.querySelectorAll('[data-update-lead-status]').forEach(el => {
    el.onchange = () => {
      const l = store.state.leads.find(i => i.id === el.dataset.updateLeadStatus);
      if (l) {
        l.status = el.value;
        store.save();
        app.toast('Pipeline stage updated');
        app.render();
      }
    };
  });

  document.querySelectorAll('[data-convert-lead]').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const lead = store.state.leads.find(l => l.id === el.dataset.convertLead);
      if (!lead) return;
      lead.status = 'Won';
      store.save();
      openNewClientModal(app, lead);
    };
  });

  document.querySelectorAll('[data-wa-lead]').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const lead = store.state.leads.find(l => l.id === el.dataset.waLead);
      if (!lead) return;
      const msg = WA_TEMPLATES.leadFollowUp(lead.name, lead.service, store.state.settings.agencyName);
      sendWaMessage(lead.phone, msg);
    };
  });
}
