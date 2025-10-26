import { supabase, type Transaction } from '../lib/supabase';

export interface TransactionWithDetails extends Transaction {
  from_handle?: string;
  to_handle?: string;
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

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch handles for all unique user IDs
    const userIds = new Set<string>();
    data.forEach(tx => {
      userIds.add(tx.from_user_id);
      userIds.add(tx.to_user_id);
    });

    const { data: handlesData } = await supabase
      .from('handles')
      .select('user_id, handle')
      .in('user_id', Array.from(userIds));

    // Create a map of user_id to handle
    const userHandleMap = new Map<string, string>();
    handlesData?.forEach(h => {
      userHandleMap.set(h.user_id, h.handle);
    });

    // Add handles to transactions
    const txsWithHandles: TransactionWithDetails[] = data.map(tx => ({
      ...tx,
      from_handle: userHandleMap.get(tx.from_user_id),
      to_handle: userHandleMap.get(tx.to_user_id),
    }));

    return txsWithHandles;
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
