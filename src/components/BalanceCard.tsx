import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle, Wallet } from 'lucide-react';
import { formatAddress } from '../services/wallet';

interface BalanceCardProps {
  balance: string;
  publicAddress: string;
  handle: string;
}

export function BalanceCard({ balance, publicAddress, handle }: BalanceCardProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(publicAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 rounded-3xl p-8 shadow-premium"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Wallet Icon */}
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-white/80" />
          <span className="text-white/80 text-sm font-medium">PYUSD Balance</span>
        </div>

        {/* Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-5xl md:text-6xl font-bold text-white">
              {parseFloat(balance).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-2xl text-white/80 font-semibold">PYUSD</span>
          </div>
        </motion.div>

        {/* Handle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-4"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            <span className="text-white font-medium">{handle}</span>
          </div>
        </motion.div>

        {/* Address */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-between"
        >
          <span className="text-white/60 text-sm font-mono">
            {formatAddress(publicAddress, 6)}
          </span>
          <button
            onClick={copyAddress}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full px-3 py-1.5"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="text-xs font-medium">Copy</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
