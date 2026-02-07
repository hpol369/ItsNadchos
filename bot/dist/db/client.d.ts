export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export interface User {
    id: string;
    telegram_id: number;
    username: string | null;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    language_code: string;
    total_messages: number;
    is_blocked: boolean;
    blocked_reason: string | null;
    created_at: string;
    updated_at: string;
}
export interface ConversationState {
    id: string;
    user_id: string;
    current_state: 'onboarding' | 'free_chat' | 'soft_upsell' | 'tier1_chat' | 'tier2_upsell' | 'tier2_chat' | 'vip_chat';
    relationship_tier: 'free' | 'tier1' | 'tier2' | 'vip';
    messages_since_upsell: number;
    last_upsell_at: string | null;
    upsell_cooldown_until: string | null;
    created_at: string;
    updated_at: string;
}
export interface Message {
    id: string;
    user_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    tokens_used: number | null;
    created_at: string;
}
export interface UserMemory {
    id: string;
    user_id: string;
    memory_type: 'fact' | 'preference' | 'interest' | 'milestone';
    content: string;
    confidence: number;
    extracted_from: string | null;
    created_at: string;
}
export interface PhotoPack {
    id: string;
    name: string;
    description: string | null;
    price_cents: number;
    photo_count: number;
    includes_tiers: string[];
    future_access: boolean;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}
export interface Photo {
    id: string;
    pack_id: string;
    storage_path: string;
    thumbnail_path: string | null;
    description: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}
export interface Purchase {
    id: string;
    user_id: string;
    pack_id: string;
    telegram_payment_id: string | null;
    amount_cents: number;
    currency: string;
    status: 'pending' | 'completed' | 'refunded' | 'failed';
    refund_reason: string | null;
    created_at: string;
    completed_at: string | null;
}
export interface RateLimit {
    id: string;
    user_id: string;
    messages_this_minute: number;
    messages_this_hour: number;
    minute_reset_at: string;
    hour_reset_at: string;
    warnings_count: number;
    temp_blocked_until: string | null;
}
export interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    price_cents: number;
    is_active: boolean;
    created_at: string;
}
export interface UserCredits {
    id: string;
    user_id: string;
    balance: number;
    lifetime_purchased: number;
    lifetime_spent: number;
    created_at: string;
    updated_at: string;
}
export interface CreditTransaction {
    id: string;
    user_id: string;
    amount: number;
    type: 'purchase' | 'message' | 'photo_unlock' | 'daily_bonus' | 'refund';
    description: string | null;
    reference_id: string | null;
    created_at: string;
}
export interface PurchaseToken {
    id: string;
    user_id: string;
    token: string;
    expires_at: string;
    used_at: string | null;
    created_at: string;
}
export interface DailyMessages {
    id: string;
    user_id: string;
    date: string;
    message_count: number;
}
export interface UnlockedPhoto {
    id: string;
    user_id: string;
    photo_id: string;
    credits_spent: number;
    unlocked_at: string;
}
export interface DailyNotification {
    id: string;
    user_id: string;
    date: string;
    message: string | null;
    photo_id: string | null;
    sent_at: string;
}
export interface CreditPurchase {
    id: string;
    user_id: string;
    package_id: string;
    token_id: string | null;
    stripe_session_id: string | null;
    stripe_payment_intent_id: string | null;
    amount_cents: number;
    credits: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    created_at: string;
    completed_at: string | null;
}
//# sourceMappingURL=client.d.ts.map