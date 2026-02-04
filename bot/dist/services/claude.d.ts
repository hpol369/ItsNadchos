import type { Message, UserMemory } from '../db/client.js';
interface ConversationContext {
    messages: Message[];
    memories: UserMemory[];
    displayName: string | null;
}
export declare function generateResponse(userMessage: string, context: ConversationContext, currentState: string, relationshipTier: string): Promise<string>;
export {};
//# sourceMappingURL=claude.d.ts.map