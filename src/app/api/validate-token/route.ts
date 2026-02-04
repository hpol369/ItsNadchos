import { NextRequest, NextResponse } from 'next/server';
import { validatePurchaseToken, getCreditPackages } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { valid: false, error: 'No token provided' },
      { status: 400 }
    );
  }

  try {
    const validation = await validatePurchaseToken(token);

    if (!validation.valid) {
      return NextResponse.json({
        valid: false,
        error: validation.error,
      });
    }

    // Get available credit packages
    const packages = await getCreditPackages();

    return NextResponse.json({
      valid: true,
      userId: validation.userId,
      displayName: validation.user?.display_name || null,
      packages,
    });
  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
