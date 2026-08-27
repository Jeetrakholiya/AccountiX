# 🔐 Next.js (App Router) Gmail OTP Authentication

This directory contains the standalone Next.js (TypeScript) implementation for Gmail OTP authentication.

### File Structure:
- `lib/otp.ts`: Cryptographically secure 6-digit OTP generator, SHA-256 hashing, 10-minute expiry, and timing-safe verification.
- `lib/mailer.ts`: Gmail Transporter supporting Google Cloud OAuth 2.0 and SMTP App Password.
- `app/api/send-otp/route.ts`: Serverless API route to generate and send OTP.
- `app/api/verify-otp/route.ts`: Serverless API route to verify OTP.
- `app/verify-email/page.tsx`: Interactive 2-step verification page with 6-box input, auto-focus, paste support, and 60s cooldown timer.

### Environment Variables:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
# Or for OAuth 2.0:
# GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
# GMAIL_CLIENT_SECRET=your-client-secret
# GMAIL_REFRESH_TOKEN=1//04your-refresh-token
```
