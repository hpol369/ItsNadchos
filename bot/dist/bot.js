import { Bot, webhookCallback } from 'grammy';
import { handleStart } from './handlers/start.js';
import { handleMessage } from './handlers/message.js';
import { handleCallback } from './handlers/callback.js';
import { handlePreCheckoutQuery, handleSuccessfulPayment } from './handlers/payment.js';
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
}
export const bot = new Bot(token);
// Command handlers
bot.command('start', handleStart);
bot.command('help', async (ctx) => {
    await ctx.reply("hey! here's what you can do:\n\n" +
        "/start - restart our chat\n" +
        "/photos - see exclusive photo packs\n" +
        "/support - get help with purchases\n\n" +
        "or just chat with me! 💕");
});
bot.command('photos', async (ctx) => {
    const { showPhotoPacks } = await import('./services/photos.js');
    await showPhotoPacks(ctx);
});
bot.command('support', async (ctx) => {
    await ctx.reply("need help? 💕\n\n" +
        "for purchase issues, just describe what happened and i'll make sure someone looks into it!\n\n" +
        "refunds are available within 24 hours of purchase.");
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
// Export webhook handler for Hono
export const handleWebhook = webhookCallback(bot, 'hono');
//# sourceMappingURL=bot.js.map