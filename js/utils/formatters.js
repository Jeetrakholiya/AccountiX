/* ==========================================================================
   AccountiX — Formatters & Utility Functions
   ========================================================================== */

export const uid = (prefix = 'ax') => `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const currentYM = () => todayStr().slice(0, 7);

export const fmtMoney = (n, symbol = '₹') => {
  const val = Number(n) || 0;
  return `${symbol}${val.toLocaleString('en-IN')}`;
};

export const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return d;
  }
};

export const fmtMonthYear = (ym) => {
  if (!ym) return '—';
  try {
    const [y, m] = ym.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  } catch (e) {
    return ym;
  }
};

export const daysBetween = (a, b) => {
  if (!a || !b) return 0;
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db - da) / 86400000);
};

export const addMonths = (dateStr, n = 1) => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
};

export const sanitizePhone = (phone) => {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.length === 10) clean = '91' + clean;
  return clean;
};

export const esc = (s) => {
  if (s === undefined || s === null) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
};
