import { ethers, Contract } from 'ethers';
import { getArbitrumProvider } from './provider';

const PYUSD_CONTRACT_ADDRESS = import.meta.env.VITE_PYUSD_CONTRACT_ADDRESS;

if (!PYUSD_CONTRACT_ADDRESS) {
  throw new Error('VITE_PYUSD_CONTRACT_ADDRESS is not defined');
}

// ERC20 ABI - only the functions we need
const PYUSD_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

/**
 * Get PYUSD contract instance (read-only)
 */
export function getPYUSDContract(): Contract {
  const provider = getArbitrumProvider();
  return new ethers.Contract(PYUSD_CONTRACT_ADDRESS, PYUSD_ABI, provider);
}

/**
 * Get PYUSD contract instance with signer (for transactions)
 */
export function getPYUSDContractWithSigner(signer: ethers.Wallet): Contract {
  return new ethers.Contract(PYUSD_CONTRACT_ADDRESS, PYUSD_ABI, signer);
}

/**
 * Get PYUSD balance for an address with retry logic
 */
export async function getPYUSDBalance(address: string, retries = 3): Promise<string> {
  console.log('💰 Fetching PYUSD balance for:', address);
  console.log('📝 Using contract:', PYUSD_CONTRACT_ADDRESS);
  
  for (let i = 0; i < retries; i++) {
    try {
      const contract = getPYUSDContract();
      const balance = await contract.balanceOf(address);
      const decimals = await contract.decimals();
      const formattedBalance = ethers.formatUnits(balance, decimals);
      
      console.log(`✅ PYUSD Balance: ${formattedBalance} (raw: ${balance.toString()}, decimals: ${decimals})`);
      return formattedBalance;
    } catch (error: any) {
      console.error(`❌ Error fetching PYUSD balance (attempt ${i + 1}/${retries}):`, error.message);
      
      // If it's the last retry, return 0
      if (i === retries - 1) {
        // Check if it's a network error
        if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
          console.warn('Network error: Unable to connect to Sepolia RPC. Please check your internet connection.');
        } else if (error.code === 'CALL_EXCEPTION') {
          console.warn('Contract error: PYUSD contract may not exist at this address on Sepolia.');
        }
        return '0';
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  return '0';
}

/**
 * Transfer PYUSD tokens
 */
export async function transferPYUSD(
  signer: ethers.Wallet,
  toAddress: string,
  amount: string
): Promise<string> {
  try {
    const contract = getPYUSDContractWithSigner(signer);
    const decimals = await contract.decimals();
    const amountInWei = ethers.parseUnits(amount, decimals);
    
    const tx = await contract.transfer(toAddress, amountInWei);
    await tx.wait();
    
    return tx.hash;
  } catch (error: any) {
    console.error('Error transferring PYUSD:', error);
    
    // Provide specific error messages
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient PYUSD balance for this transfer');
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error('Network error: Unable to connect to Sepolia. Please check your connection.');
    } else if (error.reason) {
      throw new Error(error.reason);
    }
    
    throw new Error('Failed to transfer PYUSD. Please try again.');
  }
}

/**
 * Get Ethereum Sepolia explorer URL for a transaction
 */
export function getExplorerUrl(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

/**
 * Verify if PYUSD contract exists and is valid on Sepolia
 */
export async function verifyPYUSDContract(): Promise<{ valid: boolean; error?: string }> {
  console.log('🔍 Verifying PYUSD contract at:', PYUSD_CONTRACT_ADDRESS);
  
  try {
    const contract = getPYUSDContract();
    
    // Try to get basic contract info
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals()
    ]);
    
    console.log('✅ PYUSD Contract Info:', { 
      name, 
      symbol, 
      decimals, 
      address: PYUSD_CONTRACT_ADDRESS 
    });
    
    return { valid: true };
  } catch (error: any) {
    console.error('❌ PYUSD contract verification failed:', error.message);
    console.warn('⚠️  The contract may not exist on Sepolia testnet');
    console.warn('💡 Tip: Deploy a test ERC20 token or use an existing one on Sepolia');
    return { 
      valid: false, 
      error: error.code === 'CALL_EXCEPTION' 
        ? 'Contract not found at this address on Sepolia' 
        : 'Unable to verify contract'
    };
  }
}
