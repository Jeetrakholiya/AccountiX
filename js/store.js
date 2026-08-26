/* ==========================================================================
   AccountiX — Reactive State Management & Persistence Engine
   ========================================================================== */

import { uid, todayStr, currentYM, daysBetween } from './utils/formatters.js';

const STORAGE_KEY = 'accountix_os_data_v1';

export const DEFAULT_SERVICE_CATALOG = [
  { id: 'srv_1', name: 'Social Media Management (Reels + Posts)', defaultAmount: 45000, cycle: 'Monthly Retainer', description: '12 Reels + 8 Posts + Story sets + Monthly Growth Report' },
  { id: 'srv_2', name: 'Complete Brand Marketing (SMMA)', defaultAmount: 80000, cycle: 'Monthly Retainer', description: 'Full-funnel Social Media, Reels, Meta Ads, and Influencer Collabs' },
  { id: 'srv_3', name: 'Meta & Instagram Ads Management', defaultAmount: 35000, cycle: 'Monthly Retainer', description: 'Ad creative strategy, A/B testing, pixel optimization & ROAS scaling' },
  { id: 'srv_4', name: 'Google Ads & Search Marketing', defaultAmount: 30000, cycle: 'Monthly Retainer', description: 'Search, Display, Performance Max campaigns & keyword bidding' },
  { id: 'srv_5', name: 'Website Design & Development', defaultAmount: 55000, cycle: 'Project-Based', description: 'High-converting custom website/eCommerce store setup' },
  { id: 'srv_6', name: 'Reel Video Production & Editing', defaultAmount: 40000, cycle: 'Monthly Retainer', description: 'Scripting, on-site videographer shoot + 4K reels post-production' },
  { id: 'srv_7', name: 'Search Engine Optimization (SEO)', defaultAmount: 25000, cycle: 'Monthly Retainer', description: 'Technical on-page, off-page backlinks, and local Google Maps ranking' },
  { id: 'srv_8', name: 'Graphic Design & Branding Kit', defaultAmount: 20000, cycle: 'One-Time', description: 'Logo, typography guidelines, brand identity & social media templates' },
  { id: 'srv_9', name: 'Influencer Marketing & PR', defaultAmount: 50000, cycle: 'Campaign-Based', description: 'Creator sourcing, briefing, barter/paid outreach & campaign tracking' }
];

export const EXPENSE_CATEGORIES = [
  'Salary',
  'Office Rent',
  'Electricity & Utilities',
  'Software & SaaS Tools',
  'Shooting Equipment & Gear',
  'Travel & Petrol',
  'Freelancers & Subcontractors',
  'Marketing & Client Ads',
  'Food & Beverages',
  'Legal & Accounting',
  'Miscellaneous'
];

export const CONTENT_TYPES = [
  'Reel Shoot',
  'AI Reel',
  'Reel Edit Only',
  'Carousel / Static Post',
  'Story Set',
  'Meta Ads Creative',
  'YouTube Video',
  'Website Landing Page'
];

export const CONTENT_STATUSES = [
  'Idea',
  'Scripting',
  'Shoot Assigned',
  'Shoot Done',
  'Editing',
  'Edit Done',
  'Client Approval',
  'Approved',
  'Uploaded/Posted'
];

export const STAFF_ROLES = [
  'Video Shooter / Cinematographer',
  'Video Editor',
  'Motion Graphics Designer',
  'Meta Ads Specialist',
  'Google Ads Expert',
  'Full-Stack Web Developer',
  'Telecaller / Sales Executive',
  'Social Media Manager',
  'Account Manager',
  'Creative Director',
  'HR / Operations'
];

export const PAYMENT_MODES = [
  'UPI (GPay / PhonePe / Paytm)',
  'Bank Transfer (NEFT/IMPS/RTGS)',
  'Cash',
  'Cheque',
  'Credit Card / Debit Card'
];

export const LEAD_STAGES = [
  'New',
  'Contacted',
  'Meeting Scheduled',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost'
];

const DEFAULT_SETTINGS = {
  agencyName: 'AccountiX',
  tagline: 'Agency Business OS & Financial Engine',
  phone: '+91 98765 43210',
  email: 'hello@accountix.agency',
  currencySymbol: '₹',
  theme: 'dark'
};

class Store {
  constructor() {
    this.state = {
      clients: [],
      packages: [],
      payments: [],
      expenses: [],
      staff: [],
      attendance: [],
      salaryPayments: [],
      tasks: [],
      contentItems: [],
      leads: [],
      serviceCatalog: [...DEFAULT_SERVICE_CATALOG],
      settings: { ...DEFAULT_SETTINGS },
      view: 'dashboard',
      _search: '',
      _salesTab: 'pipeline',
      _workTab: 'kanban',
      _teamTab: 'staff',
      _moneyTab: 'profit',
      _clientTab: 'clients'
    };
    this.listeners = new Set();
    this.saveTimeout = null;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  async load() {
    try {
      let raw = null;
      if (window.storage && typeof window.storage.get === 'function') {
        const res = await window.storage.get(STORAGE_KEY);
        if (res && res.value) raw = res.value;
      }
      if (!raw && typeof localStorage !== 'undefined') {
        raw = localStorage.getItem(STORAGE_KEY);
      }

      if (raw) {
        const parsed = JSON.parse(raw);
        Object.assign(this.state, parsed);
        if (!this.state.serviceCatalog || !this.state.serviceCatalog.length) {
          this.state.serviceCatalog = [...DEFAULT_SERVICE_CATALOG];
        }
      } else {
        this.seedInitialData();
      }
    } catch (e) {
      console.warn('AccountiX storage load error:', e);
      this.seedInitialData();
    }

    if (this.state.settings && this.state.settings.theme) {
      document.documentElement.setAttribute('data-theme', this.state.settings.theme);
    }

    this.notify();
  }

  save() {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(async () => {
      try {
        const { view, _search, _salesTab, _workTab, _teamTab, _moneyTab, _clientTab, ...persistable } = this.state;
        const serialized = JSON.stringify(persistable);
        
        if (window.storage && typeof window.storage.set === 'function') {
          await window.storage.set(STORAGE_KEY, serialized);
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, serialized);
        }
      } catch (e) {
        console.error('AccountiX storage save error:', e);
      }
    }, 200);
  }

  getServiceCatalog() {
    if (!this.state.serviceCatalog || !this.state.serviceCatalog.length) {
      this.state.serviceCatalog = [...DEFAULT_SERVICE_CATALOG];
    }
    return this.state.serviceCatalog;
  }

  getServiceDefaultPrice(serviceName) {
    const catalog = this.getServiceCatalog();
    const item = catalog.find(s => s.name === serviceName);
    return item ? Number(item.defaultAmount) : 35000;
  }

  clientOutstanding(clientId) {
    const pkgs = this.state.packages.filter(p => p.clientId === clientId && p.status !== 'Cancelled');
    const total = pkgs.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const paid = this.state.payments
      .filter(p => p.clientId === clientId)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return {
      total,
      paid,
      pending: Math.max(0, total - paid)
    };
  }

  activePackage(clientId) {
    const pkgs = this.state.packages
      .filter(p => p.clientId === clientId && p.status !== 'Cancelled')
      .sort((a, b) => new Date(b.endDate || 0) - new Date(a.endDate || 0));
    return pkgs[0] || null;
  }

  inMonth(dateStr, ym) {
    if (!dateStr || !ym) return false;
    return dateStr.slice(0, 7) === ym;
  }

  monthStats(ym = currentYM()) {
    const received = this.state.payments
      .filter(p => this.inMonth(p.date, ym))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const expenses = this.state.expenses
      .filter(e => this.inMonth(e.date, ym))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const salaryExpenses = this.state.expenses
      .filter(e => this.inMonth(e.date, ym) && e.category === 'Salary')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const profit = received - expenses;

    const revenueBooked = this.state.packages
      .filter(p => this.inMonth(p.startDate, ym) && p.status !== 'Cancelled')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const totalOutstanding = this.state.clients
      .filter(c => c.status !== 'Inactive')
      .reduce((sum, c) => sum + this.clientOutstanding(c.id).pending, 0);

    return {
      received,
      expenses,
      salaryExpenses,
      profit,
      revenueBooked,
      totalOutstanding
    };
  }

  seedInitialData() {
    const today = todayStr();
    const ym = currentYM();

    this.state.serviceCatalog = [...DEFAULT_SERVICE_CATALOG];

    const s1 = { id: 'st_1', name: 'Aarav Sharma', role: 'Video Shooter / Cinematographer', phone: '9820011223', baseSalary: 28000, status: 'Active' };
    const s2 = { id: 'st_2', name: 'Rohan Mehta', role: 'Video Editor', phone: '9820022334', baseSalary: 32000, status: 'Active' };
    const s3 = { id: 'st_3', name: 'Pooja Patel', role: 'Meta Ads Specialist', phone: '9820033445', baseSalary: 35000, status: 'Active' };
    const s4 = { id: 'st_4', name: 'Vikram Joshi', role: 'Full-Stack Web Developer', phone: '9820044556', baseSalary: 40000, status: 'Active' };
    const s5 = { id: 'st_5', name: 'Sneha Shah', role: 'Social Media Manager', phone: '9820055667', baseSalary: 25000, status: 'Active' };
    this.state.staff = [s1, s2, s3, s4, s5];

    const c1 = { id: 'cl_1', name: 'Apex Dental Care', company: 'Dr. Nikhil Parekh Clinic', mobile: '9898011223', whatsapp: '9898011223', instagram: '@apexdentalcare', status: 'Active', createdAt: `${ym}-01T10:00:00Z` };
    const c2 = { id: 'cl_2', name: 'UrbanFit Gym & Crossfit', company: 'UrbanFit Sports Pvt Ltd', mobile: '9898022334', whatsapp: '9898022334', instagram: '@urbanfitgym', status: 'Active', createdAt: `${ym}-02T11:00:00Z` };
    const c3 = { id: 'cl_3', name: 'Royal Rajputana Jewellers', company: 'Royal Jewellers & Sons', mobile: '9898033445', whatsapp: '9898033445', instagram: '@royalrajputana', status: 'Active', createdAt: `${ym}-03T12:00:00Z` };
    const c4 = { id: 'cl_4', name: 'The Craft Coffee Roastery', company: 'Craft Bean Hospitality', mobile: '9898044556', whatsapp: '9898044556', instagram: '@thecraftcoffee', status: 'Active', createdAt: `${ym}-04T14:00:00Z` };
    this.state.clients = [c1, c2, c3, c4];

    const p1 = { id: 'pkg_1', clientId: c1.id, serviceType: 'Social Media Management (Reels + Posts)', amount: 45000, startDate: `${ym}-01`, endDate: `${ym}-28`, assignedStaffId: s5.id, status: 'Active' };
    const p2 = { id: 'pkg_2', clientId: c2.id, serviceType: 'Meta & Instagram Ads Management', amount: 35000, startDate: `${ym}-05`, endDate: `${ym}-30`, assignedStaffId: s3.id, status: 'Active' };
    const p3 = { id: 'pkg_3', clientId: c3.id, serviceType: 'Complete Brand Marketing (SMMA)', amount: 80000, startDate: `${ym}-01`, endDate: `${ym}-30`, assignedStaffId: s1.id, status: 'Active' };
    const p4 = { id: 'pkg_4', clientId: c4.id, serviceType: 'Website Design & Development', amount: 55000, startDate: `${ym}-10`, endDate: `${ym}-25`, assignedStaffId: s4.id, status: 'Active' };
    this.state.packages = [p1, p2, p3, p4];

    this.state.payments = [
      { id: 'pay_1', clientId: c1.id, packageId: p1.id, amount: 45000, date: `${ym}-02`, mode: 'UPI (GPay / PhonePe / Paytm)', note: 'Advance full payment' },
      { id: 'pay_2', clientId: c2.id, packageId: p2.id, amount: 20000, date: `${ym}-06`, mode: 'Bank Transfer (NEFT/IMPS/RTGS)', note: 'Part payment' },
      { id: 'pay_3', clientId: c3.id, packageId: p3.id, amount: 50000, date: `${ym}-04`, mode: 'UPI (GPay / PhonePe / Paytm)', note: 'First installment' },
      { id: 'pay_4', clientId: c4.id, packageId: p4.id, amount: 30000, date: `${ym}-11`, mode: 'Bank Transfer (NEFT/IMPS/RTGS)', note: '50% project milestone' }
    ];

    this.state.expenses = [
      { id: 'exp_1', category: 'Office Rent', amount: 22000, date: `${ym}-02`, mode: 'Bank Transfer (NEFT/IMPS/RTGS)', note: 'Studio 304 Rent' },
      { id: 'exp_2', category: 'Electricity & Utilities', amount: 4800, date: `${ym}-07`, mode: 'UPI (GPay / PhonePe / Paytm)', note: 'Office Power & AC' },
      { id: 'exp_3', category: 'Software & SaaS Tools', amount: 8500, date: `${ym}-05`, mode: 'Credit Card / Debit Card', note: 'Adobe CC, Canva, Notion, Midjourney' },
      { id: 'exp_4', category: 'Shooting Equipment & Gear', amount: 3200, date: `${ym}-12`, mode: 'UPI (GPay / PhonePe / Paytm)', note: 'Wireless Lapel Mic Batteries & Diffuser' },
      { id: 'exp_5', category: 'Salary', amount: 32000, date: `${ym}-05`, mode: 'Bank Transfer (NEFT/IMPS/RTGS)', note: 'Salary — Rohan Mehta', staffId: s2.id }
    ];

    this.state.attendance = [
      { id: 'att_1', staffId: s1.id, date: today, status: 'Present', checkIn: '09:45 AM' },
      { id: 'att_2', staffId: s2.id, date: today, status: 'Present', checkIn: '10:05 AM' },
      { id: 'att_3', staffId: s3.id, date: today, status: 'Present', checkIn: '09:30 AM' },
      { id: 'att_4', staffId: s4.id, date: today, status: 'Present', checkIn: '09:50 AM' },
      { id: 'att_5', staffId: s5.id, date: today, status: 'Present', checkIn: '10:00 AM' }
    ];

    this.state.contentItems = [
      { id: 'cnt_1', clientId: c1.id, date: today, type: 'Reel Shoot', topic: '5 Dental Myths Busted by Dr. Nikhil', shootById: s1.id, assignedStaffId: s2.id, status: 'Editing', driveLink: 'https://drive.google.com/drive/folders/sample-apex', caption: 'Are you brushing too hard? 🦷' },
      { id: 'cnt_2', clientId: c2.id, date: today, type: 'Meta Ads Creative', topic: 'Transformation 30-Day Bootcamp Promo', shootById: s1.id, assignedStaffId: s3.id, status: 'Client Approval', driveLink: 'https://drive.google.com/file/sample-urbanfit', caption: 'Join before month end! 💪' },
      { id: 'cnt_3', clientId: c3.id, date: today, type: 'Reel Shoot', topic: 'Handcrafted Bridal Polki Showcase', shootById: s1.id, assignedStaffId: s2.id, status: 'Shoot Done', driveLink: 'https://drive.google.com/drive/folders/royal-jewels' },
      { id: 'cnt_4', clientId: c4.id, date: today, type: 'Website Landing Page', topic: 'Coffee Subscription & Cart Checkout', shootById: '', assignedStaffId: s4.id, status: 'Editing' }
    ];

    this.state.tasks = [
      { id: 'tsk_1', title: 'Schedule shoot with Dr. Nikhil for Saturday 11 AM', clientId: c1.id, assignedTo: s1.id, deadline: today, priority: 'High', status: 'In Progress' },
      { id: 'tsk_2', title: 'Review ROAS for UrbanFit lead gen campaign', clientId: c2.id, assignedTo: s3.id, deadline: today, priority: 'High', status: 'To Do' },
      { id: 'tsk_3', title: 'Finalize payment gateway integration for Craft Coffee', clientId: c4.id, assignedTo: s4.id, deadline: today, priority: 'Medium', status: 'In Progress' }
    ];

    this.state.leads = [
      { id: 'ld_1', name: 'Kabir Varma', business: 'Soul Sanctuary Spa & Wellness', phone: '9877011223', service: 'Social Media Management (Reels + Posts)', budget: 40000, followUpDate: today, status: 'Proposal Sent', createdAt: `${ym}-08` },
      { id: 'ld_2', name: 'Meera Deshmukh', business: 'Artisan Home Decor', phone: '9877022334', service: 'Meta & Instagram Ads Management', budget: 30000, followUpDate: today, status: 'Contacted', createdAt: `${ym}-10` },
      { id: 'ld_3', name: 'Harsh Patel', business: 'Patel Realty Infra', phone: '9877033445', service: 'Complete Brand Marketing (SMMA)', budget: 120000, followUpDate: today, status: 'Negotiation', createdAt: `${ym}-05` }
    ];

    this.save();
  }

  resetAll() {
    this.state.clients = [];
    this.state.packages = [];
    this.state.payments = [];
    this.state.expenses = [];
    this.state.staff = [];
    this.state.attendance = [];
    this.state.salaryPayments = [];
    this.state.tasks = [];
    this.state.contentItems = [];
    this.state.leads = [];
    this.state.serviceCatalog = [...DEFAULT_SERVICE_CATALOG];
    this.state.settings = { ...DEFAULT_SETTINGS };
    this.save();
    this.notify();
  }
}

export const store = new Store();
