import { Hono } from 'hono';
import { bot, handleWebhook } from './bot.js';
const app = new Hono();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
// Health check endpoint
app.get('/', (c) => {
    return c.json({ status: 'ok', bot: 'ItsNadchos' });
});
app.get('/health', (c) => {
    return c.json({ status: 'healthy' });
});
// Telegram webhook endpoint
app.post('/webhook', async (c) => {
    return handleWebhook(c);
});
// Start server
async function start() {
    // Set webhook if URL is configured
    if (WEBHOOK_URL) {
        const webhookUrl = `${WEBHOOK_URL}/webhook`;
        await bot.api.setWebhook(webhookUrl);
        console.log(`Webhook set to: ${webhookUrl}`);
    }
    else {
        // Use polling for development
        console.log('No WEBHOOK_URL set, starting in polling mode...');
        bot.start({
            onStart: (botInfo) => {
                console.log(`Bot @${botInfo.username} started in polling mode`);
            },
        });
    }
    // Start Hono server with Node.js
    console.log(`Server starting on port ${PORT}`);
    const { serve } = await import('@hono/node-server');
    serve({
        fetch: app.fetch,
        port: Number(PORT),
    });
    console.log(`Server running on port ${PORT}`);
}
start().catch(console.error);
// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('Shutting down...');
    process.exit(0);
});
//# sourceMappingURL=index.js.map