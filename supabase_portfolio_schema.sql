-- ============================================
-- PYUSD Portfolio Investment System Schema
-- ============================================

-- Portfolios Table
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'stable', 'ai', 'layer1', 'layer2', 'index', 'defi', 'meme'
  risk_level INTEGER NOT NULL CHECK (risk_level >= 1 AND risk_level <= 3), -- 1=Low, 2=Medium, 3=High
  tokens JSONB NOT NULL, -- Array of token objects: [{symbol, address, name, logo}]
  allocations JSONB NOT NULL, -- Array of allocation objects: [{symbol, weight}] weights sum to 100
  rebalance_frequency INTEGER NOT NULL, -- Seconds between rebalances
  last_rebalanced TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  total_invested DECIMAL(20, 6) DEFAULT 0,
  current_nav DECIMAL(20, 6) DEFAULT 0, -- Net Asset Value
  performance_24h DECIMAL(10, 4) DEFAULT 0, -- 24h return %
  performance_7d DECIMAL(10, 4) DEFAULT 0, -- 7d return %
  performance_30d DECIMAL(10, 4) DEFAULT 0, -- 30d return %
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Investments Table
CREATE TABLE IF NOT EXISTS user_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  pyusd_amount DECIMAL(20, 6) NOT NULL, -- Original investment in PYUSD
  shares DECIMAL(30, 18) NOT NULL, -- Portfolio shares owned
  current_value DECIMAL(20, 6) DEFAULT 0, -- Current value in PYUSD
  profit_loss DECIMAL(20, 6) DEFAULT 0, -- P/L in PYUSD
  profit_loss_percent DECIMAL(10, 4) DEFAULT 0, -- P/L %
  invested_at TIMESTAMPTZ DEFAULT NOW(),
  last_withdrawal TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, portfolio_id)
);

-- Portfolio Performance History Table
CREATE TABLE IF NOT EXISTS portfolio_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  nav DECIMAL(20, 6) NOT NULL, -- Net Asset Value at this timestamp
  total_invested DECIMAL(20, 6) NOT NULL,
  roi_percent DECIMAL(10, 4) DEFAULT 0, -- Return on Investment %
  token_prices JSONB, -- Snapshot of token prices: [{symbol, price}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rebalance History Table
CREATE TABLE IF NOT EXISTS rebalance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  old_allocations JSONB NOT NULL, -- Previous allocations
  new_allocations JSONB NOT NULL, -- New allocations after rebalance
  total_value DECIMAL(20, 6) NOT NULL, -- Portfolio value at rebalance
  reason TEXT, -- Reason for rebalance
  tx_hash TEXT, -- Blockchain transaction hash
  executed_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token Price Cache Table (for Pyth prices)
CREATE TABLE IF NOT EXISTS token_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT UNIQUE NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  confidence DECIMAL(20, 8),
  price_feed_id TEXT, -- Pyth price feed ID
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investment Transactions Table (for audit trail)
CREATE TABLE IF NOT EXISTS investment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('invest', 'withdraw', 'rebalance')),
  pyusd_amount DECIMAL(20, 6) NOT NULL,
  shares_amount DECIMAL(30, 18),
  nav_at_transaction DECIMAL(20, 6),
  tx_hash TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_portfolios_category ON portfolios(category);
CREATE INDEX IF NOT EXISTS idx_portfolios_active ON portfolios(is_active);
CREATE INDEX IF NOT EXISTS idx_user_investments_user ON user_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_investments_portfolio ON user_investments(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_performance_portfolio ON portfolio_performance(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_performance_timestamp ON portfolio_performance(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_rebalance_history_portfolio ON rebalance_history(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_user ON investment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_portfolio ON investment_transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_token_prices_symbol ON token_prices(symbol);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE rebalance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;

-- Portfolios: Everyone can read, only admins can write
CREATE POLICY "Portfolios are viewable by everyone" ON portfolios
  FOR SELECT USING (true);

CREATE POLICY "Portfolios are insertable by admins" ON portfolios
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Portfolios are updatable by admins" ON portfolios
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- User Investments: Users can only see their own
CREATE POLICY "Users can view their own investments" ON user_investments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investments" ON user_investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments" ON user_investments
  FOR UPDATE USING (auth.uid() = user_id);

-- Portfolio Performance: Everyone can read
CREATE POLICY "Performance is viewable by everyone" ON portfolio_performance
  FOR SELECT USING (true);

CREATE POLICY "Performance is insertable by admins" ON portfolio_performance
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Rebalance History: Everyone can read
CREATE POLICY "Rebalance history is viewable by everyone" ON rebalance_history
  FOR SELECT USING (true);

CREATE POLICY "Rebalance history is insertable by admins" ON rebalance_history
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Token Prices: Everyone can read
CREATE POLICY "Token prices are viewable by everyone" ON token_prices
  FOR SELECT USING (true);

CREATE POLICY "Token prices are insertable by admins" ON token_prices
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Token prices are updatable by admins" ON token_prices
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Investment Transactions: Users can only see their own
CREATE POLICY "Users can view their own transactions" ON investment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON investment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Functions
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_investments_updated_at BEFORE UPDATE ON user_investments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate user investment current value
CREATE OR REPLACE FUNCTION calculate_investment_value(
  p_user_id UUID,
  p_portfolio_id UUID
)
RETURNS TABLE(
  current_value DECIMAL,
  profit_loss DECIMAL,
  profit_loss_percent DECIMAL
) AS $$
DECLARE
  v_investment user_investments%ROWTYPE;
  v_portfolio portfolios%ROWTYPE;
  v_value DECIMAL;
  v_pl DECIMAL;
  v_pl_pct DECIMAL;
BEGIN
  -- Get user investment
  SELECT * INTO v_investment
  FROM user_investments
  WHERE user_id = p_user_id AND portfolio_id = p_portfolio_id;
  
  -- Get portfolio
  SELECT * INTO v_portfolio
  FROM portfolios
  WHERE id = p_portfolio_id;
  
  IF v_investment IS NULL OR v_portfolio IS NULL THEN
    RETURN QUERY SELECT 0::DECIMAL, 0::DECIMAL, 0::DECIMAL;
    RETURN;
  END IF;
  
  -- Calculate current value based on NAV
  -- value = (shares / total_shares) * current_nav
  -- For simplicity, using proportional calculation
  IF v_portfolio.total_invested > 0 THEN
    v_value := (v_investment.pyusd_amount / v_portfolio.total_invested) * v_portfolio.current_nav;
  ELSE
    v_value := v_investment.pyusd_amount;
  END IF;
  
  -- Calculate P/L
  v_pl := v_value - v_investment.pyusd_amount;
  v_pl_pct := (v_pl / v_investment.pyusd_amount) * 100;
  
  RETURN QUERY SELECT v_value, v_pl, v_pl_pct;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Seed Data (Example Portfolios)
-- ============================================

-- Insert example portfolios
INSERT INTO portfolios (portfolio_id, name, description, category, risk_level, tokens, allocations, rebalance_frequency) VALUES
(
  'bluechip-blend',
  'Bluechip Blend',
  'Focused on BTC & ETH stability for long-term growth',
  'stable',
  1,
  '[
    {"symbol": "BTC", "name": "Bitcoin", "address": "0x...", "logo": "https://cryptologos.cc/logos/bitcoin-btc-logo.svg"},
    {"symbol": "ETH", "name": "Ethereum", "address": "0x...", "logo": "https://cryptologos.cc/logos/ethereum-eth-logo.svg"}
  ]'::jsonb,
  '[
    {"symbol": "BTC", "weight": 60},
    {"symbol": "ETH", "weight": 40}
  ]'::jsonb,
  2592000 -- 30 days
),
(
  'ai-agents',
  'AI & Agents',
  'Exposure to AI-focused protocols and agent networks',
  'ai',
  2,
  '[
    {"symbol": "FET", "name": "Fetch.ai", "address": "0x...", "logo": ""},
    {"symbol": "AGIX", "name": "SingularityNET", "address": "0x...", "logo": ""},
    {"symbol": "OCEAN", "name": "Ocean Protocol", "address": "0x...", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "FET", "weight": 35},
    {"symbol": "AGIX", "weight": 35},
    {"symbol": "OCEAN", "weight": 30}
  ]'::jsonb,
  1209600 -- 14 days
),
(
  'layer1-leaders',
  'Layer 1 Leaders',
  'Dominant smart contract platforms for diversified L1 exposure',
  'layer1',
  2,
  '[
    {"symbol": "ETH", "name": "Ethereum", "address": "0x...", "logo": ""},
    {"symbol": "SOL", "name": "Solana", "address": "0x...", "logo": ""},
    {"symbol": "AVAX", "name": "Avalanche", "address": "0x...", "logo": ""},
    {"symbol": "ADA", "name": "Cardano", "address": "0x...", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "ETH", "weight": 40},
    {"symbol": "SOL", "weight": 30},
    {"symbol": "AVAX", "weight": 20},
    {"symbol": "ADA", "weight": 10}
  ]'::jsonb,
  2592000 -- 30 days
),
(
  'layer2-growth',
  'Layer 2 Growth',
  'Scaling & rollup ecosystem for Ethereum growth',
  'layer2',
  2,
  '[
    {"symbol": "ARB", "name": "Arbitrum", "address": "0x...", "logo": ""},
    {"symbol": "OP", "name": "Optimism", "address": "0x...", "logo": ""},
    {"symbol": "STRK", "name": "Starknet", "address": "0x...", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "ARB", "weight": 40},
    {"symbol": "OP", "weight": 40},
    {"symbol": "STRK", "weight": 20}
  ]'::jsonb,
  2592000 -- 30 days
),
(
  'defi-revival',
  'DeFi Revival',
  'DeFi protocols with strong fundamentals',
  'defi',
  3,
  '[
    {"symbol": "AAVE", "name": "Aave", "address": "0x...", "logo": ""},
    {"symbol": "UNI", "name": "Uniswap", "address": "0x...", "logo": ""},
    {"symbol": "SKY", "name": "Sky Protocol", "address": "0x...", "logo": ""},
    {"symbol": "CRV", "name": "Curve", "address": "0x...", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "AAVE", "weight": 30},
    {"symbol": "UNI", "weight": 30},
    {"symbol": "SKY", "weight": 25},
    {"symbol": "CRV", "weight": 15}
  ]'::jsonb,
  1209600 -- 14 days
),
(
  'meme-momentum',
  'Meme Momentum',
  'High-volatility trending meme coins for aggressive traders',
  'meme',
  3,
  '[
    {"symbol": "DOGE", "name": "Dogecoin", "address": "0x...", "logo": ""},
    {"symbol": "SHIB", "name": "Shiba Inu", "address": "0x...", "logo": ""},
    {"symbol": "PEPE", "name": "Pepe", "address": "0x...", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "DOGE", "weight": 40},
    {"symbol": "SHIB", "weight": 30},
    {"symbol": "PEPE", "weight": 30}
  ]'::jsonb,
  604800 -- 7 days
);

COMMENT ON TABLE portfolios IS 'Curated crypto portfolios with auto-rebalancing';
COMMENT ON TABLE user_investments IS 'User investments in portfolios';
COMMENT ON TABLE portfolio_performance IS 'Historical performance tracking for portfolios';
COMMENT ON TABLE rebalance_history IS 'Audit trail of portfolio rebalances';
COMMENT ON TABLE token_prices IS 'Cached Pyth Network token prices';
COMMENT ON TABLE investment_transactions IS 'Audit trail of all investment transactions';
