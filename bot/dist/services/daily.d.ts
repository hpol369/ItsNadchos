import type { UserMemory } from '../db/client.js';
export interface DailyMessageResult {
    message: string;
}
export interface DailyPhotoResult {
    photoId: string;
    storagePath: string;
}
export interface SendNotificationResult {
    success: boolean;
    error?: string;
}
export interface ProcessNotificationsResult {
    processed: number;
    successful: number;
    failed: number;
}
/**
 * Generate a personalized daily message for a user
 */
export declare function generateDailyMessage(userId: string, displayName: string | null, memories: UserMemory[]): Promise<string>;
/**
 * Select a random photo for daily free unlock
 */
export declare function selectDailyFreePhoto(): Promise<DailyPhotoResult | null>;
/**
 * Send daily notification to a specific user
 */
export declare function sendDailyNotification(userId: string, telegramId: number): Promise<SendNotificationResult>;
/**
 * Process daily notifications for all eligible users
 */
export declare function processAllDailyNotifications(): Promise<ProcessNotificationsResult>;
//# sourceMappingURL=daily.d.ts.map