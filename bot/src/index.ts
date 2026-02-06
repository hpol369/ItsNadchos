import 'dotenv/config';
import { Hono } from 'hono';
import { bot, createWebhookHandler } from './bot.js';
import { processAllDailyNotifications } from './services/daily.js';
import { addCredits } from './services/credits.js';

// Validate required secrets at startup
const CRON_SECRET = process.env.CRON_SECRET;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

if (!CRON_SECRET) {
  console.error('FATAL: CRON_SECRET environment variable is required');
  process.exit(1);
}

if (!WEBHOOK_SECRET) {
  console.error('FATAL: WEBHOOK_SECRET environment variable is required');
  process.exit(1);
}

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

// Cron endpoint for daily push notifications
app.get('/api/cron/daily-push', async (c) => {
  // Always require auth - CRON_SECRET validated at startup
  const authHeader = c.req.header('Authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const result = await processAllDailyNotifications();
    return c.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in daily push cron:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// API endpoint to add credits (called by Stripe webhook)
app.post('/api/credits/add', async (c) => {
  // Always require auth - WEBHOOK_SECRET validated at startup
  const authHeader = c.req.header('Authorization');
  if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const { userId, amount, referenceId } = body;

    if (!userId || !amount) {
      return c.json({ error: 'Missing userId or amount' }, 400);
    }

    const result = await addCredits(userId, amount, 'purchase', referenceId);
    return c.json({
      success: true,
      newBalance: result.newBalance,
    });
  } catch (error) {
    console.error('Error adding credits:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Start server
async function start() {
  if (WEBHOOK_URL) {
    // Webhook mode for production
    const webhookUrl = `${WEBHOOK_URL}/webhook`;
    await bot.api.setWebhook(webhookUrl);
    console.log(`Webhook set to: ${webhookUrl}`);

    // Set up webhook endpoint
    const handleWebhook = createWebhookHandler();
    app.post('/webhook', async (c) => {
      return handleWebhook(c);
    });

    // Start Hono server
    console.log(`Server starting on port ${PORT}`);
    const { serve } = await import('@hono/node-server');
    serve({
      fetch: app.fetch,
      port: Number(PORT),
    });
    console.log(`Server running on port ${PORT}`);
  } else {
    // Polling mode for development/Railway without webhook
    console.log('No WEBHOOK_URL set, starting in polling mode...');
    await bot.api.deleteWebhook();

    // Still start the HTTP server for health checks
    console.log(`Starting HTTP server on port ${PORT} for health checks...`);
    const { serve } = await import('@hono/node-server');
    serve({
      fetch: app.fetch,
      port: Number(PORT),
    });
    console.log(`HTTP server running on port ${PORT}`);

    bot.start({
      onStart: (botInfo) => {
        console.log(`Bot @${botInfo.username} started in polling mode`);
      },
    });
  }
}

start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  bot.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  bot.stop();
  process.exit(0);
});
