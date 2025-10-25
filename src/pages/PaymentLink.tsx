import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Wallet, CheckCircle2, Loader2, ExternalLink, Copy, AlertCircle } from 'lucide-react';
import { fadeIn, slideUp } from '../lib/animations';
import { useToast } from '../components/Toast';
import Confetti from 'react-confetti';
import { ethers } from 'ethers';

// PYUSD contract address on Arbitrum
const PYUSD_CONTRACT_ADDRESS = '0x35e050d3c0ec2d29d269a8ecea763a183bdf9a9d';

// ERC20 ABI for transfer function
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

// Arbitrum network config
const ARBITRUM_NETWORK = {
  chainId: '0xa4b1', // 42161 in hex
  chainName: 'Arbitrum One',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://arb1.arbitrum.io/rpc'],
  blockExplorerUrls: ['https://arbiscan.io']
};

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface PaymentRequest {
  id: string;
  handle: string;
  publicAddress: string;
  amount: string;
  note?: string;
  createdAt: string;
  paid: boolean;
  txHash?: string;
}

export function PaymentLink() {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
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
      try {
        // In a real app, fetch from backend using linkId
        // For now, decode from URL params
        const data = localStorage.getItem(`payment_link_${linkId}`);
        if (data) {
          const request = JSON.parse(data);
          setPaymentRequest(request);
          if (request.paid) {
            setSuccess(true);
            setTxHash(request.txHash || '');
          }
        } else {
          showToast('Payment link not found', 'error');
        }
      } catch (error) {
        console.error('Failed to load payment request:', error);
        showToast('Failed to load payment request', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (linkId) {
      loadPaymentRequest();
    }
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
        
        // Check if on Arbitrum network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId !== ARBITRUM_NETWORK.chainId) {
          // Try to switch to Arbitrum
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: ARBITRUM_NETWORK.chainId }],
            });
          } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [ARBITRUM_NETWORK],
                });
              } catch (addError) {
                showToast('Failed to add Arbitrum network', 'error');
                setConnecting(false);
                return;
              }
            } else {
              showToast('Please switch to Arbitrum network', 'error');
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
        paymentRequest.publicAddress,
        amount
      );
      
      showToast('Transaction sent! Waiting for confirmation...', 'info');
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Update payment request status
      const updatedRequest = {
        ...paymentRequest,
        paid: true,
        txHash: receipt.hash,
        paidBy: walletAddress,
        paidAt: new Date().toISOString()
      };
      localStorage.setItem(`payment_link_${linkId}`, JSON.stringify(updatedRequest));
      
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
    if (paymentRequest?.publicAddress) {
      navigator.clipboard.writeText(paymentRequest.publicAddress);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Link Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This payment link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {success && <Confetti recycle={false} numberOfPieces={500} />}
      <ToastContainer />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Request
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Pay with PYUSD on Arbitrum
            </p>
          </div>

          {!success ? (
            <>
              {/* Payment Details Card */}
              <motion.div
                variants={slideUp}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Payment Details
                </h2>

                <div className="space-y-4">
                  {/* Recipient Handle */}
                  <div className="p-4 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Recipient
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                      {paymentRequest.handle}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="p-6 bg-gradient-primary rounded-2xl text-white text-center">
                    <p className="text-white/80 text-sm mb-2">Amount to Pay</p>
                    <p className="text-4xl font-bold">{paymentRequest.amount} PYUSD</p>
                  </div>

                  {/* Note */}
                  {paymentRequest.note && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Payment Note
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        "{paymentRequest.note}"
                      </p>
                    </div>
                  )}

                  {/* Public Address */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Recipient Address
                      </p>
                      <button
                        onClick={copyAddress}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors"
                      >
                        {copiedAddress ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                      {paymentRequest.publicAddress}
                    </p>
                  </div>

                  {/* Network Info */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
                    <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-1">
                      Network: Arbitrum
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Make sure your wallet is connected to Arbitrum network
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Wallet Connection */}
              <motion.div
                variants={slideUp}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50"
              >
                {!walletConnected ? (
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Connect Your Wallet
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Connect MetaMask, OKX, or any Web3 wallet to pay
                    </p>
                    <motion.button
                      onClick={connectWallet}
                      disabled={connecting}
                      whileHover={{ scale: connecting ? 1 : 1.02 }}
                      whileTap={{ scale: connecting ? 1 : 0.98 }}
                      className="w-full bg-gradient-primary text-white font-semibold py-4 rounded-2xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {connecting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-5 h-5" />
                          Connect Wallet
                        </>
                      )}
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
                      <p className="text-sm text-green-900 dark:text-green-100 font-semibold mb-1">
                        ✓ Wallet Connected
                      </p>
                      <p className="text-xs font-mono text-green-700 dark:text-green-300 break-all">
                        {walletAddress}
                      </p>
                    </div>

                    <motion.button
                      onClick={handlePayment}
                      disabled={paying}
                      whileHover={{ scale: paying ? 1 : 1.02 }}
                      whileTap={{ scale: paying ? 1 : 0.98 }}
                      className="w-full bg-gradient-primary text-white font-semibold py-4 rounded-2xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {paying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Pay {paymentRequest.amount} PYUSD
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
                  Payment Successful! 🎉
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  {paymentRequest.amount} PYUSD sent to {paymentRequest.handle}
                </p>

                {/* Transaction Details */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 mb-6">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Transaction Hash
                  </div>
                  <div className="font-mono text-xs text-gray-900 dark:text-white break-all mb-4">
                    {txHash}
                  </div>
                  <a
                    href={`https://arbiscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
                  >
                    View on Arbiscan
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The recipient will receive the payment shortly.
                </p>
              </div>
            </motion.div>
          )}

          {/* Footer Info */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Powered by PYUSD Pay on Arbitrum</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
