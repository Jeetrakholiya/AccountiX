'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function VerifyEmailPage() {
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) return setError('Please enter your email address.');

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP.');

      setStep('otp');
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) return setError('Please enter the complete 6-digit OTP.');

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: fullOtp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP.');

      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {step === 'email' && (
          <form onSubmit={handleSendOtp} style={styles.form}>
            <div style={styles.iconCircle}>✉️</div>
            <h2 style={styles.title}>Email Verification</h2>
            <p style={styles.subtitle}>Enter your email address to receive a secure 6-digit one-time passcode.</p>

            {error && <div style={styles.errorBanner}>{error}</div>}

            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              disabled={loading}
            />

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Sending Code...' : 'Send Verification Code ➔'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} style={styles.form}>
            <div style={styles.iconCircle}>🔐</div>
            <h2 style={styles.title}>Enter 6-Digit Code</h2>
            <p style={styles.subtitle}>
              We sent a verification code to <b>{email}</b>.
            </p>

            {error && <div style={styles.errorBanner}>{error}</div>}

            <div style={styles.otpGrid} onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  style={styles.otpBox}
                  disabled={loading}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <button type="submit" style={styles.button} disabled={loading || otp.join('').length < 6}>
              {loading ? 'Verifying...' : 'Verify Code ➔'}
            </button>

            <div style={styles.resendRow}>
              {countdown > 0 ? (
                <span style={styles.timerText}>Resend code in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  style={styles.linkButton}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}
              <span>·</span>
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError(null); }}
                style={styles.linkButton}
              >
                Change Email
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...styles.iconCircle, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>✓</div>
            <h2 style={styles.title}>Email Verified!</h2>
            <p style={styles.subtitle}>Your email <b>{email}</b> has been authenticated successfully.</p>
            <button
              onClick={() => window.location.href = '/'}
              style={{ ...styles.button, marginTop: '20px', background: '#10b981' }}
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080a10',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#121826',
    borderRadius: '16px',
    padding: '36px 28px',
    border: '1px solid #222f46',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  iconCircle: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#f8fafc',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: 1.5,
    margin: '0 0 24px 0',
  },
  errorBanner: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    border: '1px solid rgba(244, 63, 94, 0.3)',
    borderRadius: '8px',
    color: '#f43f5e',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '18px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #222f46',
    backgroundColor: '#0e1422',
    color: '#f8fafc',
    fontSize: '15px',
    marginBottom: '18px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  otpGrid: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  otpBox: {
    width: '46px',
    height: '54px',
    fontSize: '24px',
    fontWeight: 800,
    textAlign: 'center',
    borderRadius: '10px',
    border: '1.5px solid #222f46',
    backgroundColor: '#0e1422',
    color: '#f8fafc',
    outline: 'none',
  },
  resendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '20px',
    fontSize: '13px',
    color: '#64748b',
  },
  timerText: {
    color: '#94a3b8',
    fontWeight: 600,
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#818cf8',
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
    fontSize: '13px',
  },
};
