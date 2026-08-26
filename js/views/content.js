/* ==========================================================================
   AccountiX — Content Production & Shoot Pipeline (Kanban + Table)
   ========================================================================== */

import { store, CONTENT_TYPES, CONTENT_STATUSES } from '../store.js';
import { uid, fmtDate, todayStr, esc } from '../utils/formatters.js';
import { sendWaMessage, WA_TEMPLATES } from '../utils/whatsapp.js';

export function renderContent() {
  const currentTab = store.state._workTab || 'kanban';
  const items = store.state.contentItems.slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">Creative Studio & Content Pipeline</h1>
        <p class="view-sub">${items.length} deliverables in creative workflow</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-primary" id="newContentItemBtn">
          <span>+</span> Add Content / Shoot
        </button>
      </div>
    </div>

    <!-- View Switcher Tabs -->
    <div class="tabs">
      <div class="tab ${currentTab === 'kanban' ? 'active' : ''}" data-content-tab="kanban">
        <span>📋</span> Kanban Pipeline
      </div>
      <div class="tab ${currentTab === 'table' ? 'active' : ''}" data-content-tab="table">
        <span>📅</span> List & Schedule
      </div>
    </div>

    ${currentTab === 'kanban' ? renderKanbanView() : renderTableView(items)}
  `;
}

function renderKanbanView() {
  const columns = [
    { status: 'Idea', label: '💡 Ideas & Scripts' },
    { status: 'Shoot Assigned', label: '🎥 Shoot Scheduled' },
    { status: 'Editing', label: '✂️ Post-Production / Editing' },
    { status: 'Client Approval', label: '⏳ Client Approval' },
    { status: 'Uploaded/Posted', label: '🚀 Published' }
  ];

  return `
    <div class="kanban-board">
      ${columns.map(col => {
        const colItems = store.state.contentItems.filter(it => {
          if (col.status === 'Shoot Assigned') return it.status === 'Shoot Assigned' || it.status === 'Shoot Done';
          if (col.status === 'Editing') return it.status === 'Editing' || it.status === 'Edit Done';
          if (col.status === 'Client Approval') return it.status === 'Client Approval' || it.status === 'Approved';
          return it.status === col.status;
        });

        return `
          <div class="kanban-column">
            <div class="kanban-header">
              <span>${col.label}</span>
              <span class="nav-counter">${colItems.length}</span>
            </div>
            <div class="kanban-cards-wrap">
              ${colItems.map(it => {
                const client = store.state.clients.find(c => c.id === it.clientId);
                const shooter = store.state.staff.find(s => s.id === it.shootById);
                const editor = store.state.staff.find(s => s.id === it.assignedStaffId);

                return `
                  <div class="kanban-card" data-edit-content="${it.id}">
                    <div class="kanban-card-title">${esc(it.topic || it.type)}</div>
                    <div class="kanban-card-client">${esc(client ? client.name : 'No client')}</div>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px;">
                      <span class="pill pill-gray" style="font-size: 10px;">${it.type}</span>
                      <span class="pill pill-brand" style="font-size: 10px;">${it.status}</span>
                    </div>
                    <div class="kanban-card-meta">
                      <span>📅 ${fmtDate(it.date)}</span>
                      <span>
                        ${shooter ? `🎥 ${esc(shooter.name.split(' ')[0])}` : ''}
                        ${editor ? `✂️ ${esc(editor.name.split(' ')[0])}` : ''}
                      </span>
                    </div>
                    ${it.status === 'Client Approval' && client ? `
                      <button class="wa-btn btn-sm" style="width: 100%; justify-content: center; margin-top: 8px;" data-wa-approval="${it.id}">
                        WhatsApp Approval
                      </button>
                    ` : ''}
                  </div>
                `;
              }).join('') || `<div class="empty" style="padding: 20px 0; font-size: 12px;">No items</div>`}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderTableView(items) {
  if (!items.length) {
    return `<div class="card"><div class="empty">No content scheduled yet.</div></div>`;
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Scheduled Date</th>
            <th>Deliverable Type</th>
            <th>Topic / Hook</th>
            <th>Videographer</th>
            <th>Video Editor</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(it => {
            const client = store.state.clients.find(c => c.id === it.clientId);
            const shooter = store.state.staff.find(s => s.id === it.shootById);
            const editor = store.state.staff.find(s => s.id === it.assignedStaffId);

            return `
              <tr>
                <td><b>${esc(client ? client.name : '—')}</b></td>
                <td>${fmtDate(it.date)}</td>
                <td><span class="pill pill-gray">${it.type}</span></td>
                <td><b>${esc(it.topic || '—')}</b></td>
                <td>${shooter ? esc(shooter.name) : '<span style="color:var(--muted)">—</span>'}</td>
                <td>${editor ? esc(editor.name) : '<span style="color:var(--muted)">—</span>'}</td>
                <td>
                  <select class="status-select" data-update-content-status="${it.id}" style="padding: 5px 8px; font-size: 12px; border-radius: 6px;">
                    ${CONTENT_STATUSES.map(s => `<option ${s === it.status ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    ${it.driveLink ? `<a href="${it.driveLink}" target="_blank" class="btn btn-ghost btn-sm" title="Open Footage Link">📁 Link</a>` : ''}
                    ${client ? `<button class="wa-btn btn-sm" data-wa-approval="${it.id}">WA Approval</button>` : ''}
                    <button class="btn btn-ghost btn-sm" data-edit-content="${it.id}">Edit</button>
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

export function openContentModal(app, contentId = null) {
  const item = contentId ? store.state.contentItems.find(it => it.id === contentId) : {};

  const html = `
    <div class="modal-header">
      <h3 class="modal-title">${contentId ? 'Edit Deliverable' : 'Schedule New Content / Shoot'}</h3>
      <button class="modal-close" onclick="window.closeModal()">✕</button>
    </div>

    <div class="field">
      <label>Client Account *</label>
      <select id="f_cnt_client">
        ${store.state.clients.map(c => `<option value="${c.id}" ${c.id === item.clientId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
      </select>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Scheduled / Shoot Date</label>
        <input type="date" id="f_cnt_date" value="${item.date || todayStr()}" />
      </div>
      <div class="field">
        <label>Deliverable Type</label>
        <select id="f_cnt_type">
          ${CONTENT_TYPES.map(t => `<option ${t === item.type ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="field">
      <label>Topic / Hook / Concept</label>
      <input id="f_cnt_topic" value="${esc(item.topic || '')}" placeholder="e.g. 5 Signs you need a brand redesign" />
    </div>

    <div class="field-row">
      <div class="field">
        <label>Videographer / Shooter</label>
        <select id="f_cnt_shooter">
          <option value="">— None / In-house —</option>
          ${store.state.staff.map(s => `<option value="${s.id}" ${s.id === item.shootById ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Video Editor / Creator</label>
        <select id="f_cnt_editor">
          <option value="">— None —</option>
          ${store.state.staff.map(s => `<option value="${s.id}" ${s.id === item.assignedStaffId ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="field">
      <label>Workflow Status</label>
      <select id="f_cnt_status">
        ${CONTENT_STATUSES.map(s => `<option ${s === item.status ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>

    <div class="field">
      <label>Raw Footage / Drive / Deliverable Link</label>
      <input id="f_cnt_link" value="${esc(item.driveLink || '')}" placeholder="https://drive.google.com/..." />
    </div>

    <div class="field">
      <label>Caption & Hashtag Notes</label>
      <textarea id="f_cnt_caption" rows="2" placeholder="Write caption draft or key bullet points...">${esc(item.caption || '')}</textarea>
    </div>

    <div class="modal-actions">
      ${contentId ? `<button class="btn btn-danger-ghost" id="deleteContentBtn" style="margin-right:auto;">Delete</button>` : ''}
      <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="saveContentBtn">Save Deliverable</button>
    </div>
  `;

  app.showModal(html, 560);

  document.getElementById('saveContentBtn').onclick = () => {
    const clientId = document.getElementById('f_cnt_client').value;
    if (!clientId) {
      app.toast('Please select a client');
      return;
    }

    if (contentId) {
      const it = store.state.contentItems.find(i => i.id === contentId);
      if (it) {
        it.clientId = clientId;
        it.date = document.getElementById('f_cnt_date').value;
        it.type = document.getElementById('f_cnt_type').value;
        it.topic = document.getElementById('f_cnt_topic').value.trim();
        it.shootById = document.getElementById('f_cnt_shooter').value;
        it.assignedStaffId = document.getElementById('f_cnt_editor').value;
        it.status = document.getElementById('f_cnt_status').value;
        it.driveLink = document.getElementById('f_cnt_link').value.trim();
        it.caption = document.getElementById('f_cnt_caption').value.trim();
      }
    } else {
      store.state.contentItems.push({
        id: uid('cnt'),
        clientId,
        date: document.getElementById('f_cnt_date').value,
        type: document.getElementById('f_cnt_type').value,
        topic: document.getElementById('f_cnt_topic').value.trim(),
        shootById: document.getElementById('f_cnt_shooter').value,
        assignedStaffId: document.getElementById('f_cnt_editor').value,
        status: document.getElementById('f_cnt_status').value,
        driveLink: document.getElementById('f_cnt_link').value.trim(),
        caption: document.getElementById('f_cnt_caption').value.trim()
      });
    }

    store.save();
    window.closeModal();
    app.toast(contentId ? 'Deliverable updated' : 'Deliverable scheduled');
    app.render();
  };

  const delBtn = document.getElementById('deleteContentBtn');
  if (delBtn) {
    delBtn.onclick = () => {
      if (confirm('Delete this deliverable item?')) {
        store.state.contentItems = store.state.contentItems.filter(i => i.id !== contentId);
        store.save();
        window.closeModal();
        app.toast('Item removed');
        app.render();
      }
    };
  }
}

export function attachContentEvents(app) {
  document.querySelectorAll('[data-content-tab]').forEach(el => {
    el.onclick = () => {
      store.state._workTab = el.dataset.contentTab;
      app.render();
    };
  });

  const nBtn = document.getElementById('newContentItemBtn');
  if (nBtn) nBtn.onclick = () => openContentModal(app);

  document.querySelectorAll('[data-edit-content]').forEach(el => {
    el.onclick = (e) => {
      if (e.target.closest('button') || e.target.closest('select')) return;
      openContentModal(app, el.dataset.editContent);
    };
  });

  document.querySelectorAll('[data-update-content-status]').forEach(el => {
    el.onchange = () => {
      const it = store.state.contentItems.find(i => i.id === el.dataset.updateContentStatus);
      if (it) {
        it.status = el.value;
        store.save();
        app.toast('Status updated');
        app.render();
      }
    };
  });

  document.querySelectorAll('[data-wa-approval]').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const it = store.state.contentItems.find(i => i.id === el.dataset.waApproval);
      if (!it) return;
      const client = store.state.clients.find(c => c.id === it.clientId);
      if (!client) return;
      const msg = WA_TEMPLATES.contentApproval(
        client.name,
        it.type,
        it.topic,
        it.driveLink,
        store.state.settings.agencyName
      );
      sendWaMessage(client.whatsapp || client.mobile, msg);
    };
  });
}
