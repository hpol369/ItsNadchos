# ItsNadchos Telegram Bot

AI companion chatbot for the ItsNadchos brand, powered by Claude.

## Features

- Engaging 1-on-1 AI conversations with personality
- Conversation memory and personalization
- Photo pack monetization via Telegram Payments
- Rate limiting and abuse prevention
- Full legal compliance (AI disclosure)

## Setup

### 1. Prerequisites

- Node.js 20+ or Bun
- Supabase project
- Telegram Bot (created via @BotFather)
- Anthropic API key
- Payment provider configured in BotFather

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `TELEGRAM_BOT_TOKEN` - From @BotFather
- `TELEGRAM_PAYMENT_PROVIDER_TOKEN` - From BotFather Payments
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `ANTHROPIC_API_KEY` - Claude API key
- `WEBHOOK_URL` - Your deployed bot URL (for production)

### 3. Database Setup

Run the migrations in your Supabase SQL editor:

```bash
# Open: supabase/migrations/001_initial.sql
# Copy and paste into Supabase SQL editor
```

### 4. Supabase Storage

Create a storage bucket named `photos` in Supabase:
1. Go to Storage in Supabase dashboard
2. Create a new bucket called `photos`
3. Set it to public (for photo delivery)

### 5. Install Dependencies

```bash
npm install
```

### 6. Development

```bash
npm run dev
```

The bot will run in polling mode for local development.

### 7. Production Deployment (Railway)

1. Connect your repo to Railway
2. Set environment variables in Railway dashboard
3. Set `WEBHOOK_URL` to your Railway app URL
4. Deploy!

## BotFather Configuration

1. Set bot name and description
2. Enable payments: `/mybots` → Select bot → `Payments` → Connect Stripe
3. Set commands:
```
start - Start chatting
photos - View exclusive photo packs
help - Get help
support - Payment support
```

## Photo Pack Management

1. Upload photos to Supabase Storage `photos` bucket
2. Add photo records to the `photos` table with the correct `pack_id`
3. Photos will be delivered automatically after purchase

## Monitoring

- Check Railway logs for errors
- Monitor Supabase for database issues
- Review abuse flags in the admin panel

## Architecture

```
bot/
├── src/
│   ├── index.ts          # Hono server entry
│   ├── bot.ts            # Grammy bot setup
│   ├── handlers/         # Command & message handlers
│   ├── services/         # Business logic
│   ├── db/               # Database client
│   └── utils/            # Prompts & helpers
```
