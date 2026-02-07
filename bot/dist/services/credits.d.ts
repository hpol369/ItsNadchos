export declare const FREE_DAILY_MESSAGES = 3;
export declare const CREDITS_PER_MESSAGE = 1;
export declare const CREDITS_PER_PHOTO = 10;
export interface CreditCheckResult {
    allowed: boolean;
    isFreeMessage: boolean;
    balance: number;
    freeRemaining: number;
}
export interface CreditBalance {
    balance: number;
    freeMessagesToday: number;
}
export interface AddCreditsResult {
    newBalance: number;
}
export interface UnlockPhotoResult {
    success: boolean;
    error?: string;
    creditsSpent?: number;
}
/**
 * Initialize credits for a new user
 */
export declare function initializeCredits(userId: string): Promise<void>;
/**
 * Get today's message count for a user
 */
export declare function getTodayMessageCount(userId: string): Promise<number>;
/**
 * Check if user can send a message (free or paid)
 */
export declare function checkMessageCredits(userId: string): Promise<CreditCheckResult>;
/**
 * Increment today's free message count
 */
export declare function incrementTodayMessages(userId: string): Promise<number>;
/**
 * Deduct credits for a message
 */
export declare function deductMessageCredit(userId: string): Promise<void>;
/**
 * Get user's credit balance and free messages remaining
 */
export declare function getCreditBalance(userId: string): Promise<CreditBalance>;
/**
 * Add credits to user's balance
 */
export declare function addCredits(userId: string, amount: number, type: 'purchase' | 'daily_bonus' | 'refund', referenceId?: string): Promise<AddCreditsResult>;
/**
 * Unlock a photo for 10 credits
 */
export declare function unlockPhoto(userId: string, photoId: string): Promise<UnlockPhotoResult>;
/**
 * Get list of unlocked photo IDs for a user
 */
export declare function getUnlockedPhotos(userId: string): Promise<string[]>;
/**
 * Check if a specific photo is unlocked
 */
export declare function isPhotoUnlocked(userId: string, photoId: string): Promise<boolean>;
//# sourceMappingURL=credits.d.ts.map