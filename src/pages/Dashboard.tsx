import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Send, QrCode, History, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { BalanceCard } from '../components/BalanceCard';
import { SendModal } from '../components/SendModal';
import { PageLoader } from '../components/LoadingStates';
import { fadeIn, slideUp, staggerContainer } from '../lib/animations';

export function Dashboard() {
  const { signOut } = useAuth();
  const { walletData, loading, refreshWallet } = useWallet();
  const navigate = useNavigate();
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    return <PageLoader />;
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
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              PYUSD Pay
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
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
          className="space-y-8"
        >
          {/* Balance Card */}
          <motion.div variants={slideUp}>
            <BalanceCard
              balance={walletData.balance}
              publicAddress={walletData.publicAddress}
              handle={walletData.handle}
            />
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeIn} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Send Payment */}
            <button
              onClick={() => setSendModalOpen(true)}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-premium transform hover:scale-[1.02] transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Send</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Transfer PYUSD to anyone
              </p>
            </button>

            {/* Receive Payment */}
            <button
              onClick={() => navigate('/receive')}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-premium transform hover:scale-[1.02] transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Receive</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Show your QR code
              </p>
            </button>

            {/* Transaction History */}
            <button
              onClick={() => navigate('/transactions')}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-premium transform hover:scale-[1.02] transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <History className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">History</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View all transactions
              </p>
            </button>
          </motion.div>

          {/* Info Section */}
          <motion.div
            variants={fadeIn}
            className="bg-gradient-card backdrop-blur-xl rounded-2xl p-6 border border-primary-100 dark:border-primary-900"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              ✨ Quick Tip
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Share your handle <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{walletData.handle}</span> with friends to receive instant PYUSD payments!
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Send Modal */}
      <SendModal isOpen={sendModalOpen} onClose={() => setSendModalOpen(false)} />
    </div>
  );
}
