import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, AlertCircle, Loader2, CheckCircle2, DollarSign, Percent } from 'lucide-react';
import type { UserInvestment } from '../services/portfolio';
import { calculatePortfolioValue } from '../lib/blockchain/pyth';

interface WithdrawModalProps {
  investment: UserInvestment;
  portfolio: any;
  onClose: () => void;
  onWithdraw: (shares?: number) => Promise<{ success: boolean; pyusdAmount?: number; profitLoss?: number; profitLossPercent?: number; error?: string }>;
}

export function WithdrawModal({ investment, portfolio, onClose, onWithdraw }: WithdrawModalProps) {
  const [withdrawPercent, setWithdrawPercent] = useState(100);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ pyusdAmount?: number; profitLoss?: number; profitLossPercent?: number }>();
  
  const [currentValue, setCurrentValue] = useState(0);
  const [profitLoss, setProfitLoss] = useState(0);
  const [profitLossPercent, setProfitLossPercent] = useState(0);

  useEffect(() => {
    calculateCurrentValue();
  }, []);

  const calculateCurrentValue = async () => {
    setCalculating(true);
    try {
      const value = await calculatePortfolioValue(
        portfolio.allocations,
        investment.pyusd_amount
      );
      setCurrentValue(value);
      const pl = value - investment.pyusd_amount;
      const plPercent = (pl / investment.pyusd_amount) * 100;
      setProfitLoss(pl);
      setProfitLossPercent(plPercent);
    } catch (err) {
      console.error('Error calculating value:', err);
    } finally {
      setCalculating(false);
    }
  };

  const sharesToWithdraw = (investment.shares * withdrawPercent) / 100;
  const withdrawAmount = (currentValue * withdrawPercent) / 100;
  const withdrawProfitLoss = (profitLoss * withdrawPercent) / 100;
  const initialInvestment = (investment.pyusd_amount * withdrawPercent) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');

    try {
      const res = await onWithdraw(sharesToWithdraw);
      if (res.success) {
        setResult(res);
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2500);
      } else {
        setError(res.error || 'Withdrawal failed');
      }
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
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
              {/* Header */}
              <div className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white mb-0.5">
                    Withdraw from {portfolio.name}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Redeem your investment
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {calculating ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600 dark:text-primary-400" />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Calculating value...</span>
                  </div>
                ) : (
                  <>
                    {/* Investment Summary */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Initial Investment
                        </p>
                        <p className="text-lg font-black text-gray-900 dark:text-white tabular-nums">
                          ${investment.pyusd_amount.toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Current Value
                        </p>
                        <p className="text-lg font-black text-gray-900 dark:text-white tabular-nums">
                          ${currentValue.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Profit/Loss Card */}
                    <div className={`rounded-xl p-3 border ${
                      profitLoss >= 0 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                        : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {profitLoss >= 0 ? (
                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                          )}
                          <p className="text-xs font-black uppercase tracking-wide text-gray-700 dark:text-gray-300">
                            {profitLoss >= 0 ? 'Total Profit' : 'Total Loss'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-black tabular-nums ${
                            profitLoss >= 0 
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-red-700 dark:text-red-300'
                          }`}>
                            {profitLoss >= 0 ? '+' : ''}{profitLoss.toFixed(2)} PYUSD
                          </p>
                          <p className={`text-sm font-bold tabular-nums ${
                            profitLoss >= 0 
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Withdrawal Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Withdraw Percentage Slider */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Withdrawal Amount
                          </label>
                          <div className="px-2.5 py-1 bg-gradient-to-r from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 rounded-lg border border-primary-200 dark:border-primary-800">
                            <span className="text-sm font-black text-primary-700 dark:text-primary-300 tabular-nums">
                              {withdrawPercent}%
                            </span>
                          </div>
                        </div>
                        
                        <input
                          type="range"
                          min="1"
                          max="100"
                          step="1"
                          value={withdrawPercent}
                          onChange={(e) => setWithdrawPercent(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />

                        {/* Quick Select Buttons */}
                        <div className="flex gap-2 mt-2">
                          {[25, 50, 75, 100].map((percent) => (
                            <button
                              key={percent}
                              type="button"
                              onClick={() => setWithdrawPercent(percent)}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                withdrawPercent === percent
                                  ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-md'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                            >
                              {percent}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Withdrawal Breakdown */}
                      <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 dark:from-blue-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                        <h4 className="text-xs font-black text-blue-900 dark:text-blue-100 mb-2 uppercase tracking-wide">
                          Withdrawal Summary
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-blue-700 dark:text-blue-300 font-semibold">You'll Receive</span>
                            <span className="text-blue-900 dark:text-blue-100 font-black tabular-nums">${withdrawAmount.toFixed(2)} PYUSD</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-blue-700 dark:text-blue-300 font-semibold">Initial Investment</span>
                            <span className="text-blue-900 dark:text-blue-100 font-black tabular-nums">${initialInvestment.toFixed(2)}</span>
                          </div>
                          <div className={`flex justify-between text-xs pt-2 border-t ${
                            withdrawProfitLoss >= 0 
                              ? 'border-green-200 dark:border-green-800'
                              : 'border-red-200 dark:border-red-800'
                          }`}>
                            <span className={`font-bold ${
                              withdrawProfitLoss >= 0 
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-red-700 dark:text-red-300'
                            }`}>
                              {withdrawProfitLoss >= 0 ? 'Profit' : 'Loss'}
                            </span>
                            <span className={`font-black tabular-nums ${
                              withdrawProfitLoss >= 0 
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-red-700 dark:text-red-300'
                            }`}>
                              {withdrawProfitLoss >= 0 ? '+' : ''}{withdrawProfitLoss.toFixed(2)} PYUSD
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Error Message */}
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-2.5"
                        >
                          <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{error}</p>
                        </motion.div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 text-white font-black py-3.5 rounded-xl hover:shadow-lg hover:shadow-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4" />
                            Withdraw ${withdrawAmount.toFixed(2)}
                          </>
                        )}
                      </button>
                    </form>

                    {/* Disclaimer */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
                      <div className="flex gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black text-yellow-900 dark:text-yellow-100 mb-0.5 uppercase tracking-wide">
                            Notice
                          </p>
                          <p className="text-[10px] text-yellow-700 dark:text-yellow-300 leading-relaxed">
                            Withdrawal reflects live market prices. Values may fluctuate.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            /* Success State */
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
                Withdrawal Successful!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                ${result?.pyusdAmount?.toFixed(2)} withdrawn from {portfolio.name}
              </p>

              <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                <p className={`text-sm font-black mb-1 ${
                  (result?.profitLoss || 0) >= 0 
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {(result?.profitLoss || 0) >= 0 ? '+' : ''}{result?.profitLoss?.toFixed(2)} PYUSD
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(result?.profitLoss || 0) >= 0 ? 'Profit' : 'Loss'} ({(result?.profitLossPercent || 0) >= 0 ? '+' : ''}{result?.profitLossPercent?.toFixed(2)}%)
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
