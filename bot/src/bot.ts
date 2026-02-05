import { Bot, webhookCallback } from 'grammy';
import { handleStart } from './handlers/start.js';
import { handleMessage } from './handlers/message.js';
import { handleCallback } from './handlers/callback.js';
import { handlePreCheckoutQuery, handleSuccessfulPayment } from './handlers/payment.js';
import { getCreditBalance, getUnlockedPhotos, FREE_DAILY_MESSAGES, CREDITS_PER_PHOTO } from './services/credits.js';
import { generatePurchaseToken } from './services/tokens.js';
import { supabase } from './db/client.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set');
}

export const bot = new Bot(token);

// Command handlers
bot.command('start', handleStart);
bot.command('help', async (ctx) => {
  await ctx.reply(
    "hey! here's what you can do:\n\n" +
    "/start - restart our chat\n" +
    "/balance - check your credits\n" +
    "/buy - get more credits\n" +
    "/gallery - unlock exclusive photos\n" +
    "/photos - see photo packs\n" +
    "/support - get help\n\n" +
    "or just chat with me! 💕"
  );
});
bot.command('photos', async (ctx) => {
  const { showPhotoPacks } = await import('./services/photos.js');
  await showPhotoPacks(ctx);
});
bot.command('support', async (ctx) => {
  await ctx.reply(
    "need help? 💕\n\n" +
    "for purchase issues, just describe what happened and i'll make sure someone looks into it!\n\n" +
    "refunds are available within 24 hours of purchase."
  );
});

// /buy - Generate purchase link for credits
bot.command('buy', async (ctx) => {
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  const { data: user } = await supabase
    .from('nacho_users')
    .select('id')
    .eq('telegram_id', telegramUser.id)
    .single();

  if (!user) {
    await ctx.reply("hey! use /start first 💕");
    return;
  }

  const token = await generatePurchaseToken(user.id);

  await ctx.reply(
    "get credits to chat more with me 💕\n\n" +
    "1 credit = 1 message\n" +
    "10 credits = unlock a photo\n\n" +
    "you get 3 free messages every day!",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '50 credits - $4.99', url: token.url }],
          [{ text: '120 credits - $9.99', url: token.url }],
          [{ text: '300 credits - $19.99', url: token.url }],
        ]
      }
    }
  );
});

// /balance or /nachos - Show current credits and free messages
bot.command(['balance', 'nachos'], async (ctx) => {
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  const { data: user } = await supabase
    .from('nacho_users')
    .select('id')
    .eq('telegram_id', telegramUser.id)
    .single();

  if (!user) {
    await ctx.reply("hey! use /start first 💕");
    return;
  }

  const balance = await getCreditBalance(user.id);
  const freeRemaining = Math.max(0, FREE_DAILY_MESSAGES - balance.freeMessagesToday);

  await ctx.reply(
    `💕 your balance\n\n` +
    `credits: ${balance.balance}\n` +
    `free messages today: ${freeRemaining}/${FREE_DAILY_MESSAGES}`
  );
});

// /gallery - Show photos with unlock costs
bot.command('gallery', async (ctx) => {
  const telegramUser = ctx.from;
  if (!telegramUser) return;

  const { data: user } = await supabase
    .from('nacho_users')
    .select('id')
    .eq('telegram_id', telegramUser.id)
    .single();

  if (!user) {
    await ctx.reply("hey! use /start first 💕");
    return;
  }

  // Get all active photos
  const { data: photos } = await supabase
    .from('nacho_photos')
    .select('id, description, pack_id')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(10);

  if (!photos || photos.length === 0) {
    await ctx.reply("no photos available right now! check back soon 💕");
    return;
  }

  // Get user's unlocked photos
  const unlockedIds = await getUnlockedPhotos(user.id);
  const unlockedSet = new Set(unlockedIds);

  // Build gallery message
  let message = "my exclusive gallery 💕\n\n";

  const buttons: { text: string; callback_data: string }[][] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const isUnlocked = unlockedSet.has(photo.id);
    const label = photo.description || `Photo ${i + 1}`;

    if (isUnlocked) {
      message += `✅ ${label}\n`;
      buttons.push([{ text: `📷 View: ${label}`, callback_data: `unlock_photo_${photo.id}` }]);
    } else {
      message += `🔒 ${label} (${CREDITS_PER_PHOTO} credits)\n`;
      buttons.push([{ text: `🔓 Unlock: ${label}`, callback_data: `unlock_photo_${photo.id}` }]);
    }
  }

  message += `\n${CREDITS_PER_PHOTO} credits to unlock each photo`;

  await ctx.reply(message, {
    reply_markup: { inline_keyboard: buttons }
  });
});

// Payment handlers
bot.on('pre_checkout_query', handlePreCheckoutQuery);
bot.on('message:successful_payment', handleSuccessfulPayment);

// Callback query handler (for inline buttons)
bot.on('callback_query:data', handleCallback);

// Message handler (for all text messages)
bot.on('message:text', handleMessage);

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Export webhook handler factory (only creates callback when actually used)
export const createWebhookHandler = () => webhookCallback(bot, 'hono');
