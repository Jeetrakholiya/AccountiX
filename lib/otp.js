const crypto = require('crypto');

// In-memory OTP storage with automatic memory cleanup
// In production on Vercel Serverless: Can be hooked to Upstash Redis or Supabase/PostgreSQL
const otpStore = new Map();

const OTP_EXPIRY_MINUTES = 10;
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Generates a random, cryptographically secure 6-digit numerical OTP (e.g., "684920")
 */
function generateSecureOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * SHA-256 Hash OTP so plain text is never stored in DB or memory
 */
function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
}

/**
 * Save OTP record with 60-second cooldown rate limit & 10-minute expiry
 */
function saveOtp(email, plainOtp) {
  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = otpStore.get(normalizedEmail);
  const now = Date.now();

  // Rate Limiting: 60s cooldown between requests
  if (existing && (now - existing.lastSentAt < RESEND_COOLDOWN_SECONDS * 1000)) {
    const waitTime = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (now - existing.lastSentAt)) / 1000);
    return { success: false, error: `Please wait ${waitTime}s before requesting a new code.` };
  }

  otpStore.set(normalizedEmail, {
    hashedOtp: hashOtp(plainOtp),
    expiresAt: now + OTP_EXPIRY_MINUTES * 60 * 1000,
    attempts: 0,
    lastSentAt: now,
  });

  return { success: true };
}

/**
 * Verify OTP using timing-safe comparison to prevent side-channel attacks
 */
function verifyOtp(email, plainOtp) {
  const normalizedEmail = String(email).toLowerCase().trim();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return { valid: false, message: 'No active OTP found. Please request a new code.' };
  }

  const now = Date.now();

  // 1. Check expiration
  if (now > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return { valid: false, message: 'OTP has expired. Please request a new code.' };
  }

  // 2. Check brute-force attempts
  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    return { valid: false, message: 'Too many invalid attempts. This OTP has been invalidated.' };
  }

  const inputHash = hashOtp(plainOtp);

  // 3. Timing-safe comparison
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(inputHash, 'hex'),
    Buffer.from(record.hashedOtp, 'hex')
  );

  if (!isMatch) {
    record.attempts += 1;
    const remaining = MAX_VERIFY_ATTEMPTS - record.attempts;
    return { valid: false, message: `Invalid OTP. ${remaining} attempt(s) remaining.` };
  }

  // 4. Single-use: delete immediately on success
  otpStore.delete(normalizedEmail);
  return { valid: true, message: 'Email verified successfully!' };
}

module.exports = {
  generateSecureOtp,
  hashOtp,
  saveOtp,
  verifyOtp,
  otpStore,
};
