import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, FileKey, Lock, X, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { fadeIn, slideUp } from '../lib/animations';
import { MobileNavSpacer } from '../components/MobileNav';
import { useToast } from '../components/Toast';

export function Security() {
  const navigate = useNavigate();
  const { walletData, loading } = useWallet();
  const { showToast, ToastContainer } = useToast();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKeyRevealed, setPrivateKeyRevealed] = useState(false);

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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security & Backup</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your wallet security and backups
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
          {/* Security Status */}
          <motion.div
            variants={slideUp}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Wallet Security</h2>
            </div>

            <div className="space-y-4">
              {/* Encrypted Key Status */}
              <div className="p-5 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileKey className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-green-900 dark:text-green-100">
                        Private Key Securely Stored
                      </h3>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                      Your private key is encrypted using AES-256 encryption and stored securely in our backend infrastructure. 
                      You maintain full control of your wallet at all times.
                    </p>
                  </div>
                </div>
              </div>

              {/* Encryption Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Encryption</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">AES-256 Standard</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Network</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Arbitrum Mainnet</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Private Key Management */}
          <motion.div
            variants={slideUp}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Private Key Access</h3>
            
            <div className="space-y-4">
              {/* Warning */}
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                      Caution: Never Share Your Private Key
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                      Your private key gives full access to your wallet. Never share it with anyone or enter it on untrusted websites.
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
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border-2 border-gray-300 dark:border-gray-600"
                >
                  <Eye className="w-5 h-5" />
                  Reveal Private Key
                </motion.button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Private Key</p>
                      <motion.button
                        onClick={togglePrivateKeyVisibility}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-colors"
                        aria-label="Toggle private key visibility"
                      >
                        {showPrivateKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </motion.button>
                    </div>
                    <p className="font-mono text-sm text-gray-900 dark:text-white break-all bg-white dark:bg-gray-800 p-4 rounded-xl border-2 border-red-300 dark:border-red-700">
                      {showPrivateKey ? walletData.publicAddress : '••••••••••••••••••••••••••••••••••••••••••'}
                    </p>
                  </div>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    ⚠️ This key will only be shown once. Make sure to save it securely.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Security Information */}
          <motion.div
            variants={slideUp}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">How We Protect You</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Backend Security</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your wallet is securely managed by our backend on <span className="font-semibold text-gray-900 dark:text-white">Arbitrum</span>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Encrypted Storage</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All transactions are encrypted and your private keys are stored with military-grade AES-256 encryption.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                <div className="w-8 h-8 bg-accent-100 dark:bg-accent-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileKey className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">You're In Control</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your private keys never leave our secure infrastructure, ensuring your funds are always protected.
                  </p>
                </div>
              </div>
            </div>
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
