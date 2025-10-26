import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, Copy, ExternalLink, TrendingUp, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { fadeIn, slideUp } from '../lib/animations';
import { MobileNavSpacer } from '../components/MobileNav';
import { useToast } from '../components/Toast';

export function WalletOverview() {
  const navigate = useNavigate();
  const { walletData, loading } = useWallet();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const handleCopyAddress = async () => {
    if (walletData?.publicAddress) {
      await navigator.clipboard.writeText(walletData.publicAddress);
      setCopiedAddress(true);
      showToast('Address copied to clipboard!', 'success');
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleViewOnExplorer = () => {
    if (walletData?.publicAddress) {
      window.open(`https://sepolia.etherscan.io/address/${walletData.publicAddress}`, '_blank');
    }
  };

  if (loading || !walletData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:pl-64">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:pl-64">
      <ToastContainer />
      
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center md:hidden"
              aria-label="Go back to dashboard"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wallet Overview</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your wallet details and information
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          className="space-y-4"
        >
          {/* Wallet Overview Card */}
          <motion.div
            variants={slideUp}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Wallet</h2>
            </div>

            <div className="space-y-3">
              {/* User Handle */}
              <div className="p-3 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl text-white">
                <p className="text-white/80 text-xs mb-1">Your Handle</p>
                <p className="font-mono text-xl font-bold">
                  {walletData.handle}
                </p>
              </div>

              {/* Wallet Address */}
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Public Address</p>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={handleCopyAddress}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                      aria-label="Copy address"
                    >
                      {copiedAddress ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </motion.button>
                    <motion.button
                      onClick={handleViewOnExplorer}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                      aria-label="View on explorer"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
                <p className="font-mono text-sm text-gray-700 dark:text-gray-300 break-all bg-white dark:bg-gray-800 p-3 rounded-xl">
                  {walletData.publicAddress}
                </p>
              </div>

              {/* Balance */}
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs mb-1">PYUSD Balance</p>
                    <p className="text-3xl font-bold">${parseFloat(walletData.balance).toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Network Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Network</p>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Ethereum Sepolia</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="font-semibold text-green-600 dark:text-green-400">Active</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={slideUp} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <motion.button
              onClick={handleCopyAddress}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-2 hover:border-primary-500 transition-colors min-h-[48px]"
            >
              <Copy className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <span className="font-semibold text-gray-900 dark:text-white">Copy Address</span>
            </motion.button>
            
            <motion.button
              onClick={handleViewOnExplorer}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-2 hover:border-primary-500 transition-colors min-h-[48px]"
            >
              <ExternalLink className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <span className="font-semibold text-gray-900 dark:text-white">View on Explorer</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      <MobileNavSpacer />
    </div>
  );
}
