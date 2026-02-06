import { NextRequest, NextResponse } from 'next/server';
import { validatePurchaseToken, getCreditPackages, getTokenByString, createCreditPurchase } from '@/lib/supabase';
import { createCheckoutSession } from '@/lib/stripe';
import { checkoutSchema, validate } from '@/lib/validation';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitHeaders } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  // Check rate limit
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`checkout:${clientId}`, RATE_LIMITS.checkout);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimitHeaders(rateLimit) }
    );
  }

  try {
    const body = await request.json();

    // Validate request body
    const validationResult = validate(checkoutSchema, body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    const { token, packageId } = validationResult.data;

    // Validate token
    const validation = await validatePurchaseToken(token);
    if (!validation.valid || !validation.userId) {
      return NextResponse.json(
        { error: validation.error || 'Invalid token' },
        { status: 400 }
      );
    }

    // Get package details
    const packages = await getCreditPackages();
    const selectedPackage = packages.find(p => p.id === packageId);

    if (!selectedPackage) {
      return NextResponse.json(
        { error: 'Invalid package' },
        { status: 400 }
      );
    }

    // Get token record for reference
    const tokenRecord = await getTokenByString(token);
    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 400 }
      );
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://itsnadchos.com';

    // Create Stripe checkout session
    const checkoutResult = await createCheckoutSession({
      userId: validation.userId,
      tokenId: tokenRecord.id,
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      credits: selectedPackage.credits,
      priceCents: selectedPackage.price_cents,
      successUrl: `${baseUrl}/buy/success`,
      cancelUrl: `${baseUrl}/buy/cancel`,
    });

    // Create pending purchase record using proper session ID
    await createCreditPurchase({
      userId: validation.userId,
      packageId: selectedPackage.id,
      tokenId: tokenRecord.id,
      stripeSessionId: checkoutResult.sessionId,
      amountCents: selectedPackage.price_cents,
      credits: selectedPackage.credits,
    });

    return NextResponse.json({ url: checkoutResult.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
