import crypto from 'crypto';

export interface OtpRecord {
  hashedOtp: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

// In-Memory store for development / single-instance testing.
// In Production on Vercel Serverless: Hook to Upstash Redis or Supabase PostgreSQL
const otpStore = new Map<string, OtpRecord>();

const OTP_EXPIRY_MINUTES = 10;
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Generates a random 6-digit numerical OTP (e.g. "649201")
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * SHA-256 Hash OTP
 */
export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp.trim()).digest('hex');
}

/**
 * Save OTP record with rate limiting & expiry
 */
export function saveOtp(email: string, plainOtp: string): { success: boolean; error?: string } {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = otpStore.get(normalizedEmail);
  const now = Date.now();

  // Rate Limiting: 60s cooldown
  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_SECONDS * 1000) {
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
 * Verify OTP using timing-safe comparison
 */
export function verifyOtp(email: string, plainOtp: string): { valid: boolean; message: string } {
  const normalizedEmail = email.toLowerCase().trim();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return { valid: false, message: 'No active OTP found. Please request a new code.' };
  }

  const now = Date.now();

  // Expiration check
  if (now > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return { valid: false, message: 'OTP has expired. Please request a new code.' };
  }

  // Brute-force max attempts
  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    return { valid: false, message: 'Too many invalid attempts. This OTP has been invalidated.' };
  }

  const inputHash = hashOtp(plainOtp);

  // Timing-safe comparison
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(inputHash, 'hex'),
    Buffer.from(record.hashedOtp, 'hex')
  );

  if (!isMatch) {
    record.attempts += 1;
    const remaining = MAX_VERIFY_ATTEMPTS - record.attempts;
    return { valid: false, message: `Invalid OTP. ${remaining} attempt(s) remaining.` };
  }

  // Delete on success (single-use)
  otpStore.delete(normalizedEmail);
  return { valid: true, message: 'Email verified successfully!' };
}
