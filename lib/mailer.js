const nodemailer = require('nodemailer');

const user = process.env.GMAIL_USER;
const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
const appPassword = process.env.GMAIL_APP_PASSWORD;

/**
 * Creates Nodemailer Transporter based on provided environment variables
 */
function createTransporter() {
  if (!user) {
    return null; // Dev mode fallback
  }

  // 1. Prioritize OAuth 2.0 if credentials are provided
  if (clientId && clientSecret && refreshToken) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: user,
        clientId: clientId,
        clientSecret: clientSecret,
        refreshToken: refreshToken,
      },
    });
  }

  // 2. Fallback to Gmail SMTP App Password
  if (appPassword) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: appPassword.replace(/\s+/g, ''),
      },
    });
  }

  return null;
}

/**
 * Sends a responsive, professional HTML verification email with the 6-digit OTP
 */
async function sendOtpEmail(toEmail, otp) {
  const transporter = createTransporter();

  // If no Gmail credentials set yet, log to console in development mode
  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`✉️  [DEV MODE] Gmail credentials not set in .env`);
    console.log(`🔑 Verification OTP for ${toEmail}: 👉  ${otp}  👈`);
    console.log(`======================================================\n`);
    return { devMode: true, sent: true };
  }

  const mailOptions = {
    from: `"AccountiX Security" <${user}>`,
    to: toEmail,
    subject: `🔐 Your AccountiX Verification Code: ${otp}`,
    text: `Your AccountiX verification code is: ${otp}. This code is valid for 10 minutes. If you did not request this code, please ignore this email.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080a10; color: #f8fafc; margin: 0; padding: 24px 12px; }
          .card { max-width: 480px; margin: 0 auto; background: #121826; border-radius: 16px; padding: 36px 24px; border: 1px solid #222f46; box-shadow: 0 12px 32px rgba(0,0,0,0.4); text-align: center; }
          .badge { display: inline-block; background: rgba(99, 102, 241, 0.15); color: #818cf8; font-weight: 800; font-size: 11px; padding: 5px 12px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.8px; border: 1px solid rgba(99, 102, 241, 0.3); margin-bottom: 16px; }
          .title { font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 8px 0; }
          .sub { font-size: 14px; color: #94a3b8; line-height: 1.5; margin: 0 0 24px 0; }
          .otp-container { background: #0b0f19; border: 1px dashed #312e81; border-radius: 14px; padding: 20px; margin: 24px 0; box-shadow: inset 0 2px 6px rgba(0,0,0,0.4); }
          .otp-code { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #6366f1; margin: 0; }
          .info { font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 20px; }
          .footer { font-size: 11.5px; color: #475569; border-top: 1px solid #1e293b; padding-top: 20px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">AccountiX Security</span>
          <h1 class="title">Verify Your Email</h1>
          <p class="sub">Enter this 6-digit one-time passcode to authenticate your session.</p>

          <div class="otp-container">
            <div class="otp-code">${otp}</div>
          </div>

          <p class="info">
            ⏳ This code is valid for <b>10 minutes</b> and can only be used once.<br>
            If you did not request this verification code, you can safely ignore this email.
          </p>

          <div class="footer">
            AccountiX Agency Operating System & Financial ERP<br>
            Protected with 256-bit TLS Encryption
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  return { devMode: false, sent: true };
}

/**
 * Sends a welcome invitation email to a newly added employee with their temporary password
 */
async function sendStaffInviteEmail({ toEmail, staffName, role, temporaryPassword, agencyName = 'AccountiX Media HQ', loginUrl = 'https://accountix-phi.vercel.app' }) {
  const transporter = createTransporter();

  // If no Gmail credentials set yet, log to console in development mode
  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`✉️  [DEV MODE] Gmail Staff Invite Triggered`);
    console.log(`👤 Employee: ${staffName} (${role})`);
    console.log(`📧 Email: ${toEmail}`);
    console.log(`🔑 Temporary Password: 👉  ${temporaryPassword}  👈`);
    console.log(`🔗 Login URL: ${loginUrl}`);
    console.log(`======================================================\n`);
    return { devMode: true, sent: true };
  }

  const mailOptions = {
    from: `"${agencyName} via AccountiX" <${user}>`,
    to: toEmail,
    subject: `🎉 Welcome to ${agencyName} — Staff Portal Access & Credentials`,
    text: `Hi ${staffName},\n\nYou have been invited to join ${agencyName} on AccountiX as ${role}.\n\nPortal Login URL: ${loginUrl}\nEmail: ${toEmail}\nTemporary Password: ${temporaryPassword}\n\nPlease use this temporary password to log in for the first time. You can change your password immediately after logging in.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080a10; color: #f8fafc; margin: 0; padding: 24px 12px; }
          .card { max-width: 520px; margin: 0 auto; background: #121826; border-radius: 16px; padding: 36px 26px; border: 1px solid #222f46; box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
          .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 800; font-size: 11px; padding: 5px 12px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.8px; border: 1px solid rgba(16, 185, 129, 0.3); margin-bottom: 16px; }
          .title { font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 8px 0; }
          .sub { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 20px 0; }
          .cred-box { background: #0b0f19; border: 1px solid #222f46; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .cred-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #1e293b; font-size: 13px; }
          .cred-row:last-child { border-bottom: none; }
          .cred-label { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
          .cred-val { color: #f8fafc; font-weight: 700; font-family: monospace; }
          .cred-pass { color: #10b981; font-size: 16px; font-weight: 800; }
          .btn-login { display: block; width: 100%; box-sizing: border-box; text-align: center; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff !important; text-decoration: none; padding: 14px; border-radius: 10px; font-weight: 800; font-size: 14px; margin: 24px 0 16px 0; box-shadow: 0 4px 14px rgba(99,102,241,0.4); }
          .features { background: rgba(99, 102, 241, 0.06); border-radius: 10px; padding: 14px; margin-top: 20px; font-size: 12px; color: #94a3b8; line-height: 1.8; }
          .footer { font-size: 11.5px; color: #475569; border-top: 1px solid #1e293b; padding-top: 20px; margin-top: 24px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="text-align:center;">
            <span class="badge">Team Onboarding</span>
            <h1 class="title">Welcome to ${agencyName}!</h1>
            <p class="sub">Hi <b>${staffName}</b>, you have been invited to join the agency workspace as <b>${role}</b>.</p>
          </div>

          <div class="cred-box">
            <div class="cred-row">
              <span class="cred-label">Login Portal URL</span>
              <span class="cred-val">${loginUrl}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Your Email ID</span>
              <span class="cred-val">${toEmail}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Role Assigned</span>
              <span class="cred-val" style="color:#818cf8;">${role}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Temporary Password</span>
              <span class="cred-val cred-pass">${temporaryPassword}</span>
            </div>
          </div>

          <a href="${loginUrl}" class="btn-login" target="_blank">Sign In to Employee Portal ➔</a>

          <div class="features">
            <b>🚀 What you can do in your Staff Portal:</b><br>
            • 🕒 <b>Daily Punch Clock</b>: Record your attendance & work hours with 1 tap.<br>
            • 🎬 <b>Creative Studio & Tasks</b>: Track client video shoots, editing queues & deadlines.<br>
            • 💵 <b>Salary Slips & Dues</b>: View paid salaries, bonuses & monthly attendance records.<br>
            • 🔐 <b>Change Password</b>: You will be prompted to create your new personal password upon first login.
          </div>

          <div class="footer">
            ${agencyName} · Powered by AccountiX Agency Business OS<br>
            Protected with Enterprise TLS & JWT Security
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  return { devMode: false, sent: true };
}

module.exports = {
  sendOtpEmail,
  sendStaffInviteEmail,
  createTransporter,
};
