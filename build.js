#!/usr/bin/env node

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Check if running on Railway
const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
// Check if running on Vercel
const isVercel = !!process.env.VERCEL;

async function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { cwd, stdio: 'inherit', env: process.env });
    proc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`));
    });
  });
}

async function main() {
  if (isRailway) {
    console.log('Building for Railway (bot only)...');
    const botDir = join(__dirname, 'bot');

    // Install bot dependencies
    console.log('Installing bot dependencies...');
    await runCommand('npm', ['ci'], botDir);

    // Build bot
    console.log('Building bot...');
    await runCommand('npm', ['run', 'build'], botDir);

    console.log('Bot build complete!');
  } else if (isVercel) {
    console.log('Building for Vercel (Next.js only)...');
    await runCommand('npx', ['next', 'build'], __dirname);
  } else {
    // Local or other - build both
    console.log('Building both bot and Next.js...');

    const botDir = join(__dirname, 'bot');
    if (existsSync(botDir)) {
      console.log('Installing bot dependencies...');
      await runCommand('npm', ['ci'], botDir);
      console.log('Building bot...');
      await runCommand('npm', ['run', 'build'], botDir);
    }

    console.log('Building Next.js...');
    await runCommand('npx', ['next', 'build'], __dirname);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
