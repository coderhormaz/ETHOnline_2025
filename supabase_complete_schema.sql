-- ============================================
-- StackFlow - Complete Database Schema
-- ETHOnline 2025
-- Run this ONCE in Supabase SQL Editor to rebuild the entire DB
-- ============================================

-- ============================================
-- 1. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. DROP EXISTING OBJECTS (clean rebuild)
-- ============================================
DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
DROP TRIGGER IF EXISTS update_user_investments_updated_at ON user_investments;
DROP TRIGGER IF EXISTS update_payment_links_updated_at ON payment_links;

DROP TABLE IF EXISTS investment_transactions CASCADE;
DROP TABLE IF EXISTS rebalance_history CASCADE;
DROP TABLE IF EXISTS portfolio_performance CASCADE;
DROP TABLE IF EXISTS user_investments CASCADE;
DROP TABLE IF EXISTS token_prices CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS payment_links CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS handles CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;

-- ============================================
-- 3. CORE TABLES (Wallets, Handles, Transactions)
-- ============================================

-- Wallets: stores encrypted private keys and public addresses
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  public_address TEXT NOT NULL UNIQUE,
  encrypted_private_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_wallets_public_address ON wallets(public_address);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- Handles: unique @pyusd handles for users
CREATE TABLE handles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  CHECK (handle ~ '^[a-z0-9._-]+@pyusd$')
);

CREATE INDEX idx_handles_handle ON handles(handle);
CREATE INDEX idx_handles_user_id ON handles(user_id);

-- Transactions: payment history between users
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id),
  to_user_id UUID NOT NULL REFERENCES auth.users(id),
  from_handle TEXT NOT NULL,
  to_handle TEXT NOT NULL,
  amount TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_from_user ON transactions(from_user_id, created_at DESC);
CREATE INDEX idx_transactions_to_user ON transactions(to_user_id, created_at DESC);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);

-- ============================================
-- 4. PAYMENT LINKS TABLE
-- ============================================

CREATE TABLE payment_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id TEXT NOT NULL UNIQUE,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_handle TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  amount TEXT NOT NULL,
  note TEXT,
  title TEXT,
  custom_message TEXT,
  color TEXT DEFAULT '#9333ea',
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  paid_by_address TEXT,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_links_link_id ON payment_links(link_id);
CREATE INDEX idx_payment_links_recipient ON payment_links(recipient_user_id, created_at DESC);
CREATE INDEX idx_payment_links_paid ON payment_links(paid);

-- ============================================
-- 5. PORTFOLIO SYSTEM TABLES
-- ============================================

-- Portfolios: curated investment portfolios
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  risk_level INTEGER NOT NULL CHECK (risk_level >= 1 AND risk_level <= 3),
  tokens JSONB NOT NULL,
  allocations JSONB NOT NULL,
  rebalance_frequency INTEGER NOT NULL,
  last_rebalanced TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  total_invested DECIMAL(20, 6) DEFAULT 0,
  current_nav DECIMAL(20, 6) DEFAULT 0,
  performance_24h DECIMAL(10, 4) DEFAULT 0,
  performance_7d DECIMAL(10, 4) DEFAULT 0,
  performance_30d DECIMAL(10, 4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolios_category ON portfolios(category);
CREATE INDEX idx_portfolios_active ON portfolios(is_active);
CREATE INDEX idx_portfolios_portfolio_id ON portfolios(portfolio_id);

-- User Investments: tracks user positions in portfolios
CREATE TABLE user_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  pyusd_amount DECIMAL(20, 6) NOT NULL,
  shares DECIMAL(30, 18) NOT NULL,
  current_value DECIMAL(20, 6) DEFAULT 0,
  profit_loss DECIMAL(20, 6) DEFAULT 0,
  profit_loss_percent DECIMAL(10, 4) DEFAULT 0,
  invested_at TIMESTAMPTZ DEFAULT NOW(),
  last_withdrawal TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, portfolio_id)
);

CREATE INDEX idx_user_investments_user ON user_investments(user_id);
CREATE INDEX idx_user_investments_portfolio ON user_investments(portfolio_id);

-- Portfolio Performance: historical NAV snapshots
CREATE TABLE portfolio_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  nav DECIMAL(20, 6) NOT NULL,
  total_invested DECIMAL(20, 6) NOT NULL,
  roi_percent DECIMAL(10, 4) DEFAULT 0,
  token_prices JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolio_performance_portfolio ON portfolio_performance(portfolio_id);
CREATE INDEX idx_portfolio_performance_timestamp ON portfolio_performance(timestamp DESC);

-- Rebalance History: audit trail for portfolio rebalances
CREATE TABLE rebalance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  old_allocations JSONB NOT NULL,
  new_allocations JSONB NOT NULL,
  total_value DECIMAL(20, 6) NOT NULL,
  reason TEXT,
  tx_hash TEXT,
  executed_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rebalance_history_portfolio ON rebalance_history(portfolio_id);

-- Token Prices: cached Pyth oracle prices
CREATE TABLE token_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT UNIQUE NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  confidence DECIMAL(20, 8),
  price_feed_id TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token_prices_symbol ON token_prices(symbol);

-- Investment Transactions: audit trail for invest/withdraw
CREATE TABLE investment_transactions (
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

CREATE INDEX idx_investment_transactions_user ON investment_transactions(user_id);
CREATE INDEX idx_investment_transactions_portfolio ON investment_transactions(portfolio_id);

-- ============================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_links_updated_at
  BEFORE UPDATE ON payment_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_investments_updated_at
  BEFORE UPDATE ON user_investments
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
  SELECT * INTO v_investment
  FROM user_investments
  WHERE user_id = p_user_id AND portfolio_id = p_portfolio_id;

  SELECT * INTO v_portfolio
  FROM portfolios
  WHERE id = p_portfolio_id;

  IF v_investment IS NULL OR v_portfolio IS NULL THEN
    RETURN QUERY SELECT 0::DECIMAL, 0::DECIMAL, 0::DECIMAL;
    RETURN;
  END IF;

  IF v_portfolio.total_invested > 0 THEN
    v_value := (v_investment.pyusd_amount / v_portfolio.total_invested) * v_portfolio.current_nav;
  ELSE
    v_value := v_investment.pyusd_amount;
  END IF;

  v_pl := v_value - v_investment.pyusd_amount;
  IF v_investment.pyusd_amount > 0 THEN
    v_pl_pct := (v_pl / v_investment.pyusd_amount) * 100;
  ELSE
    v_pl_pct := 0;
  END IF;

  RETURN QUERY SELECT v_value, v_pl, v_pl_pct;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE handles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE rebalance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;

-- === Wallets ===
CREATE POLICY "Users can view their own wallet"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet"
  ON wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- === Handles ===
CREATE POLICY "Anyone can view handles"
  ON handles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon can view handles for availability check"
  ON handles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert their own handle"
  ON handles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- === Transactions ===
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = from_user_id);

-- === Payment Links ===
CREATE POLICY "Users can view their own payment links"
  ON payment_links FOR SELECT
  USING (auth.uid() = recipient_user_id);

CREATE POLICY "Anyone can view payment links by link_id"
  ON payment_links FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon can view payment links"
  ON payment_links FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert their own payment links"
  ON payment_links FOR INSERT
  WITH CHECK (auth.uid() = recipient_user_id);

CREATE POLICY "Users can update their own payment links"
  ON payment_links FOR UPDATE
  USING (auth.uid() = recipient_user_id);

CREATE POLICY "Anyone can update payment links to mark paid"
  ON payment_links FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete their own payment links"
  ON payment_links FOR DELETE
  USING (auth.uid() = recipient_user_id);

-- === Portfolios ===
CREATE POLICY "Portfolios are viewable by everyone"
  ON portfolios FOR SELECT
  USING (true);

CREATE POLICY "Portfolios are insertable by admins"
  ON portfolios FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Portfolios are updatable by admins"
  ON portfolios FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- === User Investments ===
CREATE POLICY "Users can view their own investments"
  ON user_investments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investments"
  ON user_investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments"
  ON user_investments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investments"
  ON user_investments FOR DELETE
  USING (auth.uid() = user_id);

-- === Portfolio Performance ===
CREATE POLICY "Performance is viewable by everyone"
  ON portfolio_performance FOR SELECT
  USING (true);

CREATE POLICY "Performance is insertable by admins"
  ON portfolio_performance FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- === Rebalance History ===
CREATE POLICY "Rebalance history is viewable by everyone"
  ON rebalance_history FOR SELECT
  USING (true);

CREATE POLICY "Rebalance history is insertable by admins"
  ON rebalance_history FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- === Token Prices ===
CREATE POLICY "Token prices are viewable by everyone"
  ON token_prices FOR SELECT
  USING (true);

CREATE POLICY "Token prices are insertable by admins"
  ON token_prices FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Token prices are updatable by admins"
  ON token_prices FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- === Investment Transactions ===
CREATE POLICY "Users can view their own investment transactions"
  ON investment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investment transactions"
  ON investment_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 8. ENABLE REALTIME for payment_links
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE payment_links;

-- ============================================
-- 9. SEED DATA: 17 Curated Portfolios
-- ============================================

INSERT INTO portfolios (
  portfolio_id, name, description, category, risk_level,
  tokens, allocations, rebalance_frequency,
  last_rebalanced, is_active, total_invested, current_nav,
  performance_24h, performance_7d, performance_30d
) VALUES

-- 1. Bluechip Blend (Low Risk)
(
  'bluechip-blend',
  'Bluechip Blend',
  'Focused on long-term stability with top-tier assets. Perfect for conservative investors seeking steady growth.',
  'stable', 1,
  '[{"symbol":"BTC","name":"Bitcoin","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"ETH","name":"Ethereum","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"BTC","weight":60},{"symbol":"ETH","weight":40}]'::jsonb,
  2592000, NOW(), true, 0, 1, 0, 0, 0
),

-- 2. AI & Agents (Medium Risk)
(
  'ai-agents',
  'AI & Agents',
  'Exposure to decentralized AI and agent-based systems. Capitalizing on the AI revolution in crypto.',
  'ai', 2,
  '[{"symbol":"FET","name":"Fetch.ai","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"AGIX","name":"SingularityNET","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"OCEAN","name":"Ocean Protocol","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"FET","weight":50},{"symbol":"AGIX","weight":30},{"symbol":"OCEAN","weight":20}]'::jsonb,
  1209600, NOW(), true, 0, 1, 0, 0, 0
),

-- 3. Layer 1 Leaders (Medium Risk)
(
  'layer1-leaders',
  'Layer 1 Leaders',
  'Dominant smart contract platforms driving blockchain innovation and adoption.',
  'layer1', 2,
  '[{"symbol":"ETH","name":"Ethereum","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"SOL","name":"Solana","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"AVAX","name":"Avalanche","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"ETH","weight":50},{"symbol":"SOL","weight":25},{"symbol":"AVAX","weight":25}]'::jsonb,
  2592000, NOW(), true, 0, 1, 0, 0, 0
),

-- 4. Layer 2 Growth (Medium Risk)
(
  'layer2-growth',
  'Layer 2 Growth',
  'Scaling solutions enhancing Ethereum''s capabilities with lower fees and faster transactions.',
  'layer2', 2,
  '[{"symbol":"ARB","name":"Arbitrum","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"OP","name":"Optimism","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"STRK","name":"Starknet","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"ARB","weight":40},{"symbol":"OP","weight":40},{"symbol":"STRK","weight":20}]'::jsonb,
  2592000, NOW(), true, 0, 1, 0, 0, 0
),

-- 5. Top 10 Index (Low Risk)
(
  'top10-index',
  'Top 10 Index',
  'Diversified exposure to top 10 crypto assets by market cap. Passive index strategy.',
  'index', 1,
  '[{"symbol":"BTC","name":"Bitcoin","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"ETH","name":"Ethereum","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"SOL","name":"Solana","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"ADA","name":"Cardano","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"AVAX","name":"Avalanche","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"DOGE","name":"Dogecoin","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"BTC","weight":35},{"symbol":"ETH","weight":30},{"symbol":"SOL","weight":15},{"symbol":"ADA","weight":8},{"symbol":"AVAX","weight":7},{"symbol":"DOGE","weight":5}]'::jsonb,
  2592000, NOW(), true, 0, 1, 0, 0, 0
),

-- 6. DeFi Titans (Medium Risk)
(
  'defi-titans',
  'DeFi Titans',
  'Leading decentralized finance protocols powering the open financial system.',
  'defi', 2,
  '[{"symbol":"AAVE","name":"Aave","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"UNI","name":"Uniswap","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"MKR","name":"Maker","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"CRV","name":"Curve","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"AAVE","weight":25},{"symbol":"UNI","weight":25},{"symbol":"MKR","weight":25},{"symbol":"CRV","weight":25}]'::jsonb,
  1209600, NOW(), true, 0, 1, 0, 0, 0
),

-- 7. Stable Yield (Low Risk)
(
  'stable-yield',
  'Stable Yield',
  'Yield-bearing stablecoin strategies with low volatility. Capital preservation with steady returns.',
  'stable', 1,
  '[{"symbol":"PYUSD","name":"PayPal USD","address":"0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9","logo":""},{"symbol":"USDC","name":"USD Coin","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"PYUSD","weight":70},{"symbol":"USDC","weight":30}]'::jsonb,
  604800, NOW(), true, 0, 1, 0, 0, 0
),

-- 8. Web3 Infrastructure (Medium Risk)
(
  'web3-infrastructure',
  'Web3 Infrastructure',
  'Tools and oracles that power the blockchain ecosystem. Essential infrastructure plays.',
  'infrastructure', 2,
  '[{"symbol":"LINK","name":"Chainlink","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"GRT","name":"The Graph","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"LINK","weight":40},{"symbol":"GRT","weight":30},{"symbol":"ARB","weight":30}]'::jsonb,
  2592000, NOW(), true, 0, 1, 0, 0, 0
),

-- 9. Meme Momentum (High Risk)
(
  'meme-momentum',
  'Meme Momentum',
  'High-volatility meme tokens with viral potential. For risk-tolerant investors only.',
  'meme', 3,
  '[{"symbol":"DOGE","name":"Dogecoin","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"SHIB","name":"Shiba Inu","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"PEPE","name":"Pepe","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"DOGE","weight":40},{"symbol":"SHIB","weight":30},{"symbol":"PEPE","weight":20},{"symbol":"SHIB","weight":10}]'::jsonb,
  604800, NOW(), true, 0, 1, 0, 0, 0
),

-- 10. GameFi & Metaverse (High Risk)
(
  'gamefi-metaverse',
  'GameFi & Metaverse',
  'Tokens from gaming and metaverse ecosystems. Future of digital entertainment.',
  'gaming', 3,
  '[{"symbol":"AXS","name":"Axie Infinity","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"SAND","name":"The Sandbox","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"MANA","name":"Decentraland","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"AXS","weight":30},{"symbol":"SAND","weight":25},{"symbol":"MANA","weight":25},{"symbol":"SOL","weight":20}]'::jsonb,
  2592000, NOW(), true, 0, 1, 0, 0, 0
),

-- 11. NextGen Protocols (Medium Risk)
(
  'nextgen-protocols',
  'NextGen Protocols',
  'Fast-growing projects with new tech or tokenomics. Cutting-edge blockchain innovation.',
  'emerging', 2,
  '[{"symbol":"SEI","name":"Sei Network","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"TIA","name":"Celestia","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"SUI","name":"Sui","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"SEI","weight":25},{"symbol":"TIA","weight":25},{"symbol":"SUI","weight":25},{"symbol":"ARB","weight":25}]'::jsonb,
  2592000, NOW(), true, 0, 1, 0, 0, 0
),

-- 12. Sustainable Crypto (Low Risk)
(
  'sustainable-crypto',
  'Sustainable Crypto',
  'Environmentally conscious, energy-efficient networks. ESG-focused blockchain investing.',
  'sustainable', 1,
  '[{"symbol":"ADA","name":"Cardano","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"ALGO","name":"Algorand","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"ADA","weight":40},{"symbol":"ALGO","weight":30},{"symbol":"SOL","weight":30}]'::jsonb,
  2592000, NOW(), true, 0, 1, 0, 0, 0
),

-- 13. Innovation Index (Medium Risk)
(
  'innovation-index',
  'Innovation Index',
  'Exposure to emerging blockchain categories (AI + RWAs). Thematic innovation portfolio.',
  'innovation', 2,
  '[{"symbol":"FET","name":"Fetch.ai","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"AGIX","name":"SingularityNET","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"MKR","name":"Maker","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"FET","weight":25},{"symbol":"MKR","weight":25},{"symbol":"AGIX","weight":25},{"symbol":"ARB","weight":25}]'::jsonb,
  1209600, NOW(), true, 0, 1, 0, 0, 0
),

-- 14. ETH Ecosystem (Medium Risk)
(
  'eth-ecosystem',
  'ETH Ecosystem',
  'Ethereum-aligned protocols with strong fundamentals. Pure Ethereum ecosystem play.',
  'ethereum', 2,
  '[{"symbol":"ETH","name":"Ethereum","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"ARB","name":"Arbitrum","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"OP","name":"Optimism","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"ETH","weight":50},{"symbol":"ARB","weight":20},{"symbol":"OP","weight":20},{"symbol":"UNI","weight":10}]'::jsonb,
  2592000, NOW(), true, 0, 1, 0, 0, 0
),

-- 15. Bitcoin Ecosystem (Low Risk)
(
  'bitcoin-ecosystem',
  'Bitcoin Ecosystem',
  'BTC and tokens built on Bitcoin L2s and Runes. Bitcoin maximalist portfolio.',
  'bitcoin', 1,
  '[{"symbol":"BTC","name":"Bitcoin","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"STX","name":"Stacks","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"BTC","weight":70},{"symbol":"STX","weight":20},{"symbol":"ETH","weight":10}]'::jsonb,
  2592000, NOW(), true, 0, 1, 0, 0, 0
),

-- 16. Real World Assets (Medium Risk)
(
  'rwa-index',
  'Real World Assets (RWA)',
  'On-chain real-world assets like treasury and yield tokens. Bridging TradFi and DeFi.',
  'rwa', 2,
  '[{"symbol":"MKR","name":"Maker","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"AAVE","name":"Aave","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"MKR","weight":40},{"symbol":"AAVE","weight":30},{"symbol":"UNI","weight":30}]'::jsonb,
  2592000, NOW(), true, 0, 1, 0, 0, 0
),

-- 17. Builder's Basket (Medium Risk)
(
  'builders-basket',
  'Builder''s Basket',
  'Developer-focused tools & infrastructure plays. The picks and shovels of Web3.',
  'infrastructure', 2,
  '[{"symbol":"GRT","name":"The Graph","address":"0x0000000000000000000000000000000000000000","logo":""},{"symbol":"LINK","name":"Chainlink","address":"0x0000000000000000000000000000000000000000","logo":""}]'::jsonb,
  '[{"symbol":"GRT","weight":30},{"symbol":"LINK","weight":30},{"symbol":"ARB","weight":25},{"symbol":"OP","weight":15}]'::jsonb,
  2592000, NOW(), true, 0, 1, 0, 0, 0
);

-- ============================================
-- 10. VERIFY
-- ============================================
SELECT 'Schema created successfully!' AS status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
SELECT portfolio_id, name, category, risk_level FROM portfolios ORDER BY created_at;
