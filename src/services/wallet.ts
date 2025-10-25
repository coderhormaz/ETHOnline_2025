import { ethers } from 'ethers';
import { encryptPrivateKey } from '../lib/crypto';

export interface GeneratedWallet {
  privateKey: string;
  publicAddress: string;
  mnemonic: string;
  encryptedPrivateKey: string;
}

/**
 * Generate a new Ethereum wallet
 * Returns private key, public address, mnemonic, and encrypted private key
 */
export function generateWallet(): GeneratedWallet {
  try {
    // Create a random wallet
    const wallet = ethers.Wallet.createRandom();
    
    // Extract wallet details
    const privateKey = wallet.privateKey;
    const publicAddress = wallet.address;
    const mnemonic = wallet.mnemonic?.phrase || '';
    
    // Encrypt the private key for storage
    const encryptedPrivateKey = encryptPrivateKey(privateKey);
    
    return {
      privateKey,
      publicAddress,
      mnemonic,
      encryptedPrivateKey,
    };
  } catch (error) {
    console.error('Error generating wallet:', error);
    throw new Error('Failed to generate wallet');
  }
}

/**
 * Validate an Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Format address for display (truncate middle)
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}
