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
 * Generate a purchase token for a user
 */
export declare function generatePurchaseToken(userId: string): Promise<GenerateTokenResult>;
/**
 * Validate a purchase token
 */
export declare function validateToken(token: string): Promise<ValidateTokenResult>;
/**
 * Mark a token as used
 */
export declare function markTokenUsed(token: string): Promise<void>;
/**
 * Get token details by token string
 */
export declare function getTokenByString(token: string): Promise<{
    id: string;
    userId: string;
} | null>;
/**
 * Cleanup expired tokens (can be called periodically)
 */
export declare function cleanupExpiredTokens(): Promise<number>;
//# sourceMappingURL=tokens.d.ts.map