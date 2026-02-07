import { supabase } from '../db/client.js';
import { deliverPhotos } from '../services/photos.js';
import { updateConversationState } from '../services/conversation.js';
import { PHOTO_DELIVERED_MESSAGES } from '../utils/prompts.js';
export async function handlePreCheckoutQuery(ctx) {
    const preCheckoutQuery = ctx.preCheckoutQuery;
    if (!preCheckoutQuery)
        return;
    try {
        // Get user
        const { data: user } = await supabase
            .from('nacho_users')
            .select('id, is_blocked')
            .eq('telegram_id', preCheckoutQuery.from.id)
            .single();
        if (!user || user.is_blocked) {
            await ctx.answerPreCheckoutQuery(false, { error_message: 'Account not found or restricted.' });
            return;
        }
        // Verify the pack exists and is active
        const packId = preCheckoutQuery.invoice_payload;
        const { data: pack } = await supabase
            .from('nacho_photo_packs')
            .select('*')
            .eq('id', packId)
            .eq('is_active', true)
            .single();
        if (!pack) {
            await ctx.answerPreCheckoutQuery(false, { error_message: 'This pack is no longer available.' });
            return;
        }
        // Check if user already owns this pack
        const { data: existingPurchase } = await supabase
            .from('nacho_purchases')
            .select('id')
            .eq('user_id', user.id)
            .eq('pack_id', packId)
            .eq('status', 'completed')
            .single();
        if (existingPurchase) {
            await ctx.answerPreCheckoutQuery(false, { error_message: 'You already own this pack!' });
            return;
        }
        // All good - approve the checkout
        await ctx.answerPreCheckoutQuery(true);
    }
    catch (error) {
        console.error('Error in pre-checkout:', error);
        await ctx.answerPreCheckoutQuery(false, { error_message: 'Something went wrong. Please try again.' });
    }
}
export async function handleSuccessfulPayment(ctx) {
    const payment = ctx.message?.successful_payment;
    const telegramUser = ctx.from;
    if (!payment || !telegramUser)
        return;
    try {
        // Get user
        const { data: user } = await supabase
            .from('nacho_users')
            .select('id')
            .eq('telegram_id', telegramUser.id)
            .single();
        if (!user) {
            console.error('User not found for successful payment');
            return;
        }
        const packId = payment.invoice_payload;
        // Record the purchase
        const { data: purchase, error: purchaseError } = await supabase
            .from('nacho_purchases')
            .insert({
            user_id: user.id,
            pack_id: packId,
            telegram_payment_id: payment.telegram_payment_charge_id,
            amount_cents: payment.total_amount,
            currency: payment.currency,
            status: 'completed',
            completed_at: new Date().toISOString(),
        })
            .select()
            .single();
        if (purchaseError) {
            console.error('Error recording purchase:', purchaseError);
        }
        // Determine new tier
        let newTier = 'tier1';
        if (packId === 'bundle') {
            newTier = 'vip';
        }
        else if (packId === 'tier2') {
            newTier = 'tier2';
        }
        // Update conversation state
        await updateConversationState(user.id, {
            relationship_tier: newTier,
            current_state: newTier === 'vip' ? 'vip_chat' : `${newTier}_chat`,
        });
        // Send thank you message
        const randomMessage = PHOTO_DELIVERED_MESSAGES[Math.floor(Math.random() * PHOTO_DELIVERED_MESSAGES.length)];
        await ctx.reply(`thank you so much! 💖\n\n${randomMessage}`);
        // Deliver the photos
        if (purchase) {
            await deliverPhotos(ctx, user.id, purchase.id, packId);
        }
    }
    catch (error) {
        console.error('Error handling successful payment:', error);
        await ctx.reply("your payment went through! 💕 if you don't see your photos, just message me and i'll sort it out");
    }
}
//# sourceMappingURL=payment.js.map