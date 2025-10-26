import { ethers } from 'ethers';

const RPC_URL = import.meta.env.VITE_ARBITRUM_RPC_URL;
const CHAIN_ID = import.meta.env.VITE_ARBITRUM_CHAIN_ID;

if (!RPC_URL) {
  throw new Error('VITE_ARBITRUM_RPC_URL is not defined');
}

/**
 * Get Arbitrum JSON RPC Provider
 */
export function getArbitrumProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(RPC_URL, {
    chainId: parseInt(CHAIN_ID || '11155111'),
    name: 'sepolia',
  });
}

/**
 * Create a wallet instance from a private key
 */
export function getWalletInstance(privateKey: string): ethers.Wallet {
  const provider = getArbitrumProvider();
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Get the current gas price on Arbitrum
 */
export async function getGasPrice(): Promise<bigint> {
  const provider = getArbitrumProvider();
  return await provider.getFeeData().then((fee) => fee.gasPrice || BigInt(0));
}
