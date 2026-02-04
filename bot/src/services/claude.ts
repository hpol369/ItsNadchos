import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from '../utils/prompts.js';
import type { Message, UserMemory } from '../db/client.js';

const anthropic = new Anthropic();

interface ConversationContext {
  messages: Message[];
  memories: UserMemory[];
  displayName: string | null;
}

export async function generateResponse(
  userMessage: string,
  context: ConversationContext,
  currentState: string,
  relationshipTier: string
): Promise<string> {
  // Build the full system prompt with context
  let systemPrompt = SYSTEM_PROMPT;

  // Add user-specific context
  if (context.displayName) {
    systemPrompt += `\n\n## ABOUT THIS USER\nTheir name: ${context.displayName}`;
  }

  // Add memories
  if (context.memories.length > 0) {
    systemPrompt += `\n\nThings you remember about them:`;
    for (const memory of context.memories) {
      systemPrompt += `\n- ${memory.content}`;
    }
  }

  // Add relationship context
  systemPrompt += `\n\n## CURRENT STATE\nRelationship tier: ${relationshipTier}`;
  if (relationshipTier !== 'free') {
    systemPrompt += `\nThey've supported you by purchasing photos - be extra appreciative!`;
  }

  // Build message history for Claude
  const claudeMessages: Anthropic.MessageParam[] = [];

  // Add recent conversation history (last 20 messages for context)
  const recentMessages = context.messages.slice(-20);
  for (const msg of recentMessages) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      claudeMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // Add the current message
  claudeMessages.push({
    role: 'user',
    content: userMessage,
  });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages: claudeMessages,
    });

    // Extract text from response
    const textBlock = response.content.find(block => block.type === 'text');
    if (textBlock && textBlock.type === 'text') {
      return textBlock.text;
    }

    return "hmm, i got a bit tongue-tied there 😅 what were we talking about?";

  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}
