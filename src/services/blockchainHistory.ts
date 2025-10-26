import { getArbitrumProvider } from '../lib/blockchain/provider';

const PYUSD_CONTRACT_ADDRESS = import.meta.env.VITE_PYUSD_CONTRACT_ADDRESS;

interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
}

/**
 * Fetch transaction history from blockchain for a given address
 */
export async function fetchBlockchainHistory(walletAddress: string): Promise<BlockchainTransaction[]> {
  try {
    const provider = getArbitrumProvider();
    
    console.log('🔍 Fetching blockchain history...');
    console.log('📝 Contract Address:', PYUSD_CONTRACT_ADDRESS);
    console.log('👛 Wallet Address:', walletAddress);
    
    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    
    // Search for transactions in the last 10000 blocks (adjust based on needs)
    const fromBlock = Math.max(0, currentBlock - 10000);
    
    console.log(`📦 Searching blocks ${fromBlock} to ${currentBlock}`);
    
    // Get all transactions for this address
    const transactions: BlockchainTransaction[] = [];
    
    // Fetch transactions where address is sender
    console.log('🔎 Fetching sent transactions...');
    const sentTxs = await provider.getLogs({
      address: PYUSD_CONTRACT_ADDRESS,
      fromBlock,
      toBlock: currentBlock,
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event signature
        `0x000000000000000000000000${walletAddress.slice(2).toLowerCase()}` // from address
      ]
    });
    
    console.log(`📤 Found ${sentTxs.length} sent transactions`);
    
    // Fetch transactions where address is receiver
    console.log('🔎 Fetching received transactions...');
    const receivedTxs = await provider.getLogs({
      address: PYUSD_CONTRACT_ADDRESS,
      fromBlock,
      toBlock: currentBlock,
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event signature
        null,
        `0x000000000000000000000000${walletAddress.slice(2).toLowerCase()}` // to address
      ]
    });
    
    console.log(`📥 Found ${receivedTxs.length} received transactions`);
    
    // Process sent transactions
    for (const log of sentTxs) {
      const tx = await provider.getTransaction(log.transactionHash);
      const block = await provider.getBlock(log.blockNumber);
      
      if (tx && block) {
        transactions.push({
          hash: log.transactionHash,
          from: '0x' + log.topics[1].slice(26),
          to: '0x' + log.topics[2].slice(26),
          value: BigInt(log.data).toString(),
          timestamp: block.timestamp,
          blockNumber: log.blockNumber
        });
      }
    }
    
    // Process received transactions
    for (const log of receivedTxs) {
      // Skip if already added (from sent transactions)
      if (transactions.some(t => t.hash === log.transactionHash)) continue;
      
      const tx = await provider.getTransaction(log.transactionHash);
      const block = await provider.getBlock(log.blockNumber);
      
      if (tx && block) {
        transactions.push({
          hash: log.transactionHash,
          from: '0x' + log.topics[1].slice(26),
          to: '0x' + log.topics[2].slice(26),
          value: BigInt(log.data).toString(),
          timestamp: block.timestamp,
          blockNumber: log.blockNumber
        });
      }
    }
    
    // Sort by timestamp (newest first)
    transactions.sort((a, b) => b.timestamp - a.timestamp);
    
    console.log(`Found ${transactions.length} transactions for ${walletAddress}`);
    return transactions;
    
  } catch (error) {
    console.error('Error fetching blockchain history:', error);
    return [];
  }
}

/**
 * Get PYUSD balance directly from blockchain
 */
export async function getBalanceFromBlockchain(address: string): Promise<string> {
  try {
    const provider = getArbitrumProvider();
    const balance = await provider.getBalance(address);
    return (Number(balance) / 1e18).toFixed(6); // Convert from wei to ETH
  } catch (error) {
    console.error('Error fetching balance from blockchain:', error);
    return '0';
  }
}
