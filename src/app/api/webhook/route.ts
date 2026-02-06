import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent, stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import { completeCreditPurchase, markTokenUsed } from '@/lib/supabase';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  // Validate required configuration
  if (!stripe.get()) {
    console.error('Stripe not configured');
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // Validate WEBHOOK_SECRET for bot communication
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Internal webhook secret not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      // Complete the purchase and add credits
      const result = await completeCreditPurchase(
        session.id,
        session.payment_intent as string
      );

      if (result) {
        console.log(`Credits added: ${result.credits} to user ${result.userId}`);

        // Mark token as used (get from metadata)
        const tokenId = session.metadata?.token_id;
        if (tokenId) {
          // We'll need the actual token string, but we can skip this
          // since we track via the purchase record
        }

        // Optionally notify the bot to send a message
        const botWebhookUrl = process.env.BOT_WEBHOOK_URL;
        if (botWebhookUrl) {
          try {
            await fetch(`${botWebhookUrl}/api/credits/add`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${webhookSecret}`,
              },
              body: JSON.stringify({
                userId: result.userId,
                amount: result.credits,
                referenceId: session.id,
              }),
            });
          } catch (notifyError) {
            console.error('Failed to notify bot:', notifyError);
            // Don't fail the webhook for this
          }
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      return NextResponse.json(
        { error: 'Failed to process payment' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
