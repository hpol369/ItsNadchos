import { supabase } from '../db/client.js';
import { randomBytes } from 'crypto';

// Constants
const TOKEN_EXPIRY_HOURS = 24;
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://itsnadchos.com';

export interface GenerateTokenResult {
  token: string;
  url: string;
  expiresAt: Date;
}

export interface ValidateTokenResult {
  valid: boolean;
  userId?: string;
  error?: string;
}

/**
 * Generate a secure random token
 */
function generateSecureToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Generate a purchase token for a user
 */
export async function generatePurchaseToken(userId: string): Promise<GenerateTokenResult> {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Invalidate any existing unused tokens for this user
  await supabase
    .from('nacho_purchase_tokens')
    .update({ expires_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('used_at', null);

  // Create new token
  await supabase.from('nacho_purchase_tokens').insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  return {
    token,
    url: `${WEBSITE_URL}/buy?token=${token}`,
    expiresAt,
  };
}

/**
 * Validate a purchase token
 */
export async function validateToken(token: string): Promise<ValidateTokenResult> {
  const { data, error } = await supabase
    .from('nacho_purchase_tokens')
    .select('user_id, expires_at, used_at')
    .eq('token', token)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Token not found' };
  }

  if (data.used_at) {
    return { valid: false, error: 'Token already used' };
  }

  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'Token expired' };
  }

  return { valid: true, userId: data.user_id };
}

/**
 * Mark a token as used
 */
export async function markTokenUsed(token: string): Promise<void> {
  await supabase
    .from('nacho_purchase_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token);
}

/**
 * Get token details by token string
 */
export async function getTokenByString(token: string): Promise<{
  id: string;
  userId: string;
} | null> {
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

/**
 * Cleanup expired tokens (can be called periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const { data } = await supabase
    .from('nacho_purchase_tokens')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .is('used_at', null)
    .select('id');

  return data?.length || 0;
}
