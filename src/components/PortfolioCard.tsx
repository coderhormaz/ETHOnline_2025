import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Layers, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Portfolio } from '../services/portfolio';
import { getTimeUntilRebalance } from '../services/portfolio';
import { RiskBadge } from './RiskBadge';

interface PortfolioCardProps {
  portfolio: Portfolio;
}

export function PortfolioCard({ portfolio }: PortfolioCardProps) {
  const navigate = useNavigate();
  
  const performance = portfolio.performance_24h || 0;
  const isPositive = performance >= 0;
  
  return (
    <motion.div
      whileHover={{ scale: 1.005, y: -2 }}
      whileTap={{ scale: 0.995 }}
      onClick={() => navigate(`/invest/${portfolio.portfolio_id}`)}
      className="group bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {portfolio.name}
            </h3>
            <RiskBadge riskLevel={portfolio.risk_level} size="sm" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
            {portfolio.description}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
      </div>

      {/* Token Allocations - Compact */}
      <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {portfolio.allocations.slice(0, 4).map((allocation) => (
          <div
            key={allocation.symbol}
            className="flex-shrink-0 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
          >
            {allocation.symbol} {allocation.weight}%
          </div>
        ))}
        {portfolio.allocations.length > 4 && (
          <div className="flex-shrink-0 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold text-gray-500 dark:text-gray-400">
            +{portfolio.allocations.length - 4}
          </div>
        )}
      </div>

      {/* Performance - Compact */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wide">24h</p>
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
            )}
            <span className={`text-sm font-bold tabular-nums ${
              isPositive
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {isPositive ? '+' : ''}{performance.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wide">TVL</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
            ${portfolio.total_invested.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Footer - Compact */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{getTimeUntilRebalance(portfolio.last_rebalanced, portfolio.rebalance_frequency)}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-300 font-semibold">
          <Layers className="w-3 h-3" />
          <span>{portfolio.allocations.length} Assets</span>
        </div>
      </div>
    </motion.div>
  );
}
