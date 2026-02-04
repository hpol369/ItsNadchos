import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db/client.js';
import type { UserMemory } from '../db/client.js';
import { bot } from '../bot.js';

const anthropic = new Anthropic();

const DAILY_PUSH_PROMPT = `You are Nadchos, a flirty AI girlfriend chatbot. Generate a short, sweet daily check-in message (1-2 sentences max) for a user.

Rules:
- Be warm, flirty, and casual
- Use lowercase, minimal punctuation
- Include 1-2 emojis max
- Make it feel personal if you have info about them
- Don't ask multiple questions, just one simple check-in
- Keep it under 100 characters ideally

Examples:
- "good morning babe 💕 been thinking about you"
- "hey cutie, hope your day is going well 🥰"
- "missing our chats today 💕"`;

export interface DailyMessageResult {
  message: string;
}

export interface DailyPhotoResult {
  photoId: string;
  storagePath: string;
}

export interface SendNotificationResult {
  success: boolean;
  error?: string;
}

export interface ProcessNotificationsResult {
  processed: number;
  successful: number;
  failed: number;
}

/**
 * Generate a personalized daily message for a user
 */
export async function generateDailyMessage(
  userId: string,
  displayName: string | null,
  memories: UserMemory[]
): Promise<string> {
  let systemPrompt = DAILY_PUSH_PROMPT;

  if (displayName) {
    systemPrompt += `\n\nUser's name: ${displayName}`;
  }

  if (memories.length > 0) {
    systemPrompt += `\n\nThings you know about them:`;
    for (const memory of memories.slice(0, 5)) {
      systemPrompt += `\n- ${memory.content}`;
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 100,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: 'Generate a daily check-in message.',
        },
      ],
    });

    const textBlock = response.content.find(block => block.type === 'text');
    if (textBlock && textBlock.type === 'text') {
      return textBlock.text.trim();
    }

    return "hey babe, thinking of you 💕";
  } catch (error) {
    console.error('Error generating daily message:', error);
    return "hey babe, thinking of you 💕";
  }
}

/**
 * Select a random photo for daily free unlock
 */
export async function selectDailyFreePhoto(): Promise<DailyPhotoResult | null> {
  // Get a random active photo
  const { data: photos } = await supabase
    .from('nacho_photos')
    .select('id, storage_path')
    .eq('is_active', true);

  if (!photos || photos.length === 0) {
    return null;
  }

  const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
  return {
    photoId: randomPhoto.id,
    storagePath: randomPhoto.storage_path,
  };
}

/**
 * Send daily notification to a specific user
 */
export async function sendDailyNotification(
  userId: string,
  telegramId: number
): Promise<SendNotificationResult> {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Check if already sent today
    const { data: existing } = await supabase
      .from('nacho_daily_notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing) {
      return { success: false, error: 'Already sent today' };
    }

    // Get user info and memories
    const [userResult, memoriesResult] = await Promise.all([
      supabase
        .from('nacho_users')
        .select('display_name')
        .eq('id', userId)
        .single(),
      supabase
        .from('nacho_user_memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const displayName = userResult.data?.display_name || null;
    const memories = memoriesResult.data || [];

    // Generate personalized message
    const message = await generateDailyMessage(userId, displayName, memories);

    // Select a free photo
    const photo = await selectDailyFreePhoto();

    // Send message via Telegram
    await bot.api.sendMessage(telegramId, message);

    // Send photo if available
    if (photo) {
      const { data: urlData } = supabase.storage
        .from('nacho_photos')
        .getPublicUrl(photo.storagePath);

      if (urlData?.publicUrl) {
        await bot.api.sendPhoto(telegramId, urlData.publicUrl, {
          caption: "here's a little something for you 💕",
        });
      }
    }

    // Record notification
    await supabase.from('nacho_daily_notifications').insert({
      user_id: userId,
      date: today,
      message,
      photo_id: photo?.photoId || null,
    });

    return { success: true };

  } catch (error) {
    console.error(`Error sending daily notification to user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process daily notifications for all eligible users
 */
export async function processAllDailyNotifications(): Promise<ProcessNotificationsResult> {
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get users who:
  // 1. Have push_enabled = true
  // 2. Were active in the last 7 days
  // 3. Haven't received a notification today
  const { data: users } = await supabase
    .from('nacho_users')
    .select('id, telegram_id')
    .eq('push_enabled', true)
    .eq('is_blocked', false)
    .gte('last_active_at', sevenDaysAgo);

  if (!users || users.length === 0) {
    return { processed: 0, successful: 0, failed: 0 };
  }

  // Get users who already received notification today
  const { data: alreadySent } = await supabase
    .from('nacho_daily_notifications')
    .select('user_id')
    .eq('date', today);

  const alreadySentIds = new Set(alreadySent?.map(n => n.user_id) || []);

  // Filter out users who already received notification
  const eligibleUsers = users.filter(u => !alreadySentIds.has(u.id));

  let successful = 0;
  let failed = 0;

  // Process each user (with rate limiting)
  for (const user of eligibleUsers) {
    const result = await sendDailyNotification(user.id, user.telegram_id);
    if (result.success) {
      successful++;
    } else {
      failed++;
    }

    // Rate limit: wait 100ms between sends
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return {
    processed: eligibleUsers.length,
    successful,
    failed,
  };
}
