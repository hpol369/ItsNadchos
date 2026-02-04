import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db/client.js';
const anthropic = new Anthropic();
export async function extractMemories(userId, messageId, userMessage) {
    // Skip very short messages
    if (userMessage.length < 10) {
        return;
    }
    try {
        const response = await anthropic.messages.create({
            model: 'claude-haiku-4-20250514',
            max_tokens: 200,
            system: `You extract memorable facts from messages. Return JSON array of memories or empty array if nothing notable.

Format: [{"type": "fact|preference|interest|milestone", "content": "brief statement", "confidence": 0.0-1.0}]

Types:
- fact: Personal info (name, age, location, job, pets)
- preference: Likes/dislikes
- interest: Hobbies, topics they enjoy
- milestone: Important events (birthday, achievements)

Only extract clear, confident information. Skip vague statements.`,
            messages: [{
                    role: 'user',
                    content: `Extract memories from: "${userMessage}"`
                }],
        });
        const textBlock = response.content.find(block => block.type === 'text');
        if (!textBlock || textBlock.type !== 'text')
            return;
        let memories;
        try {
            memories = JSON.parse(textBlock.text);
        }
        catch {
            return; // Invalid JSON, skip
        }
        if (!Array.isArray(memories) || memories.length === 0) {
            return;
        }
        // Store memories
        for (const memory of memories) {
            if (memory.confidence >= 0.7) {
                // Check for duplicate memories
                const { data: existing } = await supabase
                    .from('user_memories')
                    .select('id')
                    .eq('user_id', userId)
                    .ilike('content', `%${memory.content}%`)
                    .limit(1);
                if (!existing || existing.length === 0) {
                    await supabase.from('user_memories').insert({
                        user_id: userId,
                        memory_type: memory.type,
                        content: memory.content,
                        confidence: memory.confidence,
                        extracted_from: messageId,
                    });
                }
            }
        }
    }
    catch (error) {
        // Don't fail the main flow for memory extraction errors
        console.error('Memory extraction error:', error);
    }
}
export async function getUserMemories(userId) {
    const { data } = await supabase
        .from('user_memories')
        .select('content')
        .eq('user_id', userId)
        .order('confidence', { ascending: false })
        .limit(15);
    return data?.map(m => m.content) || [];
}
//# sourceMappingURL=memory.js.map