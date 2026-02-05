import type { Context } from 'grammy';
import { supabase } from '../db/client.js';
import { generateResponse } from '../services/claude.js';
import { getConversationContext, updateConversationState } from '../services/conversation.js';
import { checkRateLimit } from '../services/ratelimit.js';
import { shouldShowUpsell, getUpsellMessage } from '../services/upsell.js';
import { extractMemories } from '../services/memory.js';
import { RATE_LIMIT_WARNING, BLOCKED_MESSAGE } from '../utils/prompts.js';
import { checkMessageCredits, incrementTodayMessages, deductMessageCredit, FREE_DAILY_MESSAGES, getCreditBalance } from '../services/credits.js';
import { generatePurchaseToken } from '../services/tokens.js';
import { getRandomFreePhoto, getFreePhotoUrl, getPhotoCaption } from '../services/freePhotos.js';

// Calculate typing delay based on message length (like a real person typing)
function getTypingDelay(text: string): number {
  // Average typing speed: ~40-60 words per minute = ~200-300 chars per minute
  // So roughly 200-300ms per character, but we'll make it faster (50-80ms per char)
  // Plus some random variation and a minimum delay
  const baseDelay = 1000; // minimum 1 second
  const perCharDelay = 40 + Math.random() * 30; // 40-70ms per character
  const charDelay = text.length * perCharDelay;
  const maxDelay = 4000; // cap at 4 seconds

  return Math.min(baseDelay + charDelay, maxDelay);
}

// Generate credit balance footer
function getCreditFooter(balance: number, freeRemaining: number): string {
  if (freeRemaining > 0) {
    // User is on free messages
    return `\n\n· 💕 ${freeRemaining} free left today`;
  } else if (balance <= 3 && balance > 0) {
    // Low balance warning
    return `\n\n· 🌮 ${balance} — running low 💕`;
  } else if (balance > 0) {
    // Normal balance
    return `\n\n· 🌮 ${balance}`;
  } else {
    // No credits
    return `\n\n· 🌮 0 — get more credits 💕`;
  }
}

// Send response as a single message with realistic typing delay
async function sendMessage(ctx: Context, response: string): Promise<void> {
  // Show typing indicator
  await ctx.replyWithChatAction('typing');

  // Calculate realistic delay: ~30-50ms per character (like actual typing)
  // Min 3 seconds, max 12 seconds
  const baseDelay = 3000;
  const perCharDelay = 35 + Math.random() * 15; // 35-50ms per char
  const calculatedDelay = baseDelay + response.length * perCharDelay;
  const delay = Math.min(Math.max(calculatedDelay, 3000), 12000);

  // For very long messages, refresh typing indicator halfway
  if (delay > 5000) {
    await new Promise(resolve => setTimeout(resolve, delay / 2));
    await ctx.replyWithChatAction('typing');
    await new Promise(resolve => setTimeout(resolve, delay / 2));
  } else {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Send as single message
  await ctx.reply(response);
}

export async function handleMessage(ctx: Context) {
  const telegramUser = ctx.from;
  const messageText = ctx.message?.text;

  if (!telegramUser || !messageText) {
    return;
  }

  try {
    // Get user from database
    const { data: user } = await supabase
      .from('nacho_users')
      .select('*')
      .eq('telegram_id', telegramUser.id)
      .single();

    if (!user) {
      // User doesn't exist, prompt them to start
      await ctx.reply("hey! use /start to begin chatting with me 💕");
      return;
    }

    if (user.is_blocked) {
      await ctx.reply(BLOCKED_MESSAGE);
      return;
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(user.id);
    if (rateLimitResult.blocked) {
      if (rateLimitResult.tempBlocked) {
        await ctx.reply("taking a short break from this chat. try again in a bit 💕");
        return;
      }
      await ctx.reply(RATE_LIMIT_WARNING);
      return;
    }

    // Check credits (after rate limit, before AI response)
    const creditCheck = await checkMessageCredits(user.id);

    if (!creditCheck.allowed) {
      const token = await generatePurchaseToken(user.id);
      await ctx.reply(
        `you've used your ${FREE_DAILY_MESSAGES} free messages for today 💕\n\nget credits to keep chatting with me!`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '💕 Get Credits', url: token.url }
            ]]
          }
        }
      );
      return;
    }

    // Track free message usage (do this early to prevent race conditions)
    if (creditCheck.isFreeMessage) {
      await incrementTodayMessages(user.id);
    }

    // Update last_active_at
    await supabase
      .from('nacho_users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id);

    // Get conversation state
    const { data: state } = await supabase
      .from('nacho_conversation_state')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!state) {
      await ctx.reply("something went wrong. try /start again!");
      return;
    }

    // Store user message
    const { data: userMessage } = await supabase
      .from('nacho_messages')
      .insert({
        user_id: user.id,
        role: 'user',
        content: messageText,
      })
      .select()
      .single();

    // Update message count
    await supabase
      .from('nacho_users')
      .update({ total_messages: user.total_messages + 1 })
      .eq('id', user.id);

    // Get conversation context for Claude
    const context = await getConversationContext(user.id);

    // Show typing indicator
    await ctx.replyWithChatAction('typing');

    // Generate AI response
    const response = await generateResponse(
      messageText,
      context,
      state.current_state,
      state.relationship_tier
    );

    // Store assistant message
    await supabase.from('nacho_messages').insert({
      user_id: user.id,
      role: 'assistant',
      content: response,
    });

    // Update conversation state if needed
    if (state.current_state === 'onboarding') {
      await updateConversationState(user.id, { current_state: 'free_chat' });
    }

    // Extract and store memories from the conversation
    if (userMessage) {
      await extractMemories(user.id, userMessage.id, messageText);
    }

    // Deduct credit if this was a paid message
    if (!creditCheck.isFreeMessage) {
      await deductMessageCredit(user.id);
    }

    // Send response as single message
    await sendMessage(ctx, response);

    // Chance to send a free photo (about 10% after 5+ messages)
    const totalMessages = user.total_messages + 1;
    if (totalMessages >= 5 && Math.random() < 0.10) {
      try {
        const freePhoto = await getRandomFreePhoto();
        if (freePhoto) {
          // Wait a bit before sending photo (feels more natural)
          await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
          await ctx.replyWithChatAction('upload_photo');
          await new Promise(resolve => setTimeout(resolve, 1000));

          const photoUrl = getFreePhotoUrl(freePhoto.storage_path);
          const caption = getPhotoCaption(freePhoto.description);
          await ctx.replyWithPhoto(photoUrl, { caption });
        }
      } catch (err) {
        // Silently fail - don't break the conversation for a bonus photo
        console.error('Error sending free photo:', err);
      }
    }

    // Check if we should show upsell
    const upsellCheck = await shouldShowUpsell(user.id, totalMessages, state);

    if (upsellCheck.shouldShow && upsellCheck.tier) {
      // Small delay before upsell feels more natural
      await new Promise(resolve => setTimeout(resolve, 2000));

      const upsellMessage = getUpsellMessage(upsellCheck.tier);
      await ctx.reply(upsellMessage, {
        reply_markup: {
          inline_keyboard: [[
            { text: '💕 Show me!', callback_data: `view_packs` },
            { text: 'Maybe later', callback_data: 'dismiss_upsell' }
          ]]
        }
      });

      // Update upsell tracking
      await updateConversationState(user.id, {
        last_upsell_at: new Date().toISOString(),
        messages_since_upsell: 0,
        upsell_cooldown_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    } else {
      // Increment messages since last upsell
      await supabase
        .from('nacho_conversation_state')
        .update({ messages_since_upsell: state.messages_since_upsell + 1 })
        .eq('user_id', user.id);
    }

  } catch (error) {
    console.error('Error handling message:', error);
    await ctx.reply("oops, something went weird 😅 try again?");
  }
}
