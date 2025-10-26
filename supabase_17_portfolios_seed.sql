-- ============================================
-- 17 Professional Crypto Portfolios Seed Data
-- ETHOnline 2025 - Complete Portfolio Suite
-- ============================================

-- Clear existing portfolios (if reseeding)
-- DELETE FROM portfolios;

-- Insert all 17 curated portfolios
INSERT INTO portfolios (
  portfolio_id,
  name,
  description,
  category,
  risk_level,
  tokens,
  allocations,
  rebalance_frequency,
  last_rebalanced,
  is_active,
  total_invested,
  current_nav,
  performance_24h,
  performance_7d,
  performance_30d
) VALUES

-- 1. Bluechip Blend (Low Risk)
(
  'bluechip-blend',
  'Bluechip Blend',
  'Focused on long-term stability with top-tier assets. Perfect for conservative investors seeking steady growth.',
  'stable',
  1,
  '[
    {"symbol": "BTC", "name": "Bitcoin", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "ETH", "name": "Ethereum", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "BTC", "weight": 60},
    {"symbol": "ETH", "weight": 40}
  ]'::jsonb,
  2592000, -- Monthly (30 days)
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
),

-- 2. AI & Agents (Medium Risk)
(
  'ai-agents',
  'AI & Agents',
  'Exposure to decentralized AI and agent-based systems. Capitalizing on the AI revolution in crypto.',
  'ai',
  2,
  '[
    {"symbol": "FET", "name": "Fetch.ai", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "AGIX", "name": "SingularityNET", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "OCEAN", "name": "Ocean Protocol", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "FET", "weight": 50},
    {"symbol": "AGIX", "weight": 30},
    {"symbol": "OCEAN", "weight": 20}
  ]'::jsonb,
  1209600, -- Bi-weekly (14 days)
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
),

-- 3. Layer 1 Leaders (Medium Risk)
(
  'layer1-leaders',
  'Layer 1 Leaders',
  'Dominant smart contract platforms driving blockchain innovation and adoption.',
  'layer1',
  2,
  '[
    {"symbol": "ETH", "name": "Ethereum", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "SOL", "name": "Solana", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "AVAX", "name": "Avalanche", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "ETH", "weight": 50},
    {"symbol": "SOL", "weight": 25},
    {"symbol": "AVAX", "weight": 25}
  ]'::jsonb,
  2592000, -- Monthly
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
),

-- 4. Layer 2 Growth (Medium Risk)
(
  'layer2-growth',
  'Layer 2 Growth',
  'Scaling solutions enhancing Ethereum''s capabilities with lower fees and faster transactions.',
  'layer2',
  2,
  '[
    {"symbol": "ARB", "name": "Arbitrum", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "OP", "name": "Optimism", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "STRK", "name": "Starknet", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "ARB", "weight": 40},
    {"symbol": "OP", "weight": 40},
    {"symbol": "STRK", "weight": 20}
  ]'::jsonb,
  2592000, -- Monthly
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
),

-- 5. Top 10 Index (Low Risk)
(
  'top10-index',
  'Top 10 Index',
  'Diversified exposure to top 10 crypto assets by market cap. Passive index strategy.',
  'index',
  1,
  '[
    {"symbol": "BTC", "name": "Bitcoin", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "ETH", "name": "Ethereum", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "SOL", "name": "Solana", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "ADA", "name": "Cardano", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "AVAX", "name": "Avalanche", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "DOGE", "name": "Dogecoin", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "BTC", "weight": 35},
    {"symbol": "ETH", "weight": 30},
    {"symbol": "SOL", "weight": 15},
    {"symbol": "ADA", "weight": 8},
    {"symbol": "AVAX", "weight": 7},
    {"symbol": "DOGE", "weight": 5}
  ]'::jsonb,
  2592000, -- Monthly
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
),

-- 6. DeFi Titans (Medium Risk)
(
  'defi-titans',
  'DeFi Titans',
  'Leading decentralized finance protocols powering the open financial system.',
  'defi',
  2,
  '[
    {"symbol": "AAVE", "name": "Aave", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "UNI", "name": "Uniswap", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "MKR", "name": "Maker", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "CRV", "name": "Curve", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "AAVE", "weight": 25},
    {"symbol": "UNI", "weight": 25},
    {"symbol": "MKR", "weight": 25},
    {"symbol": "CRV", "weight": 25}
  ]'::jsonb,
  1209600, -- Bi-weekly
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
),

-- 7. Stable Yield (Low Risk)
(
  'stable-yield',
  'Stable Yield',
  'Yield-bearing stablecoin strategies with low volatility. Capital preservation with steady returns.',
  'stable',
  1,
  '[
    {"symbol": "PYUSD", "name": "PayPal USD", "address": "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9", "logo": ""},
    {"symbol": "USDC", "name": "USD Coin", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "PYUSD", "weight": 70},
    {"symbol": "USDC", "weight": 30}
  ]'::jsonb,
  604800, -- Weekly
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
),

-- 8. Web3 Infrastructure (Medium Risk)
(
  'web3-infrastructure',
  'Web3 Infrastructure',
  'Tools and oracles that power the blockchain ecosystem. Essential infrastructure plays.',
  'infrastructure',
  2,
  '[
    {"symbol": "LINK", "name": "Chainlink", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "GRT", "name": "The Graph", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "LINK", "weight": 40},
    {"symbol": "GRT", "weight": 30},
    {"symbol": "ARB", "weight": 30}
  ]'::jsonb,
  2592000, -- Monthly
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
),

-- 9. Meme Momentum (High Risk)
(
  'meme-momentum',
  'Meme Momentum',
  'High-volatility meme tokens with viral potential. For risk-tolerant investors only.',
  'meme',
  3,
  '[
    {"symbol": "DOGE", "name": "Dogecoin", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "SHIB", "name": "Shiba Inu", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "PEPE", "name": "Pepe", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "DOGE", "weight": 40},
    {"symbol": "SHIB", "weight": 30},
    {"symbol": "PEPE", "weight": 20},
    {"symbol": "SHIB", "weight": 10}
  ]'::jsonb,
  604800, -- Weekly
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
),

-- 10. GameFi & Metaverse (High Risk)
(
  'gamefi-metaverse',
  'GameFi & Metaverse',
  'Tokens from gaming and metaverse ecosystems. Future of digital entertainment.',
  'gaming',
  3,
  '[
    {"symbol": "AXS", "name": "Axie Infinity", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "SAND", "name": "The Sandbox", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "MANA", "name": "Decentraland", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "AXS", "weight": 30},
    {"symbol": "SAND", "weight": 25},
    {"symbol": "MANA", "weight": 25},
    {"symbol": "SOL", "weight": 20}
  ]'::jsonb,
  2592000, -- Monthly
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
),

-- 11. NextGen Protocols (Medium Risk)
(
  'nextgen-protocols',
  'NextGen Protocols',
  'Fast-growing projects with new tech or tokenomics. Cutting-edge blockchain innovation.',
  'emerging',
  2,
  '[
    {"symbol": "SEI", "name": "Sei Network", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "TIA", "name": "Celestia", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "SUI", "name": "Sui", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "SEI", "weight": 25},
    {"symbol": "TIA", "weight": 25},
    {"symbol": "SUI", "weight": 25},
    {"symbol": "ARB", "weight": 25}
  ]'::jsonb,
  2592000, -- Monthly
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
),

-- 12. Sustainable Crypto (Low Risk)
(
  'sustainable-crypto',
  'Sustainable Crypto',
  'Environmentally conscious, energy-efficient networks. ESG-focused blockchain investing.',
  'sustainable',
  1,
  '[
    {"symbol": "ADA", "name": "Cardano", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "ALGO", "name": "Algorand", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "ADA", "weight": 40},
    {"symbol": "ALGO", "weight": 30},
    {"symbol": "SOL", "weight": 30}
  ]'::jsonb,
  2592000, -- Monthly
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
),

-- 13. Innovation Index (Medium Risk)
(
  'innovation-index',
  'Innovation Index',
  'Exposure to emerging blockchain categories (AI + RWAs). Thematic innovation portfolio.',
  'innovation',
  2,
  '[
    {"symbol": "FET", "name": "Fetch.ai", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "AGIX", "name": "SingularityNET", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "MKR", "name": "Maker", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "FET", "weight": 25},
    {"symbol": "MKR", "weight": 25},
    {"symbol": "AGIX", "weight": 25},
    {"symbol": "ARB", "weight": 25}
  ]'::jsonb,
  1209600, -- Bi-weekly
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
),

-- 14. ETH Ecosystem (Medium Risk)
(
  'eth-ecosystem',
  'ETH Ecosystem',
  'Ethereum-aligned protocols with strong fundamentals. Pure Ethereum ecosystem play.',
  'ethereum',
  2,
  '[
    {"symbol": "ETH", "name": "Ethereum", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "ARB", "name": "Arbitrum", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "OP", "name": "Optimism", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "ETH", "weight": 50},
    {"symbol": "ARB", "weight": 20},
    {"symbol": "OP", "weight": 20},
    {"symbol": "UNI", "weight": 10}
  ]'::jsonb,
  2592000, -- Monthly
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
),

-- 15. Bitcoin Ecosystem (Low Risk)
(
  'bitcoin-ecosystem',
  'Bitcoin Ecosystem',
  'BTC and tokens built on Bitcoin L2s and Runes. Bitcoin maximalist portfolio.',
  'bitcoin',
  1,
  '[
    {"symbol": "BTC", "name": "Bitcoin", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "STX", "name": "Stacks", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "BTC", "weight": 70},
    {"symbol": "STX", "weight": 20},
    {"symbol": "ETH", "weight": 10}
  ]'::jsonb,
  2592000, -- Monthly
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
),

-- 16. Real World Assets (Medium Risk)
(
  'rwa-index',
  'Real World Assets (RWA)',
  'On-chain real-world assets like treasury and yield tokens. Bridging TradFi and DeFi.',
  'rwa',
  2,
  '[
    {"symbol": "MKR", "name": "Maker", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "AAVE", "name": "Aave", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "MKR", "weight": 40},
    {"symbol": "AAVE", "weight": 30},
    {"symbol": "UNI", "weight": 30}
  ]'::jsonb,
  2592000, -- Monthly
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
),

-- 17. Builder's Basket (Medium Risk)
(
  'builders-basket',
  'Builder''s Basket',
  'Developer-focused tools & infrastructure plays. The picks and shovels of Web3.',
  'infrastructure',
  2,
  '[
    {"symbol": "GRT", "name": "The Graph", "address": "0x0000000000000000000000000000000000000000", "logo": ""},
    {"symbol": "LINK", "name": "Chainlink", "address": "0x0000000000000000000000000000000000000000", "logo": ""}
  ]'::jsonb,
  '[
    {"symbol": "GRT", "weight": 30},
    {"symbol": "LINK", "weight": 30},
    {"symbol": "ARB", "weight": 25},
    {"symbol": "OP", "weight": 15}
  ]'::jsonb,
  2592000, -- Monthly
  NOW(),
  true,
  0,
  1,
  0,
  0,
  0
);

-- Verify insertion
SELECT 
  portfolio_id, 
  name, 
  category, 
  risk_level,
  jsonb_array_length(allocations) as num_tokens,
  rebalance_frequency / 86400 as rebalance_days
FROM portfolios
ORDER BY risk_level, name;
