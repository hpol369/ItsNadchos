interface FreePhoto {
    id: string;
    storage_path: string;
    description: string | null;
    mood: string;
}
/**
 * Get a random free photo, optionally filtered by mood
 */
export declare function getRandomFreePhoto(mood?: string): Promise<FreePhoto | null>;
/**
 * Get the public URL for a free photo
 */
export declare function getFreePhotoUrl(storagePath: string): string;
/**
 * Decide if bot should send a free photo based on conversation context
 * Returns true roughly 15% of the time when conditions are right
 */
export declare function shouldSendFreePhoto(messageCount: number, lastPhotoSentAt: Date | null, conversationMood: string): boolean;
/**
 * Get a caption for sending a free photo naturally
 */
export declare function getPhotoCaption(description: string | null): string;
export {};
//# sourceMappingURL=freePhotos.d.ts.map