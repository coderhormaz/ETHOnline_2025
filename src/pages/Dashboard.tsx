import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Send, QrCode, History, LogOut, RefreshCw, TrendingUp, ArrowUpRight, ArrowDownLeft, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { BalanceCard } from '../components/BalanceCard';
import { SendModal } from '../components/SendModal';
import { PageLoader } from '../components/LoadingStates';
import { DashboardSkeleton } from '../components/SkeletonLoaders';
import { MobileNavSpacer } from '../components/MobileNav';
import { fadeIn, slideUp, staggerContainer } from '../lib/animations';

export function Dashboard() {
  const { signOut } = useAuth();
  const { walletData, loading, refreshWallet } = useWallet();
  const navigate = useNavigate();
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(0);
  const balanceControls = useAnimation();

  // Animate balance changes
  useEffect(() => {
    if (walletData?.balance) {
      const targetBalance = parseFloat(walletData.balance);
      const duration = 1000; // 1 second
      const steps = 60;
      const stepDuration = duration / steps;
      const increment = targetBalance / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        setDisplayBalance(increment * currentStep);
        
        if (currentStep >= steps) {
          setDisplayBalance(targetBalance);
          clearInterval(timer);
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    }
  }, [walletData?.balance]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshWallet();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto pt-20">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Failed to load wallet data</p>
          <button
            onClick={handleRefresh}
            className="mt-4 text-primary-600 dark:text-primary-400 hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Sparkles className="w-8 h-8 text-primary-500" />
              </motion.div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  PYUSD Pay
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  {walletData?.handle || 'Loading...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.button
                onClick={handleRefresh}
                disabled={refreshing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.button
                onClick={handleSignOut}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Sign Out</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6 sm:space-y-8"
        >
          {/* Hero Balance Section */}
          <motion.div
            variants={slideUp}
            className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-3xl p-6 sm:p-8 text-white shadow-premium"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-white/80 text-sm mb-1">Total Balance</p>
                  <motion.div
                    key={displayBalance}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl sm:text-5xl font-bold tracking-tight"
                  >
                    ${displayBalance.toFixed(2)}
                  </motion.div>
                </div>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm"
                >
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />
                </motion.div>
              </div>
              
              <div className="flex items-center gap-4 sm:gap-6">
                <div>
                  <p className="text-white/70 text-xs mb-1">Your Handle</p>
                  <p className="font-mono text-sm sm:text-base font-medium">{walletData?.handle || '---'}</p>
                </div>
                <div className="h-8 w-px bg-white/30" />
                <div>
                  <p className="text-white/70 text-xs mb-1">Network</p>
                  <p className="text-sm sm:text-base font-medium">Arbitrum</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeIn} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Send Payment */}
            <motion.button
              onClick={() => setSendModalOpen(true)}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 shadow-lg hover:shadow-premium transition-all group border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Send className="w-7 h-7 text-white" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Send</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Transfer PYUSD instantly
              </p>
            </motion.button>

            {/* Receive Payment */}
            <motion.button
              onClick={() => navigate('/receive')}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 shadow-lg hover:shadow-premium transition-all group border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <QrCode className="w-7 h-7 text-white" />
                </div>
                <ArrowDownLeft className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Receive</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Show your QR code
              </p>
            </motion.button>

            {/* Transaction History */}
            <motion.button
              onClick={() => navigate('/transactions')}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 shadow-lg hover:shadow-premium transition-all group border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <History className="w-7 h-7 text-white" />
                </div>
                <Clock className="w-5 h-5 text-gray-400 group-hover:text-accent-500 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">History</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View transactions
              </p>
            </motion.button>
          </motion.div>

          {/* Info Section */}
          <motion.div
            variants={fadeIn}
            className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 backdrop-blur-xl rounded-3xl p-6 border border-primary-200/50 dark:border-primary-800/50 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                className="flex-shrink-0"
              >
                <Sparkles className="w-6 h-6 text-primary-500" />
              </motion.div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Quick Tip
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Share your handle{' '}
                  <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded-lg text-primary-600 dark:text-primary-400 font-semibold">
                    {walletData.handle}
                  </span>
                  {' '}with friends to receive instant PYUSD payments! No long addresses needed.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Send Modal */}
      <SendModal isOpen={sendModalOpen} onClose={() => setSendModalOpen(false)} />
      
      {/* Mobile Navigation Spacer */}
      <MobileNavSpacer />
    </div>
  );
}
