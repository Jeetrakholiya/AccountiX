import nodemailer from 'nodemailer';

const user = process.env.GMAIL_USER;
const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
const appPassword = process.env.GMAIL_APP_PASSWORD;

function createTransporter() {
  if (!user) {
    throw new Error('GMAIL_USER is not defined in environment variables.');
  }

  // 1. OAuth 2.0 (Google Cloud Project)
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

  // 2. SMTP App Password
  if (appPassword) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: appPassword.replace(/\s+/g, ''),
      },
    });
  }

  throw new Error('No valid Gmail credentials found. Set GMAIL_APP_PASSWORD or OAuth 2.0 credentials in .env.');
}

export async function sendOtpEmail(toEmail: string, otp: string): Promise<void> {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"AccountiX Security" <${user}>`,
    to: toEmail,
    subject: `🔐 Your Verification Code: ${otp}`,
    text: `Your verification code is: ${otp}. Valid for 10 minutes. If you did not request this, please ignore.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #080a10; color: #f8fafc; margin: 0; padding: 24px 12px; }
          .card { max-width: 480px; margin: 0 auto; background: #121826; border-radius: 16px; padding: 36px 24px; border: 1px solid #222f46; text-align: center; }
          .badge { display: inline-block; background: rgba(99, 102, 241, 0.15); color: #818cf8; font-weight: 800; font-size: 11px; padding: 5px 12px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 16px; }
          .title { font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 8px 0; }
          .sub { font-size: 14px; color: #94a3b8; line-height: 1.5; margin: 0 0 24px 0; }
          .otp-container { background: #0b0f19; border: 1px dashed #312e81; border-radius: 14px; padding: 20px; margin: 24px 0; }
          .otp-code { font-family: 'Courier New', monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #6366f1; margin: 0; }
          .info { font-size: 13px; color: #64748b; margin-bottom: 20px; }
          .footer { font-size: 11.5px; color: #475569; border-top: 1px solid #1e293b; padding-top: 20px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">Security Verification</span>
          <h1 class="title">Verify Your Email</h1>
          <p class="sub">Use the 6-digit one-time passcode below to verify your account.</p>

          <div class="otp-container">
            <div class="otp-code">${otp}</div>
          </div>

          <p class="info">⏳ This code is valid for <b>10 minutes</b> and can only be used once.</p>

          <div class="footer">
            AccountiX Agency Business OS · Protected with TLS Encryption
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}
