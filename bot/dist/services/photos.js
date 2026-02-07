import { supabase } from '../db/client.js';
const PAYMENT_PROVIDER_TOKEN = process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN || '';
export async function showPhotoPacks(ctx) {
    // Get available packs
    const { data: packs } = await supabase
        .from('nacho_photo_packs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
    if (!packs || packs.length === 0) {
        await ctx.reply("no packs available right now! check back soon 💕");
        return;
    }
    // Get user's existing purchases
    const telegramId = ctx.from?.id;
    let ownedPacks = new Set();
    if (telegramId) {
        const { data: user } = await supabase
            .from('nacho_users')
            .select('id')
            .eq('telegram_id', telegramId)
            .single();
        if (user) {
            const { data: purchases } = await supabase
                .from('nacho_purchases')
                .select('pack_id')
                .eq('user_id', user.id)
                .eq('status', 'completed');
            ownedPacks = new Set(purchases?.map(p => p.pack_id) || []);
        }
    }
    // Build message
    let message = "here are my exclusive photo packs 💕\n\n";
    const buttons = [];
    for (const pack of packs) {
        const owned = ownedPacks.has(pack.id);
        const price = (pack.price_cents / 100).toFixed(2);
        message += `${owned ? '✅' : '💖'} *${pack.name}*\n`;
        message += `${pack.photo_count} photos - $${price}\n`;
        if (pack.description) {
            message += `_${pack.description}_\n`;
        }
        if (owned) {
            message += `(you already have this!)\n`;
        }
        message += '\n';
        if (!owned) {
            buttons.push([{ text: `💕 Get ${pack.name}`, callback_data: `buy_pack_${pack.id}` }]);
        }
    }
    message += "_all photos are pre-made exclusive content_";
    await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: buttons.length > 0 ? { inline_keyboard: buttons } : undefined,
    });
}
export async function sendPackInvoice(ctx, userId, packId) {
    // Get pack details
    const { data: pack } = await supabase
        .from('nacho_photo_packs')
        .select('*')
        .eq('id', packId)
        .eq('is_active', true)
        .single();
    if (!pack) {
        await ctx.reply("sorry, this pack isn't available anymore!");
        return;
    }
    // Check if user already owns this pack
    const { data: existingPurchase } = await supabase
        .from('nacho_purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('pack_id', packId)
        .eq('status', 'completed')
        .single();
    if (existingPurchase) {
        await ctx.reply("you already have this pack! 💕 i can resend the photos if you lost them, just ask!");
        return;
    }
    if (!PAYMENT_PROVIDER_TOKEN) {
        await ctx.reply("payments aren't set up yet! check back soon 💕");
        console.error('TELEGRAM_PAYMENT_PROVIDER_TOKEN is not configured');
        return;
    }
    try {
        await ctx.replyWithInvoice(pack.name, pack.description || `Get ${pack.photo_count} exclusive photos`, packId, // payload
        'USD', [{ label: pack.name, amount: pack.price_cents }], {
            provider_token: PAYMENT_PROVIDER_TOKEN,
            start_parameter: `pack_${packId}`,
            photo_url: 'https://itsnadchos.com/photos/hero.png', // Use hero image as preview
            photo_width: 512,
            photo_height: 512,
            need_name: false,
            need_email: false,
            need_phone_number: false,
            need_shipping_address: false,
            is_flexible: false,
        });
    }
    catch (error) {
        console.error('Error sending invoice:', error);
        await ctx.reply("something went wrong with the payment 😅 try again in a bit!");
    }
}
export async function deliverPhotos(ctx, userId, purchaseId, packId) {
    // Get photos for this pack
    const { data: photos } = await supabase
        .from('nacho_photos')
        .select('*')
        .eq('pack_id', packId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
    if (!photos || photos.length === 0) {
        await ctx.reply("hmm, looks like the photos aren't uploaded yet 😅 i'll make sure someone sorts this out for you!");
        console.error(`No photos found for pack ${packId}`);
        return;
    }
    // Get public URLs from Supabase Storage and send photos
    for (const photo of photos) {
        try {
            const { data: urlData } = supabase.storage
                .from('nacho_photos')
                .getPublicUrl(photo.storage_path);
            if (urlData?.publicUrl) {
                await ctx.replyWithPhoto(urlData.publicUrl, {
                    caption: photo.description || undefined,
                });
                // Record delivery
                await supabase.from('nacho_photo_deliveries').insert({
                    purchase_id: purchaseId,
                    photo_id: photo.id,
                });
                // Small delay between photos
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        catch (error) {
            console.error(`Error delivering photo ${photo.id}:`, error);
        }
    }
    // Check if pack includes other tiers
    const { data: pack } = await supabase
        .from('nacho_photo_packs')
        .select('includes_tiers')
        .eq('id', packId)
        .single();
    if (pack?.includes_tiers && pack.includes_tiers.length > 0) {
        for (const includedTier of pack.includes_tiers) {
            // Check if they don't already have this tier
            const { data: existingPurchase } = await supabase
                .from('nacho_purchases')
                .select('id')
                .eq('user_id', userId)
                .eq('pack_id', includedTier)
                .eq('status', 'completed')
                .single();
            if (!existingPurchase) {
                // Get photos from included tier
                const { data: includedPhotos } = await supabase
                    .from('nacho_photos')
                    .select('*')
                    .eq('pack_id', includedTier)
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true });
                if (includedPhotos && includedPhotos.length > 0) {
                    await ctx.reply(`bonus! here are the ${includedTier} photos too 💕`);
                    for (const photo of includedPhotos) {
                        try {
                            const { data: urlData } = supabase.storage
                                .from('nacho_photos')
                                .getPublicUrl(photo.storage_path);
                            if (urlData?.publicUrl) {
                                await ctx.replyWithPhoto(urlData.publicUrl, {
                                    caption: photo.description || undefined,
                                });
                                await supabase.from('nacho_photo_deliveries').insert({
                                    purchase_id: purchaseId,
                                    photo_id: photo.id,
                                });
                                await new Promise(resolve => setTimeout(resolve, 500));
                            }
                        }
                        catch (error) {
                            console.error(`Error delivering included photo ${photo.id}:`, error);
                        }
                    }
                }
            }
        }
    }
}
export async function redeliverPhotos(ctx, userId) {
    // Get all completed purchases for user
    const { data: purchases } = await supabase
        .from('nacho_purchases')
        .select('id, pack_id')
        .eq('user_id', userId)
        .eq('status', 'completed');
    if (!purchases || purchases.length === 0) {
        await ctx.reply("you don't have any purchases yet! check out /photos to see what's available 💕");
        return;
    }
    await ctx.reply("resending your photos! 💕");
    for (const purchase of purchases) {
        await deliverPhotos(ctx, userId, purchase.id, purchase.pack_id);
    }
}
//# sourceMappingURL=photos.js.map