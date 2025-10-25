import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { ArrowLeft, Copy, CheckCircle, Download, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { PageLoader } from '../components/LoadingStates';
import { MobileNavSpacer } from '../components/MobileNav';
import { fadeIn, slideUp } from '../lib/animations';

export function Receive() {
  const navigate = useNavigate();
  const { walletData, loading } = useWallet();
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const copyHandle = () => {
    if (walletData?.handle) {
      navigator.clipboard.writeText(walletData.handle);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate payment request data for QR code
  const getQRData = () => {
    if (!walletData?.handle) return '';
    
    // If amount is specified, encode as JSON payment request
    if (amount && parseFloat(amount) > 0) {
      return JSON.stringify({
        handle: walletData.handle,
        amount: amount,
        note: note || undefined
      });
    }
    
    // Otherwise just return handle
    return walletData.handle;
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!walletData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:pl-64">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Receive PYUSD
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          className="text-center"
        >
          {/* QR Code Card */}
          <motion.div
            variants={slideUp}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-premium mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {amount ? 'Payment Request' : 'Scan to Pay'}
            </h2>

            {/* Amount Input (Optional) */}
            <div className="mb-6 space-y-4">
              <div>
                <label htmlFor="receive-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                  Request Amount (Optional)
                </label>
                <input
                  id="receive-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-left">
                  Leave empty for any amount
                </p>
              </div>

              <div>
                <label htmlFor="receive-note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                  Note (Optional)
                </label>
                <input
                  id="receive-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's this payment for?"
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                />
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white p-6 rounded-2xl inline-block mb-6">
              <QRCode
                value={getQRData()}
                size={256}
              />
            </div>

            {/* Payment Details Display */}
            {amount && parseFloat(amount) > 0 && (
              <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl p-4 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Requesting</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {amount} PYUSD
                </p>
                {note && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    "{note}"
                  </p>
                )}
              </div>
            )}

            {/* Handle Display */}
            <div className="bg-gradient-card backdrop-blur-xl rounded-2xl p-6 border border-primary-100 dark:border-primary-900 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Payment Handle</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                  {walletData.handle}
                </span>
                <motion.button
                  onClick={copyHandle}
                  className="p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                  aria-label={copied ? "Handle copied" : "Copy handle to clipboard"}
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>
                {amount 
                  ? 'Share this QR code to request a specific amount' 
                  : 'Share this QR code or your handle to receive PYUSD payments'}
              </p>
            </div>
          </motion.div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              variants={slideUp}
              transition={{ delay: 0.1 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 text-left"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                ⚡ Instant Transfers
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive PYUSD payments instantly on Arbitrum
              </p>
            </motion.div>

            <motion.div
              variants={slideUp}
              transition={{ delay: 0.2 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 text-left"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                🔒 Secure
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All transactions are secured on the blockchain
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
      
      {/* Mobile Navigation Spacer */}
      <MobileNavSpacer />
    </div>
  );
}
