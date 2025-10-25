import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { executePYUSDTransfer } from '../services/transfer';
import { resolveHandle } from '../services/handle';
import { modalBackdrop, modalContent } from '../lib/animations';
import Confetti from 'react-confetti';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SendModal({ isOpen, onClose }: SendModalProps) {
  const { user } = useAuth();
  const { refreshWallet } = useWallet();
  const [recipientHandle, setRecipientHandle] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

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

  const handleClose = () => {
    setRecipientHandle('');
    setAmount('');
    setError('');
    setSuccess(false);
    setTxHash('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              variants={modalContent}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-premium max-w-md w-full p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {success && <Confetti width={400} height={600} recycle={false} numberOfPieces={200} />}
              
              {/* Close Button */}
              <motion.button
                onClick={handleClose}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
                aria-label="Close send payment modal"
              >
                <X className="w-6 h-6" />
              </motion.button>

              {!success ? (
                <>
                  {/* Header */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Send PYUSD
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Enter recipient handle and amount
                    </p>
                  </div>

                  {/* Form */}
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
                          className="w-full px-4 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                          placeholder="username@pyusd"
                          aria-describedby="recipient-help"
                        />
                      </div>
                      <p id="recipient-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Enter the recipient's @handle or wallet address
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
                          <Send className="w-5 h-5" aria-hidden="true" />
                          Send Payment
                        </>
                      )}
                    </motion.button>
                  </form>
                </>
              ) : (
                /* Success State */
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </motion.div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Payment Sent! 🎉
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Your PYUSD has been successfully sent
                  </p>

                  {/* Transaction Details */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 mb-6">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{amount} PYUSD</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">To: {recipientHandle}</div>
                  </div>

                  {/* View on Explorer */}
                  <a
                    href={`https://arbiscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
                  >
                    View on Arbiscan →
                  </a>

                  {/* Close Button */}
                  <button
                    onClick={handleClose}
                    className="mt-6 w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold py-3 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
