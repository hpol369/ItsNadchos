import { supabase } from '../db/client.js';
import type { Message, UserMemory, ConversationState } from '../db/client.js';

interface ConversationContext {
  messages: Message[];
  memories: UserMemory[];
  displayName: string | null;
}

export async function getConversationContext(userId: string): Promise<ConversationContext> {
  // Get user's display name
  const { data: user } = await supabase
    .from('nacho_users')
    .select('display_name')
    .eq('id', userId)
    .single();

  // Get recent messages (last 30)
  const { data: messages } = await supabase
    .from('nacho_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(30);

  // Get user memories
  const { data: memories } = await supabase
    .from('nacho_user_memories')
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

export async function updateConversationState(
  userId: string,
  updates: Partial<ConversationState>
): Promise<void> {
  const { error } = await supabase
    .from('nacho_conversation_state')
    .update(updates)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating conversation state:', error);
    throw error;
  }
}

export async function getConversationState(userId: string): Promise<ConversationState | null> {
  const { data } = await supabase
    .from('nacho_conversation_state')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data;
}

export async function clearConversationHistory(userId: string): Promise<void> {
  // Delete old messages (keep last 5)
  const { data: recentMessages } = await supabase
    .from('nacho_messages')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  const keepIds = recentMessages?.map(m => m.id) || [];

  if (keepIds.length > 0) {
    await supabase
      .from('nacho_messages')
      .delete()
      .eq('user_id', userId)
      .not('id', 'in', `(${keepIds.join(',')})`);
  }
}
