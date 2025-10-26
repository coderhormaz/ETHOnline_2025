import { supabase } from '../lib/supabase';
import { fetchLivePrice, type TokenSymbol } from '../lib/blockchain/pyth';

/**
 * Check if a portfolio needs rebalancing based on its frequency
 */
export async function checkRebalanceTriggers(portfolioId: string): Promise<{
  needsRebalance: boolean;
  reason?: string;
  timeSinceLastRebalance?: number;
}> {
  try {
    // Fetch portfolio
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .single();

    if (error || !portfolio) {
      return { needsRebalance: false };
    }

    const lastRebalanced = new Date(portfolio.last_rebalanced).getTime();
    const now = Date.now();
    const timeSinceLastRebalance = (now - lastRebalanced) / 1000; // seconds

    // Check if enough time has passed
    if (timeSinceLastRebalance >= portfolio.rebalance_frequency) {
      return {
        needsRebalance: true,
        reason: 'Scheduled rebalance',
        timeSinceLastRebalance,
      };
    }

    // Check for drift from target allocation
    const driftThreshold = 0.05; // 5% drift triggers rebalance
    const allocations = portfolio.allocations as Array<{ symbol: string; weight: number }>;
    
    // Get current prices
    const prices: { [key: string]: number } = {};
    for (const allocation of allocations) {
      const priceData = await fetchLivePrice(allocation.symbol as TokenSymbol);
      prices[allocation.symbol] = priceData.price;
    }

    // Calculate current total value (mock - would need actual holdings)
    const totalValue = portfolio.current_nav;
    
    // Check if any token has drifted > 5% from target
    for (const allocation of allocations) {
      const targetWeight = allocation.weight / 100;
      // This is simplified - would need actual token holdings to calculate real drift
      // For now, we just check time-based rebalancing
    }

    return {
      needsRebalance: false,
      timeSinceLastRebalance,
    };
  } catch (error) {
    console.error('Error checking rebalance triggers:', error);
    return { needsRebalance: false };
  }
}

/**
 * Execute rebalancing for a portfolio
 */
export async function executeRebalance(portfolioId: string, reason: string): Promise<{
  success: boolean;
  error?: string;
  rebalanceId?: string;
}> {
  try {
    // Fetch portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .single();

    if (portfolioError || !portfolio) {
      return { success: false, error: 'Portfolio not found' };
    }

    const allocations = portfolio.allocations as Array<{ symbol: string; weight: number }>;

    // Get current prices for all tokens
    const prices: { [key: string]: number } = {};
    for (const allocation of allocations) {
      const priceData = await fetchLivePrice(allocation.symbol as TokenSymbol);
      prices[allocation.symbol] = priceData.price;
    }

    // Calculate total portfolio value
    const totalValue = portfolio.current_nav;

    // Calculate target amounts for each token based on weights
    const trades: Array<{ symbol: string; targetAmount: number; currentAmount: number }> = [];
    
    for (const allocation of allocations) {
      const targetValue = totalValue * (allocation.weight / 100);
      const targetAmount = targetValue / prices[allocation.symbol];
      
      // In a real implementation, we would:
      // 1. Get current holdings from blockchain
      // 2. Calculate difference between current and target
      // 3. Execute trades to rebalance
      
      trades.push({
        symbol: allocation.symbol,
        targetAmount,
        currentAmount: targetAmount, // Mock current = target for now
      });
    }

    // Record rebalance in history
    const { data: rebalanceRecord, error: insertError } = await supabase
      .from('rebalance_history')
      .insert({
        portfolio_id: portfolioId,
        total_value: totalValue,
        allocations_before: allocations,
        allocations_after: allocations, // Same for now since we're not executing real trades
        trades_executed: trades,
        reason,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Update portfolio last_rebalanced timestamp
    const { error: updateError } = await supabase
      .from('portfolios')
      .update({ last_rebalanced: new Date().toISOString() })
      .eq('portfolio_id', portfolioId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return {
      success: true,
      rebalanceId: rebalanceRecord.id,
    };
  } catch (error) {
    console.error('Error executing rebalance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Auto-rebalance portfolio if needed
 */
export async function autoRebalanceIfNeeded(portfolioId: string): Promise<{
  success: boolean;
  rebalanced: boolean;
  error?: string;
}> {
  try {
    // Check if rebalance is needed
    const check = await checkRebalanceTriggers(portfolioId);
    
    if (!check.needsRebalance) {
      return { success: true, rebalanced: false };
    }

    // Execute rebalance
    const result = await executeRebalance(portfolioId, check.reason || 'Auto-rebalance');
    
    if (!result.success) {
      return { success: false, rebalanced: false, error: result.error };
    }

    return { success: true, rebalanced: true };
  } catch (error) {
    console.error('Error in auto-rebalance:', error);
    return {
      success: false,
      rebalanced: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Background job to check and rebalance all portfolios
 * This should be run on a schedule (e.g., hourly via cron job)
 */
export async function rebalanceAllPortfolios(): Promise<{
  success: boolean;
  rebalancedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let rebalancedCount = 0;

  try {
    // Fetch all active portfolios
    const { data: portfolios, error } = await supabase
      .from('portfolios')
      .select('portfolio_id')
      .eq('is_active', true);

    if (error) {
      return { success: false, rebalancedCount: 0, errors: [error.message] };
    }

    // Check and rebalance each portfolio
    for (const portfolio of portfolios || []) {
      const result = await autoRebalanceIfNeeded(portfolio.portfolio_id);
      
      if (!result.success) {
        errors.push(`${portfolio.portfolio_id}: ${result.error}`);
      } else if (result.rebalanced) {
        rebalancedCount++;
      }
    }

    return {
      success: errors.length === 0,
      rebalancedCount,
      errors,
    };
  } catch (error) {
    console.error('Error rebalancing all portfolios:', error);
    return {
      success: false,
      rebalancedCount,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Calculate optimal rebalancing trades to minimize slippage and gas
 */
export function calculateOptimalTrades(
  currentHoldings: { [symbol: string]: number },
  targetAllocations: Array<{ symbol: string; weight: number }>,
  prices: { [symbol: string]: number },
  totalValue: number
): Array<{
  symbol: string;
  action: 'buy' | 'sell';
  amount: number;
  valueUSD: number;
}> {
  const trades: Array<{
    symbol: string;
    action: 'buy' | 'sell';
    amount: number;
    valueUSD: number;
  }> = [];

  for (const allocation of targetAllocations) {
    const targetValue = totalValue * (allocation.weight / 100);
    const targetAmount = targetValue / prices[allocation.symbol];
    const currentAmount = currentHoldings[allocation.symbol] || 0;
    const difference = targetAmount - currentAmount;

    if (Math.abs(difference) > 0.0001) { // Ignore tiny differences
      trades.push({
        symbol: allocation.symbol,
        action: difference > 0 ? 'buy' : 'sell',
        amount: Math.abs(difference),
        valueUSD: Math.abs(difference) * prices[allocation.symbol],
      });
    }
  }

  // Sort by value (execute larger trades first to minimize impact)
  return trades.sort((a, b) => b.valueUSD - a.valueUSD);
}
