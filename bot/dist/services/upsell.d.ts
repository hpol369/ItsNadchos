import type { ConversationState } from '../db/client.js';
interface UpsellCheck {
    shouldShow: boolean;
    tier: 'tier1' | 'tier2' | null;
}
export declare function shouldShowUpsell(userId: string, totalMessages: number, state: ConversationState): Promise<UpsellCheck>;
export declare function getUpsellMessage(tier: 'tier1' | 'tier2'): string;
export {};
//# sourceMappingURL=upsell.d.ts.map