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

    if (amountValue <= 0) {
      setError('Please enter a valid amount');
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
      console.error('Investment error:', err);
      setError(err.message || 'Investment failed');
      setLoading(false);
    }
  };

  const handleMaxAmount = () => {
    setAmount(availableBalance.toFixed(2));
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
          className="bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {!success ? (
            <>
              {/* Header - Compact Premium */}
              <div className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white mb-0.5">
                    Invest in {portfolio.name}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Build your crypto portfolio
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content - Compact Premium */}
              <div className="p-4 space-y-4">
                {/* Available Balance - Compact */}
                <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Available Balance
                  </p>
                  <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">
                    ${availableBalance.toFixed(2)} <span className="text-sm text-gray-500">PYUSD</span>
                  </p>
                </div>

                {/* Investment Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Amount Input - Premium Compact */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="invest-amount" className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        Investment Amount
                      </label>
                      <button
                        type="button"
                        onClick={handleMaxAmount}
                        className="px-2.5 py-1 text-[10px] font-black bg-gradient-to-r from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:shadow-md transition-all uppercase tracking-wider border border-primary-200 dark:border-primary-800"
                      >
                        MAX
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <div className="p-1.5 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 rounded-lg">
                          <DollarSign className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        </div>
                      </div>
                      <input
                        id="invest-amount"
                        type="number"
                        step="0.01"
                        min="10"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className={`w-full pl-14 pr-4 py-3 rounded-xl border-2 ${
                          hasInsufficientBalance || belowMinimum
                            ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                        } text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-lg font-black tabular-nums`}
                        placeholder="10.00"
                      />
                    </div>
                    {belowMinimum && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1 font-semibold"
                      >
                        <AlertCircle className="w-3 h-3" />
                        Minimum 10 PYUSD
                      </motion.p>
                    )}
                  </div>

                  {/* Investment Summary - Compact Premium */}
                  {amountValue >= 10 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 dark:from-blue-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 shadow-sm"
                    >
                      <h4 className="text-xs font-black text-blue-900 dark:text-blue-100 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Allocation Breakdown
                      </h4>
                      <div className="space-y-1.5">
                        {portfolio.allocations.map((allocation, index) => {
                          const allocationAmount = (amountValue * allocation.weight) / 100;
                          return (
                            <div key={allocation.symbol || `allocation-${index}`} className="flex items-center justify-between text-xs bg-white/50 dark:bg-gray-800/50 rounded-lg px-2.5 py-1.5 border border-blue-100 dark:border-blue-900">
                              <span className="text-blue-700 dark:text-blue-300 font-black">
                                {allocation.symbol}
                              </span>
                              <span className="text-blue-900 dark:text-blue-100 font-black tabular-nums">
                                ${allocationAmount.toFixed(2)} <span className="text-[10px] text-blue-600 dark:text-blue-400">({allocation.weight}%)</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Error Message - Compact */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-2.5"
                    >
                      <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{error}</p>
                    </motion.div>
                  )}

                  {/* Submit Button - Premium */}
                  <button
                    type="submit"
                    disabled={loading || belowMinimum || !amount}
                    className="w-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 text-white font-black py-3.5 rounded-xl hover:shadow-lg hover:shadow-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        Invest ${amountValue.toFixed(2)}
                      </>
                    )}
                  </button>
                </form>

                {/* Disclaimer - Compact */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-yellow-900 dark:text-yellow-100 mb-0.5 uppercase tracking-wide">
                        Risk Notice
                      </p>
                      <p className="text-[10px] text-yellow-700 dark:text-yellow-300 leading-relaxed">
                        Crypto investments carry risk. Only invest what you can afford to lose.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Success State - Premium Compact */
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mb-4 border-2 border-green-200 dark:border-green-800 shadow-lg shadow-green-500/20"
              >
                <CheckCircle2 className="w-9 h-9 text-green-600 dark:text-green-400" />
              </motion.div>

              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">
                Investment Successful!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                ${amountValue.toFixed(2)} invested in {portfolio.name}
              </p>

              <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">
                  Your portfolio is now tracked
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-500">
                  View performance in My Investments
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
