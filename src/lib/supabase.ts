import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }

  if (!supabaseKey) {
    throw new Error('Missing SUPABASE_SERVICE_KEY environment variable');
  }

  _supabase = createClient(supabaseUrl, supabaseKey);
  return _supabase;
}

// Type definitions
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  is_active: boolean;
}

export interface PurchaseToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
}

export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  display_name: string | null;
}

/**
 * Validate a purchase token and get user info
 */
export async function validatePurchaseToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
  user?: User;
  error?: string;
}> {
  const supabase = getSupabase();

  const { data: tokenData, error } = await supabase
    .from('nacho_purchase_tokens')
    .select('user_id, expires_at, used_at')
    .eq('token', token)
    .single();

  if (error || !tokenData) {
    return { valid: false, error: 'Token not found' };
  }

  if (tokenData.used_at) {
    return { valid: false, error: 'Token already used' };
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    return { valid: false, error: 'Token expired' };
  }

  // Get user info
  const { data: user } = await supabase
    .from('nacho_users')
    .select('id, telegram_id, username, display_name')
    .eq('id', tokenData.user_id)
    .single();

  return {
    valid: true,
    userId: tokenData.user_id,
    user: user || undefined,
  };
}

/**
 * Get active credit packages
 */
export async function getCreditPackages(): Promise<CreditPackage[]> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from('nacho_credit_packages')
    .select('*')
    .eq('is_active', true)
    .order('price_cents', { ascending: true });

  return data || [];
}

/**
 * Mark a token as used
 */
export async function markTokenUsed(token: string): Promise<void> {
  const supabase = getSupabase();

  await supabase
    .from('nacho_purchase_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token);
}

/**
 * Create a credit purchase record
 */
export async function createCreditPurchase(params: {
  userId: string;
  packageId: string;
  tokenId: string;
  stripeSessionId: string;
  amountCents: number;
  credits: number;
}): Promise<string> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('nacho_credit_purchases')
    .insert({
      user_id: params.userId,
      package_id: params.packageId,
      token_id: params.tokenId,
      stripe_session_id: params.stripeSessionId,
      amount_cents: params.amountCents,
      credits: params.credits,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error('Failed to create purchase record');
  }

  return data.id;
}

/**
 * Complete a credit purchase and add credits
 */
export async function completeCreditPurchase(
  stripeSessionId: string,
  paymentIntentId: string
): Promise<{ userId: string; credits: number } | null> {
  const supabase = getSupabase();

  // Get purchase record
  const { data: purchase } = await supabase
    .from('nacho_credit_purchases')
    .select('id, user_id, credits, status')
    .eq('stripe_session_id', stripeSessionId)
    .single();

  if (!purchase || purchase.status === 'completed') {
    return null;
  }

  // Update purchase status
  await supabase
    .from('nacho_credit_purchases')
    .update({
      status: 'completed',
      stripe_payment_intent_id: paymentIntentId,
      completed_at: new Date().toISOString(),
    })
    .eq('id', purchase.id);

  // Add credits to user balance
  const { data: credits } = await supabase
    .from('nacho_credits')
    .select('id, balance, lifetime_purchased')
    .eq('user_id', purchase.user_id)
    .single();

  if (credits) {
    await supabase
      .from('nacho_credits')
      .update({
        balance: credits.balance + purchase.credits,
        lifetime_purchased: credits.lifetime_purchased + purchase.credits,
      })
      .eq('id', credits.id);
  } else {
    await supabase.from('nacho_credits').insert({
      user_id: purchase.user_id,
      balance: purchase.credits,
      lifetime_purchased: purchase.credits,
      lifetime_spent: 0,
    });
  }

  // Record transaction
  await supabase.from('nacho_credit_transactions').insert({
    user_id: purchase.user_id,
    amount: purchase.credits,
    type: 'purchase',
    description: 'Credits purchased via Stripe',
    reference_id: stripeSessionId,
  });

  return {
    userId: purchase.user_id,
    credits: purchase.credits,
  };
}

/**
 * Get token by token string for purchase lookup
 */
export async function getTokenByString(token: string): Promise<{
  id: string;
  userId: string;
} | null> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from('nacho_purchase_tokens')
    .select('id, user_id')
    .eq('token', token)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
  };
}
