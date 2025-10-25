import { supabase, type Transaction } from '../lib/supabase';

export interface TransactionWithDetails extends Transaction {
  fromHandleDisplay?: string;
  toHandleDisplay?: string;
}

/**
 * Get transaction history for a user
 */
export async function getTransactionHistory(userId: string): Promise<TransactionWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transaction history:', error);
      throw new Error('Failed to fetch transaction history');
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
}

/**
 * Get a single transaction by ID
 */
export async function getTransactionById(transactionId: string): Promise<Transaction | null> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
}

/**
 * Get transaction by hash
 */
export async function getTransactionByHash(txHash: string): Promise<Transaction | null> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('tx_hash', txHash)
      .single();

    if (error) {
      console.error('Error fetching transaction by hash:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching transaction by hash:', error);
    return null;
  }
}
