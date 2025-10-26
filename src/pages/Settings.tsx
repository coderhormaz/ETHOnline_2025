import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Mail, QrCode, Wallet, LogOut, Shield, FileKey, Lock, X, AlertTriangle, Eye, EyeOff, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { fadeIn, slideUp } from '../lib/animations';
import { MobileNavSpacer } from '../components/MobileNav';
import { useToast } from '../components/Toast';

export function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { walletData, loading } = useWallet();
  const { showToast, ToastContainer } = useToast();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKeyRevealed, setPrivateKeyRevealed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleRevealPrivateKey = () => {
    setShowWarningModal(true);
  };

  const handleConfirmReveal = () => {
    setShowWarningModal(false);
    setPrivateKeyRevealed(true);
    setShowPrivateKey(true);
    showToast('Private key revealed. Keep it safe!', 'success');
  };

  const handleCancelReveal = () => {
    setShowWarningModal(false);
  };

  const togglePrivateKeyVisibility = () => {
    setShowPrivateKey(!showPrivateKey);
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your account, security, and preferences
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
          {/* Profile Header - Compact */}
          <motion.div
            variants={slideUp}
            className="bg-gradient-to-br from-primary-500 via-accent-500 to-purple-600 rounded-2xl p-6 shadow-premium"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center ring-4 ring-white/30">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">
                  {walletData.handle}
                </h3>
                <p className="text-white/80 text-sm">
                  PYUSD Pay User
                </p>
              </div>
            </div>
          </motion.div>

          {/* Account Information - Compact Grid */}
          <motion.div
            variants={slideUp}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Account Information</h3>
            
            <div className="space-y-3">
              {/* Email */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.email || 'Not available'}
                  </p>
                </div>
              </div>

              {/* Handle */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-9 h-9 bg-accent-100 dark:bg-accent-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Handle</p>
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                    {walletData.handle}
                  </p>
                </div>
              </div>

              {/* Wallet Address */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-9 h-9 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Wallet</p>
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
                    {walletData.publicAddress.slice(0, 10)}...{walletData.publicAddress.slice(-8)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Security & Protection - Compact */}
          <motion.div
            variants={slideUp}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Security</h2>
            </div>

            <div className="space-y-3">
              {/* Encrypted Key Status - Compact */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileKey className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-green-900 dark:text-green-100">
                        Private Key Secured
                      </h3>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                      AES-256 encrypted and stored securely. You maintain full control.
                    </p>
                  </div>
                </div>
              </div>

              {/* Encryption Info Grid - Compact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">Encryption</p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">AES-256</p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">Network</p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Sepolia</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Private Key Management - Compact */}
          <motion.div
            variants={slideUp}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Private Key</h3>
            
            <div className="space-y-3">
              {/* Warning - Compact */}
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-900 dark:text-red-100 mb-0.5">
                      Never Share Your Private Key
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      Full wallet access. Never share with anyone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Private Key Display or Reveal Button */}
              {!privateKeyRevealed ? (
                <motion.button
                  onClick={handleRevealPrivateKey}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Reveal Private Key</span>
                </motion.button>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Your Private Key</p>
                      <motion.button
                        onClick={togglePrivateKeyVisibility}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        aria-label="Toggle private key visibility"
                      >
                        {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </motion.button>
                    </div>
                    <p className="font-mono text-xs text-gray-900 dark:text-white break-all bg-white dark:bg-gray-800 p-3 rounded-lg border border-red-300 dark:border-red-700">
                      {showPrivateKey ? walletData.publicAddress : '••••••••••••••••••••••••••••••••••••••••••'}
                    </p>
                  </div>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    ⚠️ Save securely. This won't be shown again.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* How We Protect You - Compact */}
          <motion.div
            variants={slideUp}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Protection</h3>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Backend Security</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Managed securely on Ethereum Sepolia
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-7 h-7 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lock className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Encrypted Storage</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Military-grade AES-256 encryption
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-7 h-7 bg-accent-100 dark:bg-accent-900/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileKey className="w-3.5 h-3.5 text-accent-600 dark:text-accent-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Full Control</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Keys secured in our infrastructure
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Account Settings Note & Logout - Combined */}
          <motion.div
            variants={slideUp}
            className="space-y-3"
          >
            {/* Handle Note */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-semibold">Note:</span> Payment handle is permanent
              </p>
            </div>

            {/* Logout Button */}
            <motion.button
              onClick={handleSignOut}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Warning Modal */}
      <AnimatePresence>
        {showWarningModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelReveal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-premium max-w-md w-full p-6 sm:p-8 relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <motion.button
                  onClick={handleCancelReveal}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                  aria-label="Close warning"
                >
                  <X className="w-6 h-6" />
                </motion.button>

                {/* Warning Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>

                {/* Warning Content */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    ⚠️ Critical Security Warning
                  </h3>
                  <div className="space-y-3 text-left">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                      <p className="text-sm text-red-900 dark:text-red-100 font-semibold mb-2">
                        Your private key grants full access to your wallet!
                      </p>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                          <span>Anyone with your private key can steal all your funds</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                          <span>Never share it with anyone, including support staff</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                          <span>Store it securely offline (not in screenshots or cloud)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                          <span>This key will only be shown once</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl">
                      <p className="text-sm text-yellow-900 dark:text-yellow-100">
                        <span className="font-semibold">Are you in a safe location?</span> Make sure no one can see your screen before proceeding.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <motion.button
                    onClick={handleCancelReveal}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleConfirmReveal}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl transition-colors shadow-lg"
                  >
                    I Understand, Reveal Key
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <MobileNavSpacer />
    </div>
  );
}
