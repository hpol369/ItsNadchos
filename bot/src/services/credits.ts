import { supabase } from '../db/client.js';

// Constants
export const FREE_DAILY_MESSAGES = 3;
export const CREDITS_PER_MESSAGE = 1;
export const CREDITS_PER_PHOTO = 10;

export interface CreditCheckResult {
  allowed: boolean;
  isFreeMessage: boolean;
  balance: number;
  freeRemaining: number;
}

export interface CreditBalance {
  balance: number;
  freeMessagesToday: number;
}

export interface AddCreditsResult {
  newBalance: number;
}

export interface UnlockPhotoResult {
  success: boolean;
  error?: string;
  creditsSpent?: number;
}

/**
 * Initialize credits for a new user
 */
export async function initializeCredits(userId: string): Promise<void> {
  await supabase.from('nacho_credits').insert({
    user_id: userId,
    balance: 0,
    lifetime_purchased: 0,
    lifetime_spent: 0,
  });
}

/**
 * Get today's message count for a user
 */
export async function getTodayMessageCount(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('nacho_daily_messages')
    .select('message_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  return data?.message_count || 0;
}

/**
 * Check if user can send a message (free or paid)
 */
export async function checkMessageCredits(userId: string): Promise<CreditCheckResult> {
  // Get today's free message count
  const todayCount = await getTodayMessageCount(userId);
  const freeRemaining = Math.max(0, FREE_DAILY_MESSAGES - todayCount);

  // Check if user has free messages left
  if (freeRemaining > 0) {
    return {
      allowed: true,
      isFreeMessage: true,
      balance: 0, // Don't need to fetch balance for free messages
      freeRemaining,
    };
  }

  // No free messages, check credit balance
  const { data: credits } = await supabase
    .from('nacho_credits')
    .select('balance')
    .eq('user_id', userId)
    .single();

  const balance = credits?.balance || 0;

  return {
    allowed: balance >= CREDITS_PER_MESSAGE,
    isFreeMessage: false,
    balance,
    freeRemaining: 0,
  };
}

/**
 * Increment today's free message count
 */
export async function incrementTodayMessages(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  // Upsert daily messages record
  const { data: existing } = await supabase
    .from('nacho_daily_messages')
    .select('id, message_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (existing) {
    const newCount = existing.message_count + 1;
    await supabase
      .from('nacho_daily_messages')
      .update({ message_count: newCount })
      .eq('id', existing.id);
    return newCount;
  } else {
    await supabase.from('nacho_daily_messages').insert({
      user_id: userId,
      date: today,
      message_count: 1,
    });
    return 1;
  }
}

/**
 * Deduct credits for a message
 */
export async function deductMessageCredit(userId: string): Promise<void> {
  // Get current balance
  const { data: credits } = await supabase
    .from('nacho_credits')
    .select('id, balance, lifetime_spent')
    .eq('user_id', userId)
    .single();

  if (!credits || credits.balance < CREDITS_PER_MESSAGE) {
    throw new Error('Insufficient credits');
  }

  // Update balance
  await supabase
    .from('nacho_credits')
    .update({
      balance: credits.balance - CREDITS_PER_MESSAGE,
      lifetime_spent: credits.lifetime_spent + CREDITS_PER_MESSAGE,
    })
    .eq('id', credits.id);

  // Record transaction
  await supabase.from('nacho_credit_transactions').insert({
    user_id: userId,
    amount: -CREDITS_PER_MESSAGE,
    type: 'message',
    description: 'Message sent',
  });
}

/**
 * Get user's credit balance and free messages remaining
 */
export async function getCreditBalance(userId: string): Promise<CreditBalance> {
  const [creditsResult, todayCount] = await Promise.all([
    supabase
      .from('nacho_credits')
      .select('balance')
      .eq('user_id', userId)
      .single(),
    getTodayMessageCount(userId),
  ]);

  return {
    balance: creditsResult.data?.balance || 0,
    freeMessagesToday: todayCount,
  };
}

/**
 * Add credits to user's balance
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: 'purchase' | 'daily_bonus' | 'refund',
  referenceId?: string
): Promise<AddCreditsResult> {
  // Get or create credits record
  let { data: credits } = await supabase
    .from('nacho_credits')
    .select('id, balance, lifetime_purchased')
    .eq('user_id', userId)
    .single();

  if (!credits) {
    // Create credits record if it doesn't exist
    const { data: newCredits } = await supabase
      .from('nacho_credits')
      .insert({
        user_id: userId,
        balance: 0,
        lifetime_purchased: 0,
        lifetime_spent: 0,
      })
      .select()
      .single();
    credits = newCredits;
  }

  if (!credits) {
    throw new Error('Failed to get or create credits record');
  }

  const newBalance = credits.balance + amount;
  const newLifetimePurchased = type === 'purchase'
    ? credits.lifetime_purchased + amount
    : credits.lifetime_purchased;

  // Update balance
  await supabase
    .from('nacho_credits')
    .update({
      balance: newBalance,
      lifetime_purchased: newLifetimePurchased,
    })
    .eq('id', credits.id);

  // Record transaction
  await supabase.from('nacho_credit_transactions').insert({
    user_id: userId,
    amount,
    type,
    description: type === 'purchase' ? 'Credits purchased' :
                 type === 'daily_bonus' ? 'Daily bonus' : 'Refund',
    reference_id: referenceId,
  });

  return { newBalance };
}

/**
 * Unlock a photo for 10 credits
 */
export async function unlockPhoto(
  userId: string,
  photoId: string
): Promise<UnlockPhotoResult> {
  // Check if already unlocked
  const { data: existing } = await supabase
    .from('nacho_unlocked_photos')
    .select('id')
    .eq('user_id', userId)
    .eq('photo_id', photoId)
    .single();

  if (existing) {
    return { success: true, creditsSpent: 0 }; // Already unlocked
  }

  // Check balance
  const { data: credits } = await supabase
    .from('nacho_credits')
    .select('id, balance, lifetime_spent')
    .eq('user_id', userId)
    .single();

  if (!credits || credits.balance < CREDITS_PER_PHOTO) {
    return {
      success: false,
      error: `Not enough credits. Need ${CREDITS_PER_PHOTO}, have ${credits?.balance || 0}`,
    };
  }

  // Deduct credits
  await supabase
    .from('nacho_credits')
    .update({
      balance: credits.balance - CREDITS_PER_PHOTO,
      lifetime_spent: credits.lifetime_spent + CREDITS_PER_PHOTO,
    })
    .eq('id', credits.id);

  // Record unlock
  await supabase.from('nacho_unlocked_photos').insert({
    user_id: userId,
    photo_id: photoId,
    credits_spent: CREDITS_PER_PHOTO,
  });

  // Record transaction
  await supabase.from('nacho_credit_transactions').insert({
    user_id: userId,
    amount: -CREDITS_PER_PHOTO,
    type: 'photo_unlock',
    description: 'Photo unlocked',
    reference_id: photoId,
  });

  return {
    success: true,
    creditsSpent: CREDITS_PER_PHOTO,
  };
}

/**
 * Get list of unlocked photo IDs for a user
 */
export async function getUnlockedPhotos(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('nacho_unlocked_photos')
    .select('photo_id')
    .eq('user_id', userId);

  return data?.map(p => p.photo_id) || [];
}

/**
 * Check if a specific photo is unlocked
 */
export async function isPhotoUnlocked(userId: string, photoId: string): Promise<boolean> {
  const { data } = await supabase
    .from('nacho_unlocked_photos')
    .select('id')
    .eq('user_id', userId)
    .eq('photo_id', photoId)
    .single();

  return !!data;
}
