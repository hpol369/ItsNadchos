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

// Split response into multiple messages and send with realistic delays
async function sendSplitMessages(ctx: Context, response: string, creditFooter?: string): Promise<void> {
  // Split on double newlines (paragraphs) or sentences ending with emoji
  const parts = response
    .split(/\n\n+/)
    .flatMap(part => {
      // If part is still long, try to split on sentences
      if (part.length > 100) {
        return part.split(/(?<=[.!?])\s+(?=[A-Za-z])/);
      }
      return [part];
    })
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // Send each part with typing indicator and realistic delay
  for (let i = 0; i < parts.length; i++) {
    const message = parts[i];
    const isLastMessage = i === parts.length - 1;

    // Show typing indicator
    await ctx.replyWithChatAction('typing');

    // Calculate delay based on message length
    const delay = getTypingDelay(message);
    await new Promise(resolve => setTimeout(resolve, delay));

    // Add credit footer to last message
    const finalMessage = isLastMessage && creditFooter
      ? message + creditFooter
      : message;

    // Send the message
    await ctx.reply(finalMessage);

    // Small pause between messages (like hitting send and starting to type again)
    if (!isLastMessage) {
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
    }
  }
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

    // Send response as multiple messages (no credit footer - users can check with /nachos)
    await sendSplitMessages(ctx, response);

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
    const totalMessages = user.total_messages + 1;
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
