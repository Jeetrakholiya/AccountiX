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

module.exports = {
  sendOtpEmail,
  createTransporter,
};
