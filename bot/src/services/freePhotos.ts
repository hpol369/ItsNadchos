import { supabase } from '../db/client.js';

interface FreePhoto {
  id: string;
  storage_path: string;
  description: string | null;
  mood: string;
}

/**
 * Get a random free photo, optionally filtered by mood
 */
export async function getRandomFreePhoto(mood?: string): Promise<FreePhoto | null> {
  let query = supabase
    .from('nacho_free_photos')
    .select('*');

  if (mood) {
    query = query.eq('mood', mood);
  }

  const { data: photos } = await query;

  if (!photos || photos.length === 0) {
    return null;
  }

  // Pick a random photo
  const randomIndex = Math.floor(Math.random() * photos.length);
  return photos[randomIndex];
}

/**
 * Get the public URL for a free photo
 */
export function getFreePhotoUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from('free-photos')
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Decide if bot should send a free photo based on conversation context
 * Returns true roughly 15% of the time when conditions are right
 */
export function shouldSendFreePhoto(
  messageCount: number,
  lastPhotoSentAt: Date | null,
  conversationMood: string
): boolean {
  // Don't send photos in first few messages
  if (messageCount < 5) {
    return false;
  }

  // Don't send photos too frequently (at least 10 messages apart)
  // This is a simple heuristic - in practice we'd track this per user

  // Random chance (about 12% per message after conditions met)
  const chance = Math.random();
  return chance < 0.12;
}

/**
 * Get a caption for sending a free photo naturally
 */
export function getPhotoCaption(description: string | null): string {
  const captions = [
    "thought you might like this one 💕",
    "just took this, what do you think? 😊",
    "here's a little something for you ✨",
    "felt cute, wanted to share 💕",
    "this reminded me of you 😘",
  ];

  const randomCaption = captions[Math.floor(Math.random() * captions.length)];

  if (description) {
    return `${randomCaption}\n\n${description}`;
  }

  return randomCaption;
}
