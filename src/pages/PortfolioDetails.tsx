import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Clock, DollarSign, Activity, BarChart3, Loader2, AlertCircle, Zap, Target, Shield, RotateCcw, ArrowDownLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { 
  getPortfolioDetails, 
  getRebalanceHistory, 
  getPortfolioPerformance,
  formatRebalanceFrequency,
  getTimeUntilRebalance,
  withdrawFromPortfolio,
  getMyInvestments,
  type Portfolio,
  type RebalanceHistory,
  type PortfolioPerformance,
  type UserInvestment
} from '../services/portfolio';
import { RiskBadge } from '../components/RiskBadge';
import { AllocationPieChart } from '../components/AllocationPieChart';
import { PerformanceChart } from '../components/PerformanceChart';
import { InvestModal } from '../components/InvestModal';
import { WithdrawModal } from '../components/WithdrawModal';
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
  const [userInvestment, setUserInvestment] = useState<UserInvestment | null>(null);
  const [rebalanceHistory, setRebalanceHistory] = useState<RebalanceHistory[]>([]);
  const [performanceData, setPerformanceData] = useState<PortfolioPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
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
    
    // Load user investment if logged in
    if (user && portfolioResult.portfolio) {
      const investmentsResult = await getMyInvestments(user.id);
      if (investmentsResult.success && investmentsResult.investments) {
        const investment = investmentsResult.investments.find(
          inv => (inv.portfolio as any).id === portfolioResult.portfolio!.id
        );
        setUserInvestment(investment || null);
      }
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
    if (!user || !portfolio) return;

    const result = await investInPortfolio(user.id, portfolio.id, amount);
    
    if (result.success) {
      await loadPortfolioData();
      refreshWallet();
      setShowInvestModal(false);
    } else {
      throw new Error(result.error);
    }
  };

  const handleWithdraw = async (shares?: number) => {
    if (!user || !portfolio) return { success: false, error: 'Missing data' };

    const result = await withdrawFromPortfolio(user.id, portfolio.id, shares);
    
    if (result.success) {
      await loadPortfolioData();
      refreshWallet();
      setShowWithdrawModal(false);
    }
    
    return result;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 md:pl-64">
      {/* Premium Header with Gradient */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <motion.button
              onClick={() => navigate('/invest')}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-black text-gray-900 dark:text-white truncate bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text">
                  {portfolio.name}
                </h1>
                <RiskBadge riskLevel={portfolio.risk_level} size="sm" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
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
              label={userInvestment ? "My Investment" : "Total Invested"}
              value={userInvestment ? `$${userInvestment.pyusd_amount.toFixed(2)}` : `$${portfolio.total_invested.toFixed(2)}`}
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

          {/* My Investment Section - Only show if user has invested */}
          {userInvestment && (
            <motion.div
              variants={slideUp}
              className="bg-gradient-to-br from-primary-50 via-accent-50 to-primary-50 dark:from-primary-900/20 dark:via-accent-900/20 dark:to-primary-900/20 rounded-2xl p-5 border border-primary-200 dark:border-primary-700 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  My Investment
                </h2>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Invested
                  </div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">
                    ${userInvestment.pyusd_amount.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {userInvestment.shares.toFixed(2)} shares
                  </div>
                </div>
                
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Current Value
                  </div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">
                    ${userInvestment.current_value?.toFixed(2) || userInvestment.pyusd_amount.toFixed(2)}
                  </div>
                </div>
                
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Profit/Loss
                  </div>
                  <div className={`text-xl font-black ${
                    (userInvestment.profit_loss || 0) >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {(userInvestment.profit_loss || 0) >= 0 ? '+' : ''}
                    ${(userInvestment.profit_loss || 0).toFixed(2)}
                  </div>
                </div>
                
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Return
                  </div>
                  <div className={`text-xl font-black ${
                    (userInvestment.profit_loss_percent || 0) >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {(userInvestment.profit_loss_percent || 0) >= 0 ? '+' : ''}
                    {(userInvestment.profit_loss_percent || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Two Column Layout - Compact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Allocation & Holdings - Premium Design */}
            <motion.div
              variants={slideUp}
              className="bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  Portfolio Allocation
                </h2>
              </div>
              <AllocationPieChart allocations={portfolio.allocations} size={260} />
              
              {/* Premium Token List with Live Prices */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Holdings
                  </h3>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                    <Zap className={`w-3.5 h-3.5 text-primary-600 dark:text-primary-400 ${pricesLoading ? 'animate-pulse' : ''}`} />
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400">Live</span>
                  </div>
                </div>
                {portfolio.allocations.map((allocation, index) => {
                  const priceData = tokenPrices.get(allocation.symbol);
                  const tokenInfo = portfolio.tokens.find(t => t.symbol === allocation.symbol);
                  
                  return (
                    <motion.div
                      key={allocation.symbol || `allocation-${index}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.01, backgroundColor: 'rgba(99, 102, 241, 0.02)' }}
                      className="group relative p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Token Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                              <span className="text-white font-black text-xs">{allocation.symbol.slice(0, 2)}</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                              {allocation.symbol}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {tokenInfo?.name || allocation.symbol}
                            </p>
                          </div>
                        </div>

                        {/* Allocation Badge */}
                        <div className="flex items-center px-2.5 py-1 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30 rounded-lg border border-primary-200 dark:border-primary-800">
                          <span className="text-sm font-black text-primary-700 dark:text-primary-300 tabular-nums">
                            {allocation.weight}%
                          </span>
                        </div>

                        {/* Live Price */}
                        <div className="text-right min-w-[90px]">
                          <AnimatePresence mode="wait">
                            {priceData ? (
                              <motion.div
                                key={`${allocation.symbol}-${priceData.price}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                              >
                                <p className="text-base font-black text-gray-900 dark:text-white tabular-nums mb-0.5">
                                  ${formatPrice(priceData.price)}
                                </p>
                                <p className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                  Real-time
                                </p>
                              </motion.div>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-end gap-1.5"
                              >
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
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

            {/* Performance Chart - Premium Design */}
            <motion.div
              variants={slideUp}
              className="bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  Performance History
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

          {/* Rebalance History - Premium Design */}
          {rebalanceHistory.length > 0 && (
            <motion.div
              variants={slideUp}
              className="bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 rounded-xl">
                  <RotateCcw className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  Rebalancing History
                </h2>
              </div>
              <div className="space-y-3">
                {rebalanceHistory.map((event, index) => (
                  <motion.div
                    key={event.id || `event-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.005 }}
                    className="group relative border-l-4 border-primary-500 dark:border-primary-400 pl-4 py-3 bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-r-xl hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-black text-gray-900 dark:text-white text-sm mb-1.5">
                          {event.reason}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          <p>
                            {new Date(event.executed_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-xs font-black text-green-700 dark:text-green-300">
                            Executed
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Action Buttons - Compact */}
          <motion.div
            variants={slideUp}
            className="sticky bottom-20 md:bottom-4 z-20"
          >
            {userInvestment ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowInvestModal(true)}
                  className="bg-gradient-primary text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  Add More
                </button>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <ArrowDownLeft className="w-5 h-5" />
                  Redeem
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowInvestModal(true)}
                className="w-full bg-gradient-primary text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                Invest Now
              </button>
            )}
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

      {/* Withdraw Modal */}
      {showWithdrawModal && userInvestment && (
        <WithdrawModal
          investment={userInvestment}
          portfolio={portfolio}
          onClose={() => setShowWithdrawModal(false)}
          onWithdraw={handleWithdraw}
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
      whileHover={{ scale: 1.01, y: -2 }}
      className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all shadow-sm hover:shadow-md"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-accent-500/0 group-hover:from-primary-500/5 group-hover:to-accent-500/5 transition-all" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 rounded-lg text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        </div>
        <p className={`text-xl font-black tabular-nums ${valueColor}`}>{value}</p>
        {subValue && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subValue}</p>
        )}
      </div>
    </motion.div>
  );
}
