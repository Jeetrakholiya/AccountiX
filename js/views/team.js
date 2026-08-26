/* ==========================================================================
   AccountiX — Team, Attendance & Smart Payroll Engine View
   ========================================================================== */

import { store, STAFF_ROLES } from '../store.js';
import { uid, fmtMoney, fmtDate, todayStr, currentYM, esc } from '../utils/formatters.js';

export function renderTeam() {
  const currentTab = store.state._teamTab || 'staff';
  const staff = store.state.staff;

  const totalMonthlyPayroll = staff.reduce((s, st) => s + (Number(st.baseSalary) || 0), 0);

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">Team & Payroll Operations</h1>
        <p class="view-sub">Total Monthly Fixed Payroll Commitment: <b class="mono" style="color:var(--brand-light);">${fmtMoney(totalMonthlyPayroll)}</b></p>
      </div>
      <button class="btn btn-primary" id="newStaffBtn">
        <span>+</span> Add Team Member
      </button>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <div class="tab ${currentTab === 'staff' ? 'active' : ''}" data-team-tab="staff">
        <span>👥</span> Staff Roster (${staff.length})
      </div>
      <div class="tab ${currentTab === 'attendance' ? 'active' : ''}" data-team-tab="attendance">
        <span>🕒</span> Daily Attendance
      </div>
      <div class="tab ${currentTab === 'payroll' ? 'active' : ''}" data-team-tab="payroll">
        <span>💵</span> Payroll & Salary Ledger
      </div>
    </div>

    ${currentTab === 'staff' ? renderStaffPanel(staff) : currentTab === 'attendance' ? renderAttendancePanel(staff) : renderPayrollPanel(staff)}
  `;
}

function renderStaffPanel(staff) {
  if (!staff.length) {
    return `<div class="card"><div class="empty">No team members added. Click "+ Add Team Member" to build your roster.</div></div>`;
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Designation / Role</th>
            <th>Contact Phone</th>
            <th>Base Salary (₹/mo)</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${staff.map(s => `
            <tr>
              <td><b>${esc(s.name)}</b></td>
              <td><span class="pill pill-brand">${esc(s.role || 'General Staff')}</span></td>
              <td>${esc(s.phone || '—')}</td>
              <td class="mono font-weight-bold">${fmtMoney(s.baseSalary)}</td>
              <td><span class="pill ${s.status === 'Inactive' ? 'pill-gray' : 'pill-green'}">${s.status || 'Active'}</span></td>
              <td>
                <div style="display: flex; gap: 6px;">
                  <button class="btn btn-signal btn-sm" data-pay-salary="${s.id}">Pay Salary</button>
                  <button class="btn btn-ghost btn-sm" data-edit-staff="${s.id}">Edit</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderAttendancePanel(staff) {
  const today = todayStr();

  return `
    <div class="card" style="margin-bottom: 20px;">
      <div class="card-title">
        <span>Today's Attendance Sheet — ${fmtDate(today)}</span>
        <span class="pill pill-brand">Live Log</span>
      </div>
      <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">
        Click to toggle attendance status for each team member today.
      </p>

      <div class="table-wrap" style="margin-bottom: 0;">
        <table>
          <thead>
            <tr>
              <th>Team Member</th>
              <th>Role</th>
              <th>Status Today</th>
              <th>Punch-In Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${staff.map(s => {
              const rec = store.state.attendance.find(a => a.staffId === s.id && a.date === today);
              const status = rec ? rec.status : 'Unmarked';

              return `
                <tr>
                  <td><b>${esc(s.name)}</b></td>
                  <td>${esc(s.role || '—')}</td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-sm ${status === 'Present' ? 'btn-signal' : 'btn-ghost'}" data-att-set="${s.id}-Present">
                        ✓ Present
                      </button>
                      <button class="btn btn-sm ${status === 'Half Day' ? 'btn-ghost' : 'btn-ghost'}" style="${status === 'Half Day' ? 'background:var(--amber-soft);color:var(--amber);border-color:var(--amber);' : ''}" data-att-set="${s.id}-Half Day">
                        ½ Half Day
                      </button>
                      <button class="btn btn-sm ${status === 'Absent' ? 'btn-danger-ghost' : 'btn-ghost'}" data-att-set="${s.id}-Absent">
                        ✗ Absent
                      </button>
                    </div>
                  </td>
                  <td class="mono" style="color: var(--muted); font-size: 12px;">
                    ${rec && rec.checkIn ? `🕒 ${rec.checkIn}` : '—'}
                  </td>
                </tr>
              `;
            }).join('') || `<tr><td colspan="4" class="empty">Add team members first.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPayrollPanel(staff) {
  const ym = currentYM();
  const salaryExpensesThisMonth = store.state.expenses
    .filter(e => store.inMonth(e.date, ym) && e.category === 'Salary')
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  return `
    <div class="grid grid-3">
      <div class="card">
        <div class="stat-label">Total Monthly Base Commitment</div>
        <div class="stat-value small">${fmtMoney(staff.reduce((s, st) => s + (Number(st.baseSalary) || 0), 0))}</div>
      </div>
      <div class="card">
        <div class="stat-label">Salaries Disbursed (This Month)</div>
        <div class="stat-value small good">${fmtMoney(salaryExpensesThisMonth)}</div>
      </div>
      <div class="card">
        <div class="stat-label">Pending Payroll (Estimated)</div>
        <div class="stat-value small amber">
          ${fmtMoney(Math.max(0, staff.reduce((s, st) => s + (Number(st.baseSalary) || 0), 0) - salaryExpensesThisMonth))}
        </div>
      </div>
    </div>

    <div class="section-label" style="font-size: 13px; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: 10px;">Staff Salary Actions</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Staff Name</th>
            <th>Role</th>
            <th>Base Salary</th>
            <th>Paid This Month</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${staff.map(s => {
            const paid = store.state.salaryPayments
              .filter(p => p.staffId === s.id && p.month === ym)
              .reduce((sum, p) => sum + (Number(p.finalPayable) || 0), 0);

            return `
              <tr>
                <td><b>${esc(s.name)}</b></td>
                <td>${esc(s.role || '—')}</td>
                <td class="mono">${fmtMoney(s.baseSalary)}</td>
                <td class="mono" style="color:${paid > 0 ? 'var(--signal)' : 'var(--muted)'}; font-weight:700;">
                  ${fmtMoney(paid)}
                </td>
                <td>
                  <button class="btn btn-signal btn-sm" data-pay-salary="${s.id}">
                    Calculate & Pay Salary
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div class="section-label" style="font-size: 13px; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: 10px;">Recent Salary Payments Log</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Disbursed Date</th>
            <th>Team Member</th>
            <th>For Month</th>
            <th>Base</th>
            <th>Incentive</th>
            <th>Advance/Deduction</th>
            <th>Net Paid</th>
          </tr>
        </thead>
        <tbody>
          ${store.state.salaryPayments.slice().reverse().map(sp => {
            const s = store.state.staff.find(st => st.id === sp.staffId);
            return `
              <tr>
                <td>${fmtDate(sp.paidOn)}</td>
                <td><b>${esc(s ? s.name : 'Former Staff')}</b></td>
                <td><span class="pill pill-gray">${sp.month}</span></td>
                <td class="mono">${fmtMoney(sp.base)}</td>
                <td class="mono" style="color:var(--signal);">${sp.incentive ? `+${fmtMoney(sp.incentive)}` : '—'}</td>
                <td class="mono" style="color:var(--danger);">${(sp.advance || sp.deduction) ? `-${fmtMoney((sp.advance || 0) + (sp.deduction || 0))}` : '—'}</td>
                <td class="mono font-weight-bold" style="color:var(--ink);">${fmtMoney(sp.finalPayable)}</td>
              </tr>
            `;
          }).join('') || `<tr><td colspan="7" class="empty">No salary payments logged yet.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

export function openStaffModal(app, staffId = null) {
  const s = staffId ? store.state.staff.find(st => st.id === staffId) : {};

  const html = `
    <div class="modal-header">
      <h3 class="modal-title">${staffId ? 'Edit Team Member' : 'Add Team Member'}</h3>
      <button class="modal-close" onclick="window.closeModal()">✕</button>
    </div>

    <div class="field">
      <label>Full Name *</label>
      <input id="f_st_name" value="${esc(s.name || '')}" placeholder="e.g. Rohan Mehta" required autofocus />
    </div>

    <div class="field-row">
      <div class="field">
        <label>Primary Role</label>
        <select id="f_st_role">
          ${STAFF_ROLES.map(r => `<option ${r === s.role ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Contact Phone</label>
        <input id="f_st_phone" value="${esc(s.phone || '')}" placeholder="e.g. 9820012345" />
      </div>
    </div>

    <div class="field">
      <label>Monthly Base Salary (₹)</label>
      <input type="number" id="f_st_salary" value="${s.baseSalary || 25000}" placeholder="25000" />
    </div>

    <div class="modal-actions">
      ${staffId ? `<button class="btn btn-danger-ghost" id="deleteStaffBtn" style="margin-right:auto;">Delete</button>` : ''}
      <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="saveStaffBtn">Save Staff Member</button>
    </div>
  `;

  app.showModal(html, 500);

  document.getElementById('saveStaffBtn').onclick = () => {
    const name = document.getElementById('f_st_name').value.trim();
    if (!name) {
      app.toast('Staff name is required');
      return;
    }

    if (staffId) {
      const st = store.state.staff.find(i => i.id === staffId);
      if (st) {
        st.name = name;
        st.role = document.getElementById('f_st_role').value;
        st.phone = document.getElementById('f_st_phone').value.trim();
        st.baseSalary = Number(document.getElementById('f_st_salary').value) || 0;
      }
    } else {
      store.state.staff.push({
        id: uid('st'),
        name,
        role: document.getElementById('f_st_role').value,
        phone: document.getElementById('f_st_phone').value.trim(),
        baseSalary: Number(document.getElementById('f_st_salary').value) || 0,
        status: 'Active'
      });
    }

    store.save();
    window.closeModal();
    app.toast(staffId ? 'Staff updated' : 'Staff member added');
    app.render();
  };

  const delBtn = document.getElementById('deleteStaffBtn');
  if (delBtn) {
    delBtn.onclick = () => {
      if (confirm('Remove this staff member?')) {
        store.state.staff = store.state.staff.filter(st => st.id !== staffId);
        store.save();
        window.closeModal();
        app.toast('Staff removed');
        app.render();
      }
    };
  }
}

export function openPaySalaryModal(app, staffId) {
  const s = store.state.staff.find(st => st.id === staffId);
  if (!s) return;

  const html = `
    <div class="modal-header">
      <h3 class="modal-title">Pay Monthly Salary — ${esc(s.name)}</h3>
      <button class="modal-close" onclick="window.closeModal()">✕</button>
    </div>

    <div class="card" style="background:var(--void-2); padding:12px 14px; margin-bottom:14px;">
      <div style="font-size:12px; color:var(--muted);">
        Role: <b>${esc(s.role)}</b> · Contracted Base: <b>${fmtMoney(s.baseSalary)}</b>
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Salary Month</label>
        <input type="month" id="f_sal_month" value="${currentYM()}" />
      </div>
      <div class="field">
        <label>Disbursement Date</label>
        <input type="date" id="f_sal_date" value="${todayStr()}" />
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Base Salary (₹)</label>
        <input type="number" id="f_sal_base" value="${s.baseSalary}" />
      </div>
      <div class="field">
        <label>Performance Incentive (₹)</label>
        <input type="number" id="f_sal_incentive" value="0" />
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Advance Repayment / Deductions (₹)</label>
        <input type="number" id="f_sal_advance" value="0" />
      </div>
      <div class="field">
        <label>Unpaid Leave Deductions (₹)</label>
        <input type="number" id="f_sal_deduction" value="0" />
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
      <button class="btn btn-signal" id="executePaySalaryBtn">Confirm & Pay Salary</button>
    </div>
  `;

  app.showModal(html, 520);

  document.getElementById('executePaySalaryBtn').onclick = () => {
    const base = Number(document.getElementById('f_sal_base').value) || 0;
    const incentive = Number(document.getElementById('f_sal_incentive').value) || 0;
    const advance = Number(document.getElementById('f_sal_advance').value) || 0;
    const deduction = Number(document.getElementById('f_sal_deduction').value) || 0;
    const month = document.getElementById('f_sal_month').value;
    const date = document.getElementById('f_sal_date').value;

    const finalPayable = Math.max(0, base + incentive - advance - deduction);

    // 1. Record in salary ledger
    store.state.salaryPayments.push({
      id: uid('sal'),
      staffId: s.id,
      month,
      base,
      incentive,
      advance,
      deduction,
      finalPayable,
      paidOn: date
    });

    // 2. Auto-record into master company expenses with category 'Salary'
    store.state.expenses.push({
      id: uid('exp'),
      category: 'Salary',
      amount: finalPayable,
      date,
      mode: 'Bank Transfer (NEFT/IMPS/RTGS)',
      note: `Salary (${month}) — ${s.name}`,
      staffId: s.id
    });

    store.save();
    window.closeModal();
    app.toast(`Disbursed ${fmtMoney(finalPayable)} to ${s.name} (auto-logged in Expenses)`);
    app.render();
  };
}

export function attachTeamEvents(app) {
  document.querySelectorAll('[data-team-tab]').forEach(el => {
    el.onclick = () => {
      store.state._teamTab = el.dataset.teamTab;
      app.render();
    };
  });

  const nBtn = document.getElementById('newStaffBtn');
  if (nBtn) nBtn.onclick = () => openStaffModal(app);

  document.querySelectorAll('[data-edit-staff]').forEach(el => {
    el.onclick = () => openStaffModal(app, el.dataset.editStaff);
  });

  document.querySelectorAll('[data-pay-salary]').forEach(el => {
    el.onclick = () => openPaySalaryModal(app, el.dataset.paySalary);
  });

  document.querySelectorAll('[data-att-set]').forEach(el => {
    el.onclick = () => {
      const [staffId, status] = el.dataset.attSet.split('-');
      const today = todayStr();
      let rec = store.state.attendance.find(a => a.staffId === staffId && a.date === today);
      if (!rec) {
        rec = { id: uid('att'), staffId, date: today };
        store.state.attendance.push(rec);
      }
      rec.status = status;
      if (status === 'Present' && !rec.checkIn) {
        rec.checkIn = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      }
      store.save();
      app.toast('Attendance logged');
      app.render();
    };
  });
}
