import { supabase } from '../db/client.js';
import { randomBytes } from 'crypto';
// Constants
const TOKEN_EXPIRY_HOURS = 24;
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://itsnadchos.com';
/**
 * Generate a secure random token
 */
function generateSecureToken() {
    return randomBytes(32).toString('base64url');
}
/**
 * Generate a purchase token for a user
 */
export async function generatePurchaseToken(userId) {
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
export async function validateToken(token) {
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
export async function markTokenUsed(token) {
    await supabase
        .from('nacho_purchase_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token);
}
/**
 * Get token details by token string
 */
export async function getTokenByString(token) {
    const { data } = await supabase
        .from('nacho_purchase_tokens')
        .select('id, user_id')
        .eq('token', token)
        .single();
    if (!data)
        return null;
    return {
        id: data.id,
        userId: data.user_id,
    };
}
/**
 * Cleanup expired tokens (can be called periodically)
 */
export async function cleanupExpiredTokens() {
    const { data } = await supabase
        .from('nacho_purchase_tokens')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .select('id');
    return data?.length || 0;
}
//# sourceMappingURL=tokens.js.map