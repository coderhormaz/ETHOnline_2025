import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, ExternalLink, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTransactionHistory, type TransactionWithDetails } from '../services/transactions';
import { fetchBlockchainHistory } from '../services/blockchainHistory';
import { getExplorerUrl } from '../lib/blockchain/pyusd';
import { fadeIn, slideUp } from '../lib/animations';
import { EmptyState } from '../components/EmptyState';
import { TransactionSkeleton } from '../components/SkeletonLoaders';
import { MobileNavSpacer } from '../components/MobileNav';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';

export function Transactions() {
  const { user } = useAuth();
  const { walletData } = useWallet();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [blockchainTxs, setBlockchainTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingBlockchain, setFetchingBlockchain] = useState(false);

  const fetchFromBlockchain = async () => {
    if (!walletData?.publicAddress) return;
    
    setFetchingBlockchain(true);
    try {
      const txs = await fetchBlockchainHistory(walletData.publicAddress);
      setBlockchainTxs(txs);
    } catch (error) {
      console.error('Error fetching blockchain transactions:', error);
    } finally {
      setFetchingBlockchain(false);
    }
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;

      try {
        const history = await getTransactionHistory(user.id);
        setTransactions(history);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
    fetchFromBlockchain();
  }, [user, walletData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:pl-64">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => navigate('/dashboard')}
                className="p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Transaction History
              </h1>
            </div>
            <motion.button
              onClick={fetchFromBlockchain}
              disabled={fetchingBlockchain}
              className="p-3 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-50"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              aria-label="Refresh from blockchain"
            >
              <RefreshCw className={`w-5 h-5 ${fetchingBlockchain ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Blockchain Transactions Section */}
        {blockchainTxs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Blockchain Transactions ({blockchainTxs.length})
            </h2>
            <div className="space-y-4">
              {blockchainTxs.map((tx, index) => (
                <motion.div
                  key={tx.hash}
                  variants={slideUp}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        tx.from.toLowerCase() === walletData?.publicAddress.toLowerCase()
                          ? 'bg-red-100 dark:bg-red-900/20'
                          : 'bg-green-100 dark:bg-green-900/20'
                      }`}>
                        {tx.from.toLowerCase() === walletData?.publicAddress.toLowerCase() ? (
                          <ArrowUpRight className="w-6 h-6 text-red-600 dark:text-red-400" />
                        ) : (
                          <ArrowDownLeft className="w-6 h-6 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">
                          {tx.from.toLowerCase() === walletData?.publicAddress.toLowerCase() ? 'Sent' : 'Received'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {tx.from.toLowerCase() === walletData?.publicAddress.toLowerCase() 
                            ? `To: ${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`
                            : `From: ${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`
                          }
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {new Date(tx.timestamp * 1000).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        tx.from.toLowerCase() === walletData?.publicAddress.toLowerCase()
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {tx.from.toLowerCase() === walletData?.publicAddress.toLowerCase() ? '-' : '+'}
                        {ethers.formatUnits(tx.value, 6)} PYUSD
                      </div>
                      <a
                        href={getExplorerUrl(tx.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline mt-2"
                      >
                        View on Explorer
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Database Transactions Section */}
        {loading ? (
          <TransactionSkeleton count={5} />
        ) : transactions.length === 0 && blockchainTxs.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No transactions yet"
            description="Your payment history will appear here once you start sending or receiving PYUSD"
            action={{
              label: 'Start Sending',
              onClick: () => navigate('/dashboard'),
            }}
          />
        ) : transactions.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              App Transactions ({transactions.length})
            </h2>
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                variants={slideUp}
                initial="initial"
                animate="animate"
                transition={{ delay: index * 0.05 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      tx.from_user_id === user?.id
                        ? 'bg-red-100 dark:bg-red-900/20'
                        : 'bg-green-100 dark:bg-green-900/20'
                    }`}>
                      {tx.from_user_id === user?.id ? (
                        <ArrowUpRight className="w-6 h-6 text-red-600 dark:text-red-400" />
                      ) : (
                        <ArrowDownLeft className="w-6 h-6 text-green-600 dark:text-green-400" />
                      )}
                    </div>

                    {/* Details */}
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">
                        {tx.from_user_id === user?.id ? 'Sent to' : 'Received from'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {tx.from_user_id === user?.id ? tx.to_handle : tx.from_handle}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(tx.created_at).toLocaleDateString()} at{' '}
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Amount & Link */}
                  <div className="text-right">
                    <div className={`text-lg font-bold mb-2 ${
                      tx.from_user_id === user?.id
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {tx.from_user_id === user?.id ? '-' : '+'}{tx.amount} PYUSD
                    </div>
                    <a
                      href={getExplorerUrl(tx.tx_hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      View
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>
      <MobileNavSpacer />
    </div>
  );
}
