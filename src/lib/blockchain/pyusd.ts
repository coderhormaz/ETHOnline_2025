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
 * Get PYUSD balance for an address
 */
export async function getPYUSDBalance(address: string): Promise<string> {
  try {
    const contract = getPYUSDContract();
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Error fetching PYUSD balance:', error);
    return '0';
  }
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
  } catch (error) {
    console.error('Error transferring PYUSD:', error);
    throw new Error('Failed to transfer PYUSD');
  }
}

/**
 * Get Arbitrum explorer URL for a transaction
 */
export function getExplorerUrl(txHash: string): string {
  return `https://arbiscan.io/tx/${txHash}`;
}
