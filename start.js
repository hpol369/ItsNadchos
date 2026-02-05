#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Check if running on Railway
const isRailway = !!process.env.RAILWAY_ENVIRONMENT;

if (isRailway) {
  console.log('Detected Railway environment, starting bot...');

  // Check if bot is built
  const botDistPath = join(__dirname, 'bot', 'dist', 'index.js');
  if (!existsSync(botDistPath)) {
    console.error('Bot not built! Run "npm run build" in bot folder first.');
    process.exit(1);
  }

  // Run the bot
  const bot = spawn('node', [botDistPath], {
    cwd: join(__dirname, 'bot'),
    stdio: 'inherit',
    env: process.env
  });

  bot.on('exit', (code) => process.exit(code || 0));
} else {
  console.log('Starting Next.js...');

  // Run next start
  const next = spawn('npx', ['next', 'start'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env
  });

  next.on('exit', (code) => process.exit(code || 0));
}
