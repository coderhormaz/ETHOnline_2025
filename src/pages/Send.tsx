import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send as SendIcon, Loader2, CheckCircle2, QrCode, X, ScanLine, DollarSign, AlertCircle, Wallet as WalletIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { executePYUSDTransfer } from '../services/transfer';
import { resolveHandle, listAllHandles } from '../services/handle';
import { fadeIn, slideUp } from '../lib/animations';
import { MobileNavSpacer } from '../components/MobileNav';
import { Html5Qrcode } from 'html5-qrcode';
import Confetti from 'react-confetti';

export function Send() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { walletData, refreshWallet } = useWallet();
  
  const [recipientHandle, setRecipientHandle] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [isPaymentRequest, setIsPaymentRequest] = useState(false);
  const [paymentNote, setPaymentNote] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [resolvedRecipient, setResolvedRecipient] = useState<string | null>(null);
  const [validatingRecipient, setValidatingRecipient] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);
  
  // Calculate available balance
  const availableBalance = parseFloat(walletData?.balance || '0');
  const amountValue = parseFloat(amount || '0');
  const hasInsufficientBalance = amountValue > availableBalance;

  // Debug: List all handles on component mount
  useEffect(() => {
    listAllHandles();
  }, []);

  // Validate recipient handle with debouncing
  useEffect(() => {
    if (!recipientHandle || recipientHandle === walletData?.handle) {
      setResolvedRecipient(null);
      return;
    }

    const timer = setTimeout(async () => {
      setValidatingRecipient(true);
      const address = await resolveHandle(recipientHandle);
      if (address) {
        setResolvedRecipient(address);
        setError('');
      } else {
        setResolvedRecipient(null);
        if (recipientHandle.length > 2) {
          setError('Recipient handle not found');
        }
      }
      setValidatingRecipient(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [recipientHandle, walletData?.handle]);

  // Add global styles for QR scanner
  useEffect(() => {
    // Add styles to make video visible
    const style = document.createElement('style');
    style.id = 'qr-scanner-styles';
    style.innerHTML = `
      #qr-reader video {
        width: 100% !important;
        height: auto !important;
        display: block !important;
        border-radius: 1rem;
      }
      #qr-reader {
        border: none !important;
      }
      #qr-reader__dashboard_section {
        display: none !important;
      }
      #qr-reader__dashboard_section_swaplink {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('qr-scanner-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Initialize QR Scanner
  useEffect(() => {
    let isMounted = true;
    
    if (showScanner && qrReaderRef.current && !scannerRef.current) {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      
      // Request camera permissions and start scanning
      html5QrCode.start(
        { facingMode: "environment" }, // Use back camera on mobile
        {
          fps: 10, // Frames per second for scanning
          qrbox: undefined, // Scan entire camera view, not just a box
          aspectRatio: 1.0, // Square aspect ratio
          disableFlip: false // Allow horizontal flip
        },
        (decodedText) => {
          // QR code successfully scanned
          if (isMounted) {
            console.log('QR Code scanned:', decodedText);
            
            // Try to parse as payment request JSON
            try {
              const paymentRequest = JSON.parse(decodedText);
              if (paymentRequest.handle) {
                setRecipientHandle(paymentRequest.handle);
                if (paymentRequest.amount) {
                  setAmount(paymentRequest.amount);
                  setIsPaymentRequest(true);
                  if (paymentRequest.note) {
                    setPaymentNote(paymentRequest.note);
                  }
                } else {
                  setIsPaymentRequest(false);
                  setPaymentNote('');
                }
                setError(''); // Clear any errors
                stopScanner();
                return;
              }
            } catch (e) {
              // Not JSON, treat as plain handle
            }
            
            // Fallback: treat as plain handle string
            setRecipientHandle(decodedText);
            setIsPaymentRequest(false);
            setPaymentNote('');
            setError(''); // Clear any errors
            stopScanner();
          }
        },
        (errorMessage) => {
          // This gets called continuously during scanning, ignore unless critical
          // Only log if it's not a routine "no QR code found" message
          if (!errorMessage.includes('NotFoundException')) {
            console.log('Scan error:', errorMessage);
          }
        }
      ).then(() => {
        if (isMounted) {
          console.log('Scanner started successfully');
          setScannerReady(true);
        }
      }).catch((err) => {
        if (isMounted) {
          console.error('Failed to start scanner:', err);
          let errorMsg = 'Failed to start camera. ';
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMsg += 'Please allow camera access in your browser settings.';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            errorMsg += 'No camera found on this device.';
          } else {
            errorMsg += 'Please check camera permissions.';
          }
          setError(errorMsg);
          setShowScanner(false);
          setScannerReady(false);
        }
      });
    }

    return () => {
      isMounted = false;
      // Only cleanup when component unmounts, not when showScanner changes
    };
  }, [showScanner]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        if (scanner.isScanning) {
          scanner.stop().catch(console.error);
        }
      }
    };
  }, []);

  const stopScanner = () => {
    if (scannerRef.current) {
      const scanner = scannerRef.current;
      if (scanner.isScanning) {
        scanner.stop().then(() => {
          scanner.clear();
        }).catch((err) => {
          console.error('Failed to stop scanner:', err);
        });
      }
      scannerRef.current = null;
    }
    setShowScanner(false);
    setScannerReady(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !walletData) return;

    // Validate inputs
    if (recipientHandle === walletData.handle) {
      setError('Cannot send to yourself');
      return;
    }

    if (!resolvedRecipient) {
      setError('Please enter a valid recipient handle');
      return;
    }

    if (hasInsufficientBalance) {
      setError('Insufficient balance');
      return;
    }

    if (amountValue <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleConfirmSend = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    setShowConfirmation(false);

    // Execute transfer
    const result = await executePYUSDTransfer(user.id, recipientHandle, amount, note);

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
  

  const handleMaxAmount = () => {
    if (walletData?.balance) {
      // Leave a small amount for gas (0.01 PYUSD)
      const maxAmount = Math.max(0, parseFloat(walletData.balance) - 0.01);
      setAmount(maxAmount.toFixed(2));
    }
  };

  const handleReset = () => {
    setRecipientHandle('');
    setAmount('');
    setNote('');
    setError('');
    setSuccess(false);
    setTxHash('');
    setIsPaymentRequest(false);
    setPaymentNote('');
    setResolvedRecipient(null);
    setShowConfirmation(false);
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
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          className="space-y-4"
        >
          {!success ? (
            <>
              {/* Balance Card */}
              <motion.div
                variants={slideUp}
                className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl p-4 shadow-lg"
              >
                <div className="flex items-center justify-between text-white">
                  <div>
                    <p className="text-xs text-white/80 mb-1">Available Balance</p>
                    <p className="text-2xl font-bold">${availableBalance.toFixed(2)}</p>
                    <p className="text-xs text-white/70 mt-0.5">PYUSD</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <WalletIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Send Form Card - Compact */}
              <motion.div
                variants={slideUp}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Recipient Handle */}
                  <div>
                    <label htmlFor="recipient-handle" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                        className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm font-mono"
                        placeholder="username@pyusd"
                        aria-describedby="recipient-help"
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                        aria-label="Scan QR code"
                      >
                        <QrCode className="w-4 h-4" />
                      </motion.button>
                    </div>
                    {/* Recipient Validation Status */}
                    {recipientHandle && recipientHandle !== walletData?.handle && (
                      <div className="mt-2">
                        {validatingRecipient ? (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Validating handle...</span>
                          </div>
                        ) : resolvedRecipient ? (
                          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Valid recipient: {resolvedRecipient.slice(0, 6)}...{resolvedRecipient.slice(-4)}</span>
                          </div>
                        ) : recipientHandle.length > 2 ? (
                          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                            <AlertCircle className="w-3 h-3" />
                            <span>Handle not found</span>
                          </div>
                        ) : null}
                      </div>
                    )}
                    <p id="recipient-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Enter the recipient's @handle or scan their QR code
                    </p>
                  </div>

                  {/* Payment Request Info */}
                  {isPaymentRequest && paymentNote && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3"
                    >
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-0.5">
                        📝 Payment Request
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {paymentNote}
                      </p>
                    </motion.div>
                  )}

                  {/* Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Amount (PYUSD)
                      </label>
                      <motion.button
                        type="button"
                        onClick={handleMaxAmount}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1 text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                      >
                        MAX
                      </motion.button>
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        autoComplete="off"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-2 ${
                          hasInsufficientBalance 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm font-semibold`}
                        placeholder="0.00"
                        aria-describedby="amount-help"
                      />
                    </div>
                    {hasInsufficientBalance && amountValue > 0 && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Insufficient balance
                      </p>
                    )}
                    <p id="amount-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Available: ${availableBalance.toFixed(2)} PYUSD
                    </p>
                  </div>

                  {/* Note (Optional) */}
                  <div>
                    <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Note (Optional)
                    </label>
                    <input
                      id="note"
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={100}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                      placeholder="What's this payment for?"
                      aria-describedby="note-help"
                    />
                    <p id="note-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Add a private note for your records
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      role="alert"
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3"
                    >
                      <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading || !resolvedRecipient || hasInsufficientBalance || !amount || parseFloat(amount) <= 0}
                    className="w-full bg-gradient-primary text-white font-semibold py-3 rounded-xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 min-h-[48px]"
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    aria-label="Send PYUSD payment"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <SendIcon className="w-5 h-5" aria-hidden="true" />
                        Review Payment
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
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium mb-6"
                >
                  View on Etherscan →
                </a>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    onClick={handleReset}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gradient-primary text-white font-semibold py-2.5 rounded-xl hover:shadow-glow transition-all min-h-[48px]"
                  >
                    Send Another
                  </motion.button>
                  <motion.button
                    onClick={() => navigate('/dashboard')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-h-[48px]"
                  >
                    Go to Dashboard
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmation && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmation(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Confirmation Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-3">
                    <AlertCircle className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Confirm Payment
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Please review the details before sending
                  </p>
                </div>

                {/* Transaction Summary */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 space-y-3 mb-5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">To</span>
                    <span className="font-semibold text-gray-900 dark:text-white font-mono text-sm">
                      {recipientHandle}
                    </span>
                  </div>
                  {resolvedRecipient && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-500">Address</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {resolvedRecipient.slice(0, 6)}...{resolvedRecipient.slice(-4)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          ${parseFloat(amount || '0').toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">PYUSD</div>
                      </div>
                    </div>
                  </div>
                  {note && (
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
                      <span className="text-xs text-gray-500 dark:text-gray-500 block mb-1">Note</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{note}"</p>
                    </div>
                  )}
                  <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">New Balance</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${(availableBalance - parseFloat(amount || '0')).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Warning Message */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 mb-5">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      This transaction cannot be reversed. Please verify all details before confirming.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setShowConfirmation(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-h-[48px]"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleConfirmSend}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-accent-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Confirm & Send</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

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
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-premium max-w-md w-full p-5 relative"
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
                <div className="mb-3 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-xl mb-2">
                    <ScanLine className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">
                    Scan QR Code
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Position the QR code within the frame
                  </p>
                </div>

                {/* QR Reader */}
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <div 
                    id="qr-reader" 
                    ref={qrReaderRef}
                    style={{ 
                      width: '100%',
                      minHeight: '300px',
                      maxHeight: '400px'
                    }}
                  ></div>
                  
                  {/* Scanning Guide Overlay */}
                  {scannerReady && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {/* Center Guide Box */}
                      <div className="relative w-64 h-64">
                        {/* Corner Markers */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary-500"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary-500"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary-500"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary-500"></div>
                        
                        {/* Center Crosshair */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 border-2 border-primary-400 rounded-full animate-pulse opacity-60"></div>
                        </div>
                        
                        {/* Instruction Text */}
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                          <p className="text-sm font-medium text-white drop-shadow-lg">
                            Align QR code here
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!scannerReady && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 gap-3 z-10">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                      <p className="text-sm text-white/80">Starting camera...</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                    📷 Allow camera access to scan QR codes
                  </p>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-500">
                    Position the QR code in the center of the camera view
                  </p>
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
