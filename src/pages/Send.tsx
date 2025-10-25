import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send as SendIcon, Loader2, CheckCircle2, QrCode, X, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { executePYUSDTransfer } from '../services/transfer';
import { resolveHandle } from '../services/handle';
import { fadeIn, slideUp } from '../lib/animations';
import { MobileNavSpacer } from '../components/MobileNav';
import { Html5Qrcode } from 'html5-qrcode';
import Confetti from 'react-confetti';

export function Send() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshWallet } = useWallet();
  
  const [recipientHandle, setRecipientHandle] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);

  // Initialize QR Scanner
  useEffect(() => {
    if (showScanner && qrReaderRef.current) {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      
      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // QR code scanned successfully
          setRecipientHandle(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Handle scan errors (mostly from continuous scanning)
          console.log('Scan error:', errorMessage);
        }
      ).then(() => {
        setScannerReady(true);
      }).catch((err) => {
        console.error('Failed to start scanner:', err);
        setError('Failed to start camera. Please check permissions.');
        stopScanner();
      });
    }

    return () => {
      stopScanner();
    };
  }, [showScanner]);

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear();
        scannerRef.current = null;
      }).catch((err) => {
        console.error('Failed to stop scanner:', err);
      });
    }
    setShowScanner(false);
    setScannerReady(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    // Validate recipient
    const resolvedAddress = await resolveHandle(recipientHandle);
    if (!resolvedAddress) {
      setError('Recipient handle not found');
      setLoading(false);
      return;
    }

    // Execute transfer
    const result = await executePYUSDTransfer(user.id, recipientHandle, amount);

    if (result.success && result.txHash) {
      setSuccess(true);
      setTxHash(result.txHash);
      // Refresh wallet balance
      setTimeout(() => {
        refreshWallet();
      }, 2000);
    } else {
      setError(result.error || 'Transfer failed');
    }

    setLoading(false);
  };

  const handleReset = () => {
    setRecipientHandle('');
    setAmount('');
    setError('');
    setSuccess(false);
    setTxHash('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:pl-64">
      {success && <Confetti recycle={false} numberOfPieces={500} />}
      
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Go back to dashboard"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Send Payment
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Transfer PYUSD instantly
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          className="space-y-6"
        >
          {!success ? (
            <>
              {/* Send Form Card */}
              <motion.div
                variants={slideUp}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Recipient Handle */}
                  <div>
                    <label htmlFor="recipient-handle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recipient Handle
                    </label>
                    <div className="relative">
                      <input
                        id="recipient-handle"
                        type="text"
                        value={recipientHandle}
                        onChange={(e) => setRecipientHandle(e.target.value)}
                        required
                        autoComplete="off"
                        className="w-full px-4 py-3 pr-14 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                        placeholder="username@pyusd"
                        aria-describedby="recipient-help"
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors"
                        aria-label="Scan QR code"
                      >
                        <QrCode className="w-5 h-5" />
                      </motion.button>
                    </div>
                    <p id="recipient-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Enter the recipient's @handle or scan their QR code
                    </p>
                  </div>

                  {/* Amount */}
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount (PYUSD)
                    </label>
                    <input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      autoComplete="off"
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                      placeholder="0.00"
                      aria-describedby="amount-help"
                    />
                    <p id="amount-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Minimum amount: 0.01 PYUSD
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      role="alert"
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4"
                    >
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-primary text-white font-semibold py-4 rounded-2xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 min-h-[56px]"
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    aria-label="Send PYUSD payment"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <SendIcon className="w-5 h-5" aria-hidden="true" />
                        Send Payment
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            </>
          ) : (
            /* Success State */
            <motion.div
              variants={slideUp}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                </motion.div>

                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Payment Sent! 🎉
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Your PYUSD has been successfully sent
                </p>

                {/* Transaction Details */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 mb-6">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Amount</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{amount} PYUSD</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">To: {recipientHandle}</div>
                </div>

                {/* View on Explorer */}
                <a
                  href={`https://arbiscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium mb-6"
                >
                  View on Arbiscan →
                </a>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <motion.button
                    onClick={handleReset}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gradient-primary text-white font-semibold py-3 rounded-2xl hover:shadow-glow transition-all"
                  >
                    Send Another
                  </motion.button>
                  <motion.button
                    onClick={() => navigate('/dashboard')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold py-3 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Go to Dashboard
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* QR Code Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={stopScanner}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Scanner Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-premium max-w-md w-full p-6 relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <motion.button
                  onClick={stopScanner}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 z-10"
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                  aria-label="Close QR scanner"
                >
                  <X className="w-6 h-6" />
                </motion.button>

                {/* Header */}
                <div className="mb-4 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-2xl mb-3">
                    <ScanLine className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    Scan QR Code
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Position the QR code within the frame
                  </p>
                </div>

                {/* QR Reader */}
                <div className="relative rounded-2xl overflow-hidden bg-gray-900">
                  <div id="qr-reader" ref={qrReaderRef} className="w-full"></div>
                  {!scannerReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
                  Make sure to allow camera access when prompted
                </p>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <MobileNavSpacer />
    </div>
  );
}
