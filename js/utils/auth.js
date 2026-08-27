/**
 * AccountiX Role-Based Access Control (RBAC) & Google Auth Utility
 */

export const USER_ROLES = {
  SUPER_ADMIN: 'admin',
  AGENCY_MANAGER: 'manager',
  EMPLOYEE: 'employee'
};

export const DEMO_PROFILES = [
  {
    id: 'usr_admin',
    name: 'Platform Administrator',
    email: 'admin@accountix.agency',
    role: USER_ROLES.SUPER_ADMIN,
    companyId: 'comp_1',
    companyName: 'AccountiX Platform HQ',
    title: 'Platform Super Admin',
    avatar: '👑'
  },
  {
    id: 'usr_manager',
    name: 'Jeet Rakholiya',
    email: 'jeet@accountix.agency',
    role: USER_ROLES.AGENCY_MANAGER,
    companyId: 'comp_1',
    companyName: 'AccountiX Media HQ',
    title: 'Agency Managing Director',
    avatar: '🏢'
  },
  {
    id: 'usr_rohan',
    name: 'Rohan Mehta',
    email: 'rohan@accountix.agency',
    role: USER_ROLES.EMPLOYEE,
    staffId: 'st_2',
    companyId: 'comp_1',
    companyName: 'AccountiX Media HQ',
    title: 'Lead Video Editor',
    avatar: '🎬'
  },
  {
    id: 'usr_aarav',
    name: 'Aarav Sharma',
    email: 'aarav@accountix.agency',
    role: USER_ROLES.EMPLOYEE,
    staffId: 'st_1',
    companyId: 'comp_1',
    companyName: 'AccountiX Media HQ',
    title: 'Cinematographer & Shooter',
    avatar: '📹'
  }
];

export function getInactiveUsers(users, dayThreshold = 7) {
  const now = Date.now();
  return users.filter(u => {
    if (!u.lastActiveAt) return true;
    const diffDays = (now - new Date(u.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= dayThreshold;
  });
}

export function generateReEngagementEmail(user, agencyName = 'AccountiX') {
  const subject = `Need a hand getting started with ${agencyName}? 👋`;
  const body = `Hi ${user.name},\n\n` +
    `I noticed you recently joined ${agencyName}, but haven't had a chance to log in and set up your agency client retainers and team workflows yet.\n\n` +
    `We'd love to ensure you get the absolute most value out of the platform. Would you like a quick 10-minute 1-on-1 walkthrough where we help you:\n` +
    `1. Set up your agency rate cards & packages\n` +
    `2. Onboard your active clients & team roster\n` +
    `3. Connect your real-time Supabase cloud database\n\n` +
    `Feel free to reply directly to this email or book a strategy session here.\n\n` +
    `Best regards,\n` +
    `Customer Success Team | ${agencyName}`;

  return {
    subject,
    body,
    mailtoUrl: `mailto:${encodeURIComponent(user.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  };
}
