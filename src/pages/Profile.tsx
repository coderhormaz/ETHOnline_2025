import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, QrCode, Wallet, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { fadeIn, slideUp } from '../lib/animations';
import { MobileNavSpacer } from '../components/MobileNav';

export function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { walletData, loading } = useWallet();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile & Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your account information
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          className="space-y-6"
        >
          {/* Profile Header */}
          <motion.div
            variants={slideUp}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-accent-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {walletData.handle}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  StackFlow User
                </p>
              </div>
            </div>
          </motion.div>

          {/* Account Information */}
          <motion.div
            variants={slideUp}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Account Information</h3>
            
            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email Address</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.email || 'Not available'}
                  </p>
                </div>
              </div>

              {/* Handle */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payment Handle</p>
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                    {walletData.handle}
                  </p>
                </div>
              </div>

              {/* Wallet Address */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Wallet Address</p>
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                    {walletData.publicAddress}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Account Settings */}
          <motion.div
            variants={slideUp}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Account Settings</h3>
            
            <div className="space-y-3">
              {/* Handle Note */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-semibold">Note:</span> Your payment handle is permanent and cannot be changed once set.
                </p>
              </div>

              {/* Logout Button */}
              <motion.button
                onClick={handleSignOut}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border-2 border-red-200 dark:border-red-800"
              >
                <LogOut className="w-5 h-5" />
                Logout from Account
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <MobileNavSpacer />
    </div>
  );
}
