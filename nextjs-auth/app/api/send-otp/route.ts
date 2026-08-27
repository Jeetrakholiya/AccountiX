import { NextRequest, NextResponse } from 'next/server';
import { generateSecureOtp, saveOtp } from '@/lib/otp';
import { sendOtpEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body || {};

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Valid email is required.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ success: false, error: 'Invalid email address format.' }, { status: 400 });
    }

    const otp = generateSecureOtp();
    const saveResult = saveOtp(email, otp);

    if (!saveResult.success) {
      return NextResponse.json({ success: false, error: saveResult.error }, { status: 429 });
    }

    await sendOtpEmail(email.trim(), otp);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email address.',
    });
  } catch (error: any) {
    console.error('Error sending OTP:', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}
