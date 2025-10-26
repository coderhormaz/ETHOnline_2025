import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Clock, DollarSign, Activity, BarChart3, Loader2, AlertCircle, Zap, Target, Shield } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { 
  getPortfolioDetails, 
  getRebalanceHistory, 
  getPortfolioPerformance,
  formatRebalanceFrequency,
  getTimeUntilRebalance,
  type Portfolio,
  type RebalanceHistory,
  type PortfolioPerformance 
} from '../services/portfolio';
import { RiskBadge } from '../components/RiskBadge';
import { AllocationPieChart } from '../components/AllocationPieChart';
import { PerformanceChart } from '../components/PerformanceChart';
import { InvestModal } from '../components/InvestModal';
import { investInPortfolio } from '../services/portfolio';
import { MobileNavSpacer } from '../components/MobileNav';
import { fadeIn, slideUp } from '../lib/animations';
import { fetchLivePrice, formatPrice, type TokenSymbol, type TokenPrice } from '../lib/blockchain/pyth';

export function PortfolioDetails() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { walletData, refreshWallet } = useWallet();
  
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [rebalanceHistory, setRebalanceHistory] = useState<RebalanceHistory[]>([]);
  const [performanceData, setPerformanceData] = useState<PortfolioPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [tokenPrices, setTokenPrices] = useState<Map<string, TokenPrice>>(new Map());
  const [pricesLoading, setPricesLoading] = useState(false);
  
  const availableBalance = parseFloat(walletData?.balance || '0');

  useEffect(() => {
    if (portfolioId) {
      loadPortfolioData();
    }
  }, [portfolioId]);

  useEffect(() => {
    if (portfolio?.allocations) {
      loadTokenPrices();
      // Refresh prices every 10 seconds
      const interval = setInterval(loadTokenPrices, 10000);
      return () => clearInterval(interval);
    }
  }, [portfolio?.allocations]);

  const loadTokenPrices = async () => {
    if (!portfolio?.allocations) return;
    
    setPricesLoading(true);
    const priceMap = new Map<string, TokenPrice>();
    
    try {
      await Promise.all(
        portfolio.allocations.map(async (allocation) => {
          try {
            const price = await fetchLivePrice(allocation.symbol as TokenSymbol);
            priceMap.set(allocation.symbol, price);
          } catch (err) {
            console.error(`Failed to fetch price for ${allocation.symbol}:`, err);
          }
        })
      );
      setTokenPrices(priceMap);
    } catch (err) {
      console.error('Failed to fetch token prices:', err);
    } finally {
      setPricesLoading(false);
    }
  };

  const loadPortfolioData = async () => {
    if (!portfolioId) return;
    
    setLoading(true);
    
    // Load portfolio details
    const portfolioResult = await getPortfolioDetails(portfolioId);
    if (portfolioResult.success && portfolioResult.portfolio) {
      setPortfolio(portfolioResult.portfolio);
    } else {
      setError(portfolioResult.error || 'Failed to load portfolio');
    }
    
    // Load rebalance history
    const historyResult = await getRebalanceHistory(portfolioId);
    if (historyResult.success && historyResult.history) {
      setRebalanceHistory(historyResult.history);
    }
    
    // Load performance data
    const performanceResult = await getPortfolioPerformance(portfolioId);
    if (performanceResult.success && performanceResult.performance) {
      setPerformanceData(performanceResult.performance);
    }
    
    setLoading(false);
  };

  const handleInvest = async (amount: number) => {
    if (!user || !portfolioId) return;

    const result = await investInPortfolio(user.id, portfolioId, amount);
    
    if (result.success) {
      await loadPortfolioData();
      refreshWallet();
      setShowInvestModal(false);
    } else {
      throw new Error(result.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 md:pl-64 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-600 dark:text-primary-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 md:pl-64 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Portfolio Not Found</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error || 'This portfolio does not exist'}</p>
          <button
            onClick={() => navigate('/invest')}
            className="px-5 py-2.5 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-lg transition-all text-sm"
          >
            Back to Portfolios
          </button>
        </div>
      </div>
    );
  }

  const performance = portfolio.performance_24h || 0;
  const isPositive = performance >= 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 md:pl-64">
      {/* Compact Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <motion.button
              onClick={() => navigate('/invest')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {portfolio.name}
                </h1>
                <RiskBadge riskLevel={portfolio.risk_level} size="sm" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {portfolio.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Compact */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-24">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          className="space-y-4"
        >
          {/* Premium Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard
              icon={<DollarSign className="w-4 h-4" />}
              label="Total Invested"
              value={`$${portfolio.total_invested.toFixed(2)}`}
            />
            <StatCard
              icon={isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              label="24h Performance"
              value={`${isPositive ? '+' : ''}${performance.toFixed(2)}%`}
              valueColor={isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
            />
            <StatCard
              icon={<Clock className="w-4 h-4" />}
              label="Rebalance"
              value={getTimeUntilRebalance(portfolio.last_rebalanced, portfolio.rebalance_frequency)}
            />
          </div>

          {/* Two Column Layout - Compact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Allocation & Holdings */}
            <motion.div
              variants={slideUp}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Portfolio Allocation
                </h2>
              </div>
              <AllocationPieChart allocations={portfolio.allocations} size={260} />
              
              {/* Token List with Live Prices - Compact */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Holdings
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-primary-600 dark:text-primary-400">
                    <Zap className={`w-3 h-3 ${pricesLoading ? 'animate-pulse' : ''}`} />
                    <span className="font-semibold">Live</span>
                  </div>
                </div>
                {portfolio.allocations.map((allocation) => {
                  const priceData = tokenPrices.get(allocation.symbol);
                  const tokenInfo = portfolio.tokens.find(t => t.symbol === allocation.symbol);
                  
                  return (
                    <motion.div
                      key={allocation.symbol}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.005 }}
                      className="group relative overflow-hidden p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                    >
                      <div className="relative flex items-center justify-between gap-2">
                        {/* Left: Token Info - Compact */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-xs">{allocation.symbol.slice(0, 2)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                              {allocation.symbol}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                              {tokenInfo?.name || allocation.symbol}
                            </p>
                          </div>
                        </div>

                        {/* Center: Allocation - Compact */}
                        <div className="text-center px-2">
                          <div className="inline-flex items-center px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 rounded">
                            <span className="text-sm font-black text-primary-700 dark:text-primary-300 tabular-nums">
                              {allocation.weight}%
                            </span>
                          </div>
                        </div>

                        {/* Right: Live Price - Compact */}
                        <div className="text-right min-w-[80px]">
                          <AnimatePresence mode="wait">
                            {priceData ? (
                              <motion.div
                                key={`${allocation.symbol}-${priceData.price}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                <div className="flex items-center justify-end gap-1 mb-0.5">
                                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                  <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                                    ${formatPrice(priceData.price)}
                                  </p>
                                </div>
                                <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  Live
                                </p>
                              </motion.div>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-end gap-1"
                              >
                                <Loader2 className="w-3 h-3 animate-spin text-primary-500" />
                                <p className="text-xs text-gray-400 dark:text-gray-500">Loading...</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Performance Chart - Compact */}
            <motion.div
              variants={slideUp}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Performance
                </h2>
              </div>
              {performanceData.length > 0 ? (
                <PerformanceChart data={performanceData} height={300} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No performance data yet</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Rebalance History - Compact */}
          {rebalanceHistory.length > 0 && (
            <motion.div
              variants={slideUp}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800"
            >
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
                Rebalance History
              </h2>
              <div className="space-y-4">
                {rebalanceHistory.map((event) => (
                  <div
                    key={event.id}
                    className="border-l-4 border-primary-500 pl-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-r-xl"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{event.reason}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(event.executed_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          ${event.total_value.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Portfolio Value</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Action Button - Compact */}
          <motion.div
            variants={slideUp}
            className="sticky bottom-20 md:bottom-4 z-20"
          >
            <button
              onClick={() => setShowInvestModal(true)}
              className="w-full bg-gradient-primary text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              Invest Now
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Invest Modal */}
      {showInvestModal && (
        <InvestModal
          portfolio={portfolio}
          availableBalance={availableBalance}
          onClose={() => setShowInvestModal(false)}
          onInvest={handleInvest}
        />
      )}

      <MobileNavSpacer />
    </div>
  );
}

// Stat Card Component - Compact
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  valueColor?: string;
}

function StatCard({ icon, label, value, subValue, valueColor = 'text-gray-900 dark:text-white' }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-800"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-primary-100 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
          {icon}
        </div>
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-lg font-bold tabular-nums ${valueColor}`}>{value}</p>
      {subValue && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subValue}</p>
      )}
    </motion.div>
  );
}
