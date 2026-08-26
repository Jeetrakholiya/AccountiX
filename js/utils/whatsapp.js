/* ==========================================================================
   AccountiX — WhatsApp Direct Automation Engine
   ========================================================================== */

import { sanitizePhone, fmtMoney, fmtDate } from './formatters.js';

export function buildWaLink(phone, message) {
  const cleanPhone = sanitizePhone(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function sendWaMessage(phone, message) {
  if (!phone) {
    alert('No mobile or WhatsApp number provided for this contact.');
    return;
  }
  const url = buildWaLink(phone, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export const WA_TEMPLATES = {
  paymentThanks(clientName, amount, date, pendingBalance, agencyName = 'AccountiX') {
    let msg = `Hi ${clientName},\n\nThank you for your payment of *${fmtMoney(amount)}* received on ${fmtDate(date)}.\n`;
    if (pendingBalance > 0) {
      msg += `Remaining balance on your account: *${fmtMoney(pendingBalance)}*.\n\n`;
    } else {
      msg += `Your account is fully paid up. Thank you for your partnership!\n\n`;
    }
    msg += `Warm regards,\n*${agencyName}*`;
    return msg;
  },

  outstandingReminder(clientName, pendingAmount, dueDate, agencyName = 'AccountiX') {
    return `Hi ${clientName},\n\nThis is a gentle payment reminder from *${agencyName}*.\n\nAn outstanding balance of *${fmtMoney(pendingAmount)}* is pending on your account${dueDate ? ` (Due date: ${fmtDate(dueDate)})` : ''}.\n\nKindly clear this payment at your earliest convenience so work proceeds without interruption.\n\nThank you!`;
  },

  multiRenewal(clientName, packagesList, totalAmount, dueEndDate, agencyName = 'AccountiX') {
    let msg = `Hi ${clientName},\n\nYour retainer package(s) with *${agencyName}* are due for renewal on *${fmtDate(dueEndDate)}*:\n\n`;
    packagesList.forEach(p => {
      msg += `• *${p.serviceType}*: ${fmtMoney(p.amount)}\n`;
    });
    msg += `\n*Total Renewal Amount: ${fmtMoney(totalAmount)}*\n\nPlease confirm payment to renew for the next cycle without any gap in marketing & content delivery.\n\nThank you!`;
    return msg;
  },

  contentApproval(clientName, contentType, topic, previewUrl, agencyName = 'AccountiX') {
    let msg = `Hi ${clientName},\n\nYour new *${contentType}* ("${topic || 'Untitled'}") is ready for your review!\n\n`;
    if (previewUrl) {
      msg += `Preview Link: ${previewUrl}\n\n`;
    }
    msg += `Please reply with your approval or any revision notes.\n\nBest,\n*${agencyName}*`;
    return msg;
  },

  leadFollowUp(leadName, service, agencyName = 'AccountiX') {
    return `Hi ${leadName},\n\nFollowing up on our conversation regarding *${service || 'our growth marketing services'}* with *${agencyName}*.\n\nWould you be available for a brief 10-minute catchup this week to discuss next steps?\n\nBest regards,\n*${agencyName}*`;
  }
};
