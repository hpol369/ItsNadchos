import { supabase } from '../db/client.js';
import { showPhotoPacks, sendPackInvoice } from '../services/photos.js';
import { unlockPhoto, getCreditBalance, CREDITS_PER_PHOTO } from '../services/credits.js';
import { generatePurchaseToken } from '../services/tokens.js';
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
            .from('nacho_users')
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
        // Handle photo unlock
        if (callbackData.startsWith('unlock_photo_')) {
            const photoId = callbackData.replace('unlock_photo_', '');
            await ctx.answerCallbackQuery();
            const result = await unlockPhoto(user.id, photoId);
            if (!result.success) {
                // Not enough credits - prompt to buy
                const balance = await getCreditBalance(user.id);
                const token = await generatePurchaseToken(user.id);
                await ctx.reply(`you need ${CREDITS_PER_PHOTO} credits to unlock this photo 💕\nyou have ${balance.balance} credits`, {
                    reply_markup: {
                        inline_keyboard: [[
                                { text: '💕 Get Credits', url: token.url }
                            ]]
                    }
                });
                return;
            }
            // Photo unlocked - send it
            const { data: photo } = await supabase
                .from('nacho_photos')
                .select('storage_path, description')
                .eq('id', photoId)
                .single();
            if (photo) {
                const { data: urlData } = supabase.storage
                    .from('nacho_photos')
                    .getPublicUrl(photo.storage_path);
                if (urlData?.publicUrl) {
                    const caption = result.creditsSpent === 0
                        ? "you already have this one! 💕"
                        : `unlocked! 💕 (${result.creditsSpent} credits)`;
                    await ctx.replyWithPhoto(urlData.publicUrl, {
                        caption: photo.description ? `${caption}\n\n${photo.description}` : caption,
                    });
                }
            }
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