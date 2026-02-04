import { supabase } from '../db/client.js';
import { showPhotoPacks, sendPackInvoice } from '../services/photos.js';
export async function handleCallback(ctx) {
    const callbackData = ctx.callbackQuery?.data;
    const telegramUser = ctx.from;
    if (!callbackData || !telegramUser) {
        await ctx.answerCallbackQuery();
        return;
    }
    try {
        // Get user
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('telegram_id', telegramUser.id)
            .single();
        if (!user) {
            await ctx.answerCallbackQuery({ text: 'Please /start first!' });
            return;
        }
        // Handle different callback actions
        if (callbackData === 'view_packs') {
            await ctx.answerCallbackQuery();
            await showPhotoPacks(ctx);
            return;
        }
        if (callbackData === 'dismiss_upsell') {
            await ctx.answerCallbackQuery({ text: 'no worries! 💕' });
            await ctx.editMessageReplyMarkup({ reply_markup: undefined });
            return;
        }
        if (callbackData.startsWith('buy_pack_')) {
            const packId = callbackData.replace('buy_pack_', '');
            await ctx.answerCallbackQuery();
            await sendPackInvoice(ctx, user.id, packId);
            return;
        }
        // Unknown callback
        await ctx.answerCallbackQuery();
    }
    catch (error) {
        console.error('Error handling callback:', error);
        await ctx.answerCallbackQuery({ text: 'Something went wrong!' });
    }
}
//# sourceMappingURL=callback.js.map