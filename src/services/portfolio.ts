/**
 * Portfolio Service
 * Handles all portfolio-related operations including investments, withdrawals, and performance tracking
 */

import { supabase } from '../lib/supabase';
import { fetchMultiplePrices, calculatePortfolioValue, calculatePerformance, type TokenSymbol } from '../lib/blockchain/pyth';

export interface Portfolio {
  id: string;
  portfolio_id: string;
  name: string;
  description: string;
  category: string;
  risk_level: number;
  tokens: Array<{
    symbol: string;
    name: string;
    address: string;
    logo: string;
  }>;
  allocations: Array<{
    symbol: string;
    weight: number;
  }>;
  rebalance_frequency: number;
  last_rebalanced: string;
  is_active: boolean;
  total_invested: number;
  current_nav: number;
  performance_24h: number;
  performance_7d: number;
  performance_30d: number;
  created_at: string;
  updated_at: string;
}

export interface UserInvestment {
  id: string;
  user_id: string;
  portfolio_id: string;
  pyusd_amount: number;
  shares: number;
  current_value: number;
  profit_loss: number;
  profit_loss_percent: number;
  invested_at: string;
  last_withdrawal: string | null;
  updated_at: string;
  portfolio?: Portfolio;
}

export interface PortfolioPerformance {
  id: string;
  portfolio_id: string;
  timestamp: string;
  nav: number;
  total_invested: number;
  roi_percent: number;
  token_prices: Array<{
    symbol: string;
    price: number;
  }>;
}

export interface RebalanceHistory {
  id: string;
  portfolio_id: string;
  old_allocations: Array<{
    symbol: string;
    weight: number;
  }>;
  new_allocations: Array<{
    symbol: string;
    weight: number;
  }>;
  total_value: number;
  reason: string;
  tx_hash: string | null;
  executed_at: string;
}

/**
 * Fetch all active portfolios with live data
 */
export async function fetchPortfolios(): Promise<{
  success: boolean;
  portfolios?: Portfolio[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Update with live prices
    const portfoliosWithLivePrices = await Promise.all(
      (data || []).map(async (portfolio) => {
        const symbols = portfolio.allocations.map((a: any) => a.symbol);
        const prices = await fetchMultiplePrices(symbols);
        
        // Calculate live NAV (simplified for MVP)
        const nav = portfolio.total_invested; // In production, calculate from actual holdings
        
        return {
          ...portfolio,
          current_nav: nav,
          prices: Array.from(prices.values()),
        };
      })
    );

    return {
      success: true,
      portfolios: portfoliosWithLivePrices as Portfolio[],
    };
  } catch (error: any) {
    console.error('Error fetching portfolios:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch portfolios',
    };
  }
}

/**
 * Get portfolio details by ID
 */
export async function getPortfolioDetails(portfolioId: string): Promise<{
  success: boolean;
  portfolio?: Portfolio;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Portfolio not found');

    // Fetch live prices
    const symbols = data.allocations.map((a: any) => a.symbol);
    const prices = await fetchMultiplePrices(symbols);
    
    return {
      success: true,
      portfolio: {
        ...data,
        prices: Array.from(prices.values()),
      } as Portfolio,
    };
  } catch (error: any) {
    console.error('Error fetching portfolio details:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch portfolio details',
    };
  }
}

/**
 * Invest PYUSD in a portfolio
 */
export async function investInPortfolio(
  userId: string,
  portfolioId: string,
  pyusdAmount: number
): Promise<{
  success: boolean;
  investment?: UserInvestment;
  error?: string;
}> {
  try {
    console.log('💰 Starting investment:', { userId, portfolioId, pyusdAmount });
    
    // Validate amount
    if (pyusdAmount < 10) {
      throw new Error('Minimum investment is 10 PYUSD');
    }

    // Get portfolio
    console.log('📊 Fetching portfolio...');
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .single();

    if (portfolioError) {
      console.error('Portfolio fetch error:', portfolioError);
      throw portfolioError;
    }
    if (!portfolio) throw new Error('Portfolio not found');
    
    console.log('✅ Portfolio found:', portfolio.name);

    // Calculate shares (simplified for MVP)
    // shares = investment amount (1:1 for first investor, proportional for subsequent)
    const shares = pyusdAmount;

    // Check if user already has investment
    console.log('🔍 Checking for existing investment...');
    const { data: existingInvestment } = await supabase
      .from('user_investments')
      .select('*')
      .eq('user_id', userId)
      .eq('portfolio_id', portfolioId)
      .single();

    let investment;

    if (existingInvestment) {
      console.log('📈 Updating existing investment...');
      // Update existing investment
      const { data, error } = await supabase
        .from('user_investments')
        .update({
          pyusd_amount: existingInvestment.pyusd_amount + pyusdAmount,
          shares: existingInvestment.shares + shares,
          current_value: existingInvestment.current_value + pyusdAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingInvestment.id)
        .select()
        .single();

      if (error) {
        console.error('Update investment error:', error);
        throw error;
      }
      investment = data;
      console.log('✅ Investment updated');
    } else {
      console.log('🆕 Creating new investment...');
      // Create new investment
      const { data, error } = await supabase
        .from('user_investments')
        .insert({
          user_id: userId,
          portfolio_id: portfolioId,
          pyusd_amount: pyusdAmount,
          shares,
          current_value: pyusdAmount,
          profit_loss: 0,
          profit_loss_percent: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Create investment error:', error);
        throw error;
      }
      investment = data;
      console.log('✅ Investment created');
    }

    // Update portfolio total invested
    console.log('📊 Updating portfolio totals...');
    const { error: updateError } = await supabase
      .from('portfolios')
      .update({
        total_invested: (portfolio.total_invested || 0) + pyusdAmount,
        current_nav: (portfolio.current_nav || 0) + pyusdAmount,
      })
      .eq('id', portfolioId);

    if (updateError) {
      console.error('Portfolio update error:', updateError);
    }

    // Record transaction
    console.log('📝 Recording transaction...');
    const { error: txError } = await supabase.from('investment_transactions').insert({
      user_id: userId,
      portfolio_id: portfolioId,
      transaction_type: 'invest',
      pyusd_amount: pyusdAmount,
      shares_amount: shares,
      nav_at_transaction: portfolio.current_nav || 0,
    });

    if (txError) {
      console.error('Transaction record error:', txError);
    }

    console.log('🎉 Investment completed successfully!');
    return {
      success: true,
      investment: investment as UserInvestment,
    };
  } catch (error: any) {
    console.error('❌ Error investing in portfolio:', error);
    return {
      success: false,
      error: error.message || 'Failed to invest in portfolio',
    };
  }
}

/**
 * Withdraw from a portfolio with real-time profit/loss calculation
 */
export async function withdrawFromPortfolio(
  userId: string,
  portfolioId: string,
  sharesToWithdraw?: number
): Promise<{
  success: boolean;
  pyusdAmount?: number;
  profitLoss?: number;
  profitLossPercent?: number;
  error?: string;
}> {
  try {
    // Get user investment
    const { data: investment, error: investmentError } = await supabase
      .from('user_investments')
      .select('*')
      .eq('user_id', userId)
      .eq('portfolio_id', portfolioId)
      .single();

    if (investmentError) throw investmentError;
    if (!investment) throw new Error('Investment not found');

    // Get portfolio details
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .single();

    if (portfolioError) throw portfolioError;
    if (!portfolio) throw new Error('Portfolio not found');

    // Calculate current portfolio value using live Pyth prices
    const symbols = portfolio.allocations.map((a: any) => a.symbol as TokenSymbol);
    const currentValue = await calculatePortfolioValue(
      portfolio.allocations,
      investment.pyusd_amount
    );

    // Calculate withdrawal amount
    const sharesToRedeem = sharesToWithdraw || investment.shares;
    if (sharesToRedeem > investment.shares) {
      throw new Error('Insufficient shares');
    }

    const withdrawalPercent = sharesToRedeem / investment.shares;
    const pyusdAmount = currentValue * withdrawalPercent;
    const initialInvestment = investment.pyusd_amount * withdrawalPercent;
    const profitLoss = pyusdAmount - initialInvestment;
    const profitLossPercent = (profitLoss / initialInvestment) * 100;

    // Update investment
    const remainingShares = investment.shares - sharesToRedeem;
    const remainingInvestment = investment.pyusd_amount * (1 - withdrawalPercent);

    if (remainingShares === 0) {
      // Delete investment if fully withdrawn
      await supabase
        .from('user_investments')
        .delete()
        .eq('id', investment.id);
    } else {
      // Update investment
      await supabase
        .from('user_investments')
        .update({
          shares: remainingShares,
          pyusd_amount: remainingInvestment,
          current_value: currentValue * (1 - withdrawalPercent),
          profit_loss: profitLoss,
          profit_loss_percent: profitLossPercent,
          last_withdrawal: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', investment.id);
    }

    // Update portfolio totals
    await supabase
      .from('portfolios')
      .update({
        total_invested: (portfolio.total_invested || 0) - initialInvestment,
        current_nav: (portfolio.current_nav || 0) - pyusdAmount,
      })
      .eq('id', portfolioId);

    // Record transaction
    await supabase.from('investment_transactions').insert({
      user_id: userId,
      portfolio_id: portfolioId,
      transaction_type: 'withdraw',
      pyusd_amount: pyusdAmount,
      shares_amount: sharesToRedeem,
      nav_at_transaction: currentValue,
      notes: `Profit/Loss: ${profitLoss.toFixed(2)} PYUSD (${profitLossPercent.toFixed(2)}%)`,
    });

    return {
      success: true,
      pyusdAmount,
      profitLoss,
      profitLossPercent,
    };
  } catch (error: any) {
    console.error('Error withdrawing from portfolio:', error);
    return {
      success: false,
      error: error.message || 'Failed to withdraw from portfolio',
    };
  }
}

/**
 * Get user's investments
 */
export async function getMyInvestments(userId: string): Promise<{
  success: boolean;
  investments?: UserInvestment[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('user_investments')
      .select(`
        *,
        portfolio:portfolios(*)
      `)
      .eq('user_id', userId)
      .order('invested_at', { ascending: false });

    if (error) throw error;

    // Update with live values
    const investmentsWithLiveValues = await Promise.all(
      (data || []).map(async (investment) => {
        const portfolio = investment.portfolio as any;
        
        // Fetch live prices
        const symbols = portfolio.allocations.map((a: any) => a.symbol);
        const prices = await fetchMultiplePrices(symbols);
        
        // Calculate current value (simplified for MVP)
        const currentValue = investment.current_value;
        const performance = calculatePerformance(currentValue, investment.pyusd_amount);
        
        return {
          ...investment,
          current_value: currentValue,
          profit_loss: performance.profitLoss,
          profit_loss_percent: performance.profitLossPercent,
          portfolio: {
            ...portfolio,
            prices: Array.from(prices.values()),
          },
        };
      })
    );

    return {
      success: true,
      investments: investmentsWithLiveValues as UserInvestment[],
    };
  } catch (error: any) {
    console.error('Error fetching investments:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch investments',
    };
  }
}

/**
 * Get total amount invested by user across all portfolios
 */
export async function getTotalInvestedAmount(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_investments')
      .select('pyusd_amount')
      .eq('user_id', userId);

    if (error) throw error;

    // Sum all invested amounts
    const total = (data || []).reduce((sum, investment) => {
      return sum + parseFloat(investment.pyusd_amount || '0');
    }, 0);

    return total;
  } catch (error: any) {
    console.error('Error fetching total invested amount:', error);
    return 0;
  }
}

/**
 * Get portfolio performance history
 */
export async function getPortfolioPerformance(portfolioId: string): Promise<{
  success: boolean;
  performance?: PortfolioPerformance[];
  error?: string;
}> {
  try {
    // Get portfolio UUID from portfolio_id
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('id')
      .eq('portfolio_id', portfolioId)
      .single();

    if (!portfolio) throw new Error('Portfolio not found');

    const { data, error } = await supabase
      .from('portfolio_performance')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('timestamp', { ascending: true })
      .limit(100);

    if (error) throw error;

    return {
      success: true,
      performance: data as PortfolioPerformance[],
    };
  } catch (error: any) {
    console.error('Error fetching portfolio performance:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch portfolio performance',
    };
  }
}

/**
 * Get rebalance history for a portfolio
 */
export async function getRebalanceHistory(portfolioId: string): Promise<{
  success: boolean;
  history?: RebalanceHistory[];
  error?: string;
}> {
  try {
    // Get portfolio UUID from portfolio_id
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('id')
      .eq('portfolio_id', portfolioId)
      .single();

    if (!portfolio) throw new Error('Portfolio not found');

    const { data, error } = await supabase
      .from('rebalance_history')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('executed_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return {
      success: true,
      history: data as RebalanceHistory[],
    };
  } catch (error: any) {
    console.error('Error fetching rebalance history:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch rebalance history',
    };
  }
}

/**
 * Get risk level label
 */
export function getRiskLabel(riskLevel: number): string {
  switch (riskLevel) {
    case 1:
      return 'Low';
    case 2:
      return 'Medium';
    case 3:
      return 'High';
    default:
      return 'Unknown';
  }
}

/**
 * Get risk color class
 */
export function getRiskColor(riskLevel: number): string {
  switch (riskLevel) {
    case 1:
      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    case 2:
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
    case 3:
      return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
  }
}

/**
 * Get category icon emoji
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    stable: '🟢',
    ai: '🧠',
    layer1: '�',
    layer2: '⚡',
    index: '�',
    defi: '🧩',
    meme: '🚀',
    infrastructure: '🧱',
    gaming: '🎮',
    emerging: '🔬',
    sustainable: '🌍',
    innovation: '🧬',
    ethereum: '🧊',
    bitcoin: '🌐',
    rwa: '🧊',
  };
  return icons[category] || '📊';
}

/**
 * Format rebalance frequency for display
 */
export function formatRebalanceFrequency(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  if (days === 7) return 'Weekly';
  if (days === 14) return 'Bi-weekly';
  if (days === 30) return 'Monthly';
  return `Every ${days} days`;
}

/**
 * Calculate next rebalance date
 */
export function getNextRebalanceDate(
  lastRebalanced: string,
  frequency: number
): Date {
  const last = new Date(lastRebalanced);
  return new Date(last.getTime() + frequency * 1000);
}

/**
 * Calculate time until next rebalance
 */
export function getTimeUntilRebalance(
  lastRebalanced: string,
  frequency: number
): string {
  const next = getNextRebalanceDate(lastRebalanced, frequency);
  const now = new Date();
  const diff = next.getTime() - now.getTime();
  
  if (diff < 0) return 'Due now';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}
