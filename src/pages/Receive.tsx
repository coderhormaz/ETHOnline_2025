import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { ArrowLeft, Copy, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { PageLoader } from '../components/LoadingStates';
import { fadeIn, slideUp } from '../lib/animations';

export function Receive() {
  const navigate = useNavigate();
  const { walletData, loading } = useWallet();
  const [copied, setCopied] = useState(false);

  const copyHandle = () => {
    if (walletData?.handle) {
      navigator.clipboard.writeText(walletData.handle);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!walletData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
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
              Scan to Pay
            </h2>

            {/* QR Code */}
            <div className="bg-white p-6 rounded-2xl inline-block mb-6">
              <QRCode
                value={walletData.handle}
                size={256}
              />
            </div>

            {/* Handle Display */}
            <div className="bg-gradient-card backdrop-blur-xl rounded-2xl p-6 border border-primary-100 dark:border-primary-900 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Payment Handle</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                  {walletData.handle}
                </span>
                <button
                  onClick={copyHandle}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>Share this QR code or your handle to receive PYUSD payments</p>
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
    </div>
  );
}
