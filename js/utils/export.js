/* ==========================================================================
   AccountiX — Data Export, Backup & Statement Generator
   ========================================================================== */

import { fmtMoney, fmtDate, todayStr } from './formatters.js';

export function downloadJsonBackup(data, filename = `AccountiX_Backup_${todayStr()}.json`) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCsv(filename, headers, rows) {
  const escapeCsv = (val) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printClientStatement(client, packages, payments, outstanding, agencyProfile) {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow popups to print statements.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Statement of Account — ${client.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; color: #1a172a; margin: 40px; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e3dfef; padding-bottom: 20px; margin-bottom: 24px; }
        .brand { font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 800; color: #6c3ce9; }
        .tag { font-size: 12px; color: #7e789a; }
        .meta-box { background: #f6f5fb; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13.5px; }
        th { text-align: left; background: #f6f5fb; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #7e789a; border-bottom: 1px solid #e3dfef; }
        td { padding: 11px 12px; border-bottom: 1px solid #e3dfef; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .summary-box { float: right; width: 280px; margin-top: 10px; }
        .summary-row { display: flex; justify-content: space-between; padding: 6px 0; }
        .summary-row.total { font-weight: 700; border-top: 2px solid #1a172a; font-size: 15px; margin-top: 6px; padding-top: 8px; }
        .clear { clear: both; }
        .footer { margin-top: 60px; text-align: center; color: #7e789a; font-size: 12px; border-top: 1px solid #e3dfef; padding-top: 16px; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px;">
        <button onclick="window.print()" style="padding: 9px 18px; background: #6c3ce9; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Print / Save as PDF</button>
      </div>
      <div class="header">
        <div>
          <div class="brand">${agencyProfile.agencyName || 'AccountiX'}</div>
          <div class="tag">${agencyProfile.tagline || 'Agency Business OS & Financial Engine'}</div>
          <div style="font-size: 12px; color: #7e789a; margin-top: 4px;">Phone: ${agencyProfile.phone || '—'} | Email: ${agencyProfile.email || '—'}</div>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 20px; font-family: 'Space Grotesk';">STATEMENT OF ACCOUNT</h2>
          <div style="font-size: 12px; color: #7e789a;">Date: ${fmtDate(todayStr())}</div>
        </div>
      </div>

      <div class="meta-box">
        <div style="font-size: 11px; text-transform: uppercase; color: #7e789a; font-weight: 700;">Statement For:</div>
        <div style="font-size: 16px; font-weight: 700; color: #1a172a;">${client.name}</div>
        <div style="font-size: 13px; color: #585370;">${client.company || ''} ${client.mobile ? `· ${client.mobile}` : ''}</div>
      </div>

      <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #7e789a; margin-bottom: 8px;">Packages & Services</h3>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Duration</th>
            <th style="text-align: right;">Package Amount</th>
          </tr>
        </thead>
        <tbody>
          ${packages.map(p => `
            <tr>
              <td><b>${p.serviceType}</b></td>
              <td>${fmtDate(p.startDate)} → ${fmtDate(p.endDate)}</td>
              <td class="mono" style="text-align: right;">${fmtMoney(p.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #7e789a; margin-bottom: 8px;">Payments Received</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Payment Mode</th>
            <th style="text-align: right;">Amount Paid</th>
          </tr>
        </thead>
        <tbody>
          ${payments.length ? payments.map(p => `
            <tr>
              <td>${fmtDate(p.date)}</td>
              <td>${p.mode || 'Cash'}</td>
              <td class="mono" style="text-align: right;">${fmtMoney(p.amount)}</td>
            </tr>
          `).join('') : `<tr><td colspan="3" style="text-align: center; color: #7e789a;">No payments recorded</td></tr>`}
        </tbody>
      </table>

      <div class="summary-box">
        <div class="summary-row">
          <span>Total Billed:</span>
          <span class="mono">${fmtMoney(outstanding.total)}</span>
        </div>
        <div class="summary-row">
          <span>Total Received:</span>
          <span class="mono" style="color: #228b22;">${fmtMoney(outstanding.paid)}</span>
        </div>
        <div class="summary-row total">
          <span>Balance Pending:</span>
          <span class="mono" style="color: ${outstanding.pending > 0 ? '#e53935' : '#228b22'};">${fmtMoney(outstanding.pending)}</span>
        </div>
      </div>

      <div class="clear"></div>

      <div class="footer">
        Generated via AccountiX Business Operating System. For queries or payments, contact ${agencyProfile.phone || 'support'}.
      </div>
    </body>
    </html>
  `;

  win.document.write(html);
  win.document.close();
}
