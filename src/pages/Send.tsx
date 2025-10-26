import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send as SendIcon, Loader2, CheckCircle2, QrCode, X, ScanLine } from 'lucide-react';
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
  const { refreshWallet } = useWallet();
  
  const [recipientHandle, setRecipientHandle] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [isPaymentRequest, setIsPaymentRequest] = useState(false);
  const [paymentNote, setPaymentNote] = useState('');
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);

  // Debug: List all handles on component mount
  useEffect(() => {
    listAllHandles();
  }, []);

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
    setIsPaymentRequest(false);
    setPaymentNote('');
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

                  {/* Payment Request Info */}
                  {isPaymentRequest && paymentNote && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4"
                    >
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        📝 Payment Request
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {paymentNote}
                      </p>
                    </motion.div>
                  )}

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
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium mb-6"
                >
                  View on Etherscan →
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
                <div className="relative rounded-2xl overflow-hidden bg-black">
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
