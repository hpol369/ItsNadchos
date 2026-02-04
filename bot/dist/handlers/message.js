import { supabase } from '../db/client.js';
import { generateResponse } from '../services/claude.js';
import { getConversationContext, updateConversationState } from '../services/conversation.js';
import { checkRateLimit } from '../services/ratelimit.js';
import { shouldShowUpsell, getUpsellMessage } from '../services/upsell.js';
import { extractMemories } from '../services/memory.js';
import { RATE_LIMIT_WARNING, BLOCKED_MESSAGE } from '../utils/prompts.js';
export async function handleMessage(ctx) {
    const telegramUser = ctx.from;
    const messageText = ctx.message?.text;
    if (!telegramUser || !messageText) {
        return;
    }
    try {
        // Get user from database
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', telegramUser.id)
            .single();
        if (!user) {
            // User doesn't exist, prompt them to start
            await ctx.reply("hey! use /start to begin chatting with me 💕");
            return;
        }
        if (user.is_blocked) {
            await ctx.reply(BLOCKED_MESSAGE);
            return;
        }
        // Check rate limits
        const rateLimitResult = await checkRateLimit(user.id);
        if (rateLimitResult.blocked) {
            if (rateLimitResult.tempBlocked) {
                await ctx.reply("taking a short break from this chat. try again in a bit 💕");
                return;
            }
            await ctx.reply(RATE_LIMIT_WARNING);
            return;
        }
        // Get conversation state
        const { data: state } = await supabase
            .from('conversation_state')
            .select('*')
            .eq('user_id', user.id)
            .single();
        if (!state) {
            await ctx.reply("something went wrong. try /start again!");
            return;
        }
        // Store user message
        const { data: userMessage } = await supabase
            .from('messages')
            .insert({
            user_id: user.id,
            role: 'user',
            content: messageText,
        })
            .select()
            .single();
        // Update message count
        await supabase
            .from('users')
            .update({ total_messages: user.total_messages + 1 })
            .eq('id', user.id);
        // Get conversation context for Claude
        const context = await getConversationContext(user.id);
        // Show typing indicator
        await ctx.replyWithChatAction('typing');
        // Generate AI response
        const response = await generateResponse(messageText, context, state.current_state, state.relationship_tier);
        // Store assistant message
        await supabase.from('messages').insert({
            user_id: user.id,
            role: 'assistant',
            content: response,
        });
        // Update conversation state if needed
        if (state.current_state === 'onboarding') {
            await updateConversationState(user.id, { current_state: 'free_chat' });
        }
        // Extract and store memories from the conversation
        if (userMessage) {
            await extractMemories(user.id, userMessage.id, messageText);
        }
        // Send response
        await ctx.reply(response);
        // Check if we should show upsell
        const totalMessages = user.total_messages + 1;
        const upsellCheck = await shouldShowUpsell(user.id, totalMessages, state);
        if (upsellCheck.shouldShow && upsellCheck.tier) {
            // Small delay before upsell feels more natural
            await new Promise(resolve => setTimeout(resolve, 2000));
            const upsellMessage = getUpsellMessage(upsellCheck.tier);
            await ctx.reply(upsellMessage, {
                reply_markup: {
                    inline_keyboard: [[
                            { text: '💕 Show me!', callback_data: `view_packs` },
                            { text: 'Maybe later', callback_data: 'dismiss_upsell' }
                        ]]
                }
            });
            // Update upsell tracking
            await updateConversationState(user.id, {
                last_upsell_at: new Date().toISOString(),
                messages_since_upsell: 0,
                upsell_cooldown_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            });
        }
        else {
            // Increment messages since last upsell
            await supabase
                .from('conversation_state')
                .update({ messages_since_upsell: state.messages_since_upsell + 1 })
                .eq('user_id', user.id);
        }
    }
    catch (error) {
        console.error('Error handling message:', error);
        await ctx.reply("oops, something went weird 😅 try again?");
    }
}
//# sourceMappingURL=message.js.map