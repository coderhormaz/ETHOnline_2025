import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, AlertCircle, Loader2, CheckCircle2, DollarSign } from 'lucide-react';
import type { Portfolio } from '../services/portfolio';
import { RiskBadge } from './RiskBadge';
import { AllocationPieChart } from './AllocationPieChart';

interface InvestModalProps {
  portfolio: Portfolio;
  availableBalance: number;
  onClose: () => void;
  onInvest: (amount: number) => Promise<void>;
}

export function InvestModal({ portfolio, availableBalance, onClose, onInvest }: InvestModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const amountValue = parseFloat(amount || '0');
  const hasInsufficientBalance = amountValue > availableBalance;
  const belowMinimum = amountValue > 0 && amountValue < 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hasInsufficientBalance) {
      setError('Insufficient balance');
      return;
    }

    if (belowMinimum) {
      setError('Minimum investment is 10 PYUSD');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onInvest(amountValue);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Investment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMaxAmount = () => {
    // Leave small buffer for gas
    const maxAmount = Math.max(0, availableBalance - 0.01);
    setAmount(maxAmount.toFixed(2));
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {!success ? (
            <>
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    Invest in {portfolio.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Start building your crypto portfolio
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Portfolio Overview */}
                <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {portfolio.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {portfolio.description}
                      </p>
                    </div>
                    <RiskBadge riskLevel={portfolio.risk_level} />
                  </div>

                  {/* Allocation */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Portfolio Allocation
                    </h4>
                    <AllocationPieChart allocations={portfolio.allocations} size={250} />
                  </div>
                </div>

                {/* Investment Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Available Balance */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Available Balance
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${availableBalance.toFixed(2)} PYUSD
                    </p>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="invest-amount" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Investment Amount
                      </label>
                      <button
                        type="button"
                        onClick={handleMaxAmount}
                        className="px-3 py-1 text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <input
                        id="invest-amount"
                        type="number"
                        step="0.01"
                        min="10"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 ${
                          hasInsufficientBalance || belowMinimum
                            ? 'border-red-300 dark:border-red-600'
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-lg font-semibold`}
                        placeholder="10.00"
                      />
                    </div>
                    {belowMinimum && (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Minimum investment is 10 PYUSD
                      </p>
                    )}
                    {hasInsufficientBalance && amountValue > 0 && (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Insufficient balance
                      </p>
                    )}
                  </div>

                  {/* Investment Summary */}
                  {amountValue >= 10 && !hasInsufficientBalance && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
                    >
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Investment Breakdown
                      </h4>
                      <div className="space-y-2">
                        {portfolio.allocations.map((allocation) => {
                          const allocationAmount = (amountValue * allocation.weight) / 100;
                          return (
                            <div key={allocation.symbol} className="flex items-center justify-between text-sm">
                              <span className="text-blue-700 dark:text-blue-300 font-medium">
                                {allocation.symbol}
                              </span>
                              <span className="text-blue-900 dark:text-blue-100 font-semibold">
                                ${allocationAmount.toFixed(2)} ({allocation.weight}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3"
                    >
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || hasInsufficientBalance || belowMinimum || !amount}
                    className="w-full bg-gradient-primary text-white font-semibold py-4 rounded-xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-5 h-5" />
                        Invest ${amountValue.toFixed(2)} PYUSD
                      </>
                    )}
                  </button>
                </form>

                {/* Disclaimer */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                        Investment Risk Disclosure
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        Cryptocurrency investments carry risk. Portfolio performance may vary.
                        Past performance does not guarantee future results. Only invest what you can afford to lose.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              </motion.div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Investment Successful! 🎉
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You've invested ${amountValue.toFixed(2)} in {portfolio.name}
              </p>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Your portfolio is now being tracked
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  View your investment performance in the My Investments tab
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
