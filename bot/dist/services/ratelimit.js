import { supabase } from '../db/client.js';
const MAX_MESSAGES_PER_MINUTE = 10;
const MAX_MESSAGES_PER_HOUR = 100;
const WARNINGS_BEFORE_TEMP_BLOCK = 3;
const TEMP_BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour
export async function checkRateLimit(userId) {
    const now = new Date();
    // Get current rate limit record
    const { data: rateLimit } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('user_id', userId)
        .single();
    if (!rateLimit) {
        // Create rate limit record if it doesn't exist
        await supabase.from('rate_limits').insert({ user_id: userId });
        return { blocked: false, tempBlocked: false };
    }
    // Check if user is temporarily blocked
    if (rateLimit.temp_blocked_until) {
        const blockedUntil = new Date(rateLimit.temp_blocked_until);
        if (blockedUntil > now) {
            return { blocked: true, tempBlocked: true, reason: 'Temporarily blocked for excessive messages' };
        }
    }
    // Reset minute counter if needed
    const minuteReset = new Date(rateLimit.minute_reset_at);
    let messagesThisMinute = rateLimit.messages_this_minute;
    if (now.getTime() - minuteReset.getTime() > 60 * 1000) {
        messagesThisMinute = 0;
    }
    // Reset hour counter if needed
    const hourReset = new Date(rateLimit.hour_reset_at);
    let messagesThisHour = rateLimit.messages_this_hour;
    if (now.getTime() - hourReset.getTime() > 60 * 60 * 1000) {
        messagesThisHour = 0;
    }
    // Check if over limits
    const overMinuteLimit = messagesThisMinute >= MAX_MESSAGES_PER_MINUTE;
    const overHourLimit = messagesThisHour >= MAX_MESSAGES_PER_HOUR;
    if (overMinuteLimit || overHourLimit) {
        // Increment warnings
        const newWarnings = rateLimit.warnings_count + 1;
        if (newWarnings >= WARNINGS_BEFORE_TEMP_BLOCK) {
            // Temp block the user
            await supabase
                .from('rate_limits')
                .update({
                warnings_count: newWarnings,
                temp_blocked_until: new Date(now.getTime() + TEMP_BLOCK_DURATION_MS).toISOString(),
            })
                .eq('user_id', userId);
            return { blocked: true, tempBlocked: true, reason: 'Temporarily blocked for repeated rate limit violations' };
        }
        // Just warn
        await supabase
            .from('rate_limits')
            .update({ warnings_count: newWarnings })
            .eq('user_id', userId);
        return { blocked: true, tempBlocked: false, reason: 'Rate limit exceeded' };
    }
    // Update counters
    await supabase
        .from('rate_limits')
        .update({
        messages_this_minute: messagesThisMinute + 1,
        messages_this_hour: messagesThisHour + 1,
        minute_reset_at: messagesThisMinute === 0 ? now.toISOString() : rateLimit.minute_reset_at,
        hour_reset_at: messagesThisHour === 0 ? now.toISOString() : rateLimit.hour_reset_at,
    })
        .eq('user_id', userId);
    return { blocked: false, tempBlocked: false };
}
export async function resetRateLimits(userId) {
    await supabase
        .from('rate_limits')
        .update({
        messages_this_minute: 0,
        messages_this_hour: 0,
        minute_reset_at: new Date().toISOString(),
        hour_reset_at: new Date().toISOString(),
        warnings_count: 0,
        temp_blocked_until: null,
    })
        .eq('user_id', userId);
}
//# sourceMappingURL=ratelimit.js.map