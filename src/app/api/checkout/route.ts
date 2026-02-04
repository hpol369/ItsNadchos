import { NextRequest, NextResponse } from 'next/server';
import { validatePurchaseToken, getCreditPackages, getTokenByString, createCreditPurchase } from '@/lib/supabase';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, packageId } = body;

    if (!token || !packageId) {
      return NextResponse.json(
        { error: 'Missing token or packageId' },
        { status: 400 }
      );
    }

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
    const checkoutUrl = await createCheckoutSession({
      userId: validation.userId,
      tokenId: tokenRecord.id,
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      credits: selectedPackage.credits,
      priceCents: selectedPackage.price_cents,
      successUrl: `${baseUrl}/buy/success`,
      cancelUrl: `${baseUrl}/buy/cancel`,
    });

    // Create pending purchase record
    await createCreditPurchase({
      userId: validation.userId,
      packageId: selectedPackage.id,
      tokenId: tokenRecord.id,
      stripeSessionId: checkoutUrl.split('cs_')[1]?.split('/')[0] || '',
      amountCents: selectedPackage.price_cents,
      credits: selectedPackage.credits,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
