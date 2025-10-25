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
    const formattedHandle = formatHandle(handle);
    
    const { data, error } = await supabase
      .from('handles')
      .select(`
        user_id,
        wallets!inner(public_address)
      `)
      .eq('handle', formattedHandle)
      .single();
    
    if (error) {
      console.error('Error resolving handle:', error);
      return null;
    }
    
    return (data as any).wallets.public_address;
  } catch (error) {
    console.error('Error resolving handle:', error);
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
