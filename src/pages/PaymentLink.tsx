import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Wallet, CheckCircle2, Loader2, ExternalLink, Copy, AlertCircle, Clock, XCircle } from 'lucide-react';
import { fadeIn, slideUp } from '../lib/animations';
import { useToast } from '../components/Toast';
import Confetti from 'react-confetti';
import { ethers } from 'ethers';
import { getPaymentLink, markPaymentLinkPaid } from '../services/paymentLinks';
import type { PaymentLink as PaymentLinkType } from '../services/paymentLinks';

// PYUSD contract address from env
const PYUSD_CONTRACT_ADDRESS = import.meta.env.VITE_PYUSD_CONTRACT_ADDRESS;

// ERC20 ABI for transfer function
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

// Network config from environment variables
const SEPOLIA_NETWORK = {
  chainId: `0x${parseInt(import.meta.env.VITE_ARBITRUM_CHAIN_ID || '11155111').toString(16)}`,
  chainName: import.meta.env.VITE_NETWORK_NAME || 'Sepolia',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: [import.meta.env.VITE_ARBITRUM_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'],
  blockExplorerUrls: [import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io']
};

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function PaymentLink() {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState<PaymentLinkType | null>(null);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Load payment request details
  useEffect(() => {
    const loadPaymentRequest = async () => {
      if (!linkId) {
        setError('Invalid payment link');
        setLoading(false);
        return;
      }

      try {
        const result = await getPaymentLink(linkId);
        
        if (!result.success || !result.data) {
          setError(result.error || 'Payment link not found');
          setLoading(false);
          return;
        }

        const link = result.data;
        
        // Check if link is active
        if (!link.is_active) {
          setError('This payment link has been deactivated');
          setLoading(false);
          return;
        }
        
        // Check if max uses exceeded
        if (link.max_uses && link.current_uses >= link.max_uses) {
          setError('This payment link has reached its maximum number of uses');
          setLoading(false);
          return;
        }

        setPaymentRequest(link);
        
        if (link.paid) {
          setSuccess(true);
          setTxHash(link.tx_hash || '');
        }
      } catch (error) {
        console.error('Failed to load payment request:', error);
        setError('Failed to load payment request');
      } finally {
        setLoading(false);
      }
    };

    loadPaymentRequest();
  }, [linkId]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      showToast('Please install MetaMask or another Web3 wallet', 'error');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setConnecting(true);
    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        
        // Check if on Sepolia network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId !== SEPOLIA_NETWORK.chainId) {
          // Try to switch to Sepolia
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: SEPOLIA_NETWORK.chainId }],
            });
          } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [SEPOLIA_NETWORK],
                });
              } catch (addError) {
                showToast('Failed to add Sepolia network', 'error');
                setConnecting(false);
                return;
              }
            } else {
              showToast('Please switch to Sepolia network', 'error');
              setConnecting(false);
              return;
            }
          }
        }
        
        setWalletConnected(true);
        showToast('Wallet connected successfully!', 'success');
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      showToast(error.message || 'Failed to connect wallet', 'error');
    } finally {
      setConnecting(false);
    }
  };

  const handlePayment = async () => {
    if (!walletConnected || !paymentRequest || !window.ethereum) return;

    setPaying(true);
    try {
      // Create ethers provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create contract instance
      const pyusdContract = new ethers.Contract(
        PYUSD_CONTRACT_ADDRESS,
        ERC20_ABI,
        signer
      );
      
      // Get decimals (PYUSD has 6 decimals)
      const decimals = await pyusdContract.decimals();
      
      // Convert amount to proper units (e.g., 100 PYUSD = 100 * 10^6)
      const amount = ethers.parseUnits(paymentRequest.amount, decimals);
      
      // Check balance
      const balance = await pyusdContract.balanceOf(walletAddress);
      if (balance < amount) {
        showToast('Insufficient PYUSD balance', 'error');
        setPaying(false);
        return;
      }
      
      showToast('Please confirm the transaction in your wallet...', 'info');
      
      // Execute transfer - this will trigger wallet signature window
      const tx = await pyusdContract.transfer(
        paymentRequest.recipient_address,
        amount
      );
      
      showToast('Transaction sent! Waiting for confirmation...', 'info');
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Update payment request status in Supabase
      const updateResult = await markPaymentLinkPaid(
        linkId!,
        receipt.hash,
        walletAddress
      );
      
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update payment status');
      }
      
      setTxHash(receipt.hash);
      setSuccess(true);
      showToast('Payment sent successfully!', 'success');
    } catch (error: any) {
      console.error('Payment failed:', error);
      
      let errorMessage = 'Payment failed';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient ETH for gas fees';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setPaying(false);
    }
  };

  const copyAddress = () => {
    if (paymentRequest?.recipient_address) {
      navigator.clipboard.writeText(paymentRequest.recipient_address);
      setCopiedAddress(true);
      showToast('Address copied!', 'success');
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!paymentRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <ToastContainer />
        <div className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700"
          >
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {error || 'Payment Link Not Found'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This payment link is invalid, has expired, or has already been paid.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Check if already paid
  if (paymentRequest.paid && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <ToastContainer />
        <div className="text-center max-w-md w-full">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700"
          >
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Already Paid
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This payment link has already been paid.
            </p>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mt-4">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide font-medium">Amount</p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{paymentRequest.amount}</p>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">PYUSD</p>
              </div>
              {paymentRequest.tx_hash && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-600 my-3"></div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide font-medium">Transaction</p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${paymentRequest.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary-600 dark:text-primary-400 hover:underline font-mono break-all inline-flex items-center gap-1"
                  >
                    {paymentRequest.tx_hash.substring(0, 16)}...
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      style={{
        background: paymentRequest.color 
          ? `linear-gradient(to bottom right, ${paymentRequest.color}15, ${paymentRequest.color}05)` 
          : undefined
      }}
    >
      {success && <Confetti recycle={false} numberOfPieces={500} />}
      <ToastContainer />

      <div className="max-w-lg mx-auto px-4 py-8">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          className="space-y-4"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div 
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-lg"
              style={{
                background: paymentRequest.color 
                  ? `linear-gradient(135deg, ${paymentRequest.color}, ${paymentRequest.color}CC)` 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {paymentRequest.title || 'Payment Request'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pay with PYUSD on Sepolia
            </p>
          </div>

          {!success ? (
            <>
              {/* Payment Details Card */}
              <motion.div
                variants={slideUp}
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xl border border-gray-100 dark:border-gray-700"
              >
                <div className="space-y-3">
                  {/* Amount - Compact Single Line */}
                  <div className="p-3.5 bg-gradient-primary rounded-xl text-white shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-[10px] font-medium uppercase tracking-wider">Amount</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold">{paymentRequest.amount}</span>
                        <span className="text-white/90 text-sm font-semibold">PYUSD</span>
                      </div>
                    </div>
                  </div>

                  {/* Recipient Handle */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5 uppercase tracking-wide font-medium">
                        Pay to
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {paymentRequest.recipient_handle}
                      </p>
                    </div>
                  </div>

                  {/* Note */}
                  {paymentRequest.note && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide font-medium">
                        Note
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white leading-snug">
                        "{paymentRequest.note}"
                      </p>
                    </div>
                  )}
                  
                  {/* Custom Message */}
                  {paymentRequest.custom_message && (
                    <div 
                      className="p-3 rounded-xl border"
                      style={{
                        borderColor: paymentRequest.color || '#9333ea',
                        backgroundColor: `${paymentRequest.color || '#9333ea'}08`
                      }}
                    >
                      <p className="text-[10px] mb-1 font-medium uppercase tracking-wide" style={{ color: paymentRequest.color || '#9333ea' }}>
                        Message
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white leading-snug">
                        {paymentRequest.custom_message}
                      </p>
                    </div>
                  )}

                  {/* Public Address - Collapsible */}
                  <details className="group">
                    <summary className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wide">Recipient Address</span>
                      <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-mono text-gray-700 dark:text-gray-300 break-all flex-1 leading-relaxed">
                          {paymentRequest.recipient_address}
                        </p>
                        <button
                          onClick={copyAddress}
                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors flex-shrink-0"
                        >
                          {copiedAddress ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </details>

                  {/* Network Info */}
                  <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl">
                    <div className="flex-1">
                      <p className="text-[11px] text-blue-900 dark:text-blue-100 font-semibold">
                        Network: Sepolia
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Wallet Connection */}
              <motion.div
                variants={slideUp}
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xl border border-gray-100 dark:border-gray-700"
              >
                {!walletConnected ? (
                  <div>
                    <motion.button
                      onClick={connectWallet}
                      disabled={connecting}
                      whileHover={{ scale: connecting ? 1 : 1.01 }}
                      whileTap={{ scale: connecting ? 1 : 0.99 }}
                      className="w-full bg-gradient-primary text-white font-semibold py-3.5 rounded-xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                    >
                      {connecting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-5 h-5" />
                          Connect Wallet to Pay
                        </>
                      )}
                    </motion.button>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                      MetaMask, OKX, or any Web3 wallet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-green-900 dark:text-green-100 font-medium">
                          Wallet Connected
                        </p>
                        <p className="text-xs font-mono text-green-700 dark:text-green-300 truncate">
                          {walletAddress}
                        </p>
                      </div>
                    </div>

                    <motion.button
                      onClick={handlePayment}
                      disabled={paying}
                      whileHover={{ scale: paying ? 1 : 1.01 }}
                      whileTap={{ scale: paying ? 1 : 0.99 }}
                      className="w-full bg-gradient-primary text-white font-semibold py-3.5 rounded-xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                    >
                      {paying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Confirm Payment
                        </>
                      )}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </>
          ) : (
            /* Success State */
            <motion.div
              variants={slideUp}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700"
            >
              <div className="text-center py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mb-4"
                >
                  <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </motion.div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Payment Successful! 🎉
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {paymentRequest.amount} PYUSD sent to {paymentRequest.recipient_handle}
                </p>

                {/* Transaction Details */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    Transaction Hash
                  </div>
                  <div className="font-mono text-xs text-gray-900 dark:text-white break-all mb-3">
                    {txHash}
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary-600 dark:text-primary-400 hover:underline text-xs font-medium"
                  >
                    View on Etherscan
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  The recipient will receive the payment shortly.
                </p>
              </div>
            </motion.div>
          )}

          {/* Footer Info */}
          <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
            <p>Powered by StackFlow • Sepolia Network</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
