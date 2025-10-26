import { supabase } from '../lib/supabase';

/**
 * Validate handle format (lowercase alphanumeric, dots, dashes, underscores)
 */
export function validateHandle(handle: string): { valid: boolean; error?: string } {
  // Remove @pyusd suffix if present for validation
  const cleanHandle = handle.replace('@pyusd', '');
  
  if (cleanHandle.length < 3) {
    return { valid: false, error: 'Handle must be at least 3 characters' };
  }
  
  if (cleanHandle.length > 30) {
    return { valid: false, error: 'Handle must be less than 30 characters' };
  }
  
  const regex = /^[a-z0-9._-]+$/;
  if (!regex.test(cleanHandle)) {
    return { 
      valid: false, 
      error: 'Handle can only contain lowercase letters, numbers, dots, dashes, and underscores' 
    };
  }
  
  return { valid: true };
}

/**
 * Format handle to ensure @pyusd suffix
 */
export function formatHandle(handle: string): string {
  const cleanHandle = handle.toLowerCase().replace('@pyusd', '').trim();
  return `${cleanHandle}@pyusd`;
}

/**
 * Check if handle is available in the database
 */
export async function checkHandleAvailability(handle: string): Promise<boolean> {
  try {
    const formattedHandle = formatHandle(handle);
    
    const { data, error } = await supabase
      .from('handles')
      .select('handle')
      .eq('handle', formattedHandle)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking handle availability:', error);
      throw new Error('Failed to check handle availability');
    }
    
    // If no data found, handle is available
    return !data;
  } catch (error) {
    console.error('Error checking handle availability:', error);
    throw error;
  }
}

/**
 * Resolve handle to public address
 */
export async function resolveHandle(handle: string): Promise<string | null> {
  try {
    // Clean and format the handle
    const formattedHandle = formatHandle(handle);
    
    console.log('🔍 Resolving handle:', formattedHandle);
    
    // First, get the user_id from handles table
    const { data: handleData, error: handleError } = await supabase
      .from('handles')
      .select('user_id, handle')
      .eq('handle', formattedHandle)
      .maybeSingle();
    
    if (handleError) {
      console.error('❌ Error querying handle:', handleError);
      return null;
    }
    
    if (!handleData) {
      console.error('❌ Handle not found in database:', formattedHandle);
      return null;
    }
    
    console.log('✅ Found handle:', handleData);
    
    // Then, get the wallet address for this user
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('public_address')
      .eq('user_id', handleData.user_id)
      .maybeSingle();
    
    if (walletError) {
      console.error('❌ Error querying wallet:', walletError);
      return null;
    }
    
    if (!walletData) {
      console.error('❌ Wallet not found for user_id:', handleData.user_id);
      return null;
    }
    
    console.log('✅ Resolved address:', walletData.public_address);
    return walletData.public_address;
    
  } catch (error) {
    console.error('❌ Error resolving handle:', error);
    return null;
  }
}

/**
 * Get user's handle by user ID
 */
export async function getUserHandle(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('handles')
      .select('handle')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user handle:', error);
      return null;
    }
    
    return data?.handle || null;
  } catch (error) {
    console.error('Error fetching user handle:', error);
    return null;
  }
}

/**
 * Debug function: List all handles in database
 */
export async function listAllHandles(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('handles')
      .select('handle, user_id')
      .limit(100);
    
    if (error) {
      console.error('Error fetching handles:', error);
      return;
    }
    
    console.log('📋 All handles in database:', data);
  } catch (error) {
    console.error('Error listing handles:', error);
  }
}
