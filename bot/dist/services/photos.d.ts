import type { Context } from 'grammy';
export declare function showPhotoPacks(ctx: Context): Promise<void>;
export declare function sendPackInvoice(ctx: Context, userId: string, packId: string): Promise<void>;
export declare function deliverPhotos(ctx: Context, userId: string, purchaseId: string, packId: string): Promise<void>;
export declare function redeliverPhotos(ctx: Context, userId: string): Promise<void>;
//# sourceMappingURL=photos.d.ts.map