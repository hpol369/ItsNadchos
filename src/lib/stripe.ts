import Stripe from 'stripe';

let _stripe: Stripe | null = null;

function getStripe(): Stripe | null {
  if (_stripe) return _stripe;

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return null;
  }

  _stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' });
  return _stripe;
}

export const stripe = { get: getStripe };
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export interface CreateCheckoutParams {
  userId: string;
  tokenId: string;
  packageId: string;
  packageName: string;
  credits: number;
  priceCents: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  url: string;
  sessionId: string;
}

/**
 * Create a Stripe checkout session for credit purchase
 */
export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<CheckoutSessionResult> {
  const stripeClient = stripe.get();
  if (!stripeClient) {
    throw new Error('Stripe not configured');
  }

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: params.packageName,
            description: `${params.credits} Nadchos Credits`,
          },
          unit_amount: params.priceCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      user_id: params.userId,
      token_id: params.tokenId,
      package_id: params.packageId,
      credits: params.credits.toString(),
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return {
    url: session.url,
    sessionId: session.id,
  };
}

/**
 * Verify and parse a Stripe webhook event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripeClient = stripe.get();
  if (!stripeClient) {
    throw new Error('Stripe not configured');
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error('Stripe webhook secret not configured');
  }

  return stripeClient.webhooks.constructEvent(
    payload,
    signature,
    STRIPE_WEBHOOK_SECRET
  );
}
