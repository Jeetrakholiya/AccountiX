import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/otp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body || {};

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Email and 6-digit OTP are required.' }, { status: 400 });
    }

    if (typeof otp !== 'string' || otp.trim().length !== 6) {
      return NextResponse.json({ success: false, error: 'OTP must be exactly 6 digits.' }, { status: 400 });
    }

    const verification = verifyOtp(email, otp);

    if (!verification.valid) {
      return NextResponse.json({ success: false, error: verification.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: verification.message,
      verifiedEmail: email.toLowerCase().trim(),
    });
  } catch (error: any) {
    console.error('Error verifying OTP:', error?.message || error);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
