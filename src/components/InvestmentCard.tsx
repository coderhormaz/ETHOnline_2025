import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { UserInvestment } from '../services/portfolio';

interface InvestmentCardProps {
  investment: UserInvestment;
}

export function InvestmentCard({ investment }: InvestmentCardProps) {
  const navigate = useNavigate();
  const portfolio = investment.portfolio as any;
  
  const profitLoss = investment.profit_loss || 0;
  const profitLossPercent = investment.profit_loss_percent || 0;
  const isProfit = profitLoss >= 0;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={() => navigate(`/portfolio/${portfolio.portfolio_id}`)}
      className="group cursor-pointer bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all shadow-sm hover:shadow-lg"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-base font-black text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {portfolio.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
            {portfolio.description}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-600 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* Initial Investment */}
        <div>
          <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Invested
          </p>
          <p className="text-sm font-black text-gray-900 dark:text-white tabular-nums">
            ${parseFloat(investment.pyusd_amount.toString()).toFixed(2)}
          </p>
        </div>

        {/* Current Value */}
        <div>
          <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Current
          </p>
          <p className="text-sm font-black text-gray-900 dark:text-white tabular-nums">
            ${parseFloat(investment.current_value.toString()).toFixed(2)}
          </p>
        </div>

        {/* Profit/Loss */}
        <div>
          <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            P/L
          </p>
          <div className="flex items-center gap-1">
            {isProfit ? (
              <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
            )}
            <p className={`text-sm font-black tabular-nums ${
              isProfit 
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {isProfit ? '+' : ''}{profitLoss.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Percentage Badge */}
      <div className="flex items-center justify-between">
        <div className={`px-2.5 py-1 rounded-lg ${
          isProfit 
            ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
            : 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
        }`}>
          <p className={`text-xs font-black tabular-nums ${
            isProfit 
              ? 'text-green-700 dark:text-green-300'
              : 'text-red-700 dark:text-red-300'
          }`}>
            {isProfit ? '+' : ''}{profitLossPercent.toFixed(2)}%
          </p>
        </div>

        {/* Token Badges */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {portfolio.allocations?.slice(0, 3).map((allocation: any, index: number) => (
            <div
              key={allocation.symbol || `token-${index}`}
              className="flex-shrink-0 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-bold text-gray-600 dark:text-gray-400"
            >
              {allocation.symbol}
            </div>
          ))}
          {portfolio.allocations?.length > 3 && (
            <div className="flex-shrink-0 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-bold text-gray-500 dark:text-gray-500">
              +{portfolio.allocations.length - 3}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
