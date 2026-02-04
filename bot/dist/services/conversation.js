import { supabase } from '../db/client.js';
export async function getConversationContext(userId) {
    // Get user's display name
    const { data: user } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', userId)
        .single();
    // Get recent messages (last 30)
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(30);
    // Get user memories
    const { data: memories } = await supabase
        .from('user_memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
    return {
        messages: messages || [],
        memories: memories || [],
        displayName: user?.display_name || null,
    };
}
export async function updateConversationState(userId, updates) {
    const { error } = await supabase
        .from('conversation_state')
        .update(updates)
        .eq('user_id', userId);
    if (error) {
        console.error('Error updating conversation state:', error);
        throw error;
    }
}
export async function getConversationState(userId) {
    const { data } = await supabase
        .from('conversation_state')
        .select('*')
        .eq('user_id', userId)
        .single();
    return data;
}
export async function clearConversationHistory(userId) {
    // Delete old messages (keep last 5)
    const { data: recentMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
    const keepIds = recentMessages?.map(m => m.id) || [];
    if (keepIds.length > 0) {
        await supabase
            .from('messages')
            .delete()
            .eq('user_id', userId)
            .not('id', 'in', `(${keepIds.join(',')})`);
    }
}
//# sourceMappingURL=conversation.js.map