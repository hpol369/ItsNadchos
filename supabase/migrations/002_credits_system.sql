-- ItsNadchos Credits System Migration

-- Credit packages
CREATE TABLE nacho_credit_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  credits INT NOT NULL,
  price_cents INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO nacho_credit_packages (id, name, credits, price_cents) VALUES
  ('starter', '50 Credits', 50, 499),
  ('popular', '120 Credits', 120, 999),
  ('best_value', '300 Credits', 300, 1999);

-- User credit balances
CREATE TABLE nacho_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES nacho_users(id) ON DELETE CASCADE UNIQUE,
  balance INT DEFAULT 0,
  lifetime_purchased INT DEFAULT 0,
  lifetime_spent INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions (audit log)
CREATE TABLE nacho_credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES nacho_users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'message', 'photo_unlock', 'daily_bonus', 'refund')),
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase tokens (link Telegram → Website)
CREATE TABLE nacho_purchase_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES nacho_users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily free messages tracking
CREATE TABLE nacho_daily_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES nacho_users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  message_count INT DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Unlocked photos per user
CREATE TABLE nacho_unlocked_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES nacho_users(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES nacho_photos(id) ON DELETE CASCADE,
  credits_spent INT DEFAULT 0,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, photo_id)
);

-- Daily push notifications tracking
CREATE TABLE nacho_daily_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES nacho_users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  message TEXT,
  photo_id UUID REFERENCES nacho_photos(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Credit purchases (Stripe)
CREATE TABLE nacho_credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES nacho_users(id) ON DELETE CASCADE,
  package_id TEXT REFERENCES nacho_credit_packages(id),
  token_id UUID REFERENCES nacho_purchase_tokens(id),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount_cents INT NOT NULL,
  credits INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add push_enabled column to users table
ALTER TABLE nacho_users ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE nacho_users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes for performance
CREATE INDEX idx_nacho_credits_user_id ON nacho_credits(user_id);
CREATE INDEX idx_nacho_credit_transactions_user_id ON nacho_credit_transactions(user_id);
CREATE INDEX idx_nacho_credit_transactions_created_at ON nacho_credit_transactions(created_at DESC);
CREATE INDEX idx_nacho_purchase_tokens_token ON nacho_purchase_tokens(token);
CREATE INDEX idx_nacho_purchase_tokens_expires_at ON nacho_purchase_tokens(expires_at);
CREATE INDEX idx_nacho_daily_messages_user_date ON nacho_daily_messages(user_id, date);
CREATE INDEX idx_nacho_unlocked_photos_user_id ON nacho_unlocked_photos(user_id);
CREATE INDEX idx_nacho_daily_notifications_user_date ON nacho_daily_notifications(user_id, date);
CREATE INDEX idx_nacho_credit_purchases_user_id ON nacho_credit_purchases(user_id);
CREATE INDEX idx_nacho_credit_purchases_stripe_session ON nacho_credit_purchases(stripe_session_id);
CREATE INDEX idx_nacho_users_push_enabled ON nacho_users(push_enabled) WHERE push_enabled = TRUE;
CREATE INDEX idx_nacho_users_last_active ON nacho_users(last_active_at);

-- Enable RLS on new tables
ALTER TABLE nacho_credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nacho_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE nacho_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nacho_purchase_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE nacho_daily_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nacho_unlocked_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE nacho_daily_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE nacho_credit_purchases ENABLE ROW LEVEL SECURITY;

-- Service role policies for new tables
CREATE POLICY "Service role full access" ON nacho_credit_packages FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON nacho_credits FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON nacho_credit_transactions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON nacho_purchase_tokens FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON nacho_daily_messages FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON nacho_unlocked_photos FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON nacho_daily_notifications FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON nacho_credit_purchases FOR ALL TO service_role USING (true);

-- Trigger for updated_at on nacho_credits
CREATE TRIGGER update_nacho_credits_updated_at BEFORE UPDATE ON nacho_credits
  FOR EACH ROW EXECUTE FUNCTION update_nacho_updated_at_column();
