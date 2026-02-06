import { NextRequest, NextResponse } from 'next/server';
import { validatePurchaseToken, getCreditPackages } from '@/lib/supabase';
import { validateTokenSchema, validateQuery } from '@/lib/validation';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitHeaders } from '@/lib/ratelimit';

export async function GET(request: NextRequest) {
  // Check rate limit
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`validate-token:${clientId}`, RATE_LIMITS.validateToken);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { valid: false, error: 'Too many requests' },
      { status: 429, headers: rateLimitHeaders(rateLimit) }
    );
  }

  // Validate query parameters
  const validationResult = validateQuery(
    validateTokenSchema,
    request.nextUrl.searchParams
  );

  if (!validationResult.success) {
    return NextResponse.json(
      { valid: false, error: validationResult.error },
      { status: 400 }
    );
  }

  const { token } = validationResult.data;

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
