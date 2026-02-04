import type { Message, UserMemory, ConversationState } from '../db/client.js';
interface ConversationContext {
    messages: Message[];
    memories: UserMemory[];
    displayName: string | null;
}
export declare function getConversationContext(userId: string): Promise<ConversationContext>;
export declare function updateConversationState(userId: string, updates: Partial<ConversationState>): Promise<void>;
export declare function getConversationState(userId: string): Promise<ConversationState | null>;
export declare function clearConversationHistory(userId: string): Promise<void>;
export {};
//# sourceMappingURL=conversation.d.ts.map