import { supabase } from '../db/client.js';
import { ONBOARDING_MESSAGE } from '../utils/prompts.js';
export async function handleStart(ctx) {
    const telegramUser = ctx.from;
    if (!telegramUser) {
        await ctx.reply("Something went wrong. Please try again!");
        return;
    }
    try {
        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id, is_blocked')
            .eq('telegram_id', telegramUser.id)
            .single();
        if (existingUser?.is_blocked) {
            await ctx.reply("Sorry, this account has been restricted.");
            return;
        }
        if (existingUser) {
            // Returning user - reset conversation state to free chat
            await supabase
                .from('conversation_state')
                .update({ current_state: 'free_chat' })
                .eq('user_id', existingUser.id);
            await ctx.reply("welcome back! 💕 missed you, what's new?");
            return;
        }
        // Create new user
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
            telegram_id: telegramUser.id,
            username: telegramUser.username || null,
            first_name: telegramUser.first_name || null,
            last_name: telegramUser.last_name || null,
            display_name: telegramUser.first_name || telegramUser.username || null,
            language_code: telegramUser.language_code || 'en',
        })
            .select()
            .single();
        if (userError || !newUser) {
            console.error('Error creating user:', userError);
            await ctx.reply("Something went wrong. Please try /start again!");
            return;
        }
        // Create conversation state
        await supabase.from('conversation_state').insert({
            user_id: newUser.id,
            current_state: 'onboarding',
            relationship_tier: 'free',
        });
        // Create rate limit record
        await supabase.from('rate_limits').insert({
            user_id: newUser.id,
        });
        // Store the onboarding message
        await supabase.from('messages').insert({
            user_id: newUser.id,
            role: 'assistant',
            content: ONBOARDING_MESSAGE,
        });
        // Send onboarding message with AI disclosure
        await ctx.reply(ONBOARDING_MESSAGE);
    }
    catch (error) {
        console.error('Error in /start handler:', error);
        await ctx.reply("Something went wrong. Please try again!");
    }
}
//# sourceMappingURL=start.js.map