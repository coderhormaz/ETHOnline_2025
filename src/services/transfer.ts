import { supabase, type Transaction } from '../lib/supabase';
import { decryptPrivateKey } from '../lib/crypto';
import { getWalletInstance } from '../lib/blockchain/provider';
import { transferPYUSD } from '../lib/blockchain/pyusd';
import { resolveHandle, getUserHandle } from './handle';

/**
 * Execute a PYUSD transfer from one user to another using handles
 */
export async function executePYUSDTransfer(
  fromUserId: string,
  toHandle: string,
  amount: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // 1. Resolve recipient handle to address
    const toAddress = await resolveHandle(toHandle);
    if (!toAddress) {
      return { success: false, error: 'Recipient handle not found' };
    }

    // 2. Get sender's wallet data
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('encrypted_private_key, public_address')
      .eq('user_id', fromUserId)
      .single();

    if (walletError || !walletData) {
      return { success: false, error: 'Sender wallet not found' };
    }

    // 3. Decrypt private key
    const privateKey = decryptPrivateKey(walletData.encrypted_private_key);

    // 4. Create wallet instance
    const wallet = getWalletInstance(privateKey);

    // 5. Execute transfer
    const txHash = await transferPYUSD(wallet, toAddress, amount);

    // 6. Get handles for both users
    const fromHandle = await getUserHandle(fromUserId);
    
    // Get recipient user ID
    const { data: recipientData } = await supabase
      .from('handles')
      .select('user_id')
      .eq('handle', toHandle)
      .single();

    // 7. Save transaction to database
    if (fromHandle && recipientData) {
      await saveTransaction({
        from_user_id: fromUserId,
        to_user_id: recipientData.user_id,
        from_handle: fromHandle,
        to_handle: toHandle,
        amount,
        tx_hash: txHash,
        status: 'confirmed',
      });
    }

    return { success: true, txHash };
  } catch (error) {
    console.error('Error executing PYUSD transfer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Transfer failed' 
    };
  }
}

/**
 * Save a transaction to the database
 */
export async function saveTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  try {
    const { error } = await supabase
      .from('transactions')
      .insert(transaction);

    if (error) {
      console.error('Error saving transaction:', error);
      throw new Error('Failed to save transaction');
    }
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
}
