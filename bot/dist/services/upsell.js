import { supabase } from '../db/client.js';
import { TIER1_UPSELL_MESSAGES, TIER2_UPSELL_MESSAGES } from '../utils/prompts.js';
export async function shouldShowUpsell(userId, totalMessages, state) {
    // Rule 1: Check cooldown (24h since last upsell)
    if (state.upsell_cooldown_until) {
        const cooldownEnd = new Date(state.upsell_cooldown_until);
        if (cooldownEnd > new Date()) {
            return { shouldShow: false, tier: null };
        }
    }
    // Rule 2: Need minimum messages
    if (totalMessages < 5) {
        return { shouldShow: false, tier: null };
    }
    // Rule 3: Need enough messages since last upsell
    if (state.messages_since_upsell < 10) {
        return { shouldShow: false, tier: null };
    }
    // Check what packs user already owns
    const { data: purchases } = await supabase
        .from('purchases')
        .select('pack_id')
        .eq('user_id', userId)
        .eq('status', 'completed');
    const ownedPacks = new Set(purchases?.map(p => p.pack_id) || []);
    // Already VIP - no upsells needed
    if (ownedPacks.has('bundle')) {
        return { shouldShow: false, tier: null };
    }
    // Has tier2 - no more upsells
    if (ownedPacks.has('tier2')) {
        return { shouldShow: false, tier: null };
    }
    // Has tier1 - consider tier2 upsell
    if (ownedPacks.has('tier1')) {
        // Tier 2 upsell: 40+ total messages, 3+ days since first message
        const { data: user } = await supabase
            .from('users')
            .select('created_at')
            .eq('id', userId)
            .single();
        if (user) {
            const daysSinceStart = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
            if (totalMessages >= 40 && daysSinceStart >= 3) {
                return { shouldShow: true, tier: 'tier2' };
            }
        }
        return { shouldShow: false, tier: null };
    }
    // No purchases - consider tier1 upsell
    // Tier 1 upsell: 15+ messages
    if (totalMessages >= 15) {
        return { shouldShow: true, tier: 'tier1' };
    }
    return { shouldShow: false, tier: null };
}
export function getUpsellMessage(tier) {
    const messages = tier === 'tier1' ? TIER1_UPSELL_MESSAGES : TIER2_UPSELL_MESSAGES;
    return messages[Math.floor(Math.random() * messages.length)];
}
//# sourceMappingURL=upsell.js.map