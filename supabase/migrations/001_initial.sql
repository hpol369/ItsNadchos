-- ItsNadchos Telegram Bot Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE nacho_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT DEFAULT 'en',
  total_messages INT DEFAULT 0,
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation state table
CREATE TABLE nacho_conversation_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES nacho_users(id) ON DELETE CASCADE UNIQUE,
  current_state TEXT DEFAULT 'onboarding' CHECK (current_state IN ('onboarding', 'free_chat', 'soft_upsell', 'tier1_chat', 'tier2_upsell', 'tier2_chat', 'vip_chat')),
  relationship_tier TEXT DEFAULT 'free' CHECK (relationship_tier IN ('free', 'tier1', 'tier2', 'vip')),
  messages_since_upsell INT DEFAULT 0,
  last_upsell_at TIMESTAMPTZ,
  upsell_cooldown_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table (for conversation context)
CREATE TABLE nacho_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES nacho_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User memories (extracted facts about users)
CREATE TABLE nacho_user_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES nacho_users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('fact', 'preference', 'interest', 'milestone')),
  content TEXT NOT NULL,
  confidence FLOAT DEFAULT 1.0,
  extracted_from UUID REFERENCES nacho_messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photo packs configuration
CREATE TABLE nacho_photo_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INT NOT NULL,
  photo_count INT NOT NULL,
  includes_tiers TEXT[] DEFAULT '{}',
  future_access BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual photos
CREATE TABLE nacho_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pack_id TEXT REFERENCES nacho_photo_packs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases table
CREATE TABLE nacho_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES nacho_users(id) ON DELETE CASCADE,
  pack_id TEXT REFERENCES nacho_photo_packs(id),
  telegram_payment_id TEXT,
  amount_cents INT NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  refund_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Photo delivery tracking
CREATE TABLE nacho_photo_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES nacho_purchases(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES nacho_photos(id),
  delivered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting table
CREATE TABLE nacho_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES nacho_users(id) ON DELETE CASCADE UNIQUE,
  messages_this_minute INT DEFAULT 0,
  messages_this_hour INT DEFAULT 0,
  minute_reset_at TIMESTAMPTZ DEFAULT NOW(),
  hour_reset_at TIMESTAMPTZ DEFAULT NOW(),
  warnings_count INT DEFAULT 0,
  temp_blocked_until TIMESTAMPTZ
);

-- Abuse reports/flags
CREATE TABLE nacho_abuse_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES nacho_users(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('spam', 'explicit', 'harassment', 'other')),
  message_id UUID REFERENCES nacho_messages(id),
  details TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default photo packs
INSERT INTO nacho_photo_packs (id, name, description, price_cents, photo_count, includes_tiers, sort_order) VALUES
  ('tier1', 'Exclusive Starter Pack', 'Get 5 exclusive photos', 499, 5, '{}', 1),
  ('tier2', 'Premium Collection', 'Get 10 premium photos (includes Starter Pack)', 1499, 10, '{tier1}', 2),
  ('bundle', 'VIP All Access', 'Get 20 photos + future releases', 2499, 20, '{tier1,tier2}', 3);

-- Indexes for performance
CREATE INDEX idx_nacho_users_telegram_id ON nacho_users(telegram_id);
CREATE INDEX idx_nacho_messages_user_id ON nacho_messages(user_id);
CREATE INDEX idx_nacho_messages_created_at ON nacho_messages(created_at DESC);
CREATE INDEX idx_nacho_purchases_user_id ON nacho_purchases(user_id);
CREATE INDEX idx_nacho_purchases_status ON nacho_purchases(status);
CREATE INDEX idx_nacho_user_memories_user_id ON nacho_user_memories(user_id);
CREATE INDEX idx_nacho_photos_pack_id ON nacho_photos(pack_id);

-- Row Level Security (RLS) policies
ALTER TABLE nacho_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nacho_conversation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE nacho_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nacho_user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE nacho_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE nacho_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE nacho_photo_packs ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for the bot backend)
CREATE POLICY "Service role full access" ON nacho_users FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON nacho_conversation_state FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON nacho_messages FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON nacho_user_memories FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON nacho_purchases FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON nacho_photos FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON nacho_photo_packs FOR ALL TO service_role USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_nacho_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_nacho_users_updated_at BEFORE UPDATE ON nacho_users
  FOR EACH ROW EXECUTE FUNCTION update_nacho_updated_at_column();

CREATE TRIGGER update_nacho_conversation_state_updated_at BEFORE UPDATE ON nacho_conversation_state
  FOR EACH ROW EXECUTE FUNCTION update_nacho_updated_at_column();
