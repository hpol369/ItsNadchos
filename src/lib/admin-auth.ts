/**
 * Admin authentication utilities using HMAC-SHA256 signed session cookies.
 * Edge-compatible (uses Web Crypto API).
 */

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SessionPayload {
  exp: number; // Expiration timestamp
}

/**
 * Get the admin session secret from environment variables.
 * Throws if not configured.
 */
function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET not configured');
  }
  return secret;
}

/**
 * Get the admin password from environment variables.
 */
export function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

/**
 * Verify if admin password is configured.
 */
export function isAdminConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD && !!process.env.ADMIN_SESSION_SECRET;
}

/**
 * Sign data using HMAC-SHA256.
 */
async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Verify HMAC-SHA256 signature.
 */
async function verify(data: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await sign(data, secret);
  // Constant-time comparison
  if (signature.length !== expectedSignature.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Create a signed session token.
 */
export async function createSessionToken(): Promise<string> {
  const secret = getSessionSecret();
  const payload: SessionPayload = {
    exp: Date.now() + SESSION_EXPIRY_MS,
  };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = btoa(payloadStr);
  const signature = await sign(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

/**
 * Verify and decode a session token.
 * Returns null if invalid or expired.
 */
export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const secret = getSessionSecret();
    const [payloadB64, signature] = token.split('.');

    if (!payloadB64 || !signature) {
      return false;
    }

    const isValid = await verify(payloadB64, signature, secret);
    if (!isValid) {
      return false;
    }

    const payload: SessionPayload = JSON.parse(atob(payloadB64));
    if (payload.exp < Date.now()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Verify admin password.
 */
export function verifyAdminPassword(password: string): boolean {
  const adminPassword = getAdminPassword();
  if (!adminPassword) {
    return false;
  }
  // Constant-time comparison
  if (password.length !== adminPassword.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < password.length; i++) {
    result |= password.charCodeAt(i) ^ adminPassword.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Get the session cookie name.
 */
export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

/**
 * Check if request has valid admin session from cookie value.
 */
export async function hasValidAdminSession(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) {
    return false;
  }
  return verifySessionToken(cookieValue);
}
