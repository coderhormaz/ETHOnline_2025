import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Wallet, PieChart, Search, Shield, Zap, Target, BarChart3, Sparkles, TrendingDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { fetchPortfolios, getMyInvestments, investInPortfolio, type Portfolio, type UserInvestment } from '../services/portfolio';
import { PortfolioCard } from '../components/PortfolioCard';
import { InvestModal } from '../components/InvestModal';
import { EmptyState } from '../components/EmptyState';
import { MobileNavSpacer } from '../components/MobileNav';
import { fadeIn, slideUp } from '../lib/animations';

type TabType = 'explore' | 'my-investments';

export function Invest() {
  const { user } = useAuth();
  const { walletData, refreshWallet } = useWallet();
  
  const [activeTab, setActiveTab] = useState<TabType>('explore');
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [myInvestments, setMyInvestments] = useState<UserInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState<number | 'all'>('all');
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  
  const availableBalance = parseFloat(walletData?.balance || '0');

  // Load portfolios
  useEffect(() => {
    loadPortfolios();
  }, []);

  // Load user investments when tab changes
  useEffect(() => {
    if (activeTab === 'my-investments' && user) {
      loadMyInvestments();
    }
  }, [activeTab, user]);

  const loadPortfolios = async () => {
    setLoading(true);
    const result = await fetchPortfolios();
    if (result.success && result.portfolios) {
      setPortfolios(result.portfolios);
    }
    setLoading(false);
  };

  const loadMyInvestments = async () => {
    if (!user) return;
    
    setLoading(true);
    const result = await getMyInvestments(user.id);
    if (result.success && result.investments) {
      setMyInvestments(result.investments);
    }
    setLoading(false);
  };

  const handleInvest = async (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
    setShowInvestModal(true);
  };

  const handleInvestConfirm = async (amount: number) => {
    if (!user || !selectedPortfolio) return;

    const result = await investInPortfolio(user.id, selectedPortfolio.portfolio_id, amount);
    
    if (result.success) {
      // Refresh data
      await loadPortfolios();
      await loadMyInvestments();
      refreshWallet();
      
      // Close modal
      setShowInvestModal(false);
      setSelectedPortfolio(null);
    } else {
      throw new Error(result.error);
    }
  };

  // Filter portfolios
  const filteredPortfolios = portfolios.filter((portfolio) => {
    const matchesSearch = portfolio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portfolio.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || portfolio.category === selectedCategory;
    const matchesRisk = selectedRisk === 'all' || selectedRisk === null || portfolio.risk_level === selectedRisk;
    return matchesSearch && matchesCategory && matchesRisk;
  });

  const riskLevels = [
    { id: 'all' as const, label: 'All', color: 'gray', icon: BarChart3 },
    { id: 1, label: 'Conservative', color: 'green', icon: Shield },
    { id: 2, label: 'Balanced', color: 'yellow', icon: Target },
    { id: 3, label: 'Aggressive', color: 'red', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 md:pl-64">
      {/* Compact Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Portfolio Manager</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Professional crypto strategies</p>
              </div>
            </div>

            {/* Compact Balance */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Wallet className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Available</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">${availableBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-24">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          className="space-y-4"
        >
          {/* Compact Tabs */}
          <div className="flex gap-1 p-1 bg-gray-200 dark:bg-gray-800 rounded-lg">
            <TabButton
              active={activeTab === 'explore'}
              onClick={() => setActiveTab('explore')}
              icon={<TrendingUp className="w-4 h-4" />}
              label="Explore"
            />
            <TabButton
              active={activeTab === 'my-investments'}
              onClick={() => setActiveTab('my-investments')}
              icon={<Wallet className="w-4 h-4" />}
              label="My Portfolio"
              badge={myInvestments.length > 0 ? myInvestments.length : undefined}
            />
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'explore' && (
              <motion.div
                key="explore"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Compact Search & Filters */}
                <div className="space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search portfolios..."
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Risk Filter - Compact Pills */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Risk:</span>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {riskLevels.map((risk) => {
                        const isActive = selectedRisk === risk.id;
                        const Icon = risk.icon;
                        
                        return (
                          <button
                            key={risk.id ?? 'all'}
                            onClick={() => setSelectedRisk(risk.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                              isActive
                                ? risk.color === 'green'
                                  ? 'bg-green-500 text-white shadow-md'
                                  : risk.color === 'yellow'
                                  ? 'bg-yellow-500 text-white shadow-md'
                                  : risk.color === 'red'
                                  ? 'bg-red-500 text-white shadow-md'
                                  : 'bg-gray-700 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{risk.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Results Bar */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      <span className="font-bold text-gray-900 dark:text-white">{filteredPortfolios.length}</span> of {portfolios.length} portfolios
                    </span>
                    {(selectedRisk !== 'all' || searchQuery) && (
                      <button
                        onClick={() => {
                          setSelectedRisk('all');
                          setSearchQuery('');
                        }}
                        className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Portfolios Grid - More Compact */}
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-56 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : filteredPortfolios.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredPortfolios.map((portfolio) => (
                      <div key={portfolio.portfolio_id} onClick={() => handleInvest(portfolio)}>
                        <PortfolioCard portfolio={portfolio} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12">
                    <EmptyState
                      icon={PieChart}
                      title="No portfolios found"
                      description="Try adjusting your search or filters"
                    />
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'my-investments' && (
              <motion.div
                key="my-investments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : myInvestments.length > 0 ? (
                  <div className="space-y-3">
                    {myInvestments.map((investment) => (
                      <InvestmentCard key={investment.id} investment={investment} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12">
                    <EmptyState
                      icon={Wallet}
                      title="No investments yet"
                      description="Start building your crypto portfolio"
                      action={{
                        label: 'Explore Portfolios',
                        onClick: () => setActiveTab('explore'),
                      }}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Invest Modal */}
      {showInvestModal && selectedPortfolio && (
        <InvestModal
          portfolio={selectedPortfolio}
          availableBalance={availableBalance}
          onClose={() => {
            setShowInvestModal(false);
            setSelectedPortfolio(null);
          }}
          onInvest={handleInvestConfirm}
        />
      )}

      <MobileNavSpacer />
    </div>
  );
}

// Tab Button Component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

function TabButton({ active, onClick, icon, label, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition-all whitespace-nowrap relative ${
        active
          ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

// Investment Card Component - More Compact
interface InvestmentCardProps {
  investment: UserInvestment;
}

function InvestmentCard({ investment }: InvestmentCardProps) {
  const portfolio = investment.portfolio as Portfolio;
  const profitLoss = investment.profit_loss || 0;
  const profitLossPercent = investment.profit_loss_percent || 0;
  const isPositive = profitLoss >= 0;

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5 truncate">
            {portfolio.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Invested: ${investment.pyusd_amount.toFixed(2)}
          </p>
        </div>
        <div className="text-right ml-4">
          <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
            ${investment.current_value.toFixed(2)}
          </p>
          <div className={`flex items-center justify-end gap-1 text-xs font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{isPositive ? '+' : ''}{profitLossPercent.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Compact Allocation Tags */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {portfolio.allocations.slice(0, 5).map((allocation) => (
          <div
            key={allocation.symbol}
            className="flex-shrink-0 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
          >
            {allocation.symbol} {allocation.weight}%
          </div>
        ))}
        {portfolio.allocations.length > 5 && (
          <div className="flex-shrink-0 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold text-gray-500 dark:text-gray-400">
            +{portfolio.allocations.length - 5}
          </div>
        )}
      </div>
    </motion.div>
  );
}
