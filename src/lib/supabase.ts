import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Wallet {
  id: string;
  user_id: string;
  public_address: string;
  encrypted_private_key: string;
  created_at: string;
  updated_at: string;
}

export interface Handle {
  id: string;
  user_id: string;
  handle: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_handle: string;
  to_handle: string;
  amount: string;
  tx_hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  updated_at: string;
}
